import { useEffect, useState } from 'react'
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { LibraryItem } from '../types'

// The Library: the summary of every lesson the student finished, by subject.
// Kept on this device and, with an account, in users/{uid}/library so it
// follows the student to other devices.

const KEY = 'mivvi_library'
const EVENT = 'mivvi-library'

export function readLibrary(): LibraryItem[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeLibrary(list: LibraryItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500))) } catch { /* storage full */ }
  window.dispatchEvent(new Event(EVENT))
}

/** Adds (or replaces) a lesson summary. */
export function saveToLibrary(item: LibraryItem) {
  writeLibrary([item, ...readLibrary().filter((x) => x.id !== item.id)])
  const uid = auth.currentUser?.uid
  if (uid) setDoc(doc(db, 'users', uid, 'library', item.id), JSON.parse(JSON.stringify(item))).catch((e) => console.warn('library save', e))
}

export function removeFromLibrary(id: string) {
  writeLibrary(readLibrary().filter((x) => x.id !== id))
  const uid = auth.currentUser?.uid
  if (uid) deleteDoc(doc(db, 'users', uid, 'library', id)).catch(() => { /* offline */ })
}

/** After signing in: brings the account's summaries here and uploads the ones only this device has. */
export async function syncLibrary(uid: string) {
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'library'))
    const cloud = snap.docs.map((d) => d.data() as LibraryItem)
    const local = readLibrary()
    const byId = new Map<string, LibraryItem>()
    for (const item of [...cloud, ...local]) {
      const cur = byId.get(item.id)
      if (!cur || item.date > cur.date) byId.set(item.id, item)
    }
    const cloudIds = new Set(cloud.map((c) => c.id))
    local.filter((l) => !cloudIds.has(l.id)).forEach((l) => setDoc(doc(db, 'users', uid, 'library', l.id), JSON.parse(JSON.stringify(l))).catch(() => { /* later */ }))
    writeLibrary([...byId.values()].sort((a, b) => b.date - a.date))
  } catch (e) {
    console.warn('Could not sync the library', e)
  }
}

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>(readLibrary)
  useEffect(() => {
    const update = () => setItems(readLibrary())
    window.addEventListener(EVENT, update)
    window.addEventListener('storage', update)
    return () => { window.removeEventListener(EVENT, update); window.removeEventListener('storage', update) }
  }, [])
  return items
}
