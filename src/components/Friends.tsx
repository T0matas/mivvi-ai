import { useEffect, useRef, useState } from 'react'
import { Box, Dialog, Typography, CircularProgress, IconButton } from '@mui/material'
import { Close, PersonAddAlt1Rounded, QrCode2Rounded, QrCodeScannerRounded, ContentCopyRounded, CheckRounded, ChatBubbleOutlineRounded, IosShareRounded, AlternateEmailRounded } from '@mui/icons-material'
import QRCode from 'react-qr-code'
import { QrReader } from 'react-qr-reader'
import { findByName, sendFriendRequest, acceptFriend, removeFriendship, PublicProfile, isOnline, toHandle } from '../services/social'
import { FriendView } from '../services/useSocial'
import { yearLabel } from '../data/ptCurriculum'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// Friends: everyone has a unique id (their name). You add someone by typing
// it, by scanning their QR code, or by opening their link; they get a request
// and the friendship only exists once they accept it.

const AVATAR_COLORS = ['#a9c8f5', '#c0eadb', '#ffdb7c', '#ff9fbb', '#c9b8ff', '#ff9f88']
const colorFor = (s: string) => AVATAR_COLORS[[...s].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_COLORS.length]

export function Avatar({ name, photo, size = 36, online }: { name: string; photo?: string | null; size?: number; online?: boolean }) {
  const [failed, setFailed] = useState(false)
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {photo && !failed ? (
        <Box component="img" src={photo} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} sx={{ width: size, height: size, borderRadius: size * 0.32 + 'px', objectFit: 'cover' }} />
      ) : (
        <Box sx={{ width: size, height: size, borderRadius: size * 0.32 + 'px', bgcolor: colorFor(name), color: '#1d2742', display: 'grid', placeItems: 'center', fontSize: size * 0.42, fontWeight: 700 }}>{name.charAt(0).toUpperCase()}</Box>
      )}
      {online !== undefined && (
        <Box sx={{ position: 'absolute', right: -2, bottom: -2, width: size * 0.34, height: size * 0.34, minWidth: 9, minHeight: 9, borderRadius: '50%', bgcolor: online ? cv.green : '#555', boxShadow: `0 0 0 2.5px ${cv.bg}` }} />
      )}
    </Box>
  )
}

export const inviteLink = (handle: string) => `${window.location.origin}/add/${handle}`

