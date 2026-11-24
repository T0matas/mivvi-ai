import { useEffect, useMemo, useRef, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../firebase'
import { Friendship, PublicProfile, subscribeFriendships, subscribeProfile, subscribeChats, ChatSummary, isUnread, markDelivered } from './social'

/** The signed-in Firebase user, kept up to date. */
export function useAuthUser() {
  const [user, setUser] = useState<User | null>(auth.currentUser)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  return user
}

export interface FriendView {
  friendship: Friendship
  uid: string
  name: string
  profile: PublicProfile | null
}

/** Friends, requests and chats of the signed-in student, live. */
export function useSocial(uid?: string | null) {
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [profiles, setProfiles] = useState<Record<string, PublicProfile | null>>({})
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setFriendships([]); setChats([]); setLoaded(false); setError(false)
    if (!uid) return
    const a = subscribeFriendships(uid, (l) => { setFriendships(l); setLoaded(true); setError(false) }, () => { setError(true); setLoaded(true) })
    const b = subscribeChats(uid, setChats)
    return () => { a(); b() }
  }, [uid])

  // New messages reached this device: tell the sender ("Entregue").
  const deliveredFor = useRef<Record<string, number>>({})
  useEffect(() => {
    if (!uid) return
    for (const c of chats) {
      if (!c.lastAt || c.lastFrom === uid) continue
      if ((c.delivered?.[uid] || 0) >= c.lastAt || deliveredFor.current[c.id] === c.lastAt) continue
      deliveredFor.current[c.id] = c.lastAt
      markDelivered(c, uid)
    }
  }, [chats, uid])

  // Live public cards of everyone in the list (names, online status).
  const others = useMemo(() => [...new Set(friendships.map((f) => f.users.find((u) => u !== uid)!).filter(Boolean))].sort(), [friendships, uid])
  const key = others.join(',')
  useEffect(() => {
    const subs = others.map((o) => subscribeProfile(o, (p) => setProfiles((prev) => ({ ...prev, [o]: p }))))
    return () => subs.forEach((s) => s())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const view = (f: Friendship): FriendView => {
    const other = f.users.find((u) => u !== uid)!
    const profile = profiles[other] || null
    return { friendship: f, uid: other, profile, name: profile?.name || (f.from === other ? f.fromName : f.toName) || 'Amigo' }
  }

  const friends = friendships.filter((f) => f.status === 'accepted').map(view).sort((a, b) => a.name.localeCompare(b.name))
  const incoming = friendships.filter((f) => f.status === 'pending' && f.to === uid).map(view)
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.from === uid).map(view)
  const unread = uid ? chats.filter((c) => isUnread(c, uid) && friends.some((f) => c.users.includes(f.uid))).length : 0

  return { friends, incoming, outgoing, chats, unread, loaded, error }
}
