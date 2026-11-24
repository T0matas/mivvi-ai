import { useEffect, useRef, useState } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { ArrowUpward, Close, EditNoteRounded, StopRounded, ContentCopyRounded, CheckRounded, RefreshRounded } from '@mui/icons-material'
import { Markdown } from './AITutor'
import { chatWithKodu, TutorContext } from '../services/aiService'
import { KoduMessage } from '../services/codevantumAI'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// "Pergunta ao Mivvi": the AI beside the lesson, like an assistant panel.
// It knows the lesson's topic and the question on screen (shown as a context
// chip above the composer). Before the student answers it only gives hints;
// after, it can explain the answer. On a phone it opens as a sheet.

export const PANEL_WIDTH = 380

interface Msg { id: string; role: KoduMessage['role']; content: string; error?: boolean }

interface Props {
  open: boolean
  onClose: () => void
  mobile: boolean
  context: TutorContext
  /** Short label of what's on screen, e.g. "Pergunta 3". */
  contextLabel?: string
  contextText?: string
  answered?: boolean
}

export default function LessonAIPanel({ open, onClose, mobile, context, contextLabel, contextText, answered }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight }, [messages])
  useEffect(() => { if (open && !mobile) setTimeout(() => input.current?.focus(), 200) }, [open, mobile])
  useEffect(() => () => abort.current?.abort(), [])
  useEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [text])

  const ask = async (prompt: string, history = messages) => {
    const q = prompt.trim()
    if (!q || busy) return
    soundManager.playSend()
    const user: Msg = { id: crypto.randomUUID(), role: 'user', content: q }
    const reply: Msg = { id: crypto.randomUUID(), role: 'assistant', content: '' }
    const next = [...history, user]
    setMessages([...next, reply])
    setText('')
    setBusy(true)
    const ctrl = new AbortController()
    abort.current = ctrl
    try {
      await chatWithKodu(next.filter((m) => !m.error).map(({ role, content }) => ({ role, content })), context,
        (t) => setMessages((all) => all.map((m) => (m.id === reply.id ? { ...m, content: t } : m))), ctrl.signal)
      soundManager.playMessage()
    } catch (e: any) {
      if (e?.name !== 'AbortError') setMessages((all) => all.map((m) => (m.id === reply.id ? { ...m, content: e?.message || 'O Mivvi não conseguiu responder. Tenta outra vez.', error: true } : m)))
    } finally {
      setBusy(false)
      abort.current = null
    }
  }

  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    const idx = messages.lastIndexOf(lastUser)
    ask(lastUser.content, messages.slice(0, idx))
  }

  const suggestions = answered
    ? ['Porque é que esta é a resposta certa?', 'Explica-me com outro exemplo', 'Faz-me uma pergunta parecida']
    : answered === false
      ? ['Explica-me a pergunta', 'Dá-me uma pista', 'Lembra-me a matéria']
      : ['Resume esta aula em 3 pontos', 'Explica-me com um exemplo do dia a dia', 'Que dúvidas costumam aparecer?']

  if (!open) return null

  return (
    <>
      {mobile && <Box onClick={onClose} sx={{ position: 'fixed', inset: 0, zIndex: 1340, bgcolor: 'rgba(0,0,0,.5)', animation: 'aiFade .2s ease both', '@keyframes aiFade': { from: { opacity: 0 } } }} />}
      <Box component="aside" aria-label="Pergunta ao Mivvi"
        sx={{
          position: 'fixed', zIndex: 1350, display: 'flex', flexDirection: 'column', color: cv.text, textAlign: 'left',
          ...(mobile
            ? { left: 0, right: 0, bottom: 0, height: '82dvh', borderRadius: '24px 24px 0 0', bgcolor: '#191919', boxShadow: `0 -1px 0 ${cv.border}, 0 -20px 50px rgba(0,0,0,.5)`, animation: 'aiUp .3s cubic-bezier(.22,1,.36,1) both', '@keyframes aiUp': { from: { transform: 'translateY(100%)' } } }
            : { top: 10, right: 10, bottom: 10, width: PANEL_WIDTH, borderRadius: '22px', bgcolor: '#191919', boxShadow: `inset 0 0 0 1px ${cv.border}, 0 20px 50px rgba(0,0,0,.45)`, animation: 'aiIn .3s cubic-bezier(.22,1,.36,1) both', '@keyframes aiIn': { from: { opacity: 0, transform: 'translateX(16px)' } } }),
          '@keyframes aiDot': { '0%, 80%, 100%': { opacity: 0.25 }, '40%': { opacity: 1 } },
        }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.75, height: 54, flexShrink: 0, borderBottom: `1px solid ${cv.border}` }}>
          <Box component="img" src="/mivvi-logo.svg" alt="" sx={{ width: 24, height: 24, borderRadius: '8px', flexShrink: 0 }} />
          <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 650 }}>Pergunta ao Mivvi</Typography>
          <IconButton onClick={() => { abort.current?.abort(); setMessages([]); soundManager.playClick() }} aria-label="Nova conversa" title="Nova conversa" sx={{ width: 32, height: 32 }}><EditNoteRounded sx={{ fontSize: 19 }} /></IconButton>
          <IconButton onClick={() => { soundManager.playBack(); onClose() }} aria-label="Fechar" sx={{ width: 32, height: 32 }}><Close sx={{ fontSize: 18 }} /></IconButton>
        </Box>

        {/* Conversation */}
        <Box ref={scroller} sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.length === 0 && (
            <Box sx={{ my: 'auto', display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 1, py: 2 }}>
              <Box component="img" src="/mivvi-logo.svg" alt="Mivvi" sx={{ width: 58, height: 58, borderRadius: '17px' }} />
              <Typography sx={{ fontFamily: cv.display, fontSize: 17, fontWeight: 700, mt: 1 }}>Tens alguma dúvida?</Typography>
              <Typography sx={{ fontSize: 13.5, color: cv.muted, maxWidth: 260, lineHeight: 1.5 }}>
                {answered === false && contextText ? 'Ajudo-te a pensar, mas a resposta tens de ser tu a descobrir 😉' : 'Pergunta-me o que quiseres sobre esta aula.'}
              </Typography>
              <Box sx={{ display: 'grid', gap: 0.75, mt: 1.5, width: '100%' }}>
                {suggestions.map((s) => (
                  <Box key={s} component="button" onClick={() => ask(s)} sx={{ textAlign: 'left', p: '9px 12px', border: 0, borderRadius: '12px', bgcolor: cv.soft, color: cv.text, font: 'inherit', fontSize: 13.5, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,.09)' } }}>{s}</Box>
                ))}
              </Box>
            </Box>
          )}

          {messages.map((m, i) => m.role === 'user' ? (
            <Box key={m.id} sx={{ alignSelf: 'flex-end', maxWidth: '85%', px: 1.75, py: 1, borderRadius: '18px', bgcolor: cv.surface, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.content}</Box>
          ) : (
            <Box key={m.id} sx={{ fontSize: 14, lineHeight: 1.65, color: m.error ? cv.coral : '#e4e4e7', display: 'grid', gap: 1.25 }}>
              {m.content ? <Markdown text={m.content} animate={false} /> : (
                <Box sx={{ display: 'flex', gap: 0.5, py: 0.5 }}>
                  {[0, 1, 2].map((d) => <Box key={d} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cv.muted, animation: `aiDot 1.2s ease-in-out ${d * 0.15}s infinite` }} />)}
                </Box>
              )}
              {m.content && !(busy && i === messages.length - 1) && (
                <Box sx={{ display: 'flex', gap: 0.25, ml: -0.75 }}>
                  <IconButton aria-label="Copiar" onClick={() => { navigator.clipboard?.writeText(m.content); setCopied(m.id); setTimeout(() => setCopied(null), 1500) }} sx={{ width: 28, height: 28 }}>
                    {copied === m.id ? <CheckRounded sx={{ fontSize: 15 }} /> : <ContentCopyRounded sx={{ fontSize: 14 }} />}
                  </IconButton>
                  {i === messages.length - 1 && <IconButton aria-label="Tentar outra vez" onClick={retry} sx={{ width: 28, height: 28 }}><RefreshRounded sx={{ fontSize: 16 }} /></IconButton>}
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* Composer with the context chip */}
        <Box sx={{ flexShrink: 0, p: 1.25, pt: 0, pb: mobile ? 'calc(10px + env(safe-area-inset-bottom, 0px))' : 1.25 }}>
          <Box sx={{ borderRadius: '18px', bgcolor: cv.composer, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, '&:focus-within': { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.32)' } }}>
            {contextText && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, pt: 1 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, maxWidth: '100%', height: 26, px: 1, borderRadius: '8px', bgcolor: cv.soft, fontSize: 12.5, color: cv.muted }}>
                  <Box component="span" sx={{ color: cv.accent, fontWeight: 700 }}>@</Box>
                  <Box component="span" sx={{ color: cv.text, fontWeight: 600, flexShrink: 0 }}>{contextLabel}</Box>
                  <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contextText}</Box>
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, p: '4px 6px 6px 14px' }}>
              <Box component="textarea" ref={input} rows={1} value={text} placeholder="Escreve a tua dúvida…"
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(text) } }}
                sx={{ flex: 1, minWidth: 0, resize: 'none', border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14.5, lineHeight: 1.45, py: '8px', maxHeight: 120, '&::placeholder': { color: cv.faint } }} />
              {busy ? (
                <Box component="button" onClick={() => abort.current?.abort()} aria-label="Parar" sx={sendBtn(true)}><StopRounded sx={{ fontSize: 18 }} /></Box>
              ) : (
                <Box component="button" onClick={() => ask(text)} disabled={!text.trim()} aria-label="Enviar" sx={sendBtn(!!text.trim())}><ArrowUpward sx={{ fontSize: 18 }} /></Box>
              )}
            </Box>
          </Box>
          <Typography sx={{ fontSize: 11, color: cv.faint, textAlign: 'center', mt: 0.75 }}>Codevantum AI · o Mivvi pode enganar-se</Typography>
        </Box>
      </Box>
    </>
  )
}

const sendBtn = (on: boolean) => ({
  width: 34, height: 34, flexShrink: 0, border: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: on ? 'pointer' : 'default',
  bgcolor: on ? '#fff' : cv.surface, color: on ? '#0d0d0d' : cv.faint, transition: 'background-color .15s',
})