/** Reads a scanned QR code: our invite link, or a bare name. */
const handleFromCode = (text: string) => {
  const m = text.match(/\/add\/([^/?#\s]+)/)
  return decodeURIComponent(m ? m[1] : text).trim().replace(/^@/, '')
}

interface AddProps {
  open: boolean
  onClose: () => void
  me: PublicProfile
  /** Opened from someone's link or QR code. */
  initialName?: string
}

export function AddFriendDialog({ open, onClose, me, initialName }: AddProps) {
  const [tab, setTab] = useState<'name' | 'qr' | 'scan'>('name')
  const [query, setQuery] = useState('')
  const [found, setFound] = useState<PublicProfile | null>(null)
  const [state, setState] = useState<'idle' | 'searching' | 'notfound' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const search = async (name: string) => {
    const n = name.trim().replace(/^@/, '')
    if (!n) return
    setFound(null); setMessage('')
    if (toHandle(n) === me.handle) { setState('error'); setMessage('Esse és tu! 🙂'); return }
    setState('searching')
    try {
      const p = await findByName(n)
      if (!p) { setState('notfound'); return }
      setFound(p); setState('idle')
    } catch {
      setState('error'); setMessage('Não foi possível procurar agora. Verifica a ligação.')
    }
  }

  useEffect(() => {
    if (!open) return
    setTab('name'); setFound(null); setState('idle'); setMessage(''); setCopied(false)
    setQuery(initialName || '')
    if (initialName) search(initialName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialName])

  const send = async () => {
    if (!found) return
    setState('sending')
    try {
      const r = await sendFriendRequest(me, found)
      soundManager.playSuccess()
      setState('done')
      setMessage({ sent: `Pedido enviado a ${found.name}. Quando aceitar, ficam amigos.`, accepted: `Tu e ${found.name} já são amigos!`, 'already-friends': `Tu e ${found.name} já são amigos.`, 'already-sent': `Já enviaste um pedido a ${found.name}.` }[r])
    } catch (e: any) {
      soundManager.playError()
      setState('error'); setMessage(e?.message?.startsWith('Não te') ? e.message : 'Não foi possível enviar o pedido.')
    }
  }

  const link = inviteLink(me.handle)
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); soundManager.playClick(); setTimeout(() => setCopied(false), 1800) } catch { /* no clipboard */ }
  }
  const share = async () => {
    try { await (navigator as any).share({ title: 'Mivvi', text: `Adiciona-me no Mivvi: @${me.name}`, url: link }) } catch { copy() }
  }

  const tabs = [
    { id: 'name' as const, icon: <AlternateEmailRounded />, label: 'Nome' },
    { id: 'qr' as const, icon: <QrCode2Rounded />, label: 'O meu código' },
    { id: 'scan' as const, icon: <QrCodeScannerRounded />, label: 'Ler código' },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#1c1c1c', borderRadius: '24px', m: 1.5, color: cv.text, textAlign: 'left' } }}>
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ flex: 1, fontFamily: cv.display, fontSize: 20, fontWeight: 700 }}>Adicionar amigo</Typography>
          <IconButton onClick={onClose} aria-label="Fechar" sx={{ width: 34, height: 34 }}><Close sx={{ fontSize: 19 }} /></IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, p: 0.5, mt: 1.5, borderRadius: 999, bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
          {tabs.map((t) => (
            <Box key={t.id} component="button" onClick={() => { soundManager.playClick(); setTab(t.id) }}
              sx={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, height: 34, border: 0, borderRadius: 999, font: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                bgcolor: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#0d0d0d' : cv.muted, '& svg': { fontSize: 16 } }}>
              {t.icon}{t.label}
            </Box>
          ))}
        </Box>

        {tab === 'name' && (
          <Box sx={{ mt: 2 }}>
            <Box component="form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); search(query) }} sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.75, height: 46, px: 1.5, borderRadius: '14px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, '&:focus-within': { boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.5)' } }}>
                <Box component="span" sx={{ color: cv.faint, fontWeight: 600 }}>@</Box>
                <Box component="input" autoFocus value={query} placeholder="nome do amigo" spellCheck={false} autoCapitalize="none"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value.replace(/\s/g, '')); setFound(null); setState('idle'); setMessage('') }}
                  sx={{ flex: 1, minWidth: 0, border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 15 }} />
              </Box>
              <Box component="button" type="submit" disabled={!query.trim() || state === 'searching'} sx={{ height: 46, px: 2, border: 0, borderRadius: '14px', bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', '&:disabled': { bgcolor: cv.surface, color: cv.faint } }}>
                {state === 'searching' ? <CircularProgress size={16} sx={{ color: cv.muted }} /> : 'Procurar'}
              </Box>
            </Box>
            <Typography sx={{ fontSize: 12.5, color: cv.faint, mt: 1 }}>Escreve o nome exato (o ID) da pessoa. Ela recebe um pedido e tem de o aceitar.</Typography>

            {state === 'notfound' && <Typography sx={{ mt: 2, fontSize: 14, color: cv.coral }}>Não encontrei ninguém com o nome “{query}”.</Typography>}

            {found && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '16px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, animation: 'fdIn .3s ease both', '@keyframes fdIn': { from: { opacity: 0, transform: 'translateY(6px)' } } }}>
                <Avatar name={found.name} photo={found.photo} size={42} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{found.name}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: cv.muted }}>@{found.handle}{found.year ? ` · ${yearLabel(found.year)}` : ''}</Typography>
                </Box>
                {state !== 'done' && (
                  <Box component="button" onClick={send} disabled={state === 'sending'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 36, px: 1.5, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                    {state === 'sending' ? <CircularProgress size={14} sx={{ color: '#0d0d0d' }} /> : <PersonAddAlt1Rounded sx={{ fontSize: 17 }} />}Pedir
                  </Box>
                )}
              </Box>
            )}
            {message && <Typography sx={{ mt: 1.5, fontSize: 14, color: state === 'error' ? cv.coral : cv.green }}>{message}</Typography>}
          </Box>
        )}

        {tab === 'qr' && (
          <Box sx={{ mt: 2.5, display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
            <Box sx={{ p: 2, borderRadius: '20px', bgcolor: '#fff', lineHeight: 0 }}>
              <QRCode value={link} size={176} bgColor="#ffffff" fgColor="#141414" />
            </Box>
            <Typography sx={{ fontFamily: cv.display, fontSize: 19, fontWeight: 700, mt: 2 }}>@{me.name}</Typography>
            <Typography sx={{ fontSize: 13, color: cv.muted, mt: 0.25 }}>Mostra este código a um amigo para ele te adicionar.</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Box component="button" onClick={copy} sx={ghostBtn}>{copied ? <CheckRounded /> : <ContentCopyRounded />}{copied ? 'Copiado' : 'Copiar link'}</Box>
              {'share' in navigator && <Box component="button" onClick={share} sx={ghostBtn}><IosShareRounded />Partilhar</Box>}
            </Box>
          </Box>
        )}

        {tab === 'scan' && <Scanner onCode={(code) => { soundManager.playSelect(); const n = handleFromCode(code); setTab('name'); setQuery(n); search(n) }} />}
      </Box>
    </Dialog>
  )
}

