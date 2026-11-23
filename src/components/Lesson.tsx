import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { Close, Check, VolumeUp, MicNoneRounded, StopRounded, LightbulbOutlined, LocalFireDepartment, Replay, ArrowForward } from '@mui/icons-material'

import { Exercise, AIResponse, UserProfile } from '../types'
import { generateExercises, getAIFeedback } from '../services/aiService'
import Mascot from './Mascot'
import { soundManager } from '../utils/soundEffects'
import { t } from '../utils/translations'
import StreakCelebration from './StreakCelebration'
import ExitConfirmDialog from './ExitConfirmDialog'
import LessonRewards from './LessonRewards'
import { handleSuccess } from '../services/feedbackService'
import { playListeningAudio } from '../services/audioService'
import { cv } from '../theme'
import QuestionVisual from './QuestionVisual'
import { getCachedPlan } from '../services/lessonPlan'

// A lesson laid out like Codevantum's lesson player: a segmented progress bar,
// one question at a time with Mivvi beside it, answers as quiet rows, and a
// sheet that slides up from the bottom with the result.

interface LessonProps {
  lessonId: number
  onComplete: (xpGained: number, correct: number, total: number, gemsEarned?: number, subject?: string) => void
  onMistake?: () => void
  onBack: (skipTutorial?: boolean) => void
  userProfile: UserProfile | null
  currentOutfit?: string
  isTutorial?: boolean
  isReplay?: boolean
}

type Outcome = 'right' | 'wrong'

const COPY: Record<string, Record<string, string>> = {
  pt: {
    loading: 'A preparar a tua lição', step1: 'A escolher os temas', step2: 'A escrever as perguntas', step3: 'A rever as respostas',
    choice: 'Escolhe a resposta', listen: 'Ouve e responde', write: 'Escreve a resposta', speak: 'Diz em voz alta',
    check: 'Verificar', next: 'Continuar', finish: 'Terminar', hint: 'Ver dica', right: 'Muito bem!', wrong: 'Ainda não',
    answer: 'Resposta certa', typeHere: 'Escreve aqui…', play: 'Ouvir', playing: 'A tocar…', tapMic: 'Toca para falar', listening: 'A ouvir…',
    review: 'Correção', reviewTitle: 'Vamos rever o que falhou', reviewText: '{n} perguntas voltam agora, para as acertares de vez.', reviewGo: 'Rever agora',
    emptyTitle: 'Não foi possível criar a lição', emptyText: 'Tenta outra vez daqui a pouco.', retry: 'Tentar outra vez', back: 'Voltar',
    thinking: 'O Mivvi está a escrever uma explicação…', keys: 'Usa 1–4 e Enter',
  },
  en: {
    loading: 'Preparing your lesson', step1: 'Picking topics', step2: 'Writing questions', step3: 'Checking answers',
    choice: 'Pick the answer', listen: 'Listen and answer', write: 'Type the answer', speak: 'Say it out loud',
    check: 'Check', next: 'Continue', finish: 'Finish', hint: 'Show hint', right: 'Nice!', wrong: 'Not quite',
    answer: 'Correct answer', typeHere: 'Type here…', play: 'Listen', playing: 'Playing…', tapMic: 'Tap to speak', listening: 'Listening…',
    review: 'Review', reviewTitle: "Let's review your mistakes", reviewText: '{n} questions come back now so you get them right.', reviewGo: 'Review now',
    emptyTitle: "Couldn't create this lesson", emptyText: 'Please try again in a moment.', retry: 'Try again', back: 'Back',
    thinking: 'Mivvi is writing an explanation…', keys: 'Use 1–4 and Enter',
  },
  es: {
    loading: 'Preparando tu lección', step1: 'Eligiendo temas', step2: 'Escribiendo preguntas', step3: 'Revisando respuestas',
    choice: 'Elige la respuesta', listen: 'Escucha y responde', write: 'Escribe la respuesta', speak: 'Dilo en voz alta',
    check: 'Comprobar', next: 'Continuar', finish: 'Terminar', hint: 'Ver pista', right: '¡Muy bien!', wrong: 'Todavía no',
    answer: 'Respuesta correcta', typeHere: 'Escribe aquí…', play: 'Escuchar', playing: 'Sonando…', tapMic: 'Toca para hablar', listening: 'Escuchando…',
    review: 'Corrección', reviewTitle: 'Repasemos los fallos', reviewText: '{n} preguntas vuelven ahora para que las aciertes.', reviewGo: 'Repasar ahora',
    emptyTitle: 'No se pudo crear la lección', emptyText: 'Inténtalo de nuevo en un momento.', retry: 'Reintentar', back: 'Volver',
    thinking: 'Mivvi está escribiendo una explicación…', keys: 'Usa 1–4 y Enter',
  },
}

