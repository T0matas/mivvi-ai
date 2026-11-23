import { useNavigate } from 'react-router-dom'
import { useEffect, useLayoutEffect, useRef, useState, Fragment, ReactNode } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { ArrowBack, ArrowUpward, Refresh, Stop, Add, MicNoneRounded, Close, InsertDriveFileOutlined, MenuBookRounded, QuizRounded, EditNoteRounded, LightbulbRounded } from '@mui/icons-material'
import Mascot from './Mascot'
import { chatWithKodu } from '../services/aiService'
import { KODU_NAME, KoduMessage, transcribeAudio } from '../services/codevantumAI'
import { Subject, UserProfile } from '../types'
import { cv } from '../theme'

// Mivvi, the tutor: the student's messages on the right, Mivvi's on the left
// with the mascot beside them. While Mivvi thinks, a light sweeps across
// "A pensar…"; its answer fades in word by word. Photos and text files can be
// attached (photos go to a vision model), and the microphone dictates.

interface Attachment {
    id: string
    kind: 'image' | 'file'
    name: string
    /** data URL for images, text content for files */
    data: string
}

interface Message {
    id: string
    role: KoduMessage['role']
    content: string
    images?: string[]
    files?: string[]
    error?: boolean
}

interface AITutorProps {
    userProfile: UserProfile | null
    currentOutfit?: string
    /** Shown inside the dashboard, between the top bar and the bottom nav. */
    embedded?: boolean
    subject?: Subject | null
}

const SUGGESTIONS = [
    { label: 'Explica-me uma matéria', color: '#c0eadb', icon: MenuBookRounded, prompt: 'Explica-me, de forma simples, a matéria que estou a estudar agora.' },
    { label: 'Faz-me um quiz rápido', color: '#a9c8f5', icon: QuizRounded, prompt: 'Faz-me um quiz rápido de 3 perguntas, uma de cada vez, sobre o que estou a estudar.' },
    { label: 'Ajuda num exercício', color: cv.butter, icon: EditNoteRounded, prompt: 'Tenho um exercício difícil. Ajuda-me passo a passo, sem me dares logo a resposta.' },
    { label: 'Dicas para estudar', color: cv.coral, icon: LightbulbRounded, prompt: 'Dá-me 3 dicas curtas para estudar melhor esta semana.' },
]

const TEXT_FILE = /\.(txt|md|csv|json|py|js|ts|java|c|cpp|html|css|sql)$/i
const MAX_FILE_CHARS = 20000

/** Photos are shrunk before sending (longest side 1280px, JPEG). */
function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = reject
        reader.onload = () => {
            const img = new Image()
            img.onerror = reject
            img.onload = () => {
                const scale = Math.min(1, 1280 / Math.max(img.width, img.height))
                const canvas = document.createElement('canvas')
                canvas.width = Math.round(img.width * scale)
                canvas.height = Math.round(img.height * scale)
                canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL('image/jpeg', 0.85))
            }
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    })
}