function Scanner({ onCode }: { onCode: (text: string) => void }) {
  const done = useRef(false)
  const [error, setError] = useState('')
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', bgcolor: '#000', aspectRatio: '1 / 1', '& section': { paddingTop: '0 !important', height: '100%' }, '& video': { objectFit: 'cover' } }}>
        <QrReader
          constraints={{ facingMode: 'environment' }}
          scanDelay={300}
          onResult={(result, err) => {
            if (result && !done.current) { done.current = true; onCode(result.getText()) }
            if (err && (err as any).name === 'NotAllowedError') setError('Sem acesso à câmara. Permite a câmara nas definições do browser.')
          }}
          containerStyle={{ width: '100%', height: '100%' }}
          videoContainerStyle={{ width: '100%', height: '100%', paddingTop: 0 }}
          videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box sx={{ position: 'absolute', inset: '18%', borderRadius: '18px', boxShadow: '0 0 0 9999px rgba(0,0,0,.35)', border: '2px solid rgba(255,255,255,.8)', pointerEvents: 'none' }} />
      </Box>
      <Typography sx={{ fontSize: 13, color: error ? cv.coral : cv.muted, mt: 1.25, textAlign: 'center' }}>
        {error || 'Aponta a câmara para o código do teu amigo. Também podes lê-lo com a câmara do telemóvel.'}
      </Typography>
    </Box>
  )
}

interface PanelProps {
  me: PublicProfile
  friends: FriendView[]
  incoming: FriendView[]
  outgoing: FriendView[]
  onMessage?: (f: FriendView) => void
  onAdd: () => void
  compact?: boolean
}

