import { addDoc, collection, doc, onSnapshot, query, setDoc, updateDoc, where, Unsubscribe } from 'firebase/firestore'
import { db } from '../firebase'
import { pairId } from './social'

// Voice and video calls between friends: WebRTC peer-to-peer, with Firestore
// only carrying the handshake (offer, answer and network candidates).
//
//   calls/{id}                    → { pair, from, to, fromName, type, status, offer, answer }
//   calls/{id}/callerCandidates/* and calleeCandidates/*
//
// status: ringing → accepted → ended (or declined / missed / cancelled).

export type CallType = 'audio' | 'video'
export type CallStatus = 'ringing' | 'accepted' | 'ended' | 'declined' | 'missed' | 'cancelled'

export interface CallDoc {
  id: string
  pair: string
  from: string
  to: string
  fromName?: string
  type: CallType
  status: CallStatus
  createdAt: number
  acceptedAt?: number
}

const ICE: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }],
  iceCandidatePoolSize: 4,
}

export function getMedia(type: CallType) {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: type === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  })
}

/** Incoming calls that are ringing for this student. */
export function subscribeIncoming(uid: string, cb: (calls: CallDoc[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'calls'), where('to', '==', uid), where('status', '==', 'ringing')),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CallDoc, 'id'>) })).filter((c) => Date.now() - c.createdAt < 60000)),
    (e) => console.warn('calls', e),
  )
}

export function subscribeCall(id: string, cb: (c: CallDoc | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'calls', id), (s) => cb(s.exists() ? ({ id: s.id, ...(s.data() as Omit<CallDoc, 'id'>) }) : null))
}

export const setCallStatus = (id: string, status: CallStatus) =>
  updateDoc(doc(db, 'calls', id), { status, ...(status === 'accepted' ? { acceptedAt: Date.now() } : { endedAt: Date.now() }) }).catch(() => { /* already gone */ })

/** A live connection: local and remote streams, and how to end it. */
export interface Session {
  pc: RTCPeerConnection
  local: MediaStream
  remote: MediaStream
  close: () => void
}

function makePeer(local: MediaStream, callId: string, mine: 'callerCandidates' | 'calleeCandidates', theirs: 'callerCandidates' | 'calleeCandidates') {
  const pc = new RTCPeerConnection(ICE)
  const remote = new MediaStream()
  local.getTracks().forEach((t) => pc.addTrack(t, local))
  pc.ontrack = (e) => e.streams[0]?.getTracks().forEach((t) => { if (!remote.getTracks().includes(t)) remote.addTrack(t) })
  // Candidates found before the call document exists wait in a queue.
  let ready = false
  const queue: RTCIceCandidateInit[] = []
  const push = (c: RTCIceCandidateInit) => addDoc(collection(db, 'calls', callId, mine), c).catch(() => { /* ended */ })
  pc.onicecandidate = (e) => { if (!e.candidate) return; const c = e.candidate.toJSON(); if (ready) push(c); else queue.push(c) }
  const markReady = () => { ready = true; queue.splice(0).forEach(push) }
  const unsubs: Unsubscribe[] = []
  const listenCandidates = () => unsubs.push(onSnapshot(collection(db, 'calls', callId, theirs), (s) => {
    s.docChanges().forEach((ch) => { if (ch.type === 'added') pc.addIceCandidate(new RTCIceCandidate(ch.doc.data())).catch(() => { /* late */ }) })
  }))
  const close = () => {
    unsubs.forEach((u) => u())
    local.getTracks().forEach((t) => t.stop())
    try { pc.close() } catch { /* closed */ }
  }
  return { pc, remote, unsubs, listenCandidates, close, markReady }
}

/** Starts a call to a friend. */
export async function startCall(me: { uid: string; name: string }, otherUid: string, type: CallType): Promise<{ id: string; session: Session }> {
  const local = await getMedia(type)
  const ref = doc(collection(db, 'calls'))
  const peer = makePeer(local, ref.id, 'callerCandidates', 'calleeCandidates')
  const offer = await peer.pc.createOffer()
  await peer.pc.setLocalDescription(offer)
  await setDoc(ref, { pair: pairId(me.uid, otherUid), from: me.uid, to: otherUid, fromName: me.name, type, status: 'ringing', createdAt: Date.now(), offer: { type: offer.type, sdp: offer.sdp } })
  peer.markReady()
  peer.unsubs.push(onSnapshot(ref, (s) => {
    const answer = s.data()?.answer
    if (answer && !peer.pc.currentRemoteDescription) peer.pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => { /* closed */ })
  }))
  peer.listenCandidates()
  return { id: ref.id, session: { pc: peer.pc, local, remote: peer.remote, close: peer.close } }
}

/** Answers an incoming call. */
export async function answerCall(call: CallDoc & { offer?: RTCSessionDescriptionInit }, type: CallType): Promise<Session> {
  const local = await getMedia(type)
  const peer = makePeer(local, call.id, 'calleeCandidates', 'callerCandidates')
  await peer.pc.setRemoteDescription(new RTCSessionDescription(call.offer!))
  const answer = await peer.pc.createAnswer()
  await peer.pc.setLocalDescription(answer)
  peer.markReady()
  await updateDoc(doc(db, 'calls', call.id), { answer: { type: answer.type, sdp: answer.sdp }, status: 'accepted', acceptedAt: Date.now() })
  peer.listenCandidates()
  return { pc: peer.pc, local, remote: peer.remote, close: peer.close }
}
