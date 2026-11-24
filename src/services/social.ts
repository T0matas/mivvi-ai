import {
  collection, doc, getDoc, onSnapshot, query, runTransaction, serverTimestamp, setDoc, deleteDoc, updateDoc,
  where, orderBy, limitToLast, writeBatch, Timestamp, Unsubscribe, deleteField,
} from 'firebase/firestore'
import { db } from '../firebase'

// Friends and chat, on Firestore.
//
//   usernames/{handle}      → { uid, name }        one owner per name (unique ids)
//   profiles/{uid}          → public card: name, handle, year, xp, photo, lastSeen
//   friendships/{a_b}       → { users:[a,b], from, to, status:'pending'|'accepted' }
//   chats/{a_b}             → { users, lastText, lastFrom, lastAt, reads:{uid:ts} }
//   chats/{a_b}/messages/*  → { from, text, at }
//
// a_b is the two uids sorted and joined by "_", so each pair has one doc.
// The matching security rules are in firestore.rules at the project root.

export interface PublicProfile {
  uid: string
  name: string
  handle: string
  year?: string | null
  xp?: number
  photo?: string | null
  lastSeen?: number
}

export interface Friendship {
  id: string
  users: string[]
  from: string
  to: string
  status: 'pending' | 'accepted'
  fromName?: string
  toName?: string
  createdAt?: number
}

export interface ChatSummary {
  id: string
  users: string[]
  lastText?: string
  lastFrom?: string
  lastAt?: number
  reads?: Record<string, number>
  /** uid → when that person's app last received the messages ("entregue"). */
  delivered?: Record<string, number>
  /** uid → a counter bumped while that person types (compared by change, not by clock). */
  typing?: Record<string, number>
}

export type MessageKind = 'text' | 'image' | 'file' | 'audio' | 'call'

export interface ChatMessage {
  id: string
  from: string
  text: string
  at: number
  pending?: boolean
  kind?: MessageKind
  /** Attachment stored in chats/{id}/files/{fileId}. */
  fileId?: string
  name?: string
  size?: number
  mime?: string
  /** Audio length or call length, in seconds. */
  duration?: number
  callType?: 'audio' | 'video'
  callStatus?: 'done' | 'missed' | 'declined'
  edited?: boolean
  deleted?: boolean
}

/** Biggest attachment kept in the chat (stored inside Firestore, under its 1 MB document limit). */
export const MAX_FILE_BYTES = 700 * 1024

const ms = (v: unknown): number => (v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : 0)

// ── Names ──────────────────────────────────────────────────────────────────

/** The id behind a name: lower case, no accents, no spaces. "Tomás" → "tomas". */
export const toHandle = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, '')

/** Why a name can't be used, or null when it's fine. */
export function nameProblem(name: string): string | null {
  const n = name.trim()
  if (n.length < 3) return 'O nome precisa de pelo menos 3 letras.'
  if (n.length > 20) return 'O nome pode ter no máximo 20 caracteres.'
  if (!/^[\p{L}\p{N}_.]+$/u.test(n)) return 'Usa só letras, números, "_" ou "." (sem espaços).'
  return null
}

export class NameTakenError extends Error {
  constructor() { super('Esse nome já está a ser usado. Escolhe outro.') }
}

/** true when nobody else owns this name. Throws when the database can't be reached. */
export async function isNameFree(name: string, myUid?: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', toHandle(name)))
  return !snap.exists() || snap.data()?.uid === myUid
}

/** Reserves `name` for this account (and frees the old one). Throws NameTakenError. */
export async function claimName(uid: string, name: string, extra: Partial<PublicProfile> = {}) {
  const handle = toHandle(name)
  const profileRef = doc(db, 'profiles', uid)
  await runTransaction(db, async (tx) => {
    const nameRef = doc(db, 'usernames', handle)
    const [taken, mine] = await Promise.all([tx.get(nameRef), tx.get(profileRef)])
    if (taken.exists() && taken.data()?.uid !== uid) throw new NameTakenError()
    const oldHandle = mine.exists() ? (mine.data()?.handle as string | undefined) : undefined
    if (oldHandle && oldHandle !== handle) {
      const oldRef = doc(db, 'usernames', oldHandle)
      const old = await tx.get(oldRef)
      if (old.exists() && old.data()?.uid === uid) tx.delete(oldRef)
    }
    tx.set(nameRef, { uid, name: name.trim() })
    tx.set(profileRef, JSON.parse(JSON.stringify({ ...extra, uid, name: name.trim(), handle, updatedAt: Date.now() })), { merge: true })
  })
}