/** Requests waiting for an answer, then the friends list. */
export function FriendsPanel({ friends, incoming, outgoing, onMessage, onAdd, compact }: PanelProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const act = async (id: string, fn: () => Promise<unknown>, sound: 'ok' | 'click' = 'click') => {
    setBusy(id)
    try { await fn(); sound === 'ok' ? soundManager.playSuccess() : soundManager.playClick() } catch { soundManager.playError() } finally { setBusy(null) }
  }
  const row = { display: 'flex', alignItems: 'center', gap: 1.25, px: compact ? 1.25 : 2, py: 1.25 }
  const small = { height: 32, px: 1.5, border: 0, borderRadius: 999, font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5 }

  return (
    <Box>
      {incoming.length > 0 && (
        <Box sx={{ mb: 1.5, borderRadius: '18px', bgcolor: 'rgba(96,165,250,.06)', boxShadow: 'inset 0 0 0 1px rgba(96,165,250,.2)', overflow: 'hidden' }}>
          <Typography sx={{ px: compact ? 1.25 : 2, pt: 1.25, fontSize: 11.5, fontWeight: 700, color: cv.accent, textTransform: 'uppercase', letterSpacing: '.07em' }}>Pedidos de amizade · {incoming.length}</Typography>
          {incoming.map((f) => (
            <Box key={f.friendship.id} sx={row}>
              <Avatar name={f.name} photo={f.profile?.photo} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</Typography>
                <Typography sx={{ fontSize: 12, color: cv.muted }}>quer ser teu amigo</Typography>
              </Box>
              <Box component="button" disabled={busy === f.friendship.id} onClick={() => act(f.friendship.id, () => acceptFriend(f.friendship.id), 'ok')} sx={{ ...small, bgcolor: '#fff', color: '#0d0d0d' }}>Aceitar</Box>
              <Box component="button" disabled={busy === f.friendship.id} onClick={() => act(f.friendship.id, () => removeFriendship(f.friendship.id))} sx={{ ...small, bgcolor: 'transparent', color: cv.muted, px: 1 }} aria-label="Recusar"><Close sx={{ fontSize: 17 }} /></Box>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ borderRadius: '18px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, overflow: 'hidden' }}>
        {friends.map((f, i) => (
          <Box key={f.friendship.id} sx={{ ...row, borderTop: i ? `1px solid ${cv.border}` : 0 }}>
            <Avatar name={f.name} photo={f.profile?.photo} online={isOnline(f.profile)} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</Typography>
              <Typography sx={{ fontSize: 12, color: cv.muted }}>{isOnline(f.profile) ? 'Online' : f.profile?.year ? yearLabel(f.profile.year) : 'Amigo'}</Typography>
            </Box>
            {onMessage && <IconButton onClick={() => { soundManager.playClick(); onMessage(f) }} aria-label={`Mensagem a ${f.name}`} sx={{ width: 34, height: 34 }}><ChatBubbleOutlineRounded sx={{ fontSize: 18 }} /></IconButton>}
            <Box component="button" disabled={busy === f.friendship.id} onClick={() => { if (window.confirm(`Remover ${f.name} dos amigos?`)) act(f.friendship.id, () => removeFriendship(f.friendship.id)) }}
              sx={{ ...small, bgcolor: 'transparent', color: cv.faint, px: 0.75, '&:hover': { color: cv.coral } }}>Remover</Box>
          </Box>
        ))}
        {outgoing.map((f, i) => (
          <Box key={f.friendship.id} sx={{ ...row, borderTop: friends.length || i ? `1px solid ${cv.border}` : 0, opacity: 0.75 }}>
            <Avatar name={f.name} photo={f.profile?.photo} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>{f.name}</Typography>
              <Typography sx={{ fontSize: 12, color: cv.muted }}>Pedido enviado · à espera</Typography>
            </Box>
            <Box component="button" disabled={busy === f.friendship.id} onClick={() => act(f.friendship.id, () => removeFriendship(f.friendship.id))} sx={{ ...small, bgcolor: 'transparent', color: cv.faint, px: 0.75 }}>Cancelar</Box>
          </Box>
        ))}
        {!friends.length && !outgoing.length && (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ flex: 1, color: cv.muted, fontSize: 14 }}>Ainda não tens amigos no Mivvi.</Typography>
            <Box component="button" onClick={onAdd} sx={{ ...small, bgcolor: '#fff', color: '#0d0d0d' }}><PersonAddAlt1Rounded sx={{ fontSize: 16 }} />Adicionar</Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

const ghostBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 38, px: 1.75, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`,
  color: cv.text, font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', '& svg': { fontSize: 17 }, '&:hover': { bgcolor: 'rgba(255,255,255,.05)' },
} as const