// ── Light markdown, with each word fading in as it arrives ───────────────────
function words(text: string, animate: boolean, key: string): ReactNode {
    if (!animate) return text
    return text.split(/(\s+)/).map((w, i) => (/^\s+$/.test(w) || !w ? w : <span key={`${key}-${i}`} className="mv-word">{w}</span>))
}
function inline(text: string, animate: boolean): ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ fontWeight: 600 }}>{words(part.slice(2, -2), animate, `b${i}`)}</strong>
        if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) return <em key={i} style={{ color: '#d4d4d8' }}>{words(part.slice(1, -1), animate, `i${i}`)}</em>
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
            return <code key={i} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.88em', background: cv.soft, padding: '1px 5px', borderRadius: 5 }}>{part.slice(1, -1)}</code>
        }
        return <Fragment key={i}>{words(part, animate, `t${i}`)}</Fragment>
    })
}
function Markdown({ text, animate }: { text: string; animate: boolean }) {
    const blocks = text.split(/(```[\s\S]*?(?:```|$))/g).filter((b) => b.trim())
    return (
        <>
            {blocks.map((block, i) => {
                if (block.startsWith('```')) {
                    const code = block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')
                    return (
                        <Box key={i} component="pre" sx={{ m: 0, p: '12px 14px', borderRadius: '12px', boxShadow: `inset 0 0 0 1px ${cv.border}`, overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13.5, lineHeight: 1.55, color: '#d8d8de', animation: animate ? 'mvWord .4s ease both' : 'none' }}>
                            {code}
                        </Box>
                    )
                }
                return block.trim().split(/\n{2,}/).map((para, j) => {
                    const lines = para.split('\n').filter((l) => l.trim())
                    // Markdown table: | a | b | rows with a |---| separator
                    if (lines.length >= 2 && lines.every((l) => l.trim().startsWith('|')) && /^\|?\s*:?-{2,}/.test(lines[1].trim())) {
                        const cells = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
                        const head = cells(lines[0])
                        const rows = lines.slice(2).map(cells)
                        return (
                            <Box key={`${i}-${j}`} sx={{ overflowX: 'auto', borderRadius: '14px', boxShadow: `inset 0 0 0 1px ${cv.border}`, animation: animate ? 'mvWord .4s ease both' : 'none' }}>
                                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, '& th, & td': { textAlign: 'left', px: 1.75, py: 1.1, verticalAlign: 'top' }, '& th': { fontWeight: 600, bgcolor: 'rgba(255,255,255,.04)', whiteSpace: 'nowrap' }, '& td': { borderTop: `1px solid ${cv.border}` } }}>
                                    <thead><tr>{head.map((h, k) => <th key={k}>{inline(h, false)}</th>)}</tr></thead>
                                    <tbody>{rows.map((r, ri) => <tr key={ri}>{head.map((_, k) => <td key={k}>{inline(r[k] || '', false)}</td>)}</tr>)}</tbody>
                                </Box>
                            </Box>
                        )
                    }
                    if (lines.length && lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
                        return (
                            <Box key={`${i}-${j}`} component="ul" sx={{ m: 0, pl: 2.5, display: 'grid', gap: 0.5 }}>
                                {lines.map((l, k) => <li key={k}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''), animate)}</li>)}
                            </Box>
                        )
                    }
                    return <p key={`${i}-${j}`} style={{ margin: 0 }}>{inline(lines.join('\n').replace(/^#+\s*/gm, ''), animate)}</p>
                })
            })}
        </>
    )
}

