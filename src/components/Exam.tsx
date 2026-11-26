import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { Check, Close, TimerOutlined, FullscreenRounded, ArrowBack, ArrowForward, BlockRounded, EmojiEventsRounded, ReplayRounded } from '@mui/icons-material'
import { Exercise, UserProfile, ExamResult } from '../types'
import { generateExam, checkTypedAnswer, normalizeAnswer } from '../services/aiService'
import { getCachedPlan } from '../services/lessonPlan'
import { subjectName, subjectColor, yearLabel } from '../data/ptCurriculum'
import { SubjectTile } from './SubjectDoodle'
import QuestionVisual from './QuestionVisual'
import { TopicImage } from './TheoryBlocks'
import ExitConfirmDialog from './ExitConfirmDialog'
import Mascot from './Mascot'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// The final exam of a subject, after its last lesson: questions over every
// topic of the year, a timer, no hints and no Mivvi. It runs in full screen;
// leaving full screen, switching tab/app or window annuls it.

interface Props {
  subject: string
  userProfile: UserProfile
  previous?: ExamResult
  onRecord: (r: ExamResult['last']) => void
  onExit: () => void
}

type Phase = 'intro' | 'running' | 'grading' | 'done' | 'annulled'
const COUNT = 20
const SECONDS_PER_QUESTION = 90

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`
const canFullscreen = () => typeof document !== 'undefined' && !!document.fullscreenEnabled && !!document.documentElement.requestFullscreen

export default function Exam({ subject, userProfile, previous, onRecord, onExit }: Props) {
  const color = subjectColor(subject)
  const [plan, setPlan] = useState(() => getCachedPlan(subject, userProfile.schoolYear, userProfile.course) || [])
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<Exercise[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [left, setLeft] = useState(COUNT * SECONDS_PER_QUESTION)
  const [results, setResults] = useState<boolean[]>([])
  const [reason, setReason] = useState('')
  const [quit, setQuit] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [fsError, setFsError] = useState(false)
  const phaseRef = useRef<Phase>('intro')
  phaseRef.current = phase
  const fsSupported = canFullscreen()

  // Questions are written while the student reads the rules.
  const load = useCallback(() => {
    setLoadError(false)
    setQuestions(null)
    generateExam(subject, userProfile.schoolYear || '1ano', userProfile.course, COUNT)
      .then((q) => { setQuestions(q); setAnswers(q.map(() => '')); setLeft(q.length * SECONDS_PER_QUESTION); setPlan(getCachedPlan(subject, userProfile.schoolYear, userProfile.course) || []) })
      .catch(() => setLoadError(true))
  }, [subject, userProfile.schoolYear, userProfile.course])
  useEffect(() => { load() }, [load])

  const leaveFullscreen = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => { /* already out */ }) }

  const annul = useCallback((why: string) => {
    if (phaseRef.current !== 'running') return
    phaseRef.current = 'annulled'
    setReason(why)
    setPhase('annulled')
    soundManager.playError()
    leaveFullscreen()
    onRecord({ score: 0, correct: 0, total: questions?.length || COUNT, date: Date.now(), annulled: true, reason: why })
  }, [onRecord, questions])

  // ── Anti-cheat: full screen, tab and window ──
  useEffect(() => {
    if (phase !== 'running') return
    const onFs = () => { if (fsSupported && !document.fullscreenElement) annul('Saíste do ecrã inteiro.') }
    const onVis = () => { if (document.visibilityState === 'hidden') annul('Mudaste de separador ou saíste da app.') }
    let blurTimer: ReturnType<typeof setTimeout> | undefined
    const onBlur = () => { blurTimer = setTimeout(() => { if (!document.hasFocus()) annul('Mudaste para outra janela.') }, 1200) }
    const onFocus = () => clearTimeout(blurTimer)
    const block = (e: Event) => e.preventDefault()
    const onKey = (e: KeyboardEvent) => {
      // Developer tools, printing and view-source shortcuts are not allowed.
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && ['p', 'u', 's'].includes(e.key.toLowerCase())) || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))) e.preventDefault()
    }
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    document.addEventListener('fullscreenchange', onFs)
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    document.addEventListener('keydown', onKey)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      clearTimeout(blurTimer)
      document.removeEventListener('fullscreenchange', onFs)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [phase, annul, fsSupported])

  const submit = useCallback(async () => {
    if (!questions || phaseRef.current !== 'running') return
    phaseRef.current = 'grading'
    setPhase('grading')
    leaveFullscreen()
    const res: boolean[] = []
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const a = answers[i] || ''
      if (!a.trim()) { res.push(false); continue }
      if (q.type === 'typing' || !q.options?.length) res.push((await checkTypedAnswer(a, q)).correct)
      else res.push(normalizeAnswer(a) === normalizeAnswer(q.correctAnswer))
    }
    const correct = res.filter(Boolean).length
    const score = Math.round((correct / questions.length) * 200) / 10
    setResults(res)
    setPhase('done')
    if (score >= 9.5) soundManager.playLevelUp(); else soundManager.playError()
    onRecord({ score, correct, total: questions.length, date: Date.now() })
  }, [questions, answers, onRecord])

  // Timer: when it reaches zero the exam is handed in as it is.
  useEffect(() => {
    if (phase !== 'running') return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase])
  useEffect(() => { if (phase === 'running' && left <= 0) submit() }, [left, phase, submit])

  const start = async () => {
    if (!questions) return
    if (fsSupported) {
      setFsError(false)
      try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions) } catch { setFsError(true); return }
    }
    soundManager.playStart()
    setIndex(0)
    phaseRef.current = 'running'
    setPhase('running')
  }

  const page = { position: 'fixed' as const, inset: 0, zIndex: 1400, bgcolor: cv.bg, color: cv.text, overflowY: 'auto' as const, textAlign: 'left' as const }
  const btn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: 46, px: 2.75, border: 0, borderRadius: 999, font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', bgcolor: '#fff', color: '#0d0d0d', '&:hover:not(:disabled)': { bgcolor: '#e6e6e6' }, '&:disabled': { bgcolor: cv.surface, color: cv.faint, cursor: 'default' } } as const
  const ghost = { ...btn, bgcolor: 'transparent', color: cv.text, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, '&:hover:not(:disabled)': { bgcolor: cv.soft } } as const
  const card = { borderRadius: '22px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}` }

  // ── Intro ──
  if (phase === 'intro') {
    const minutes = Math.round(((questions?.length || COUNT) * SECONDS_PER_QUESTION) / 60)
    return (
      <Box sx={page}>
        <Box sx={{ maxWidth: 560, mx: 'auto', px: 2.5, py: { xs: 3, sm: 6 } }}>
          <Box component="button" onClick={onExit} sx={{ ...ghost, height: 36, px: 1.5, fontSize: 13.5 }}><ArrowBack sx={{ fontSize: 17 }} />Voltar</Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 3 }}>
            <SubjectTile subject={subject} size={36} />
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color }}>{subjectName(subject)} · {yearLabel(userProfile.schoolYear)}</Typography>
          </Box>
          <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 28, sm: 34 }, fontWeight: 700, letterSpacing: '-0.03em', mt: 1.5 }}>Exame final</Typography>
          <Typography sx={{ color: cv.muted, fontSize: 15, mt: 0.75, lineHeight: 1.5 }}>
            {plan.length ? `Mostra o que aprendeste nas ${plan.length} lições do ano.` : 'Mostra o que aprendeste este ano.'} As perguntas cobrem todas as matérias.
          </Typography>

          <Box sx={{ ...card, mt: 3, p: 2.25, display: 'grid', gap: 1.5 }}>
            {[
              [`${questions?.length || COUNT} perguntas`, 'Escolha múltipla e respostas curtas, sem dicas.'],
              [`${minutes} minutos`, 'Quando o tempo acaba, o exame é entregue como estiver.'],
              ['Nota de 0 a 20', 'Ficas aprovado com 9,5 ou mais.'],
              [fsSupported ? 'Ecrã inteiro obrigatório' : 'Sem sair da app', fsSupported
                ? 'Se saíres do ecrã inteiro (Esc), mudares de separador ou de janela, o exame é anulado.'
                : 'Se mudares de app ou de separador, o exame é anulado.'],
            ].map(([t, d], i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                <Box component="span" sx={{ width: 22, height: 22, borderRadius: '7px', bgcolor: i === 3 ? 'rgba(255,159,136,.15)' : cv.surface, color: i === 3 ? cv.coral : cv.muted, fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, mt: '1px' }}>{i + 1}</Box>
                <Box>
                  <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>{t}</Typography>
                  <Typography sx={{ fontSize: 13, color: cv.muted, lineHeight: 1.45 }}>{d}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {fsError && (
            <Typography sx={{ fontSize: 13.5, color: cv.coral, mt: 2 }}>O browser não deixou pôr em ecrã inteiro. Abre o Mivvi diretamente no browser (não dentro de outra app) e tenta outra vez.</Typography>
          )}
          {previous && (
            <Typography sx={{ fontSize: 13.5, color: cv.muted, mt: 2 }}>
              Melhor nota: <Box component="strong" sx={{ color: cv.text }}>{String(previous.best).replace('.', ',')}</Box> · {previous.attempts} {previous.attempts === 1 ? 'tentativa' : 'tentativas'}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
            {loadError ? (
              <>
                <Typography sx={{ fontSize: 14, color: cv.coral }}>Não foi possível preparar o exame.</Typography>
                <Box component="button" onClick={load} sx={btn}>Tentar outra vez</Box>
              </>
            ) : (
              <Box component="button" disabled={!questions} onClick={start} sx={btn}>
                {questions ? <>{fsSupported && <FullscreenRounded sx={{ fontSize: 20 }} />}Começar exame</> : <><CircularProgress size={16} sx={{ color: cv.muted }} />A preparar o exame…</>}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  // ── Annulled ──
  if (phase === 'annulled') {
    return (
      <Box sx={{ ...page, display: 'grid', placeItems: 'center', px: 2.5 }}>
        <Box sx={{ maxWidth: 440, textAlign: 'center', display: 'grid', justifyItems: 'center' }}>
          <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: 'rgba(255,159,136,.12)', color: cv.coral, display: 'grid', placeItems: 'center' }}><BlockRounded sx={{ fontSize: 32 }} /></Box>
          <Typography sx={{ fontFamily: cv.display, fontSize: 26, fontWeight: 700, mt: 2 }}>Exame anulado</Typography>
          <Typography sx={{ color: cv.muted, fontSize: 15, mt: 0.75, lineHeight: 1.5 }}>{reason} As regras do exame não deixam sair do ecrã durante a prova.</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
            <Box component="button" onClick={onExit} sx={ghost}>Voltar ao início</Box>
            <Box component="button" onClick={() => { setPhase('intro'); load() }} sx={btn}><ReplayRounded sx={{ fontSize: 19 }} />Tentar de novo</Box>
          </Box>
        </Box>
      </Box>
    )
  }

  // ── Grading ──
  if (phase === 'grading') {
    return (
      <Box sx={{ ...page, display: 'grid', placeItems: 'center' }}>
        <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1.5 }}>
          <Mascot size={72} mood="thinking" />
          <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700 }}>A corrigir o teu exame…</Typography>
        </Box>
      </Box>
    )
  }

  // ── Result ──
  if (phase === 'done' && questions) {
    const correct = results.filter(Boolean).length
    const score = Math.round((correct / questions.length) * 200) / 10
    const passed = score >= 9.5
    return (
      <Box sx={page}>
        <Box sx={{ maxWidth: 640, mx: 'auto', px: 2.5, py: { xs: 3, sm: 6 } }}>
          <Box sx={{ ...card, p: { xs: 2.5, sm: 3.5 }, display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
            <Mascot size={72} mood={passed ? 'celebrating' : 'sad'} />
            <Typography sx={{ fontSize: 13.5, color: cv.muted, mt: 1.5 }}>{subjectName(subject)} · Exame final</Typography>
            <Typography sx={{ fontFamily: cv.display, fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, mt: 1, color: passed ? cv.green : cv.coral }}>
              {String(score).replace('.', ',')}<Box component="span" sx={{ fontSize: 24, color: cv.muted }}>/20</Box>
            </Typography>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1.5, px: 1.5, height: 30, borderRadius: 999, fontSize: 13.5, fontWeight: 600, bgcolor: passed ? 'rgba(125,219,168,.12)' : 'rgba(255,159,136,.12)', color: passed ? cv.green : cv.coral }}>
              {passed ? <EmojiEventsRounded sx={{ fontSize: 17 }} /> : <Close sx={{ fontSize: 17 }} />}{passed ? 'Aprovado' : 'Ainda não'} · {correct} de {questions.length} certas
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <Box component="button" onClick={onExit} sx={ghost}>Voltar ao início</Box>
              <Box component="button" onClick={() => { setPhase('intro'); load() }} sx={btn}><ReplayRounded sx={{ fontSize: 19 }} />Repetir</Box>
            </Box>
          </Box>

          <Typography sx={{ fontSize: 15, fontWeight: 600, mt: 4, mb: 1.5 }}>Correção</Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {questions.map((q, i) => (
              <Box key={i} sx={{ ...card, borderRadius: '16px', p: 1.75, display: 'flex', gap: 1.25 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: results[i] ? cv.green : cv.coral, color: '#0d0d0d', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {results[i] ? <Check sx={{ fontSize: 15 }} /> : <Close sx={{ fontSize: 15 }} />}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{i + 1}. {q.question}</Typography>
                  <Typography sx={{ fontSize: 13, color: cv.muted, mt: 0.5 }}>
                    A tua resposta: <Box component="span" sx={{ color: results[i] ? cv.green : cv.coral }}>{answers[i] || '—'}</Box>
                    {!results[i] && <> · Certa: <Box component="span" sx={{ color: cv.text }}>{q.correctAnswer}</Box></>}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    )
  }

  // ── Running ──
  if (!questions) return null
  const q = questions[index]
  const typing = q.type === 'typing' || !q.options?.length
  const answered = answers.filter((a) => a.trim()).length
  const setAnswer = (v: string) => setAnswers((prev) => prev.map((a, i) => (i === index ? v : a)))

  return (
    <Box sx={{ ...page, userSelect: 'none' }}>
      <ExitConfirmDialog open={quit} onCancel={() => setQuit(false)} onConfirm={() => { setQuit(false); annul('Desististe do exame.') }}
        title="Desistir do exame?" message="Se saíres agora, o exame é anulado e conta como tentativa." confirmLabel="Desistir" />
      <ExitConfirmDialog open={confirmSubmit} onCancel={() => setConfirmSubmit(false)} onConfirm={() => { setConfirmSubmit(false); submit() }}
        title="Entregar o exame?" message={`Tens ${questions.length - answered} ${questions.length - answered === 1 ? 'pergunta' : 'perguntas'} por responder. As que ficarem em branco contam como erradas.`} confirmLabel="Entregar" />

      {/* Top bar */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: cv.bg, borderBottom: `1px solid ${cv.border}` }}>
        <Box sx={{ maxWidth: 760, mx: 'auto', px: 2, height: 56, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <SubjectTile subject={subject} size={28} />
          <Typography sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Exame final · {subjectName(subject)}</Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 32, px: 1.25, borderRadius: 999, bgcolor: left < 300 ? 'rgba(255,159,136,.14)' : cv.soft, color: left < 300 ? cv.coral : cv.text, fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            <TimerOutlined sx={{ fontSize: 17 }} />{fmt(left)}
          </Box>
          <Box component="button" onClick={() => setQuit(true)} sx={{ ...ghost, height: 32, px: 1.5, fontSize: 13 }}>Desistir</Box>
        </Box>
        {/* Question navigator */}
        <Box sx={{ maxWidth: 760, mx: 'auto', px: 2, pb: 1.25, display: 'flex', gap: 0.5, overflowX: 'auto' }}>
          {questions.map((_, i) => (
            <Box key={i} component="button" onClick={() => { soundManager.playClick(); setIndex(i) }}
              sx={{ minWidth: 30, height: 30, border: 0, borderRadius: '9px', font: 'inherit', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                bgcolor: i === index ? '#fff' : answers[i]?.trim() ? cv.surface : 'transparent', color: i === index ? '#0d0d0d' : answers[i]?.trim() ? cv.text : cv.faint,
                boxShadow: i === index || answers[i]?.trim() ? 'none' : `inset 0 0 0 1px ${cv.border}` }}>
              {i + 1}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Question */}
      <Box key={index} sx={{ maxWidth: 640, mx: 'auto', px: 2.5, pt: 3, pb: 16, animation: 'exQ .25s ease both', '@keyframes exQ': { from: { opacity: 0, transform: 'translateY(6px)' } } }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cv.muted, textTransform: 'uppercase', letterSpacing: '.07em' }}>Pergunta {index + 1} de {questions.length}</Typography>
        <Typography sx={{ fontFamily: cv.display, fontSize: { xs: 19, sm: 22 }, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.35, mt: 1 }}>{q.question}</Typography>
        {q.image && <TopicImage query={q.image} hideTitle />}
        {q.visual && <Box sx={{ mt: 2 }}><QuestionVisual visual={q.visual} subject={subject} /></Box>}

        {typing ? (
          <Box component="input" autoFocus value={answers[index] || ''} placeholder="A tua resposta" autoComplete="off" spellCheck={false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnswer(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && index < questions.length - 1) setIndex(index + 1) }}
            sx={{ mt: 2.25, width: '100%', boxSizing: 'border-box', height: 52, px: 2, borderRadius: '14px', border: 0, outline: 'none', font: 'inherit', fontSize: 16, color: cv.text, bgcolor: cv.paper, userSelect: 'text',
              boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, '&:focus': { boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.5)' }, '&::placeholder': { color: cv.faint } }} />
        ) : (
          <Box sx={{ mt: 2.25, display: 'grid', gap: 0.75 }}>
            {q.options.map((o, i) => {
              const on = answers[index] === o
              return (
                <Box key={o + i} component="button" onClick={() => { setAnswer(o); soundManager.playSelect() }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', minHeight: 48, p: '8px 12px 8px 8px', border: 0, borderRadius: '14px', textAlign: 'left', font: 'inherit', fontSize: 14.5, color: cv.text, cursor: 'pointer',
                    bgcolor: on ? cv.surface : 'transparent', boxShadow: `inset 0 0 0 ${on ? 1.5 : 1}px ${on ? '#fff' : cv.border}`, '&:hover': { bgcolor: on ? cv.surface : 'rgba(255,255,255,.03)' } }}>
                  <Box component="span" sx={{ width: 26, height: 26, borderRadius: '8px', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, bgcolor: on ? '#fff' : cv.surface, color: on ? '#0d0d0d' : cv.muted }}>{String.fromCharCode(65 + i)}</Box>
                  {o}
                </Box>
              )
            })}
          </Box>
        )}
      </Box>

      {/* Bottom bar */}
      <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, bgcolor: 'rgba(20,20,20,.94)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${cv.border}` }}>
        <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 1.5, pb: 'calc(12px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="button" disabled={index === 0} onClick={() => setIndex(index - 1)} sx={{ ...ghost, height: 44, px: 1.75 }}><ArrowBack sx={{ fontSize: 18 }} /></Box>
          <Typography sx={{ flex: 1, textAlign: 'center', fontSize: 13, color: cv.muted }}>{answered} de {questions.length} respondidas</Typography>
          {index < questions.length - 1 ? (
            <Box component="button" onClick={() => setIndex(index + 1)} sx={{ ...btn, height: 44 }}>Seguinte<ArrowForward sx={{ fontSize: 18 }} /></Box>
          ) : (
            <Box component="button" onClick={() => { if (answered === questions.length) submit(); else setConfirmSubmit(true) }} sx={{ ...btn, height: 44 }}>
              <Check sx={{ fontSize: 18 }} />Entregar
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