export async function getProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(db, 'profiles', uid))
  return snap.exists() ? (snap.data() as PublicProfile) : null
}

/** Updates the public card (year, xp, photo…). */
export async function updatePublicProfile(uid: string, data: Partial<PublicProfile>) {
  try {
    await setDoc(doc(db, 'profiles', uid), JSON.parse(JSON.stringify({ ...data, uid, updatedAt: Date.now() })), { merge: true })
  } catch (e) {
    console.warn('Could not update the public profile', e)
  }
}

/** Marks this student as online (call every minute or so). */
export function heartbeat(uid: string) {
  updateDoc(doc(db, 'profiles', uid), { lastSeen: Date.now() }).catch(() => { /* no profile yet */ })
}

export const isOnline = (p?: PublicProfile | null) => !!p?.lastSeen && Date.now() - p.lastSeen < 2.5 * 60 * 1000

/** Finds someone by their name / id (case and accents don't matter). */
export async function findByName(name: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(db, 'usernames', toHandle(name.replace(/^@/, ''))))
  if (!snap.exists()) return null
  const uid = snap.data()!.uid as string
  return (await getProfile(uid)) || { uid, name: snap.data()!.name, handle: toHandle(name) }
}

export function subscribeProfile(uid: string, cb: (p: PublicProfile | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'profiles', uid), (s) => cb(s.exists() ? (s.data() as PublicProfile) : null), () => cb(null))
}

// ── Friends ────────────────────────────────────────────────────────────────

export const pairId = (a: string, b: string) => [a, b].sort().join('_')

export type RequestResult = 'sent' | 'accepted' | 'already-friends' | 'already-sent'

/** Sends a request; if the other person had already asked, it becomes a friendship. */
export async function sendFriendRequest(me: PublicProfile, other: PublicProfile): Promise<RequestResult> {
  if (me.uid === other.uid) throw new Error('Não te podes adicionar a ti próprio.')
  const blockedByMe = await getDoc(doc(db, 'users', me.uid, 'blocked', other.uid))
  if (blockedByMe.exists()) throw new Error('Não é possível enviar este pedido de amizade.')
  const ref = doc(db, 'friendships', pairId(me.uid, other.uid))
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const f = snap.data() as Friendship
    if (f.status === 'accepted') return 'already-friends'
    if (f.to === me.uid) { await updateDoc(ref, { status: 'accepted', acceptedAt: Date.now() }); return 'accepted' }
    return 'already-sent'
  }
  await setDoc(ref, { users: [me.uid, other.uid], from: me.uid, to: other.uid, status: 'pending', fromName: me.name, toName: other.name, createdAt: Date.now() })
  return 'sent'
}

export const acceptFriend = (id: string) => updateDoc(doc(db, 'friendships', id), { status: 'accepted', acceptedAt: Date.now() })
export const removeFriendship = (id: string) => deleteDoc(doc(db, 'friendships', id))

export interface BlockedContact { uid: string; name: string; photo?: string | null }

export const archiveContact = (uid: string, friend: PublicProfile) =>
  setDoc(doc(db, 'users', uid, 'archivedChats', friend.uid), { uid: friend.uid, name: friend.name, photo: friend.photo || null, archivedAt: Date.now() })
export const unarchiveContact = (uid: string, friendUid: string) => deleteDoc(doc(db, 'users', uid, 'archivedChats', friendUid))

export async function blockContact(uid: string, friend: PublicProfile, friendshipId: string) {
  await setDoc(doc(db, 'users', uid, 'blocked', friend.uid), { uid: friend.uid, name: friend.name, photo: friend.photo || null, blockedAt: Date.now() })
  await removeFriendship(friendshipId)
}
export const unblockContact = (uid: string, friendUid: string) => deleteDoc(doc(db, 'users', uid, 'blocked', friendUid))

