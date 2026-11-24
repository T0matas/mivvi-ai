import {
  collection, doc, getDoc, onSnapshot, query, runTransaction, serverTimestamp, setDoc, deleteDoc, updateDoc,
  where, orderBy, limitToLast, writeBatch, Timestamp, Unsubscribe,
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

export function subscribeFriendships(uid: string, cb: (list: Friendship[]) => void, onError?: (e: unknown) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'friendships'), where('users', 'array-contains', uid)),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Friendship, 'id'>) }))),
    (e) => { console.warn('friendships', e); onError?.(e) },
  )
}

// ── Chat ───────────────────────────────────────────────────────────────────

export function subscribeChats(uid: string, cb: (list: ChatSummary[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'chats'), where('users', 'array-contains', uid)),
    (s) => cb(s.docs.map((d) => {
      const x = d.data({ serverTimestamps: 'estimate' })
      const reads: Record<string, number> = {}
      for (const [k, v] of Object.entries(x.reads || {})) reads[k] = ms(v)
      return { id: d.id, users: x.users, lastText: x.lastText, lastFrom: x.lastFrom, lastAt: ms(x.lastAt), reads, typing: x.typing || {} }
    })),
    (e) => console.warn('chats', e),
  )
}

export function subscribeMessages(chatId: string, cb: (list: ChatMessage[]) => void, onError?: (e: unknown) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'chats', chatId, 'messages'), orderBy('at'), limitToLast(300)),
    { includeMetadataChanges: true },
    (s) => cb(s.docs.map((d) => {
      const x = d.data({ serverTimestamps: 'estimate' })
      return { id: d.id, from: x.from, text: x.text || '', at: ms(x.at) || Date.now(), pending: d.metadata.hasPendingWrites, kind: x.kind || 'text', fileId: x.fileId, name: x.name, size: x.size, mime: x.mime, duration: x.duration, callType: x.callType, callStatus: x.callStatus }
    })),
    (e) => { console.warn('messages', e); onError?.(e) },
  )
}

export async function sendMessage(meUid: string, otherUid: string, text: string, extra: Partial<ChatMessage> = {}, file?: { data: string; mime: string; name: string; size: number }) {
  const body = text.trim().slice(0, 2000)
  const kind = extra.kind || 'text'
  if (!body && kind === 'text') return
  const id = pairId(meUid, otherUid)
  const batch = writeBatch(db)
  const msgRef = doc(collection(db, 'chats', id, 'messages'))
  let fileId: string | undefined
  if (file) {
    const fileRef = doc(collection(db, 'chats', id, 'files'))
    fileId = fileRef.id
    batch.set(fileRef, { from: meUid, data: file.data, mime: file.mime, name: file.name, size: file.size, at: serverTimestamp() })
  }
  const preview = kind === 'image' ? '📷 Foto' : kind === 'file' ? `📎 ${extra.name || 'Ficheiro'}` : kind === 'audio' ? '🎤 Mensagem de voz' : kind === 'call' ? (extra.callStatus === 'missed' ? '📞 Chamada perdida' : extra.callType === 'video' ? '📹 Videochamada' : '📞 Chamada') : body
  batch.set(doc(db, 'chats', id), { users: [meUid, otherUid].sort(), lastText: preview.slice(0, 140), lastFrom: meUid, lastAt: serverTimestamp(), reads: { [meUid]: serverTimestamp() }, typing: { [meUid]: 0 } }, { merge: true })
  batch.set(msgRef, { ...JSON.parse(JSON.stringify({ from: meUid, text: body, kind, fileId, name: extra.name, size: extra.size, mime: extra.mime, duration: extra.duration, callType: extra.callType, callStatus: extra.callStatus })), at: serverTimestamp() })
  await batch.commit()
}

const fileCache = new Map<string, Promise<{ data: string; mime: string; name: string } | null>>()
/** The attachment of a message (cached). */
export function loadFile(chatId: string, fileId: string) {
  const key = chatId + '/' + fileId
  if (!fileCache.has(key)) {
    fileCache.set(key, getDoc(doc(db, 'chats', chatId, 'files', fileId)).then((s) => (s.exists() ? (s.data() as any) : null)).catch(() => { fileCache.delete(key); return null }))
  }
  return fileCache.get(key)!
}

let typingCounter = 0
let lastTypingPing = 0
/** Tells the friend "a escrever…" (at most every 2.5 s). */
export function pingTyping(meUid: string, otherUid: string) {
  const now = Date.now()
  if (now - lastTypingPing < 2500) return
  lastTypingPing = now
  typingCounter = (typingCounter % 1000000) + 1
  setDoc(doc(db, 'chats', pairId(meUid, otherUid)), { users: [meUid, otherUid].sort(), typing: { [meUid]: typingCounter } }, { merge: true }).catch(() => { /* offline */ })
}
export function stopTyping(meUid: string, otherUid: string) {
  lastTypingPing = 0
  setDoc(doc(db, 'chats', pairId(meUid, otherUid)), { users: [meUid, otherUid].sort(), typing: { [meUid]: 0 } }, { merge: true }).catch(() => { /* offline */ })
}

export function markRead(meUid: string, otherUid: string) {
  const id = pairId(meUid, otherUid)
  setDoc(doc(db, 'chats', id), { users: [meUid, otherUid].sort(), reads: { [meUid]: serverTimestamp() } }, { merge: true }).catch(() => { /* not friends yet */ })
}

export const isUnread = (c: ChatSummary, me: string) => !!c.lastAt && c.lastFrom !== me && c.lastAt > (c.reads?.[me] || 0)