/** Forgiving comparison for typed and spoken answers: case, accents and punctuation don't matter. */
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()

const KIND = {
  'multiple-choice': { color: '#9fc9ff' },
  listening: { color: cv.mint },
  typing: { color: cv.butter },
  speaking: { color: '#ff9fbb' },
} as const

const fadeUp = (delay = 0) => ({
  animation: `lsUp .38s cubic-bezier(.22,1,.36,1) ${delay}s both`,
  '@keyframes lsUp': { from: { opacity: 0, transform: 'translateY(10px)' } },
})

export default function Lesson({ lessonId, onComplete, onMistake, onBack, userProfile, currentOutfit = 'default', isTutorial, isReplay }: LessonProps) {
  const lang = userProfile?.language || 'pt-BR'
  const c = COPY[lang.slice(0, 2)] || COPY.en

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [index, setIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [aiFeedback, setAiFeedback] = useState<AIResponse | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [results, setResults] = useState<(Outcome | null)[]>([])
  const [score, setScore] = useState({ correct: 0, total: 0, xp: 0 })
  const [loading, setLoading] = useState(true)
  const [loadStep, setLoadStep] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showStreakCelebration, setShowStreakCelebration] = useState(false)
  const [celebrationStreak, setCelebrationStreak] = useState(0)
  const [retryQueue, setRetryQueue] = useState<Exercise[]>([])
  const [inRetryPhase, setInRetryPhase] = useState(false)
  const [showRetryInterstitial, setShowRetryInterstitial] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [rewardsData, setRewardsData] = useState({ xp: 0, correct: 0, total: 0, gems: 0 })
  const [currentSubject, setCurrentSubject] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const recognition = useRef<any>(null)
  const typingRef = useRef<HTMLInputElement>(null)

  const exercise = exercises[index]
  const kind: keyof typeof KIND = exercise
    ? (exercise.type === 'speaking' || exercise.exerciseType === 'speaking' ? 'speaking'
      : exercise.exerciseType === 'listening' ? 'listening'
        : exercise.type === 'typing' || !exercise.options?.length ? 'typing' : 'multiple-choice')
    : 'multiple-choice'
  const answered = outcome !== null
  const options = exercise?.options || []
  const hasOptions = options.length > 0 && kind !== 'typing' && kind !== 'speaking'
  const answer = hasOptions ? selectedOption : userAnswer

  useEffect(() => () => { try { recognition.current?.stop() } catch { /* ignore */ } }, [])

  // ── Loading ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true
    const timer = setInterval(() => setLoadStep((s) => Math.min(s + 1, 2)), 1400)
    ;(async () => {
      setLoading(true)
      setLoadStep(0)
      const subject = localStorage.getItem('mivvi_selectedSubject') || userProfile?.selectedSubjects?.[0] || 'matematica'
      setCurrentSubject(subject)
      try {
        const [list] = await Promise.all([
          generateExercises(lessonId, userProfile?.difficulty || 'medium', subject, userProfile?.schoolYear || '1ano', lang, userProfile?.course),
          new Promise((r) => setTimeout(r, 900)), // let the intro play
        ])
        if (!alive) return
        setExercises(list)
        setResults(list.map(() => null))
      } catch (error) {
        console.error('Failed to load exercises:', error)
      } finally {
        if (alive) setLoading(false)
        clearInterval(timer)
      }
    })()
    return () => { alive = false; clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  // ── Actions ───────────────────────────────────────────────────────────────
  const resetExerciseState = () => {
    setUserAnswer('')
    setSelectedOption('')
    setOutcome(null)
    setAiFeedback(null)
    setShowHint(false)
  }

  const handleSubmit = useCallback(async () => {
    if (!exercise || answered || !answer.trim()) return
    const correct = hasOptions
      ? answer.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase()
      : normalize(answer) === normalize(exercise.correctAnswer)
    const result: Outcome = correct ? 'right' : 'wrong'
    setOutcome(result)
    setResults((prev) => prev.map((r, i) => (i === index ? result : r)))
    const points = inRetryPhase ? 5 : 10

    if (correct) {
      const next = streak + 1
      setStreak(next)
      setScore((p) => ({ correct: p.correct + 1, total: p.total + 1, xp: p.xp + points }))
      soundManager.playSuccess()
      if (next === 5 || next === 10) {
        setCelebrationStreak(next)
        setTimeout(() => { setShowStreakCelebration(true); handleSuccess() }, 900)
      }
    } else {
      setStreak(0)
      setScore((p) => ({ ...p, total: p.total + 1 }))
      soundManager.playError()
      onMistake?.()
      setRetryQueue((prev) => [...prev, exercise])
    }

    const feedback = await getAIFeedback(exercise, correct, lang, answer)
    setAiFeedback(feedback)
  }, [exercise, answered, answer, hasOptions, index, inRetryPhase, streak, lang, onMistake])

  const handleFinishLesson = () => {
    let xp = isTutorial ? Math.floor(Math.random() * 101) + 100 : Math.floor(Math.random() * 71) + 30
    let gems = 0 // gems were removed from the app
    if (isReplay) { xp = 0; gems = 0 }
    if (score.correct >= exercises.length * 0.6) soundManager.playLevelUp()
    setRewardsData({ xp, correct: score.correct, total: score.total, gems })
    setShowRewards(true)
  }

  const handleNext = useCallback(() => {
    soundManager.playClick()
    if (index < exercises.length - 1) {
      setIndex((i) => i + 1)
      resetExerciseState()
    } else if (retryQueue.length > 0) {
      setShowRetryInterstitial(true)
    } else {
      handleFinishLesson()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, exercises.length, retryQueue.length])

  const startRetryPhase = () => {
    setShowRetryInterstitial(false)
    setInRetryPhase(true)
    setExercises(retryQueue)
    setResults(retryQueue.map(() => null))
    setRetryQueue([])
    setIndex(0)
    resetExerciseState()
  }

  const handleRewardsClose = () => {
    setShowRewards(false)
    onComplete(rewardsData.xp, rewardsData.correct, rewardsData.total, rewardsData.gems, currentSubject || undefined)
  }

  const handlePlayAudio = async () => {
    if (!exercise || isPlayingAudio) return
    await playListeningAudio(exercise.audioText || exercise.question, lang, () => setIsPlayingAudio(true), () => setIsPlayingAudio(false))
  }

  const toggleListening = () => {
    if (isListening) { recognition.current?.stop(); setIsListening(false); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert(t('speech_error', lang) || 'Speech recognition not supported in this browser.'); return }
    const r = new SR()
    r.lang = lang
    r.interimResults = true
    r.onstart = () => setIsListening(true)
    r.onresult = (e: any) => setUserAnswer(Array.from(e.results).map((x: any) => x[0].transcript).join(''))
    r.onerror = () => setIsListening(false)
    r.onend = () => setIsListening(false)
    setUserAnswer('')
    r.start()
    recognition.current = r
  }

  // Keyboard: 1–4 pick an option, Enter checks or continues.
  useEffect(() => {
    if (loading || showRewards || showRetryInterstitial || showExitDialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (answered) handleNext()
        else handleSubmit()
        return
      }
      if (!answered && hasOptions && document.activeElement?.tagName !== 'INPUT') {
        const n = Number(e.key)
        if (n >= 1 && n <= options.length) { setSelectedOption(options[n - 1]); soundManager.playClick() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, showRewards, showRetryInterstitial, showExitDialog, answered, hasOptions, options, handleNext, handleSubmit])

  useEffect(() => { if (kind === 'typing' && !answered) typingRef.current?.focus() }, [index, kind, answered])

  // ── Screens ───────────────────────────────────────────────────────────────
  const page = { minHeight: '100dvh', bgcolor: cv.bg, color: cv.text, textAlign: 'left' as const, fontFamily: cv.font }

  if (loading) {
    const steps = [c.step1, c.step2, c.step3]
    return (
      <Box sx={{ ...page, display: 'grid', placeItems: 'center', px: 3 }}>
        <Box sx={{ width: '100%', maxWidth: 520, display: 'grid', justifyItems: 'center', ...fadeUp() }}>
          <Mascot size={92} mood="thinking" outfit={currentOutfit} />
          <Typography sx={{ fontFamily: cv.display, fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', mt: 2.5 }}>{c.loading}</Typography>

          {/* What Mivvi is doing, one line lighting up after another */}
          <Box component="ol" sx={{ listStyle: 'none', p: 0, m: '14px 0 0', display: 'grid', gap: 0.75, justifyItems: 'center' }}>
            {steps.map((s, i) => (
              <Box component="li" key={s} sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 14, color: i < loadStep ? cv.muted : i === loadStep ? 'transparent' : cv.faint,
                transition: 'color .3s',
                ...(i === loadStep && {
                  backgroundImage: 'linear-gradient(90deg, #8e8e93 0%, #8e8e93 40%, #f2f2f7 50%, #8e8e93 60%, #8e8e93 100%)',
                  backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  animation: 'lsShimmer 2.2s linear infinite',
                  '@keyframes lsShimmer': { from: { backgroundPosition: '100% 0' }, to: { backgroundPosition: '0% 0' } },
                }),
              }}>
                {i < loadStep && <Check sx={{ fontSize: 15, color: cv.green }} />}
                {s}
              </Box>
            ))}
          </Box>

          {/* A sketch of the question that is coming */}
          <Box aria-hidden sx={{ width: '100%', mt: 4, p: 2.5, borderRadius: '18px', boxShadow: `inset 0 0 0 1px ${cv.border}`, display: 'grid', gap: 1.25,
            '& i': { display: 'block', height: 12, borderRadius: 999, background: 'linear-gradient(90deg, #232323 25%, #2e2e2e 37%, #232323 63%)', backgroundSize: '400% 100%', animation: 'lsSkel 1.4s ease infinite' },
            '@keyframes lsSkel': { from: { backgroundPosition: '100% 50%' }, to: { backgroundPosition: '0 50%' } } }}>
            <i style={{ width: '30%', height: 10 }} />
            <i style={{ width: '85%', height: 18 }} />
            <i style={{ width: '60%', height: 18, marginBottom: 8 }} />
            {[0, 1, 2].map((k) => <i key={k} style={{ height: 44, borderRadius: 14 }} />)}
          </Box>
        </Box>
      </Box>
    )
  }

  if (exercises.length === 0) {
    return (
      <Box sx={{ ...page, display: 'grid', placeItems: 'center', px: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1, ...fadeUp() }}>
          <Mascot size={88} mood="sad" outfit={currentOutfit} />
          <Typography sx={{ fontFamily: cv.display, fontSize: 22, fontWeight: 700, mt: 1.5 }}>{c.emptyTitle}</Typography>
          <Typography sx={{ color: cv.muted }}>{c.emptyText}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Box component="button" onClick={() => window.location.reload()} sx={pillPrimary}>{c.retry}</Box>
            <Box component="button" onClick={() => onBack()} sx={pillSecondary}>{c.back}</Box>
          </Box>
        </Box>
      </Box>
    )
  }

  if (showRetryInterstitial) {
    return (
      <Box sx={{ ...page, display: 'grid', placeItems: 'center', px: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'grid', justifyItems: 'center', maxWidth: 420 }}>
          <Box sx={fadeUp()}><Mascot size={110} mood="thinking" outfit={currentOutfit} /></Box>
          <Typography sx={{ fontFamily: cv.display, fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', mt: 2.5, ...fadeUp(0.08) }}>{c.reviewTitle}</Typography>
          <Typography sx={{ color: cv.muted, mt: 1, ...fadeUp(0.14) }}>{c.reviewText.replace('{n}', String(retryQueue.length))}</Typography>
          <Box component="button" onClick={startRetryPhase} sx={{ ...pillPrimary, mt: 3, ...fadeUp(0.2) }}><Replay sx={{ fontSize: 18 }} />{c.reviewGo}</Box>
        </Box>
      </Box>
    )
  }

  const tone = outcome === 'right' ? cv.green : cv.coral
  const kindLabel = { 'multiple-choice': c.choice, listening: c.listen, typing: c.write, speaking: c.speak }[kind]
  const isLast = index === exercises.length - 1 && retryQueue.length === 0

  return (
    <>
      {showStreakCelebration && <StreakCelebration streak={celebrationStreak} onComplete={() => setShowStreakCelebration(false)} />}
      <ExitConfirmDialog open={showExitDialog} language={lang} onConfirm={() => { setShowExitDialog(false); onBack(isTutorial) }} onCancel={() => setShowExitDialog(false)} outfit={currentOutfit} isTutorial={isTutorial} />
      <LessonRewards open={showRewards} xpGained={rewardsData.xp} correctAnswers={rewardsData.correct} totalQuestions={rewardsData.total} gemsEarned={rewardsData.gems} onClose={handleRewardsClose} language={lang} outfit={currentOutfit} />

      <Box sx={{ ...page, display: 'flex', flexDirection: 'column', pb: '180px' }}>
        {/* Top: close, segmented progress, streak */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 5, bgcolor: cv.bg, pt: 'env(safe-area-inset-top, 0px)' }}>
          <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', alignItems: 'center', gap: 1.5, px: 2, height: 60 }}>
            <IconButton onClick={() => setShowExitDialog(true)} aria-label={c.back} sx={{ width: 36, height: 36 }}><Close sx={{ fontSize: 20 }} /></IconButton>
            <Box sx={{ flex: 1, display: 'flex', gap: '4px' }} role="progressbar" aria-valuemin={0} aria-valuemax={exercises.length} aria-valuenow={index + 1}>
              {exercises.map((_, i) => (
                <Box key={i} sx={{
                  flex: 1, height: 5, borderRadius: 999, overflow: 'hidden', bgcolor: 'rgba(255,255,255,.08)', position: 'relative',
                  '&::after': {
                    content: '""', position: 'absolute', inset: 0, borderRadius: 999,
                    bgcolor: results[i] === 'right' ? cv.green : results[i] === 'wrong' ? cv.coral : i === index ? '#fff' : 'transparent',
                    transform: results[i] || i === index ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left',
                    transition: 'transform .45s cubic-bezier(.22,1,.36,1), background-color .3s',
                    opacity: i === index && !results[i] ? 0.85 : 1,
                  },
                }} />
              ))}
            </Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, minWidth: 40, justifyContent: 'flex-end', color: streak ? cv.butter : cv.faint, fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              <LocalFireDepartment key={streak} sx={{ fontSize: 18, animation: streak ? 'lsPop .4s cubic-bezier(.34,1.56,.64,1)' : 'none', '@keyframes lsPop': { '0%': { transform: 'scale(.6)' }, '100%': { transform: 'scale(1)' } } }} />
              {streak}
            </Box>
          </Box>
        </Box>

        {/* Question */}
        <Box key={`${inRetryPhase}-${index}`} component="main" sx={{ width: '100%', maxWidth: 640, mx: 'auto', px: 2.5, pt: { xs: 2, sm: 5 }, boxSizing: 'border-box' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, fontWeight: 500, color: cv.muted, ...fadeUp() }}>
            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: KIND[kind].color }} />
            {inRetryPhase ? `${c.review} · ${kindLabel}` : kindLabel}
            <Box component="span" sx={{ ml: 'auto', color: cv.faint, fontVariantNumeric: 'tabular-nums' }}>{index + 1}/{exercises.length}</Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: 2, ...fadeUp(0.05) }}>
            <Box sx={{ flexShrink: 0, mt: '-4px', animation: answered ? (outcome === 'right' ? 'lsHop .5s ease' : 'lsShake .45s ease') : 'none',
              '@keyframes lsHop': { '40%': { transform: 'translateY(-8px)' } },
              '@keyframes lsShake': { '20%, 60%': { transform: 'translateX(-4px)' }, '40%, 80%': { transform: 'translateX(4px)' } } }}>
              <Mascot size={58} outfit={currentOutfit} mood={answered ? (outcome === 'right' ? 'happy' : 'sad') : 'idle'} />
            </Box>
            <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 21, sm: 25 }, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3, pt: 0.5 }}>
              {exercise.question}
            </Typography>
          </Box>

          {/* Hint, only when asked for */}
          {exercise.hint && !answered && (
            <Box sx={{ mt: 1.5, ml: { xs: 0, sm: '74px' }, ...fadeUp(0.1) }}>
              {showHint ? (
                <Box sx={{ display: 'inline-flex', gap: 1, alignItems: 'flex-start', p: '10px 14px', borderRadius: '14px', bgcolor: 'rgba(255,219,124,.08)', color: '#f3e3b5', fontSize: 14, animation: 'lsUp .25s ease both' }}>
                  <LightbulbOutlined sx={{ fontSize: 17, color: cv.butter, mt: '1px' }} />{exercise.hint}
                </Box>
              ) : (
                <Box component="button" onClick={() => { setShowHint(true); soundManager.playClick() }} sx={{ ...pillGhost }}>
                  <LightbulbOutlined sx={{ fontSize: 16 }} />{c.hint}
                </Box>
              )}
            </Box>
          )}

          {/* Something to look at with every question */}
          {kind !== 'speaking' && (
            <Box sx={{ mt: 3, ...fadeUp(0.1) }}>
              <QuestionVisual visual={exercise.visual} subject={currentSubject}
                topic={lessonId === 99999 ? 'Treino de revisão' : getCachedPlan(currentSubject || '', userProfile?.schoolYear, userProfile?.course)?.[(lessonId % 100) - 1]?.title} />
            </Box>
          )}

          {/* Listening player */}
          {kind === 'listening' && (
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, p: '12px 16px 12px 12px', borderRadius: '20px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, ...fadeUp(0.12) }}>
              <Box component="button" onClick={handlePlayAudio} aria-label={c.play} sx={{ width: 52, height: 52, flexShrink: 0, border: 0, borderRadius: '50%', background: cv.send, color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'transform .15s', '&:active': { transform: 'scale(.94)' } }}>
                <VolumeUp />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '3px', height: 32 }} aria-hidden>
                {Array.from({ length: 28 }).map((_, i) => (
                  <Box key={i} sx={{ flex: 1, borderRadius: 999, bgcolor: isPlayingAudio ? cv.accent : '#3a3a3a', height: `${30 + Math.abs(Math.sin(i * 1.7)) * 70}%`, transition: 'background-color .2s',
                    animation: isPlayingAudio ? `lsWave .9s ease-in-out ${(i % 7) * 0.08}s infinite` : 'none',
                    '@keyframes lsWave': { '0%, 100%': { transform: 'scaleY(.45)' }, '50%': { transform: 'scaleY(1)' } } }} />
                ))}
              </Box>
              <Typography sx={{ fontSize: 13, color: cv.muted, minWidth: 64, textAlign: 'right' }}>{isPlayingAudio ? c.playing : c.play}</Typography>
            </Box>
          )}

          {/* Options */}
          {hasOptions && (
            <Box sx={{ mt: 3, display: 'grid', gap: 1 }}>
              {options.map((option, i) => {
                const picked = selectedOption === option
                const isAnswer = option.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase()
                const state = answered ? (isAnswer ? 'right' : picked ? 'wrong' : 'dim') : picked ? 'picked' : 'idle'
                const ring = { right: cv.green, wrong: cv.coral, picked: '#fff', idle: cv.border, dim: cv.border }[state]
                return (
                  <Box key={option + i} component="button" disabled={answered} onClick={() => { setSelectedOption(option); soundManager.playClick() }}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', minHeight: 54, p: '10px 14px 10px 10px', border: 0, borderRadius: '16px', textAlign: 'left',
                      font: 'inherit', fontSize: 15, color: cv.text, cursor: answered ? 'default' : 'pointer',
                      bgcolor: state === 'right' ? 'rgba(125,219,168,.1)' : state === 'wrong' ? 'rgba(255,159,136,.1)' : picked ? cv.surface : 'transparent',
                      boxShadow: `inset 0 0 0 ${state === 'idle' || state === 'dim' ? 1 : 2}px ${ring}`,
                      opacity: state === 'dim' ? 0.45 : 1,
                      transition: 'background-color .15s, box-shadow .15s, opacity .25s, transform .15s',
                      '&:hover:not(:disabled)': { bgcolor: picked ? cv.surface : 'rgba(255,255,255,.03)' },
                      '&:active:not(:disabled)': { transform: 'scale(.99)' },
                      ...fadeUp(0.12 + i * 0.05),
                      ...(state === 'wrong' && { animation: 'lsShake .4s ease' }),
                    }}>
                    <Box component="span" sx={{ width: 30, height: 30, flexShrink: 0, borderRadius: '9px', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600,
                      bgcolor: state === 'right' ? cv.green : state === 'wrong' ? cv.coral : picked ? '#fff' : cv.surface, color: state === 'idle' || state === 'dim' ? cv.muted : '#0d0d0d', transition: 'background-color .15s, color .15s' }}>
                      {state === 'right' ? <Check sx={{ fontSize: 17 }} /> : state === 'wrong' ? <Close sx={{ fontSize: 17 }} /> : String.fromCharCode(65 + i)}
                    </Box>
                    {option}
                  </Box>
                )
              })}
            </Box>
          )}

          {/* Typing */}
          {(kind === 'typing' || (kind === 'listening' && !hasOptions)) && (
            <Box sx={{ mt: 3, ...fadeUp(0.12) }}>
              <Box component="input" ref={typingRef} value={userAnswer} disabled={answered} placeholder={c.typeHere} autoComplete="off" spellCheck={false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserAnswer(e.target.value)}
                sx={{ width: '100%', boxSizing: 'border-box', height: 60, px: 2.25, borderRadius: '16px', border: 0, outline: 'none', font: 'inherit', fontSize: 18, color: cv.text, bgcolor: cv.paper,
                  boxShadow: `inset 0 0 0 ${answered ? 2 : 1}px ${answered ? tone : cv.borderStrong}`, transition: 'box-shadow .15s',
                  '&:focus': { boxShadow: `inset 0 0 0 2px ${answered ? tone : 'rgba(255,255,255,.5)'}` }, '&::placeholder': { color: cv.faint } }} />
            </Box>
          )}

          {/* Speaking */}
          {kind === 'speaking' && (
            <Box sx={{ mt: 3, display: 'grid', justifyItems: 'center', gap: 2, ...fadeUp(0.12) }}>
              {exercise.audioText && (
                <Box sx={{ width: '100%', boxSizing: 'border-box', p: '16px 18px', borderRadius: '16px', boxShadow: `inset 0 0 0 1px ${cv.border}`, fontSize: 18, fontWeight: 500, textAlign: 'center' }}>
                  “{exercise.audioText}”
                </Box>
              )}
              <Box component="button" onClick={toggleListening} disabled={answered} aria-label={c.tapMic}
                sx={{ position: 'relative', width: 76, height: 76, border: 0, borderRadius: '50%', cursor: 'pointer', display: 'grid', placeItems: 'center', color: isListening ? '#0d0d0d' : '#fff', bgcolor: isListening ? '#fff' : cv.accentStrong,
                  '&::before': isListening ? { content: '""', position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(255,255,255,.4)', animation: 'lsRing 1.4s ease-out infinite' } : {},
                  '@keyframes lsRing': { from: { transform: 'scale(.9)', opacity: 1 }, to: { transform: 'scale(1.35)', opacity: 0 } } }}>
                {isListening ? <StopRounded sx={{ fontSize: 30 }} /> : <MicNoneRounded sx={{ fontSize: 30 }} />}
              </Box>
              <Typography sx={{ fontSize: 14, color: userAnswer ? cv.text : cv.muted, minHeight: 22, textAlign: 'center' }}>
                {userAnswer || (isListening ? c.listening : c.tapMic)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Bottom sheet: check → result */}
        <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10 }}>
          {answered && (
            <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, pb: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
              {/* Result card: Mivvi reacts, the answer, a short explanation, one button */}
              <Box sx={{ position: 'relative', overflow: 'hidden', p: 2.25, borderRadius: '24px', bgcolor: '#1f1f1f',
                boxShadow: `inset 0 0 0 1px ${outcome === 'right' ? 'rgba(125,219,168,.28)' : 'rgba(255,159,136,.28)'}, 0 20px 50px rgba(0,0,0,.55)`,
                animation: 'lsCard .4s cubic-bezier(.22,1,.36,1) both', '@keyframes lsCard': { from: { opacity: 0, transform: 'translateY(24px) scale(.98)' } } }}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Mascot size={44} mood={outcome === 'right' ? 'happy' : 'sad'} outfit={currentOutfit} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: cv.display, fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: tone, lineHeight: 1.2 }}>
                      {aiFeedback?.feedback && aiFeedback.feedback.length < 28 ? aiFeedback.feedback : outcome === 'right' ? c.right : c.wrong}
                    </Typography>
                    {aiFeedback?.encouragement && outcome === 'right' && (
                      <Typography sx={{ fontSize: 13, color: cv.muted, animation: 'lsUp .3s ease both' }}>{aiFeedback.encouragement}</Typography>
                    )}
                  </Box>
                  <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: tone, color: '#0d0d0d', display: 'grid', placeItems: 'center', flexShrink: 0, animation: 'lsPop .4s cubic-bezier(.34,1.56,.64,1)' }}>
                    {outcome === 'right' ? <Check sx={{ fontSize: 18 }} /> : <Close sx={{ fontSize: 18 }} />}
                  </Box>
                </Box>

                {outcome === 'wrong' && (
                  <Box sx={{ position: 'relative', mt: 1.75, display: 'flex', alignItems: 'center', gap: 1, p: '10px 12px', borderRadius: '14px', bgcolor: 'rgba(125,219,168,.08)' }}>
                    <Check sx={{ fontSize: 17, color: cv.green }} />
                    <Typography sx={{ fontSize: 14 }}><Box component="span" sx={{ color: cv.muted }}>{c.answer}: </Box><strong>{exercise.correctAnswer}</strong></Typography>
                  </Box>
                )}

                <Box sx={{ position: 'relative', mt: 1.5, minHeight: 21 }}>
                  {aiFeedback ? (
                    <Typography sx={{ fontSize: 14.5, color: '#d4d4d8', lineHeight: 1.55, animation: 'lsUp .3s ease both' }}>{aiFeedback.explanation}</Typography>
                  ) : (
                    <Typography sx={{ fontSize: 13.5, color: 'transparent', backgroundImage: 'linear-gradient(90deg, #8e8e93 0%, #8e8e93 40%, #f2f2f7 50%, #8e8e93 60%, #8e8e93 100%)', backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', animation: 'lsShimmer 2.2s linear infinite', '@keyframes lsShimmer': { from: { backgroundPosition: '100% 0' }, to: { backgroundPosition: '0% 0' } } }}>
                      {c.thinking}
                    </Typography>
                  )}
                </Box>

                <Box component="button" onClick={handleNext} sx={{ ...pillPrimary, position: 'relative', width: '100%', height: 48, mt: 2, '&:focus-visible': { outline: '2px solid rgba(255,255,255,.5)', outlineOffset: 2 } }}>
                  {isLast ? c.finish : c.next}<ArrowForward sx={{ fontSize: 18 }} />
                </Box>
              </Box>
            </Box>
          )}
          {!answered && (
            <Box sx={{ bgcolor: cv.bg, borderTop: `1px solid ${cv.border}` }}>
              <Box sx={{ maxWidth: 640, mx: 'auto', px: 2.5, pt: 2, pb: 'calc(16px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ flex: 1, fontSize: 12.5, color: cv.faint, display: { xs: 'none', sm: 'block' } }}>{hasOptions ? c.keys : ''}</Typography>
                <Box component="button" onClick={handleSubmit} disabled={!answer.trim()} sx={{ ...pillPrimary, height: 48, minWidth: { xs: '100%', sm: 180 } }}>{c.check}</Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </>
  )
}

const pillBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: 42, px: 2.75, border: 0, borderRadius: 999,
  font: 'inherit', fontSize: 14.5, fontWeight: 500, cursor: 'pointer', transition: 'background-color .15s, opacity .15s, transform .15s',
  '&:active:not(:disabled)': { transform: 'scale(.98)' },
} as const
const pillPrimary = { ...pillBase, bgcolor: '#fff', color: '#0d0d0d', '&:hover:not(:disabled)': { bgcolor: '#e6e6e6' }, '&:disabled': { bgcolor: cv.surface, color: cv.faint, cursor: 'default' } }
const pillSecondary = { ...pillBase, bgcolor: 'transparent', color: cv.text, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, '&:hover': { bgcolor: cv.surface } }
const pillGhost = { ...pillBase, height: 32, px: 1.5, fontSize: 13.5, bgcolor: 'transparent', color: cv.muted, boxShadow: `inset 0 0 0 1px ${cv.border}`, '&:hover': { color: cv.text, bgcolor: 'rgba(255,255,255,.03)' } }
