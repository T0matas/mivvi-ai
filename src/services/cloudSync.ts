import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { UserProfile, UserProgress } from '../types'

// The signed-in student's profile and progress, kept in Firestore at
// users/{uid} so the account works on any device. Without an account (or if
// the database refuses), the app keeps working from this device only.

export interface CloudData {
  profile?: UserProfile
  progress?: UserProgress
}

/**
 * 'none' means the account really has nothing saved yet; 'error' means we
 * could not read it (offline, rules…) and must NOT overwrite the cloud copy.
 */
export type CloudResult = { status: 'ok'; data: CloudData } | { status: 'none' } | { status: 'error'; error: unknown }

export async function readCloud(uid = auth.currentUser?.uid): Promise<CloudResult> {
  if (!uid) return { status: 'none' }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (!snap.exists()) return { status: 'none' }
      const data = snap.data() as CloudData
      if (!data.profile?.isOnboarded) return { status: 'none' }
      return { status: 'ok', data: { profile: data.profile, progress: data.progress } }
    } catch (error) {
      console.warn('Could not read the account data:', error)
      if (attempt === 1) return { status: 'error', error }
      await new Promise((r) => setTimeout(r, 800))
    }
  }
  return { status: 'error', error: null }
}

/** Kept for older callers. */
export async function loadFromCloud(uid = auth.currentUser?.uid): Promise<CloudData | null> {
  const r = await readCloud(uid)
  return r.status === 'ok' ? r.data : null
}

/** Joins two progress records without losing work done on either device. */
export function mergeProgress(a: UserProgress, b?: Partial<UserProgress> | null): UserProgress {
  if (!b) return a
  const union = (x: number[] = [], y: number[] = []) => [...new Set([...x, ...y])]
  const subjectProgress: UserProgress['subjectProgress'] = { ...(a.subjectProgress || {}) }
  for (const [k, v] of Object.entries(b.subjectProgress || {})) {
    const cur = subjectProgress[k]
    subjectProgress[k] = cur && v
      ? { completedLessons: union(cur.completedLessons, v.completedLessons), currentLesson: Math.max(cur.currentLesson, v.currentLesson), xp: Math.max(cur.xp, v.xp) }
      : (v || cur)!
  }
  const newer = (b.xp || 0) >= (a.xp || 0) ? b : a
  return {
    ...a,
    ...newer,
    xp: Math.max(a.xp || 0, b.xp || 0),
    streak: newer.streak ?? a.streak,
    completedLessons: union(a.completedLessons, b.completedLessons),
    currentLesson: Math.max(a.currentLesson || 1, b.currentLesson || 1),
    unlockedOutfits: [...new Set([...(a.unlockedOutfits || []), ...(b.unlockedOutfits || [])])],
    subjectProgress,
  } as UserProgress
}

let timer: ReturnType<typeof setTimeout> | undefined
let pending: CloudData = {}
let pendingUid: string | undefined

async function flush() {
  const uid = pendingUid
  if (!uid || (!pending.profile && !pending.progress)) return
  const payload = JSON.parse(JSON.stringify(pending)) // drops undefined values Firestore rejects
  pending = {}
  try {
    await setDoc(doc(db, 'users', uid), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
  } catch (error) {
    console.warn('Could not save to the account:', error)
  }
}

/** Saves a little after the last change, so a lesson's many updates make one write. */
export function saveToCloud(data: CloudData, uid = auth.currentUser?.uid) {
  if (!uid) return
  if (pendingUid && pendingUid !== uid) pending = {}
  pendingUid = uid
  pending = { ...pending, ...data }
  clearTimeout(timer)
  timer = setTimeout(flush, 1200)
}

// Don't lose the last change when the tab is closed or the app goes to background.
if (typeof window !== 'undefined') {
  const now = () => { clearTimeout(timer); flush() }
  window.addEventListener('pagehide', now)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') now() })
}