export function subscribeArchivedContacts(uid: string, cb: (items: BlockedContact[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'users', uid, 'archivedChats'), (s) => cb(s.docs.map((d) => d.data() as BlockedContact)))
}
export function subscribeBlockedContacts(uid: string, cb: (items: BlockedContact[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'users', uid, 'blocked'), (s) => cb(s.docs.map((d) => d.data() as BlockedContact)))
}

export function subscribeFriendships(uid: string, cb: (list: Friendship[]) => void, onError?: (e: unknown) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'friendships'), where('users', 'array-contains', uid)),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Friendship, 'id'>) }))),
    (e) => { console.warn('friendships', e); onError?.(e) },
  )
}

// ── Chat (direct messages and groups) ─────────────────────────────────────
//
// A "thread" is either a direct chat chats/{a_b} or a group groups/{id}; both
// have the same messages/ and files/ subcollections and the same summary
// fields (lastText, reads, delivered, typing).

export interface ThreadRef { col: 'chats' | 'groups'; id: string }
export const dmRef = (a: string, b: string): ThreadRef => ({ col: 'chats', id: pairId(a, b) })
export const groupRef = (id: string): ThreadRef => ({ col: 'groups', id })
const refKey = (r: ThreadRef) => `${r.col}/${r.id}`

export interface GroupInfo extends ChatSummary {
  name: string
  members: string[]
  memberNames: Record<string, string>
  admins: string[]
  createdBy: string
  color?: string
  lastFromName?: string
}

const readMap = (m: any) => { const out: Record<string, number> = {}; for (const [k, v] of Object.entries(m || {})) out[k] = ms(v); return out }

export function subscribeChats(uid: string, cb: (list: ChatSummary[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'chats'), where('users', 'array-contains', uid)),
    (s) => cb(s.docs.map((d) => {
      const x = d.data({ serverTimestamps: 'estimate' })
      return { id: d.id, users: x.users, lastText: x.lastText, lastFrom: x.lastFrom, lastAt: ms(x.lastAt), reads: readMap(x.reads), delivered: readMap(x.delivered), typing: x.typing || {} }
    })),
    (e) => console.warn('chats', e),
  )
}

export function subscribeGroups(uid: string, cb: (list: GroupInfo[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'groups'), where('members', 'array-contains', uid)),
    (s) => cb(s.docs.map((d) => {
      const x = d.data({ serverTimestamps: 'estimate' })
      return {
        id: d.id, users: x.members || [], members: x.members || [], memberNames: x.memberNames || {}, admins: x.admins || [], createdBy: x.createdBy, name: x.name || 'Grupo', color: x.color,
        lastText: x.lastText, lastFrom: x.lastFrom, lastFromName: x.lastFromName, lastAt: ms(x.lastAt) || ms(x.createdAt), reads: readMap(x.reads), delivered: readMap(x.delivered), typing: x.typing || {},
      }
    })),
    (e) => console.warn('groups', e),
  )
}

const GROUP_COLORS = ['#a9c8f5', '#c0eadb', '#ffdb7c', '#ff9fbb', '#c9b8ff', '#ff9f88', '#9fe3c9']

/** Creates a group with me as admin. */
export async function createGroup(me: { uid: string; name: string }, name: string, people: { uid: string; name: string }[]) {
  const members = [me.uid, ...people.map((p) => p.uid).filter((u) => u !== me.uid)]
  const memberNames: Record<string, string> = { [me.uid]: me.name }
  people.forEach((p) => { memberNames[p.uid] = p.name })
  const ref = doc(collection(db, 'groups'))
  await setDoc(ref, {
    name: name.trim().slice(0, 40), members, memberNames, admins: [me.uid], createdBy: me.uid, createdAt: serverTimestamp(),
    color: GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)],
    lastText: `${me.name} criou o grupo`, lastFrom: me.uid, lastFromName: me.name, lastAt: serverTimestamp(), reads: { [me.uid]: serverTimestamp() },
  })
  return ref.id
}