export default function AITutor({ userProfile, embedded = false, subject }: AITutorProps) {
    const navigate = useNavigate()
    const lang = userProfile?.language || 'pt-PT'
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [busy, setBusy] = useState(false)
    const [notice, setNotice] = useState('')
    const [recording, setRecording] = useState(false)
    const [transcribing, setTranscribing] = useState(false)
    const [seconds, setSeconds] = useState(0)
    const thread = useRef<HTMLDivElement>(null)
    const box = useRef<HTMLTextAreaElement>(null)
    const fileInput = useRef<HTMLInputElement>(null)
    const abort = useRef<AbortController | null>(null)
    const recorder = useRef<MediaRecorder | null>(null)
    const streamingId = useRef<string | null>(null)

    useEffect(() => () => { abort.current?.abort(); recorder.current?.stream.getTracks().forEach((t) => t.stop()) }, [])
    useEffect(() => { thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: 'smooth' }) }, [messages, busy])
    useLayoutEffect(() => {
        const el = box.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }, [input])
    useEffect(() => {
        if (!recording) return
        setSeconds(0)
        const t = setInterval(() => setSeconds((s) => s + 1), 1000)
        return () => clearInterval(t)
    }, [recording])
    useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(t) }, [notice])

    // ── Sending ──────────────────────────────────────────────────────────────
    const ask = async (history: Message[]) => {
        const controller = new AbortController()
        abort.current = controller
        const id = `${Date.now()}-ai`
        streamingId.current = id
        setBusy(true)
        setMessages([...history, { id, role: 'assistant', content: '' }])
        try {
            const text = await chatWithKodu(
                history.filter((m) => !m.error).map(({ role, content, images }) => ({ role, content, images })),
                { language: lang, name: userProfile?.name, schoolYear: userProfile?.schoolYear, subjects: userProfile?.selectedSubjects, subject },
                (soFar) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: soFar } : m))),
                controller.signal,
            )
            if (!text.trim()) throw new Error('empty')
        } catch (error) {
            if (controller.signal.aborted) setMessages((prev) => prev.filter((m) => m.id !== id || m.content))
            else {
                const message = error instanceof Error && error.message !== 'empty' ? error.message : 'O Mivvi não respondeu.'
                setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: message, error: true } : m)))
            }
        } finally {
            setBusy(false)
            abort.current = null
            streamingId.current = null
        }
    }

    const send = (text = input) => {
        const typed = text.trim()
        if ((!typed && !attachments.length) || busy) return
        const files = attachments.filter((a) => a.kind === 'file')
        const images = attachments.filter((a) => a.kind === 'image').map((a) => a.data)
        const fileText = files.map((f) => `\n\nFicheiro anexado (${f.name}):\n\`\`\`\n${f.data}\n\`\`\``).join('')
        const content = (typed || (images.length ? 'Ajuda-me com isto.' : 'Lê este ficheiro.')) + fileText
        setInput('')
        setAttachments([])
        ask([...messages, { id: `${Date.now()}-me`, role: 'user', content, images, files: files.map((f) => f.name) }])
    }

    const retry = () => {
        const history = messages.filter((m) => !m.error)
        if (history.length && history[history.length - 1].role === 'user') ask(history)
    }

    // ── Attachments ──────────────────────────────────────────────────────────
    const onFiles = async (list: FileList | null) => {
        if (!list) return
        for (const file of Array.from(list).slice(0, 4)) {
            try {
                if (file.type.startsWith('image/')) {
                    if (attachments.filter((a) => a.kind === 'image').length >= 3) { setNotice('Podes anexar até 3 imagens.'); break }
                    const data = await compressImage(file)
                    setAttachments((p) => [...p, { id: `${Date.now()}-${file.name}`, kind: 'image', name: file.name, data }])
                } else if (file.type.startsWith('text/') || TEXT_FILE.test(file.name)) {
                    const text = (await file.text()).slice(0, MAX_FILE_CHARS)
                    setAttachments((p) => [...p, { id: `${Date.now()}-${file.name}`, kind: 'file', name: file.name, data: text }])
                } else {
                    setNotice('Só consigo ler imagens e ficheiros de texto (por agora).')
                }
            } catch {
                setNotice(`Não consegui abrir ${file.name}.`)
            }
        }
        if (fileInput.current) fileInput.current.value = ''
    }

    // ── Microphone ───────────────────────────────────────────────────────────
    const toggleMic = async () => {
        if (recording) { recorder.current?.stop(); return }
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setNotice('Este browser não deixa gravar áudio.'); return }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const rec = new MediaRecorder(stream)
            const chunks: Blob[] = []
            rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
            rec.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop())
                setRecording(false)
                const audio = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
                if (audio.size < 1500) return
                setTranscribing(true)
                try {
                    const text = await transcribeAudio(audio)
                    if (text) setInput((v) => (v ? `${v} ${text}` : text))
                    else setNotice('Não ouvi nada. Tenta outra vez.')
                } catch (error) {
                    setNotice(error instanceof Error ? error.message : 'Não consegui perceber o áudio.')
                } finally {
                    setTranscribing(false)
                    box.current?.focus()
                }
            }
            recorder.current = rec
            rec.start()
            setRecording(true)
        } catch {
            setNotice('Precisas de permitir o microfone para falar com o Mivvi.')
        }
    }

    const last = messages[messages.length - 1]
    const waiting = busy && last?.role === 'assistant' && !last.content
    const canSend = (!!input.trim() || attachments.length > 0) && !busy && !recording && !transcribing

    const shimmer = {
        color: 'transparent', backgroundImage: 'linear-gradient(90deg, #8e8e93 0%, #8e8e93 40%, #f2f2f7 50%, #8e8e93 60%, #8e8e93 100%)', backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text', backgroundClip: 'text', animation: 'mvShimmer 2s linear infinite',
    }
    const iconBtn = { width: 36, height: 36, flexShrink: 0, color: cv.muted, '&:hover': { color: cv.text, bgcolor: 'rgba(255,255,255,.06)' } }

    return (
        <Box sx={{
            position: 'fixed', left: 0, right: 0, top: embedded ? 'calc(57px + env(safe-area-inset-top, 0px))' : 0, bottom: 0,
            zIndex: embedded ? 5 : 1200, display: 'flex', flexDirection: 'column', bgcolor: cv.bg, color: cv.text, textAlign: 'left', fontFamily: cv.font,
            '& .mv-word': { display: 'inline', animation: 'mvWord .45s ease both' },
            '@keyframes mvWord': { from: { opacity: 0, filter: 'blur(3px)' } },
            '@keyframes mvIn': { from: { opacity: 0, transform: 'translateY(8px)' } },
            '@keyframes mvShimmer': { from: { backgroundPosition: '100% 0' }, to: { backgroundPosition: '0% 0' } },
            '@keyframes mvPulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        }}>
            {/* Header */}
            {(!embedded || messages.length > 0) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, pt: embedded ? 1 : 'calc(10px + env(safe-area-inset-top, 0px))', maxWidth: 780, width: '100%', mx: 'auto', boxSizing: 'border-box' }}>
                    {!embedded && (
                        <>
                            <IconButton onClick={() => navigate('/dashboard')} aria-label="Voltar" sx={{ width: 34, height: 34 }}><ArrowBack sx={{ fontSize: 19 }} /></IconButton>
                            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{KODU_NAME}</Typography>
                        </>
                    )}
                    <Box sx={{ flex: 1 }} />
                    {messages.length > 0 && (
                        <Box component="button" onClick={() => { abort.current?.abort(); setMessages([]) }}
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 32, px: 1.5, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.border}`, color: cv.muted, font: 'inherit', fontSize: 13, cursor: 'pointer', '&:hover': { color: cv.text, bgcolor: 'rgba(255,255,255,.04)' } }}>
                            <Refresh sx={{ fontSize: 16 }} /> Nova conversa
                        </Box>
                    )}
                </Box>
            )}

            {/* Thread */}
            <Box ref={thread} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                <Box sx={{ maxWidth: 780, mx: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2.75, minHeight: '100%', boxSizing: 'border-box' }}>
                    {messages.length === 0 ? (
                        <Box sx={{ m: 'auto', width: '100%', maxWidth: 560, display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
                            <Box sx={{ animation: 'mvIn .4s cubic-bezier(.22,1,.36,1) both' }}><Mascot size={88} mood="happy" /></Box>
                            <Typography sx={{ fontFamily: cv.display, fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', mt: 1.5, animation: 'mvIn .4s cubic-bezier(.22,1,.36,1) .05s both' }}>Olá, sou o Mivvi</Typography>
                            <Typography sx={{ color: cv.muted, fontSize: 15, mt: 0.5, maxWidth: 400, animation: 'mvIn .4s cubic-bezier(.22,1,.36,1) .1s both' }}>
                                O teu tutor. Pergunta-me qualquer coisa, ou manda uma foto de um exercício.
                            </Typography>
                            <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mt: 3.5 }}>
                                {SUGGESTIONS.map((sg, i) => (
                                    <Box key={sg.label} component="button" onClick={() => send(sg.prompt)}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, border: 0, borderRadius: '18px', textAlign: 'left', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, color: cv.text, font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                                            transition: 'background-color .15s, box-shadow .15s, transform .15s', '&:hover': { bgcolor: '#222', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}` }, '&:active': { transform: 'scale(.98)' },
                                            animation: `mvIn .4s cubic-bezier(.22,1,.36,1) ${0.15 + i * 0.05}s both` }}>
                                        <Box sx={{ width: 38, height: 38, borderRadius: '12px', bgcolor: sg.color, color: '#1d2742', display: 'grid', placeItems: 'center', flexShrink: 0 }}><sg.icon sx={{ fontSize: 20 }} /></Box>
                                        {sg.label}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ) : messages.map((m) => (
                        m.role === 'user' ? (
                            <Box key={m.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75, animation: 'mvIn .3s cubic-bezier(.22,1,.36,1) both' }}>
                                {!!m.images?.length && (
                                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        {m.images.map((src, i) => <Box key={i} component="img" src={src} alt="Imagem anexada" sx={{ width: 140, height: 140, objectFit: 'cover', borderRadius: '16px', boxShadow: `inset 0 0 0 1px ${cv.border}` }} />)}
                                    </Box>
                                )}
                                {!!m.files?.length && m.files.map((f) => (
                                    <Box key={f} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderRadius: '14px', boxShadow: `inset 0 0 0 1px ${cv.border}`, fontSize: 13.5 }}>
                                        <InsertDriveFileOutlined sx={{ fontSize: 18, color: cv.muted }} />{f}
                                    </Box>
                                ))}
                                <Box sx={{ maxWidth: 'min(78%, 520px)', px: 1.75, py: 1, borderRadius: '18px', bgcolor: cv.surface, fontSize: 15, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                    {m.content.split('\n\nFicheiro anexado (')[0]}
                                </Box>
                            </Box>
                        ) : (
                            <Box key={m.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, animation: 'mvIn .3s cubic-bezier(.22,1,.36,1) both' }}>
                                <Box sx={{ width: 34, height: 34, borderRadius: '11px', bgcolor: cv.surface, display: 'grid', placeItems: 'center', flexShrink: 0, mt: '-2px' }}>
                                    <Mascot size={26} mood={m.error ? 'sad' : !m.content ? 'thinking' : 'idle'} animated={!m.content} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0, pt: '5px' }}>
                                    {!m.content ? (
                                        <Typography component="span" sx={{ fontSize: 15, fontWeight: 500, ...shimmer }}>A pensar…</Typography>
                                    ) : (
                                        <Box sx={{ fontSize: 15, lineHeight: 1.65, display: 'grid', gap: 1.25, color: m.error ? cv.coral : cv.text, overflowWrap: 'anywhere' }}>
                                            <Markdown text={m.content} animate={m.id === streamingId.current || (busy && m.id === last?.id)} />
                                            {m.error && (
                                                <Box component="button" onClick={retry} sx={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 32, px: 1.75, border: 0, borderRadius: 999, background: 'none', boxShadow: `inset 0 0 0 1px ${cv.border}`, color: cv.text, font: 'inherit', fontSize: 13.5, cursor: 'pointer', '&:hover': { bgcolor: cv.soft } }}>
                                                    <Refresh sx={{ fontSize: 15 }} /> Tentar outra vez
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )
                    ))}
                    {waiting && null}
                </Box>
            </Box>

            {/* Composer */}
            <Box sx={{ maxWidth: 780, width: '100%', mx: 'auto', px: 1.5, pt: 1, pb: embedded ? 'calc(92px + env(safe-area-inset-bottom, 0px))' : 'calc(14px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box' }}>
                {notice && <Typography sx={{ fontSize: 13, color: cv.coral, textAlign: 'center', mb: 1, animation: 'mvIn .25s ease both' }}>{notice}</Typography>}
                <input ref={fileInput} type="file" multiple hidden accept="image/*,.txt,.md,.csv,.json,.py,.js,.ts,.java,.c,.cpp,.html,.css,.sql" onChange={(e) => onFiles(e.target.files)} />
                <Box component="form" onSubmit={(e) => { e.preventDefault(); send() }}
                    onDragOver={(e: React.DragEvent) => e.preventDefault()} onDrop={(e: React.DragEvent) => { e.preventDefault(); onFiles(e.dataTransfer.files) }}
                    sx={{ borderRadius: '26px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, transition: 'box-shadow .15s', '&:focus-within': { boxShadow: `inset 0 0 0 1px ${cv.borderStrong}` } }}>
                    {attachments.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', px: 1.5, pt: 1.5 }}>
                            {attachments.map((a) => (
                                <Box key={a.id} sx={{ position: 'relative', animation: 'mvIn .25s ease both' }}>
                                    {a.kind === 'image'
                                        ? <Box component="img" src={a.data} alt={a.name} sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '14px', display: 'block' }} />
                                        : <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 60, px: 1.5, borderRadius: '14px', bgcolor: cv.surface, fontSize: 13, maxWidth: 200 }}><InsertDriveFileOutlined sx={{ fontSize: 18, color: cv.muted }} /><Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</Box></Box>}
                                    <Box component="button" type="button" aria-label="Remover anexo" onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
                                        sx={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, border: 0, borderRadius: '50%', bgcolor: '#fff', color: '#0d0d0d', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 0 0 2px #1c1c1c' }}>
                                        <Close sx={{ fontSize: 14 }} />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, p: '8px 8px 8px 8px' }}>
                        <IconButton type="button" onClick={() => fileInput.current?.click()} aria-label="Anexar" title="Anexar imagem ou ficheiro" disabled={busy || recording} sx={iconBtn}><Add sx={{ fontSize: 22 }} /></IconButton>
                        {recording ? (
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, height: 36, px: 1, color: cv.text, fontSize: 14.5 }}>
                                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: cv.coral, animation: 'mvPulse 1s ease-in-out infinite' }} />
                                A ouvir… <Box component="span" sx={{ color: cv.muted, fontVariantNumeric: 'tabular-nums' }}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</Box>
                            </Box>
                        ) : transcribing ? (
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', height: 36, px: 1 }}>
                                <Typography component="span" sx={{ fontSize: 14.5, fontWeight: 500, ...shimmer }}>A escrever o que disseste…</Typography>
                            </Box>
                        ) : (
                            <Box component="textarea" ref={box} rows={1} value={input}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                                onPaste={(e: React.ClipboardEvent<HTMLTextAreaElement>) => { if (e.clipboardData.files.length) { e.preventDefault(); onFiles(e.clipboardData.files) } }}
                                placeholder="Pergunta ao Mivvi…" aria-label="Pergunta ao Mivvi"
                                sx={{ flex: 1, minWidth: 0, minHeight: 24, maxHeight: 160, m: 0, my: '6px', px: 0.5, py: 0, border: 0, outline: 'none', resize: 'none', background: 'none', font: 'inherit', fontSize: 15, lineHeight: '24px', color: '#fff', '&::placeholder': { color: '#8f8f8f', opacity: 1 } }} />
                        )}
                        <IconButton type="button" onClick={toggleMic} aria-label={recording ? 'Parar de gravar' : 'Falar'} title={recording ? 'Parar' : 'Falar'} disabled={busy || transcribing}
                            sx={{ ...iconBtn, ...(recording && { color: '#0d0d0d', bgcolor: cv.coral, '&:hover': { bgcolor: '#ffb4a2', color: '#0d0d0d' } }) }}>
                            {recording ? <Stop sx={{ fontSize: 19 }} /> : <MicNoneRounded sx={{ fontSize: 21 }} />}
                        </IconButton>
                        {busy ? (
                            <IconButton onClick={() => abort.current?.abort()} aria-label="Parar" sx={{ width: 36, height: 36, flexShrink: 0, bgcolor: '#fff', color: '#0d0d0d', '&:hover': { bgcolor: '#e6e6e6', color: '#0d0d0d' } }}>
                                <Stop sx={{ fontSize: 18 }} />
                            </IconButton>
                        ) : (
                            <IconButton type="submit" disabled={!canSend} aria-label="Enviar" sx={{ width: 36, height: 36, flexShrink: 0, bgcolor: '#fff', color: '#0d0d0d', '&:hover': { bgcolor: '#e6e6e6', color: '#0d0d0d' }, '&.Mui-disabled': { bgcolor: cv.surface, color: cv.faint } }}>
                                <ArrowUpward sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
