import { Fragment, useEffect, useRef, useState } from 'react'
import { Box, Typography, IconButton, CircularProgress, Dialog } from '@mui/material'
import {
  ArrowBack, SendRounded, AttachFileRounded, MicRounded, DeleteOutlineRounded, CallRounded, VideocamRounded,
  PlayArrowRounded, PauseRounded, InsertDriveFileRounded, DownloadRounded, CallMadeRounded, CallReceivedRounded, PhoneMissedRounded, Close,
} from '@mui/icons-material'
import { ChatMessage, ChatSummary, PublicProfile, isOnline, markRead, pairId, sendMessage, subscribeMessages, loadFile, pingTyping, stopTyping, MAX_FILE_BYTES } from '../services/social'
import { FriendView } from '../services/useSocial'
import { Avatar } from './Friends'
import { useCalls } from './CallProvider'
import { yearLabel } from '../data/ptCurriculum'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// One conversation: header with call buttons, messages grouped by person and
// day (text, photos, files, voice messages, calls), "a escrever…", and the
// composer with attach, voice recording and send.

const time = (ms: number) => new Date(ms).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
const dayLabel = (ms: number) => {
  const d = new Date(ms), today = new Date()
  const y = new Date(); y.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === y.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
}
const lastSeen = (p: PublicProfile | null) => {
  if (isOnline(p)) return 'Online'
  if (!p?.lastSeen) return p?.year ? yearLabel(p.year) : ''
  const min = Math.round((Date.now() - p.lastSeen) / 60000)
  if (min < 60) return `Visto há ${min} min`
  if (min < 60 * 24) return `Visto há ${Math.round(min / 60)} h`
  return `Visto a ${new Date(p.lastSeen).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}`
}
const fmtSecs = (s = 0) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`
const fmtSize = (b = 0) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)

const readAsDataUrl = (blob: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob) })

/** Photos are shrunk until they fit in the chat (longest side ≤ 1600 px, JPEG). */
async function compressImage(file: File): Promise<{ data: string; size: number }> {
  const url = await readAsDataUrl(file)
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
  for (const [side, q] of [[1600, 0.82], [1280, 0.72], [1024, 0.62], [800, 0.55]] as const) {
    const scale = Math.min(1, side / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    const data = c.toDataURL('image/jpeg', q)
    const size = Math.round((data.length - 23) * 0.75)
    if (size <= MAX_FILE_BYTES) return { data, size }
  }
  throw new Error('too big')
}

export default function Conversation({ me, friend, chat, mobile, onBack }: { me: PublicProfile; friend: FriendView; chat?: ChatSummary; mobile: boolean; onBack: () => void }) {
  const { call, busy: inCall } = useCalls()
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState<{ start: number } | null>(null)
  const [recSecs, setRecSecs] = useState(0)
  const [typing, setTyping] = useState(false)
  const [viewer, setViewer] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const cancelRec = useRef(false)
  const lastCount = useRef(0)
  const lastTyping = useRef<number | undefined>(undefined)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>()
  const chatId = pairId(me.uid, friend.uid)

  useEffect(() => subscribeMessages(chatId, (list) => {
    if (lastCount.current && list.length > lastCount.current && list[list.length - 1].from !== me.uid) { soundManager.playMessage(); setTyping(false) }
    lastCount.current = list.length
    setMessages(list)
    setError('')
  }, () => setError('Não foi possível carregar as mensagens.')), [chatId, me.uid])

  // "a escrever…": shown for a few seconds each time the friend's counter changes.
  const theirTyping = chat?.typing?.[friend.uid]
  useEffect(() => {
    const prev = lastTyping.current
    lastTyping.current = theirTyping
    if (prev === undefined || !theirTyping || theirTyping === prev) { if (!theirTyping) setTyping(false); return }
    setTyping(true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(false), 4500)
  }, [theirTyping])
  useEffect(() => () => { clearTimeout(typingTimer.current); stopTyping(me.uid, friend.uid) }, [me.uid, friend.uid])

  useEffect(() => { if (messages) markRead(me.uid, friend.uid) }, [messages?.length, me.uid, friend.uid])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight }, [messages?.length, typing])
  useEffect(() => { if (!mobile) input.current?.focus() }, [mobile, friend.uid])
  useEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [text])
  useEffect(() => {
    if (!recording) return
    const t = setInterval(() => setRecSecs(Math.round((Date.now() - recording.start) / 1000)), 250)
    return () => clearInterval(t)
  }, [recording])

  const fail = (msg: string) => { setError(msg); soundManager.playError() }

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setText('')
    soundManager.playSend()
    stopTyping(me.uid, friend.uid)
    try { await sendMessage(me.uid, friend.uid, body) } catch { setText(body); fail('A mensagem não foi enviada. Tenta outra vez.') }
  }

  const onPickFile = async (file?: File) => {
    if (!file) return
    setError('')
    setSending(true)
    try {
      if (file.type.startsWith('image/') && !file.type.includes('gif')) {
        const { data, size } = await compressImage(file)
        await sendMessage(me.uid, friend.uid, '', { kind: 'image', name: file.name, size, mime: 'image/jpeg' }, { data, mime: 'image/jpeg', name: file.name, size })
      } else {
        if (file.size > MAX_FILE_BYTES) { fail(`O ficheiro é grande demais (máximo ${fmtSize(MAX_FILE_BYTES)}).`); return }
        const data = await readAsDataUrl(file)
        await sendMessage(me.uid, friend.uid, '', { kind: file.type.startsWith('image/') ? 'image' : 'file', name: file.name, size: file.size, mime: file.type || 'application/octet-stream' }, { data, mime: file.type || 'application/octet-stream', name: file.name, size: file.size })
      }
      soundManager.playSend()
    } catch {
      fail('Não foi possível enviar o ficheiro.')
    } finally {
      setSending(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || ''
      const r = new MediaRecorder(stream, { ...(type && { mimeType: type }), audioBitsPerSecond: 32000 })
      chunks.current = []
      cancelRec.current = false
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data) }
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const secs = Math.max(1, Math.round((Date.now() - start) / 1000))
        setRecording(null); setRecSecs(0)
        if (cancelRec.current || !chunks.current.length) return
        const blob = new Blob(chunks.current, { type: r.mimeType || type || 'audio/webm' })
        if (blob.size > MAX_FILE_BYTES) { fail('A mensagem de voz é longa demais.'); return }
        setSending(true)
        try {
          const data = await readAsDataUrl(blob)
          await sendMessage(me.uid, friend.uid, '', { kind: 'audio', duration: secs, size: blob.size, mime: blob.type }, { data, mime: blob.type, name: 'voz', size: blob.size })
          soundManager.playSend()
        } catch { fail('Não foi possível enviar o áudio.') } finally { setSending(false) }
      }
      const start = Date.now()
      r.start(250)
      recorder.current = r
      setRecording({ start })
      soundManager.playSelect()
    } catch (e: any) {
      fail(e?.name === 'NotAllowedError' ? 'Sem acesso ao microfone. Permite-o nas definições do browser.' : 'Não foi possível gravar.')
    }
  }
  const stopRecording = (cancel = false) => { cancelRec.current = cancel; recorder.current?.stop(); recorder.current = null }
  // Voice messages up to 2 minutes.
  useEffect(() => { if (recording && recSecs >= 120) stopRecording() }, [recSecs, recording])

  const rows = messages || []
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0,
      ...(mobile && { position: 'fixed', inset: 0, zIndex: 1250, bgcolor: cv.bg, pt: 'env(safe-area-inset-top, 0px)' }) }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: { xs: 1, md: 2 }, height: 58, borderBottom: `1px solid ${cv.border}`, flexShrink: 0 }}>
        {mobile && <IconButton onClick={() => { soundManager.playBack(); onBack() }} aria-label="Voltar" sx={{ width: 36, height: 36 }}><ArrowBack sx={{ fontSize: 20 }} /></IconButton>}
        <Avatar name={friend.name} photo={friend.profile?.photo} size={34} online={isOnline(friend.profile)} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{friend.name}</Typography>
          <Typography sx={{ fontSize: 12, color: typing ? cv.accent : isOnline(friend.profile) ? cv.green : cv.muted }}>{typing ? 'a escrever…' : lastSeen(friend.profile)}</Typography>
        </Box>
        <IconButton onClick={() => call(friend, 'audio')} disabled={inCall} aria-label="Chamada de voz" title="Chamada de voz" sx={{ width: 38, height: 38 }}><CallRounded sx={{ fontSize: 20 }} /></IconButton>
        <IconButton onClick={() => call(friend, 'video')} disabled={inCall} aria-label="Videochamada" title="Videochamada" sx={{ width: 38, height: 38 }}><VideocamRounded sx={{ fontSize: 21 }} /></IconButton>
      </Box>

      {/* Messages */}
      <Box ref={scroller} sx={{ flex: 1, overflowY: 'auto', px: { xs: 1.5, md: 2.5 }, py: 2 }}>
        {messages === null && !error && <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}><CircularProgress size={22} sx={{ color: cv.muted }} /></Box>}
        {messages !== null && rows.length === 0 && (
          <Box sx={{ display: 'grid', justifyItems: 'center', textAlign: 'center', py: 5, gap: 1 }}>
            <Avatar name={friend.name} photo={friend.profile?.photo} size={60} />
            <Typography sx={{ fontFamily: cv.display, fontSize: 18, fontWeight: 700, mt: 1 }}>{friend.name}</Typography>
            <Typography sx={{ fontSize: 13.5, color: cv.muted, maxWidth: 280 }}>Este é o início da vossa conversa. Diz olá, liga-lhe ou combinem estudar juntos!</Typography>
          </Box>
        )}
        {rows.map((m, i) => {
          const prev = rows[i - 1]
          const newDay = !prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString()
          const grouped = !newDay && prev && prev.from === m.from && prev.kind !== 'call' && m.kind !== 'call' && m.at - prev.at < 5 * 60 * 1000
          const mine = m.from === me.uid
          const who = mine ? me : { name: friend.name, photo: friend.profile?.photo }
          return (
            <Fragment key={m.id}>
              {newDay && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2 }}>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: cv.border }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: cv.muted, px: 1.25, py: 0.4, borderRadius: 999, boxShadow: `inset 0 0 0 1px ${cv.border}`, textTransform: 'capitalize' }}>{dayLabel(m.at)}</Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: cv.border }} />
                </Box>
              )}
              {m.kind === 'call' ? <CallRow m={m} mine={mine} name={friend.name} /> : (
                <Box sx={{ display: 'flex', gap: 1.25, mt: grouped ? 0.25 : 1.5, px: 0.75, py: 0.25, mx: -0.75, borderRadius: '10px', '&:hover': { bgcolor: 'rgba(255,255,255,.025)' }, '&:hover .msg-time': { opacity: 1 } }}>
                  <Box sx={{ width: 34, flexShrink: 0 }}>
                    {!grouped ? <Avatar name={who.name} photo={who.photo} size={34} /> : (
                      <Typography className="msg-time" sx={{ fontSize: 10.5, color: cv.faint, opacity: 0, textAlign: 'right', pt: '3px', fontVariantNumeric: 'tabular-nums' }}>{time(m.at)}</Typography>
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    {!grouped && (
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{mine ? 'Tu' : friend.name}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: cv.faint }}>{time(m.at)}</Typography>
                      </Box>
                    )}
                    {m.kind === 'image' && m.fileId ? <ImageMsg chatId={chatId} m={m} onOpen={setViewer} />
                      : m.kind === 'file' && m.fileId ? <FileMsg chatId={chatId} m={m} />
                        : m.kind === 'audio' && m.fileId ? <AudioMsg chatId={chatId} m={m} mine={mine} />
                          : <Typography sx={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: m.pending ? cv.muted : '#e4e4e7' }}>{m.text}</Typography>}
                  </Box>
                </Box>
              )}
            </Fragment>
          )
        })}
        {typing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 1.5 }}>
            <Avatar name={friend.name} photo={friend.profile?.photo} size={34} />
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 1.25, borderRadius: '16px', bgcolor: cv.surface,
              '@keyframes tyDot': { '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 }, '30%': { transform: 'translateY(-3px)', opacity: 1 } } }}>
              {[0, 1, 2].map((d) => <Box key={d} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#cfcfd4', animation: `tyDot 1.2s ease-in-out ${d * 0.15}s infinite` }} />)}
            </Box>
            <Typography sx={{ fontSize: 12, color: cv.faint }}>{friend.name} está a escrever…</Typography>
          </Box>
        )}
      </Box>

      {/* Composer */}
      <Box sx={{ flexShrink: 0, px: { xs: 1.25, md: 2 }, pt: 1, pb: mobile ? 'calc(10px + env(safe-area-inset-bottom, 0px))' : 1.75 }}>
        {error && <Typography sx={{ fontSize: 12.5, color: cv.coral, mb: 0.75, px: 0.5 }}>{error}</Typography>}
        <input ref={fileInput} type="file" hidden onChange={(e) => onPickFile(e.target.files?.[0])} />
        {recording ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: '6px 6px 6px 10px', borderRadius: '18px', bgcolor: cv.composer, boxShadow: 'inset 0 0 0 1px rgba(255,159,136,.35)' }}>
            <IconButton onClick={() => { stopRecording(true); soundManager.playBack() }} aria-label="Cancelar gravação" sx={{ width: 36, height: 36, color: cv.coral }}><DeleteOutlineRounded /></IconButton>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444', animation: 'recBlink 1s ease-in-out infinite', '@keyframes recBlink': { '50%': { opacity: 0.3 } } }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtSecs(recSecs)}</Typography>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '3px', height: 24, overflow: 'hidden' }} aria-hidden>
              {Array.from({ length: 36 }).map((_, k) => (
                <Box key={k} sx={{ flex: 1, minWidth: 2, borderRadius: 999, bgcolor: cv.coral, height: `${25 + Math.abs(Math.sin(k * 1.3)) * 75}%`, animation: `recWave .9s ease-in-out ${(k % 6) * 0.1}s infinite`, '@keyframes recWave': { '0%, 100%': { transform: 'scaleY(.4)' }, '50%': { transform: 'scaleY(1)' } } }} />
              ))}
            </Box>
            <Box component="button" onClick={() => stopRecording(false)} aria-label="Enviar áudio" sx={sendBtn(true)}><SendRounded sx={{ fontSize: 18 }} /></Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, p: '6px 6px 6px 6px', borderRadius: '18px', bgcolor: cv.composer, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, '&:focus-within': { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)' } }}>
            <IconButton onClick={() => fileInput.current?.click()} disabled={sending} aria-label="Anexar ficheiro" title="Anexar foto ou ficheiro" sx={{ width: 36, height: 36 }}>
              {sending ? <CircularProgress size={17} sx={{ color: cv.muted }} /> : <AttachFileRounded sx={{ fontSize: 20, transform: 'rotate(45deg)' }} />}
            </IconButton>
            <Box component="textarea" ref={input} rows={1} value={text} maxLength={2000} placeholder={`Mensagem para ${friend.name}`}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setText(e.target.value); if (e.target.value.trim()) pingTyping(me.uid, friend.uid) }}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
              onPaste={(e: React.ClipboardEvent) => { const f = e.clipboardData.files?.[0]; if (f) { e.preventDefault(); onPickFile(f) } }}
              sx={{ flex: 1, minWidth: 0, resize: 'none', border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 15, lineHeight: 1.45, py: '7px', px: 0.5, maxHeight: 140, '&::placeholder': { color: cv.faint } }} />
            {text.trim() ? (
              <Box component="button" onClick={send} aria-label="Enviar" sx={sendBtn(true)}><SendRounded sx={{ fontSize: 18 }} /></Box>
            ) : (
              <Box component="button" onClick={startRecording} disabled={sending} aria-label="Gravar mensagem de voz" title="Gravar mensagem de voz" sx={{ ...sendBtn(false), color: cv.text, bgcolor: 'transparent', '&:hover': { bgcolor: cv.soft } }}><MicRounded sx={{ fontSize: 20 }} /></Box>
            )}
          </Box>
        )}
        {!mobile && <Typography sx={{ fontSize: 11.5, color: cv.faint, mt: 0.75, px: 0.5 }}><b>Enter</b> para enviar · <b>Shift + Enter</b> nova linha · fotos e ficheiros até {fmtSize(MAX_FILE_BYTES)}</Typography>}
      </Box>

      <Dialog open={!!viewer} onClose={() => setViewer(null)} maxWidth="lg" PaperProps={{ sx: { bgcolor: 'transparent', border: 0, boxShadow: 'none', m: 1 } }}>
        {viewer && <Box component="img" src={viewer} alt="" onClick={() => setViewer(null)} sx={{ maxWidth: '94vw', maxHeight: '88vh', borderRadius: '14px', display: 'block' }} />}
        <IconButton onClick={() => setViewer(null)} aria-label="Fechar" sx={{ position: 'fixed', top: 16, right: 16, bgcolor: 'rgba(0,0,0,.5)', color: '#fff' }}><Close /></IconButton>
      </Dialog>
    </Box>
  )
}

const sendBtn = (on: boolean) => ({
  width: 36, height: 36, flexShrink: 0, border: 0, borderRadius: '12px', display: 'grid', placeItems: 'center', cursor: 'pointer',
  background: on ? cv.send : cv.surface, color: on ? '#fff' : cv.faint, transition: 'background .15s, transform .15s', '&:active:not(:disabled)': { transform: 'scale(.92)' },
})

function useFile(chatId: string, fileId?: string) {
  const [file, setFile] = useState<{ data: string; mime: string; name: string } | null | undefined>(undefined)
  useEffect(() => {
    if (!fileId) { setFile(null); return }
    let alive = true
    loadFile(chatId, fileId).then((f) => { if (alive) setFile(f) })
    return () => { alive = false }
  }, [chatId, fileId])
  return file
}

function ImageMsg({ chatId, m, onOpen }: { chatId: string; m: ChatMessage; onOpen: (src: string) => void }) {
  const f = useFile(chatId, m.fileId)
  return (
    <Box sx={{ mt: 0.5, width: 'fit-content', maxWidth: 'min(320px, 100%)', borderRadius: '14px', overflow: 'hidden', bgcolor: cv.surface, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
      {f ? <Box component="img" src={f.data} alt={m.name || 'Foto'} onClick={() => onOpen(f.data)} sx={{ display: 'block', maxWidth: '100%', maxHeight: 320, cursor: 'zoom-in' }} />
        : <Box sx={{ width: 220, height: 160, display: 'grid', placeItems: 'center' }}>{f === undefined ? <CircularProgress size={20} sx={{ color: cv.muted }} /> : <Typography sx={{ fontSize: 13, color: cv.muted }}>Foto indisponível</Typography>}</Box>}
    </Box>
  )
}

function FileMsg({ chatId, m }: { chatId: string; m: ChatMessage }) {
  const f = useFile(chatId, m.fileId)
  const ext = (m.name?.split('.').pop() || '').slice(0, 4).toUpperCase()
  return (
    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, pr: 1, borderRadius: '14px', bgcolor: cv.surface, boxShadow: `inset 0 0 0 1px ${cv.border}`, width: 'fit-content', maxWidth: '100%' }}>
      <Box sx={{ position: 'relative', width: 38, height: 44, borderRadius: '8px', bgcolor: '#a9c8f5', color: '#1d2742', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <InsertDriveFileRounded sx={{ fontSize: 22 }} />
        {ext && <Box sx={{ position: 'absolute', bottom: 3, fontSize: 8.5, fontWeight: 800 }}>{ext}</Box>}
      </Box>
      <Box sx={{ minWidth: 0, maxWidth: 220 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || 'Ficheiro'}</Typography>
        <Typography sx={{ fontSize: 12, color: cv.muted }}>{fmtSize(m.size)}</Typography>
      </Box>
      {f ? (
        <IconButton component="a" href={f.data} download={m.name || 'ficheiro'} aria-label="Descarregar" sx={{ width: 36, height: 36 }}><DownloadRounded sx={{ fontSize: 20 }} /></IconButton>
      ) : <Box sx={{ width: 36, display: 'grid', placeItems: 'center' }}>{f === undefined && <CircularProgress size={16} sx={{ color: cv.muted }} />}</Box>}
    </Box>
  )
}

function AudioMsg({ chatId, m, mine }: { chatId: string; m: ChatMessage; mine: boolean }) {
  const f = useFile(chatId, m.fileId)
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pos, setPos] = useState(0)
  const bars = 32

  useEffect(() => () => audio.current?.pause(), [])
  const toggle = () => {
    if (!f) return
    if (!audio.current) {
      const a = new Audio(f.data)
      a.ontimeupdate = () => { const d = isFinite(a.duration) ? a.duration : m.duration || 1; setPos(a.currentTime); setProgress(Math.min(1, a.currentTime / d)) }
      a.onended = () => { setPlaying(false); setProgress(0); setPos(0) }
      audio.current = a
    }
    if (playing) { audio.current.pause(); setPlaying(false) } else { audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false)) }
  }
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audio.current
    if (!a) return
    const r = e.currentTarget.getBoundingClientRect()
    const d = isFinite(a.duration) ? a.duration : m.duration || 0
    a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * d
  }
  const seed = (m.id.charCodeAt(0) || 7) + (m.id.charCodeAt(1) || 3)
  return (
    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1.25, p: '8px 14px 8px 8px', borderRadius: '18px', width: 'min(300px, 100%)', boxSizing: 'border-box',
      bgcolor: mine ? 'rgba(96,165,250,.14)' : cv.surface, boxShadow: `inset 0 0 0 1px ${mine ? 'rgba(96,165,250,.25)' : cv.border}` }}>
      <Box component="button" onClick={toggle} disabled={!f} aria-label={playing ? 'Pausa' : 'Ouvir'}
        sx={{ width: 36, height: 36, border: 0, borderRadius: '50%', bgcolor: '#fff', color: '#0d0d0d', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, '&:disabled': { opacity: 0.5 } }}>
        {f === undefined ? <CircularProgress size={15} sx={{ color: '#0d0d0d' }} /> : playing ? <PauseRounded /> : <PlayArrowRounded />}
      </Box>
      <Box onClick={seek} sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', height: 28, cursor: 'pointer' }}>
        {Array.from({ length: bars }).map((_, k) => (
          <Box key={k} sx={{ flex: 1, borderRadius: 999, height: `${22 + Math.abs(Math.sin((k + seed) * 1.7)) * 78}%`, bgcolor: k / bars < progress ? (mine ? cv.accent : '#fff') : 'rgba(255,255,255,.25)', transition: 'background-color .1s' }} />
        ))}
      </Box>
      <Typography sx={{ fontSize: 12, color: cv.muted, fontVariantNumeric: 'tabular-nums', minWidth: 30, textAlign: 'right' }}>{fmtSecs(playing || pos ? pos : m.duration)}</Typography>
    </Box>
  )
}

function CallRow({ m, mine, name }: { m: ChatMessage; mine: boolean; name: string }) {
  const missed = m.callStatus === 'missed' || m.callStatus === 'declined'
  const Icon = missed ? PhoneMissedRounded : mine ? CallMadeRounded : CallReceivedRounded
  const label = m.callStatus === 'declined' ? (mine ? `${name} recusou a chamada` : 'Recusaste a chamada')
    : missed ? (mine ? 'Chamada sem resposta' : 'Chamada perdida')
      : `${m.callType === 'video' ? 'Videochamada' : 'Chamada de voz'} · ${fmtSecs(m.duration)}`
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, borderRadius: 999, bgcolor: cv.soft, fontSize: 13, color: missed ? cv.coral : cv.muted }}>
        {m.callType === 'video' && !missed ? <VideocamRounded sx={{ fontSize: 16 }} /> : <Icon sx={{ fontSize: 16 }} />}
        {label}
        <Box component="span" sx={{ color: cv.faint, fontSize: 12 }}>{time(m.at)}</Box>
      </Box>
    </Box>
  )
}