export const renameGroup = (id: string, name: string) => updateDoc(doc(db, 'groups', id), { name: name.trim().slice(0, 40) })

export async function addGroupMembers(g: GroupInfo, people: { uid: string; name: string }[]) {
  const memberNames = { ...g.memberNames }
  people.forEach((p) => { memberNames[p.uid] = p.name })
  await updateDoc(doc(db, 'groups', g.id), { members: [...new Set([...g.members, ...people.map((p) => p.uid)])], memberNames })
}

export async function leaveGroup(g: GroupInfo, uid: string) {
  const memberNames = { ...g.memberNames }
  delete memberNames[uid]
  await updateDoc(doc(db, 'groups', g.id), { members: g.members.filter((m) => m !== uid), memberNames })
}

export function subscribeMessages(ref: ThreadRef, cb: (list: ChatMessage[]) => void, onError?: (e: unknown) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, ref.col, ref.id, 'messages'), orderBy('at'), limitToLast(300)),
    { includeMetadataChanges: true },
    (s) => cb(s.docs.map((d) => {
      const x = d.data({ serverTimestamps: 'estimate' })
      return { id: d.id, from: x.from, text: x.text || '', at: ms(x.at) || Date.now(), pending: d.metadata.hasPendingWrites, kind: x.kind || 'text', fileId: x.fileId, name: x.name, size: x.size, mime: x.mime, duration: x.duration, callType: x.callType, callStatus: x.callStatus, edited: !!x.editedAt, deleted: !!x.deleted }
    })),
    (e) => { console.warn('messages', e); onError?.(e) },
  )
}

const previewOf = (kind: MessageKind, body: string, extra: Partial<ChatMessage>) =>
  kind === 'image' ? '📷 Foto' : kind === 'file' ? `📎 ${extra.name || 'Ficheiro'}` : kind === 'audio' ? '🎤 Mensagem de voz' : kind === 'call' ? (extra.callStatus === 'missed' ? '📞 Chamada perdida' : extra.callType === 'video' ? '📹 Videochamada' : '📞 Chamada') : body

/** Base fields every write to a thread summary needs (chats keep their two users). */
const summaryBase = (ref: ThreadRef, users?: string[]) => (ref.col === 'chats' && users ? { users: [...users].sort() } : {})

export async function sendToThread(ref: ThreadRef, me: { uid: string; name?: string }, text: string, extra: Partial<ChatMessage> = {}, file?: { data: string; mime: string; name: string; size: number }, users?: string[]) {
  const body = text.trim().slice(0, 2000)
  const kind = extra.kind || 'text'
  if (!body && kind === 'text') return
  const batch = writeBatch(db)
  const msgRef = doc(collection(db, ref.col, ref.id, 'messages'))
  let fileId: string | undefined
  if (file) {
    const fileRef = doc(collection(db, ref.col, ref.id, 'files'))
    fileId = fileRef.id
    batch.set(fileRef, { from: me.uid, data: file.data, mime: file.mime, name: file.name, size: file.size, at: serverTimestamp() })
  }
  batch.set(doc(db, ref.col, ref.id), {
    ...summaryBase(ref, users), lastText: previewOf(kind, body, extra).slice(0, 140), lastFrom: me.uid, ...(ref.col === 'groups' && { lastFromName: me.name || '' }),
    lastAt: serverTimestamp(), reads: { [me.uid]: serverTimestamp() }, typing: { [me.uid]: 0 },
  }, { merge: true })
  batch.set(msgRef, { ...JSON.parse(JSON.stringify({ from: me.uid, text: body, kind, fileId, name: extra.name, size: extra.size, mime: extra.mime, duration: extra.duration, callType: extra.callType, callStatus: extra.callStatus })), at: serverTimestamp() })
  await batch.commit()
}

/** Direct message (kept for calls and older callers). */
export function sendMessage(meUid: string, otherUid: string, text: string, extra: Partial<ChatMessage> = {}, file?: { data: string; mime: string; name: string; size: number }) {
  return sendToThread(dmRef(meUid, otherUid), { uid: meUid }, text, extra, file, [meUid, otherUid])
}

