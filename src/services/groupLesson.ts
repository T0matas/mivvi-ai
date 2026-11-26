import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, Unsubscribe } from 'firebase/firestore'
import { db } from '../firebase'
import { Exercise } from '../types'
import { sendToThread, groupRef } from './social'

// A live lesson inside a group: one student (the host) starts it from a
// lesson of their plan; everyone answers the same question at the same time;
// the host reveals the answer (with Mivvi's explanation) and moves on.
//
//   groups/{gid}/sessions/{sid}          → { host, hostName, subject, topic, questions, index, phase, explanations }
//   groups/{gid}/sessions/{sid}/answers/{uid} → { name, answers: { [i]: { answer, correct } } }

export type SessionPhase = 'question' | 'reveal' | 'ended'

export interface GroupSession {
  id: string
  host: string
  hostName: string
  subject: string
  topic: string
  questions: Exercise[]
  index: number
  phase: SessionPhase
  explanations: Record<string, string>
  createdAt: number
}

export interface SessionAnswers {
  uid: string
  name: string
  answers: Record<string, { answer: string; correct: boolean }>
}

const sessions = (gid: string) => collection(db, 'groups', gid, 'sessions')

export async function startSession(gid: string, me: { uid: string; name: string }, subject: string, topic: string, questions: Exercise[]) {
  const clean = JSON.parse(JSON.stringify(questions.map((q) => ({ question: q.question, options: q.options, correctAnswer: q.correctAnswer, acceptedAnswers: q.acceptedAnswers || [], type: q.type, visual: q.visual || null, hint: q.hint || null }))))
  const ref = await addDoc(sessions(gid), { host: me.uid, hostName: me.name, subject, topic, questions: clean, index: 0, phase: 'question', explanations: {}, createdAt: Date.now(), at: serverTimestamp() })
  // The invitation in the chat: a card with "Entrar" for everyone in the group.
  sendToThread(groupRef(gid), me, topic, { kind: 'lesson', sessionId: ref.id }).catch(() => { /* fine */ })
  return ref.id
}

/** The lesson running in a group right now (the most recent one not ended). */
export function subscribeActiveSession(gid: string, cb: (s: GroupSession | null) => void): Unsubscribe {
  return onSnapshot(query(sessions(gid), where('phase', 'in', ['question', 'reveal'])), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GroupSession, 'id'>) }))
      .filter((s) => Date.now() - s.createdAt < 3 * 60 * 60 * 1000)
      .sort((a, b) => b.createdAt - a.createdAt)
    cb(list[0] || null)
  }, (e) => { console.warn('group lesson', e); cb(null) })
}

export function subscribeSession(gid: string, sid: string, cb: (s: GroupSession | null) => void, onError?: (e: unknown) => void): Unsubscribe {
  return onSnapshot(doc(db, 'groups', gid, 'sessions', sid), (d) => cb(d.exists() ? ({ id: d.id, ...(d.data() as Omit<GroupSession, 'id'>) }) : null), (e) => { console.warn('group lesson', e); onError?.(e) })
}

export function subscribeAnswers(gid: string, sid: string, cb: (list: SessionAnswers[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'groups', gid, 'sessions', sid, 'answers'), (snap) => cb(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<SessionAnswers, 'uid'>) }))))
}

export function submitAnswer(gid: string, sid: string, me: { uid: string; name: string }, index: number, answer: string, correct: boolean) {
  return setDoc(doc(db, 'groups', gid, 'sessions', sid, 'answers', me.uid), { name: me.name, answers: { [String(index)]: { answer, correct } } }, { merge: true })
}

export const hostUpdate = (gid: string, sid: string, patch: Partial<Pick<GroupSession, 'index' | 'phase'>> & { explanations?: Record<string, string> }) =>
  updateDoc(doc(db, 'groups', gid, 'sessions', sid), patch as Record<string, unknown>)

/** Mivvi's explanation of question i, written once by the host for everyone. */
export const setExplanation = (gid: string, sid: string, i: number, text: string) =>
  updateDoc(doc(db, 'groups', gid, 'sessions', sid), { [`explanations.${i}`]: text })
