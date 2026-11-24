import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { CallRounded, CallEndRounded, MicRounded, MicOffRounded, VideocamRounded, VideocamOffRounded, CameraswitchRounded } from '@mui/icons-material'
import { answerCall, CallDoc, CallType, Session, setCallStatus, startCall, subscribeCall, subscribeIncoming } from '../services/calls'
import { PublicProfile, sendMessage } from '../services/social'
import { FriendView } from '../services/useSocial'
import { Avatar } from './Friends'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// Calls between friends: start one from the chat, get the ringing card when
// someone calls you, and the call screen (big remote video or the friend's
// avatar, your camera in a corner, mute / camera / hang up).

interface CallApi {
  call: (friend: FriendView, type: CallType) => void
  busy: boolean
}
const Ctx = createContext<CallApi>({ call: () => {}, busy: false })
export const useCalls = () => useContext(Ctx)

type Active = {
  id: string
  role: 'caller' | 'callee'
  type: CallType
  other: { uid: string; name: string; photo?: string | null }
  status: 'ringing' | 'connecting' | 'live'
  startedAt?: number
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function CallProvider({ me, friends, children }: { me: PublicProfile | null; friends: FriendView[]; children: ReactNode }) {
  const [incoming, setIncoming] = useState<(CallDoc & { offer?: RTCSessionDescriptionInit }) | null>(null)
  const [active, setActive] = useState<Active | null>(null)
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [now, setNow] = useState(Date.now())
  const session = useRef<Session | null>(null)
  const unsubCall = useRef<(() => void) | null>(null)
  const activeRef = useRef<Active | null>(null)
  activeRef.current = active
  const remoteVideo = useRef<HTMLVideoElement>(null)
  const remoteAudio = useRef<HTMLAudioElement>(null)
  const localVideo = useRef<HTMLVideoElement>(null)
  const friendsRef = useRef(friends)
  friendsRef.current = friends

  // Who is calling me.
  useEffect(() => {
    if (!me) return
    return subscribeIncoming(me.uid, (list) => {
      const c = list[0] as any
      if (!c || activeRef.current) { setIncoming(null); return }
      setIncoming(c)
    })
  }, [me?.uid])  // eslint-disable-line react-hooks/exhaustive-deps

  // Ring while someone is calling / while waiting for the friend to answer.
  useEffect(() => {
    if (incoming && !active) { soundManager.playRing(); const t = setInterval(() => soundManager.playRing(), 2200); return () => clearInterval(t) }
    if (active?.status === 'ringing' && active.role === 'caller') { soundManager.playDialTone(); const t = setInterval(() => soundManager.playDialTone(), 3000); return () => clearInterval(t) }
  }, [incoming, active?.status, active?.role])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active?.status !== 'live') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active?.status])

  const attach = (s: Session) => {
    if (remoteVideo.current) remoteVideo.current.srcObject = s.remote
    if (remoteAudio.current) remoteAudio.current.srcObject = s.remote
    if (localVideo.current) localVideo.current.srcObject = s.local
  }
  useEffect(() => { if (session.current) attach(session.current) })

  const cleanup = useCallback((logAs?: 'done' | 'missed' | 'declined') => {
    const a = activeRef.current
    unsubCall.current?.()
    unsubCall.current = null
    session.current?.close()
    session.current = null
    setActive(null)
    setMuted(false)
    setCamOff(false)
    soundManager.playHangup()
    // The caller writes the call in the chat history.
    if (a && me && a.role === 'caller' && logAs) {
      const duration = a.startedAt ? Math.round((Date.now() - a.startedAt) / 1000) : 0
      sendMessage(me.uid, a.other.uid, '', { kind: 'call', callType: a.type, callStatus: logAs, duration }).catch(() => { /* offline */ })
    }
  }, [me])

  const watch = (id: string) => {
    unsubCall.current = subscribeCall(id, (c) => {
      const a = activeRef.current
      if (!a) return
      if (!c || ['ended', 'declined', 'missed', 'cancelled'].includes(c.status)) {
        cleanup(!c ? undefined : c.status === 'declined' ? 'declined' : c.status === 'missed' ? 'missed' : a.startedAt ? 'done' : 'missed')
        return
      }
      if (c.status === 'accepted' && a.status !== 'live') setActive({ ...a, status: 'live', startedAt: c.acceptedAt || Date.now() })
    })
  }

  // Nobody answered in 40 s: missed.
  useEffect(() => {
    if (active?.status !== 'ringing' || active.role !== 'caller') return
    const t = setTimeout(() => { setCallStatus(active.id, 'missed') }, 40000)
    return () => clearTimeout(t)
  }, [active?.status, active?.id, active?.role])

  const call = async (friend: FriendView, type: CallType) => {
    if (!me || active) return
    setError('')
    const other = { uid: friend.uid, name: friend.name, photo: friend.profile?.photo }
    setActive({ id: '', role: 'caller', type, other, status: 'ringing' })
    try {
      const { id, session: s } = await startCall({ uid: me.uid, name: me.name }, friend.uid, type)
      session.current = s
      attach(s)
      setActive({ id, role: 'caller', type, other, status: 'ringing' })
      activeRef.current = { id, role: 'caller', type, other, status: 'ringing' }
      watch(id)
    } catch (e: any) {
      setActive(null)
      setError(e?.name === 'NotAllowedError' ? 'Sem acesso ao microfone/câmara. Permite-o nas definições do browser.' : 'Não foi possível iniciar a chamada.')
    }
  }

  const accept = async (type: CallType) => {
    const c = incoming
    if (!c || !me) return
    setIncoming(null)
    const f = friendsRef.current.find((x) => x.uid === c.from)
    const other = { uid: c.from, name: f?.name || c.fromName || 'Amigo', photo: f?.profile?.photo }
    const a: Active = { id: c.id, role: 'callee', type, other, status: 'connecting' }
    setActive(a)
    activeRef.current = a
    try {
      session.current = await answerCall(c, type)
      attach(session.current)
      watch(c.id)
    } catch (e: any) {
      setCallStatus(c.id, 'declined')
      setActive(null)
      setError(e?.name === 'NotAllowedError' ? 'Sem acesso ao microfone/câmara. Permite-o nas definições do browser.' : 'Não foi possível atender.')
    }
  }

  const decline = () => { if (incoming) setCallStatus(incoming.id, 'declined'); setIncoming(null) }

  const hangup = () => {
    const a = activeRef.current
    if (!a) return
    if (a.id) setCallStatus(a.id, a.status === 'ringing' && a.role === 'caller' ? 'cancelled' : 'ended')
    cleanup(a.role === 'caller' ? (a.startedAt ? 'done' : 'missed') : undefined)
  }

  const toggleMute = () => { const s = session.current; if (!s) return; s.local.getAudioTracks().forEach((t) => (t.enabled = muted)); setMuted(!muted) }
  const toggleCam = () => {
    const s = session.current
    if (!s) return
    s.local.getVideoTracks().forEach((t) => (t.enabled = camOff))
    setCamOff(!camOff)
  }
  const flipCam = async () => {
    const s = session.current
    const old = s?.local.getVideoTracks()[0]
    if (!s || !old) return
    const facing = old.getSettings().facingMode === 'environment' ? 'user' : 'environment'
    try {
      const v = (await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })).getVideoTracks()[0]
      await s.pc.getSenders().find((x) => x.track === old)?.replaceTrack(v)
      s.local.removeTrack(old); old.stop(); s.local.addTrack(v)
      if (localVideo.current) localVideo.current.srcObject = s.local
    } catch { /* one camera */ }
  }

  const ctl = (on: boolean, danger = false) => ({
    width: 56, height: 56, border: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'transform .15s, background-color .15s',
    bgcolor: danger ? '#ef4444' : on ? '#fff' : 'rgba(255,255,255,.14)', color: danger ? '#fff' : on ? '#0d0d0d' : '#fff', '&:active': { transform: 'scale(.92)' }, '& svg': { fontSize: 26 },
  })
  const hasRemoteVideo = active?.type === 'video'
  const seconds = active?.startedAt ? Math.max(0, Math.round((now - active.startedAt) / 1000)) : 0
  const incomingFriend = incoming ? friends.find((f) => f.uid === incoming.from) : null

  return (
    <Ctx.Provider value={{ call, busy: !!active }}>
      {children}

      {/* Someone is calling */}
      {incoming && !active && (
        <Box sx={{ position: 'fixed', top: 'calc(12px + env(safe-area-inset-top, 0px))', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, width: 'min(420px, calc(100% - 24px))', p: 1.75, borderRadius: '22px', bgcolor: '#222', color: cv.text,
          boxShadow: `inset 0 0 0 1px ${cv.borderStrong}, 0 20px 50px rgba(0,0,0,.6)`, display: 'flex', alignItems: 'center', gap: 1.5, animation: 'clIn .35s cubic-bezier(.22,1,.36,1) both', '@keyframes clIn': { from: { opacity: 0, transform: 'translate(-50%, -16px)' } } }}>
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ position: 'absolute', inset: -4, borderRadius: '16px', border: `2px solid ${cv.green}`, animation: 'clPulse 1.4s ease-out infinite', '@keyframes clPulse': { from: { opacity: 1, transform: 'scale(.95)' }, to: { opacity: 0, transform: 'scale(1.25)' } } }} />
            <Avatar name={incomingFriend?.name || incoming.fromName || '?'} photo={incomingFriend?.profile?.photo} size={46} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{incomingFriend?.name || incoming.fromName}</Typography>
            <Typography sx={{ fontSize: 13, color: cv.muted }}>{incoming.type === 'video' ? 'Videochamada…' : 'Chamada de voz…'}</Typography>
          </Box>
          <Box component="button" onClick={decline} aria-label="Recusar" sx={{ ...ctl(false, true), width: 44, height: 44, '& svg': { fontSize: 22 } }}><CallEndRounded /></Box>
          <Box component="button" onClick={() => accept(incoming.type)} aria-label="Atender" sx={{ ...ctl(false), width: 44, height: 44, bgcolor: cv.green, color: '#0d0d0d', '& svg': { fontSize: 22 } }}>
            {incoming.type === 'video' ? <VideocamRounded /> : <CallRounded />}
          </Box>
        </Box>
      )}

      {error && (
        <Box onClick={() => setError('')} sx={{ position: 'fixed', left: '50%', top: 16, transform: 'translateX(-50%)', zIndex: 2000, px: 2, py: 1.25, borderRadius: 999, bgcolor: '#2a2a2a', color: cv.coral, fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,.4)', cursor: 'pointer', maxWidth: '90vw' }}>{error}</Box>
      )}

      {/* The call screen */}
      {active && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 1999, bgcolor: '#0c0c0c', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <audio ref={remoteAudio} autoPlay />
          <Box component="video" ref={remoteVideo} autoPlay playsInline muted
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: hasRemoteVideo && active.status === 'live' ? 'block' : 'none', bgcolor: '#000' }} />

          {!(hasRemoteVideo && active.status === 'live') && (
            <Box sx={{ display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 1.5 }}>
              <Box sx={{ position: 'relative' }}>
                {active.status !== 'live' && <Box sx={{ position: 'absolute', inset: -10, borderRadius: '40px', border: '2px solid rgba(255,255,255,.25)', animation: 'clPulse 1.6s ease-out infinite', '@keyframes clPulse': { from: { opacity: 1, transform: 'scale(.95)' }, to: { opacity: 0, transform: 'scale(1.25)' } } }} />}
                <Avatar name={active.other.name} photo={active.other.photo} size={112} />
              </Box>
              <Typography sx={{ fontFamily: cv.display, fontSize: 26, fontWeight: 700, mt: 1.5 }}>{active.other.name}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,.65)', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                {active.status === 'ringing' ? 'A chamar…' : active.status === 'connecting' ? 'A ligar…' : fmt(seconds)}
              </Typography>
            </Box>
          )}

          {hasRemoteVideo && active.status === 'live' && (
            <Box sx={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', left: 16, px: 1.5, py: 0.75, borderRadius: 999, bgcolor: 'rgba(0,0,0,.45)', backdropFilter: 'blur(8px)', fontSize: 14, fontWeight: 600 }}>
              {active.other.name} · {fmt(seconds)}
            </Box>
          )}

          {/* My camera */}
          <Box component="video" ref={localVideo} autoPlay playsInline muted
            sx={{ position: 'absolute', right: 16, top: 'calc(16px + env(safe-area-inset-top, 0px))', width: { xs: 104, sm: 180 }, aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: '16px', bgcolor: '#222', transform: 'scaleX(-1)',
              boxShadow: '0 10px 30px rgba(0,0,0,.5)', display: active.type === 'video' && !camOff ? 'block' : 'none' }} />

          <Box sx={{ position: 'absolute', bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))', display: 'flex', gap: 2, p: 1.25, borderRadius: 999, bgcolor: 'rgba(30,30,30,.7)', backdropFilter: 'blur(12px)' }}>
            <Box component="button" onClick={toggleMute} aria-label={muted ? 'Ligar microfone' : 'Silenciar'} sx={ctl(muted)}>{muted ? <MicOffRounded /> : <MicRounded />}</Box>
            {active.type === 'video' && <Box component="button" onClick={toggleCam} aria-label={camOff ? 'Ligar câmara' : 'Desligar câmara'} sx={ctl(camOff)}>{camOff ? <VideocamOffRounded /> : <VideocamRounded />}</Box>}
            {active.type === 'video' && <Box component="button" onClick={flipCam} aria-label="Trocar câmara" sx={ctl(false)}><CameraswitchRounded /></Box>}
            <Box component="button" onClick={hangup} aria-label="Desligar" sx={ctl(false, true)}><CallEndRounded /></Box>
          </Box>
        </Box>
      )}
    </Ctx.Provider>
  )
}