/** Changes the text of one of my messages. */
export async function editMessage(ref: ThreadRef, msgId: string, text: string, isLast: boolean) {
  const body = text.trim().slice(0, 2000)
  if (!body) return
  await updateDoc(doc(db, ref.col, ref.id, 'messages', msgId), { text: body, editedAt: Date.now() })
  if (isLast) updateDoc(doc(db, ref.col, ref.id), { lastText: body.slice(0, 140) }).catch(() => { /* fine */ })
}

/** Deletes one of my messages for everyone (it shows as "Mensagem apagada"). */
export async function deleteMessage(ref: ThreadRef, m: ChatMessage, isLast: boolean) {
  await updateDoc(doc(db, ref.col, ref.id, 'messages', m.id), { deleted: true, text: '', fileId: deleteField(), name: deleteField() })
  if (m.fileId) deleteDoc(doc(db, ref.col, ref.id, 'files', m.fileId)).catch(() => { /* fine */ })
  if (isLast) updateDoc(doc(db, ref.col, ref.id), { lastText: '🚫 Mensagem apagada' }).catch(() => { /* fine */ })
}

const fileCache = new Map<string, Promise<{ data: string; mime: string; name: string } | null>>()
/** The attachment of a message (cached). */
export function loadFile(ref: ThreadRef, fileId: string) {
  const key = refKey(ref) + '/' + fileId
  if (!fileCache.has(key)) {
    fileCache.set(key, getDoc(doc(db, ref.col, ref.id, 'files', fileId)).then((s) => (s.exists() ? (s.data() as any) : null)).catch(() => { fileCache.delete(key); return null }))
  }
  return fileCache.get(key)!
}

let typingCounter = 0
let lastTypingPing = 0
/** Tells the others "a escrever…" (at most every 2.5 s). */
export function pingTyping(ref: ThreadRef, meUid: string, users?: string[]) {
  const now = Date.now()
  if (now - lastTypingPing < 2500) return
  lastTypingPing = now
  typingCounter = (typingCounter % 1000000) + 1
  setDoc(doc(db, ref.col, ref.id), { ...summaryBase(ref, users), typing: { [meUid]: typingCounter } }, { merge: true }).catch(() => { /* offline */ })
}
export function stopTyping(ref: ThreadRef, meUid: string, users?: string[]) {
  lastTypingPing = 0
  setDoc(doc(db, ref.col, ref.id), { ...summaryBase(ref, users), typing: { [meUid]: 0 } }, { merge: true }).catch(() => { /* offline */ })
}

export function markRead(ref: ThreadRef, meUid: string, users?: string[]) {
  setDoc(doc(db, ref.col, ref.id), { ...summaryBase(ref, users), reads: { [meUid]: serverTimestamp() }, delivered: { [meUid]: serverTimestamp() } }, { merge: true }).catch(() => { /* not friends yet */ })
}

/** This device received the messages: they show "Entregue" on the other side. */
export function markDelivered(ref: ThreadRef, chat: ChatSummary, meUid: string) {
  setDoc(doc(db, ref.col, ref.id), { ...summaryBase(ref, chat.users), delivered: { [meUid]: serverTimestamp() } }, { merge: true }).catch(() => { /* offline */ })
}

export type Receipt = 'pending' | 'sent' | 'delivered' | 'seen'
/** Where one of my messages is. In a group: seen/delivered once everyone else has. */
export function receiptOf(m: { at: number; pending?: boolean }, chat: ChatSummary | undefined, others: string | string[]): Receipt {
  if (m.pending) return 'pending'
  const list = Array.isArray(others) ? others : [others]
  if (!list.length) return 'sent'
  if (list.every((o) => (chat?.reads?.[o] || 0) >= m.at)) return 'seen'
  if (list.every((o) => (chat?.delivered?.[o] || 0) >= m.at)) return 'delivered'
  return 'sent'
}

/** In a group: who has already seen a message. */
export const seenBy = (m: { at: number }, chat: ChatSummary | undefined, others: string[]) => others.filter((o) => (chat?.reads?.[o] || 0) >= m.at)

export const isUnread = (c: ChatSummary, me: string) => !!c.lastAt && c.lastFrom !== me && c.lastAt > (c.reads?.[me] || 0)
