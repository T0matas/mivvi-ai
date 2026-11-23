import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getApp } from 'firebase/app'
import { auth } from '../firebase'
import { UserProfile, UserProgress } from '../types'

// The signed-in student's profile and progress, kept in Firestore at
// users/{uid} so the account works on any device. Without an account (or if
// the database refuses), the app keeps working from this device only.

export interface CloudData {
  profile?: UserProfile
  progress?: UserProgress
}

const db = () => getFirestore(getApp())

export async function loadFromCloud(uid = auth.currentUser?.uid): Promise<CloudData | null> {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db(), 'users', uid))
    if (!snap.exists()) return null
    const data = snap.data() as CloudData
    return { profile: data.profile, progress: data.progress }
  } catch (error) {
    console.warn('Could not read the account data:', error)
    return null
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
let pending: CloudData = {}

/** Saves a little after the last change, so a lesson's many updates make one write. */
export function saveToCloud(data: CloudData, uid = auth.currentUser?.uid) {
  if (!uid) return
  pending = { ...pending, ...data }
  clearTimeout(timer)
  timer = setTimeout(async () => {
    const payload = JSON.parse(JSON.stringify(pending)) // drops undefined values Firestore rejects
    pending = {}
    try {
      await setDoc(doc(db(), 'users', uid), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
    } catch (error) {
      console.warn('Could not save to the account:', error)
    }
  }, 1200)
}
