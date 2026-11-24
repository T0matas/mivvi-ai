import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Typography, IconButton, CircularProgress, useMediaQuery } from '@mui/material'
import { Close, Check, VolumeUp, Replay, ArrowForward, AutoStoriesOutlined } from '@mui/icons-material'

import { Exercise, AIResponse, UserProfile, LessonTheory } from '../types'
import { generateTheory, generateLessonExercises, getAIFeedback, checkTypedAnswer, normalizeAnswer, LessonRequest } from '../services/aiService'
import Mascot from './Mascot'
import { soundManager } from '../utils/soundEffects'
import ExitConfirmDialog from './ExitConfirmDialog'
import LessonRewards from './LessonRewards'
import LessonTheoryView, { rich } from './LessonTheoryView'
import { playListeningAudio } from '../services/audioService'
import { cv } from '../theme'
import QuestionVisual from './QuestionVisual'
import { getCachedPlan } from '../services/lessonPlan'
import { readLibrary, saveToLibrary } from '../services/library'
import { subjectName } from '../data/ptCurriculum'
import LessonAIPanel, { PANEL_WIDTH } from './LessonAIPanel'

// A lesson is a class + exercises. First the "aula": Mivvi explains the topic
// like a teacher (LessonTheoryView) while the exercises are written in the
// background from that explanation. Then 10 questions, one at a time, with
// Mivvi beside them for a hint, and a result card after each answer. Typed
// answers that mean the same as the expected one count as right.

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
type Phase = 'loading' | 'theory' | 'review' | 'quiz'

const KIND = {
  'multiple-choice': { color: '#9fc9ff', label: 'Escolhe a resposta' },
  listening: { color: cv.mint, label: 'Ouve e responde' },
  typing: { color: cv.butter, label: 'Escreve a resposta' },
} as const

const fadeUp = (delay = 0) => ({
  animation: `lsUp .32s cubic-bezier(.22,1,.36,1) ${delay}s both`,
  '@keyframes lsUp': { from: { opacity: 0, transform: 'translateY(8px)' } },
})

const shimmer = {
  color: 'transparent', backgroundImage: 'linear-gradient(90deg, #8e8e93 0%, #8e8e93 40%, #f2f2f7 50%, #8e8e93 60%, #8e8e93 100%)', backgroundSize: '300% 100%',
  WebkitBackgroundClip: 'text', backgroundClip: 'text', animation: 'lsShimmer 2.2s linear infinite',
  '@keyframes lsShimmer': { from: { backgroundPosition: '100% 0' }, to: { backgroundPosition: '0% 0' } },
}

export default function Lesson({ lessonId, onComplete, onMistake, onBack, userProfile, currentOutfit = 'default', isTutorial, isReplay }: LessonProps) {
  const [params] = useSearchParams()
  const subject = params.get('s') || localStorage.getItem('mivvi_selectedSubject') || userProfile?.selectedSubjects?.[0] || 'matematica'
  const lang = userProfile?.language || 'pt-PT'
  const isPractice = lessonId === 99999
  const lessonNumber = isPractice ? undefined : lessonId % 100
  const planTopic = lessonNumber ? getCachedPlan(subject, userProfile?.schoolYear, userProfile?.course)?.[lessonNumber - 1]?.title : undefined
  const request: LessonRequest = { lessonId, subject, schoolYear: userProfile?.schoolYear || '1ano', language: lang, course: userProfile?.course, difficulty: userProfile?.difficulty || 'medium' }

  const [phase, setPhase] = useState<Phase>('loading')
  const [theory, setTheory] = useState<LessonTheory | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exState, setExState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle')
  const [loadStep, setLoadStep] = useState(0)

  const [index, setIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [checking, setChecking] = useState(false)
  const [acceptedSimilar, setAcceptedSimilar] = useState(false)
  const [aiFeedback, setAiFeedback] = useState<AIResponse | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [results, setResults] = useState<(Outcome | null)[]>([])
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [retryQueue, setRetryQueue] = useState<Exercise[]>([])
  const [inRetryPhase, setInRetryPhase] = useState(false)
  const [showRetryInterstitial, setShowRetryInterstitial] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [rewardsData, setRewardsData] = useState({ xp: 0, correct: 0, total: 0, gems: 0 })
  const typingRef = useRef<HTMLInputElement>(null)
  const alive = useRef(true)

  // The Mivvi AI panel beside the lesson (a sheet on smaller screens).
  const narrow = useMediaQuery('(max-width: 999px)')
  // Keep Mivvi open throughout the lesson, including when exercises begin.
  const [aiOpen, setAiOpen] = useState(true)
  const inset = !narrow && aiOpen ? PANEL_WIDTH + 20 : 0

  const exercise = exercises[index]
  const kind: keyof typeof KIND = exercise
    ? (exercise.exerciseType === 'listening' && exercise.options.length ? 'listening' : exercise.type === 'typing' || !exercise.options?.length ? 'typing' : 'multiple-choice')
    : 'multiple-choice'
  const answered = outcome !== null
  const options = exercise?.options || []
  const hasOptions = options.length > 0 && kind !== 'typing'
  const answer = hasOptions ? selectedOption : userAnswer

  // ── Loading: the class first, then the exercises built from it ──────────────
  const loadExercises = useCallback(async (from: LessonTheory | null) => {
    setExState('loading')
    try {
      const list = await generateLessonExercises(request, from)
      if (!alive.current) return
      setExercises(list)
      setResults(list.map(() => null))
      setExState('ready')
    } catch {
      if (alive.current) setExState('failed')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, subject])

  useEffect(() => {
    alive.current = true
    const timer = setInterval(() => setLoadStep((s) => Math.min(s + 1, 2)), 1600)
    ;(async () => {
      // A lesson done before already has its class in the Library.
      const saved = readLibrary().find((i) => i.lessonId === lessonId && i.subject === subject)?.theory
      const t = isPractice ? null : saved || await generateTheory(request)
      if (!alive.current) return
      clearInterval(timer)
      setTheory(t)
      if (t) setPhase('theory')
      else setPhase('quiz')
      loadExercises(t)
    })()
    return () => { alive.current = false; clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, subject])

  // ── Actions ─────────────────────────────────────────────────────────────────
  const resetExerciseState = () => {
    setUserAnswer('')
    setSelectedOption('')
    setOutcome(null)
    setAiFeedback(null)
    setShowHint(false)
    setAcceptedSimilar(false)
  }

  const handleSubmit = useCallback(async () => {
    if (!exercise || answered || checking || !answer.trim()) return
    let correct: boolean
    let exact = true
    if (hasOptions) {
      correct = normalizeAnswer(answer) === normalizeAnswer(exercise.correctAnswer)
    } else {
      setChecking(true)
      const r = await checkTypedAnswer(answer, exercise)
      setChecking(false)
      correct = r.correct
      exact = r.exact
    }
    const result: Outcome = correct ? 'right' : 'wrong'
    setOutcome(result)
    setAcceptedSimilar(correct && !exact)
    setResults((prev) => prev.map((r, i) => (i === index ? result : r)))

    if (correct) {
      setScore((p) => ({ correct: p.correct + 1, total: p.total + 1 }))
      soundManager.playSuccess()
    } else {
      setScore((p) => ({ ...p, total: p.total + 1 }))
      soundManager.playError()
      onMistake?.()
      setRetryQueue((prev) => [...prev, exercise])
    }
    setAiFeedback(await getAIFeedback(exercise, correct, lang, answer, subject))
  }, [exercise, answered, checking, answer, hasOptions, index, lang, onMistake, subject])

  const handleFinishLesson = () => {
    const right = score.correct
    let xp = isPractice ? 20 + right * 3 : 20 + right * 6 + (right === score.total ? 20 : 0)
    if (isReplay) xp = Math.round(xp / 4)
    if (score.correct >= score.total * 0.6) soundManager.playLevelUp()
    if (theory && !isPractice) {
      saveToLibrary({ id: `${subject}_${lessonId}`, subject, lessonId, lessonNumber, title: theory.title, theory, correct: score.correct, total: score.total, date: Date.now() })
    }
    setRewardsData({ xp, correct: score.correct, total: score.total, gems: 0 })
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
  }, [index, exercises.length, retryQueue.length, score, theory])

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
    onComplete(rewardsData.xp, rewardsData.correct, rewardsData.total, rewardsData.gems, subject)
  }

  const handlePlayAudio = async () => {
    if (!exercise || isPlayingAudio) return
    await playListeningAudio(exercise.audioText || exercise.question, lang, () => setIsPlayingAudio(true), () => setIsPlayingAudio(false))
  }

  // Keyboard: 1–4 pick an option, Enter checks or continues.
  useEffect(() => {
    if (phase !== 'quiz' || showRewards || showRetryInterstitial || showExitDialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (answered) handleNext()
        else handleSubmit()
        return
      }
      if (!answered && hasOptions && document.activeElement?.tagName !== 'INPUT') {
        const n = Number(e.key)
        if (n >= 1 && n <= options.length) { setSelectedOption(options[n - 1]); soundManager.playSelect() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, showRewards, showRetryInterstitial, showExitDialog, answered, hasOptions, options, handleNext, handleSubmit])

  useEffect(() => { if (phase === 'quiz' && kind === 'typing' && !answered) typingRef.current?.focus() }, [phase, index, kind, answered])

  // ── Screens ─────────────────────────────────────────────────────────────────
  const inQuiz = phase === 'quiz' && !!exercise && !showRetryInterstitial
  const panel = (
    <LessonAIPanel open={aiOpen} onClose={() => setAiOpen(false)} mobile={narrow}
      answered={inQuiz ? answered : undefined}
      contextLabel={inQuiz ? `Pergunta ${index + 1}` : 'Aula'}
      contextText={inQuiz ? exercise.question : theory?.title || planTopic}
      context={{
        language: lang, name: userProfile?.name, schoolYear: userProfile?.schoolYear, subject,
        lesson: {
          topic: theory?.title || planTopic,
          summary: theory ? [theory.intro, ...theory.keyPoints].join(' ') : undefined,
          question: inQuiz ? exercise.question : undefined,
          options: inQuiz && hasOptions ? options : undefined,
          answered: inQuiz ? answered : undefined,
          correctAnswer: inQuiz && answered ? exercise.correctAnswer : undefined,
        },
      }} />
  )
  const aiButton = !aiOpen && (
    <Box component="button" onClick={() => { soundManager.playClick(); setAiOpen(true) }} aria-label="Pergunta ao Mivvi"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 32, px: 1.25, border: 0, borderRadius: 999, bgcolor: cv.accentSoft, color: '#cfe3ff', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', '&:hover': { bgcolor: 'rgba(96,165,250,.26)' } }}>
      <Box component="img" src="/mivvi-logo.svg" alt="" sx={{ width: 20, height: 20, borderRadius: '6px' }} />{narrow ? 'Mivvi' : 'Pergunta ao Mivvi'}
    </Box>
  )

  const page = { minHeight: '100dvh', bgcolor: cv.bg, color: cv.text, textAlign: 'left' as const, fontFamily: cv.font }

  if (phase === 'loading' || (phase === 'quiz' && exState === 'loading')) {
    const steps = isPractice || phase === 'quiz' ? ['A escolher os temas', 'A escrever as perguntas', 'A rever as respostas'] : ['A abrir o programa do teu ano', 'A preparar a explicação', 'A escolher exemplos']
    return (
      <Box sx={{ ...page, display: 'grid', placeItems: 'center', px: 3 }}>
        <Box sx={{ width: '100%', maxWidth: 440, display: 'grid', justifyItems: 'center', textAlign: 'center', ...fadeUp() }}>
          <Mascot size={80} mood="thinking" outfit={currentOutfit} />
          <Typography sx={{ fontSize: 13, color: cv.muted, mt: 2.5 }}>{subjectName(subject)}{lessonNumber ? ` · Lição ${lessonNumber}` : ''}</Typography>
          <Typography sx={{ fontFamily: cv.display, fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', mt: 0.5 }}>{planTopic || (isPractice ? 'Treino de revisão' : 'A preparar a tua aula')}</Typography>
          <Box component="ol" sx={{ listStyle: 'none', p: 0, m: '16px 0 0', display: 'grid', gap: 0.75, justifyItems: 'center' }}>
            {steps.map((s, i) => (
              <Box component="li" key={s} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 13.5, color: i < loadStep ? cv.muted : cv.faint, ...(i === loadStep && shimmer) }}>
                {i < loadStep && <Check sx={{ fontSize: 15, color: cv.green }} />}{s}
              </Box>
            ))}
          </Box>
          <Box component="button" onClick={() => onBack()} sx={{ ...pillGhost, mt: 4 }}>Cancelar</Box>
        </Box>
      </Box>
    )
  }

  if (phase === 'theory' && theory) {
    return (
      <>
        <ExitConfirmDialog open={showExitDialog} language={lang} onConfirm={() => { setShowExitDialog(false); onBack(isTutorial) }} onCancel={() => setShowExitDialog(false)} outfit={currentOutfit} isTutorial={isTutorial} />
        <LessonTheoryView theory={theory} subject={subject} lessonNumber={lessonNumber} ready={exState === 'ready'} failed={exState === 'failed'}
          onRetry={() => loadExercises(theory)} onStart={() => setPhase('quiz')} onClose={() => setShowExitDialog(true)} rightInset={inset} extra={aiButton} />
        {panel}
      </>
    )
  }

  if (phase === 'review' && theory) {
    return (
      <>
        <LessonTheoryView mode="review" theory={theory} subject={subject} lessonNumber={lessonNumber} onStart={() => setPhase('quiz')} onClose={() => setPhase('quiz')} rightInset={inset} extra={aiButton} />
        {panel}
      </>
    )
  }

  if (exercises.length === 0) {
    return (
      <Box sx={{ ...page, display: 'grid', placeItems: 'center', px: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1, maxWidth: 380, ...fadeUp() }}>
          <Mascot size={80} mood="sad" outfit={currentOutfit} />
          <Typography sx={{ fontFamily: cv.display, fontSize: 21, fontWeight: 700, mt: 1.5 }}>Não consegui preparar esta lição</Typography>
          <Typography sx={{ color: cv.muted, fontSize: 14.5 }}>O Mivvi está com muitos pedidos agora. Tenta outra vez daqui a pouco.</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Box component="button" onClick={() => loadExercises(theory)} sx={pillPrimary}>Tentar outra vez</Box>
            <Box component="button" onClick={() => onBack()} sx={pillSecondary}>Voltar</Box>
          </Box>
        </Box>
      </Box>
    )
  }

  if (showRetryInterstitial) {
    return (
      <Box sx={{ ...page, display: 'grid', placeItems: 'center', px: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'grid', justifyItems: 'center', maxWidth: 400 }}>
          <Box sx={fadeUp()}><Mascot size={92} mood="thinking" outfit={currentOutfit} /></Box>
          <Typography sx={{ fontFamily: cv.display, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', mt: 2.25, ...fadeUp(0.06) }}>Vamos rever o que falhou</Typography>
          <Typography sx={{ color: cv.muted, mt: 1, fontSize: 14.5, ...fadeUp(0.1) }}>{retryQueue.length} {retryQueue.length === 1 ? 'pergunta volta' : 'perguntas voltam'} agora, para as acertares de vez.</Typography>
          <Box component="button" onClick={startRetryPhase} sx={{ ...pillPrimary, mt: 3, ...fadeUp(0.14) }}><Replay sx={{ fontSize: 18 }} />Rever agora</Box>
        </Box>
      </Box>
    )
  }

  const tone = outcome === 'right' ? cv.green : cv.coral
  const isLast = index === exercises.length - 1 && retryQueue.length === 0

  return (
    <>
      <ExitConfirmDialog open={showExitDialog} language={lang} onConfirm={() => { setShowExitDialog(false); onBack(isTutorial) }} onCancel={() => setShowExitDialog(false)} outfit={currentOutfit} isTutorial={isTutorial} />
      <LessonRewards open={showRewards} xpGained={rewardsData.xp} correctAnswers={rewardsData.correct} totalQuestions={rewardsData.total} gemsEarned={rewardsData.gems} onClose={handleRewardsClose} language={lang} outfit={currentOutfit} />

      {panel}
      <Box sx={{ ...page, display: 'flex', flexDirection: 'column', pb: '200px', pr: `${inset}px`, transition: 'padding-right .3s cubic-bezier(.22,1,.36,1)' }}>
        {/* Top: close, segmented progress, back to the class */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 5, bgcolor: cv.bg, pt: 'env(safe-area-inset-top, 0px)' }}>
          <Box sx={{ maxWidth: 640, mx: 'auto', display: 'flex', alignItems: 'center', gap: 1, px: 1.5, height: 52 }}>
            <IconButton onClick={() => setShowExitDialog(true)} aria-label="Sair" sx={{ width: 34, height: 34 }}><Close sx={{ fontSize: 19 }} /></IconButton>
            <Box sx={{ flex: 1, display: 'flex', gap: '3px' }} role="progressbar" aria-valuemin={0} aria-valuemax={exercises.length} aria-valuenow={index + 1}>
              {exercises.map((_, i) => (
                <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 999, bgcolor: results[i] === 'right' ? cv.green : results[i] === 'wrong' ? cv.coral : i === index ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.08)', transition: 'background-color .3s' }} />
              ))}
            </Box>
            {theory && (
              <IconButton onClick={() => { soundManager.playPage(); setPhase('review') }} aria-label="Rever a aula" title="Rever a aula" sx={{ width: 34, height: 34 }}><AutoStoriesOutlined sx={{ fontSize: 18 }} /></IconButton>
            )}
            {aiButton}
          </Box>
        </Box>

        {/* Question */}
        <Box key={`${inRetryPhase}-${index}`} component="main" sx={{ width: '100%', maxWidth: 600, mx: 'auto', px: 2, pt: { xs: 1.5, sm: 3.5 }, boxSizing: 'border-box' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 12.5, fontWeight: 500, color: cv.muted, ...fadeUp() }}>
            <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: KIND[kind].color }} />
            {inRetryPhase ? `Correção · ${KIND[kind].label}` : KIND[kind].label}
            <Box component="span" sx={{ ml: 'auto', color: cv.faint, fontVariantNumeric: 'tabular-nums' }}>{index + 1}/{exercises.length}</Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mt: 1.5, ...fadeUp(0.04) }}>
            <Box sx={{ flexShrink: 0, mt: '-2px', animation: answered ? (outcome === 'right' ? 'lsHop .5s ease' : 'lsShake .45s ease') : 'none',
              '@keyframes lsHop': { '40%': { transform: 'translateY(-6px)' } },
              '@keyframes lsShake': { '20%, 60%': { transform: 'translateX(-3px)' }, '40%, 80%': { transform: 'translateX(3px)' } } }}>
              <Mascot size={38} outfit={currentOutfit} mood={answered ? (outcome === 'right' ? 'happy' : 'sad') : checking ? 'thinking' : 'idle'} />
            </Box>
            <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 17.5, sm: 20 }, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.35, pt: 0.25 }}>
              {exercise.question}
            </Typography>
          </Box>

          {/* Mivvi's hint, like a teacher leaning over */}
          {exercise.hint && !answered && (
            <Box sx={{ mt: 1.5, ...fadeUp(0.08) }}>
              {showHint ? (
                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', p: '10px 12px', borderRadius: '14px', bgcolor: 'rgba(96,165,250,.07)', boxShadow: 'inset 0 0 0 1px rgba(96,165,250,.18)', animation: 'lsUp .25s ease both' }}>
                  <Mascot size={26} mood="thinking" animated={false} />
                  <Box>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: cv.accent }}>Pensa um pouco</Typography>
                    <Typography sx={{ fontSize: 14, lineHeight: 1.45, mt: 0.25 }}>{rich(exercise.hint)}</Typography>
                  </Box>
                </Box>
              ) : (
                <Box component="button" onClick={() => { setShowHint(true); soundManager.playClick() }} sx={pillGhost}>
                  Pedir ajuda ao Mivvi
                </Box>
              )}
            </Box>
          )}

          {exercise.visual && (
            <Box sx={{ mt: 2, ...fadeUp(0.08) }}>
              <QuestionVisual visual={exercise.visual} subject={subject} />
            </Box>
          )}

          {/* Listening player */}
          {kind === 'listening' && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5, p: '8px 12px 8px 8px', borderRadius: '16px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, ...fadeUp(0.1) }}>
              <Box component="button" onClick={handlePlayAudio} aria-label="Ouvir" sx={{ width: 42, height: 42, flexShrink: 0, border: 0, borderRadius: '50%', background: cv.send, color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', '&:active': { transform: 'scale(.94)' } }}>
                <VolumeUp sx={{ fontSize: 21 }} />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '3px', height: 26 }} aria-hidden>
                {Array.from({ length: 26 }).map((_, i) => (
                  <Box key={i} sx={{ flex: 1, borderRadius: 999, bgcolor: isPlayingAudio ? cv.accent : '#3a3a3a', height: `${30 + Math.abs(Math.sin(i * 1.7)) * 70}%`,
                    animation: isPlayingAudio ? `lsWave .9s ease-in-out ${(i % 7) * 0.08}s infinite` : 'none',
                    '@keyframes lsWave': { '0%, 100%': { transform: 'scaleY(.45)' }, '50%': { transform: 'scaleY(1)' } } }} />
                ))}
              </Box>
              <Typography sx={{ fontSize: 12.5, color: cv.muted, minWidth: 56, textAlign: 'right' }}>{isPlayingAudio ? 'A tocar…' : 'Ouvir'}</Typography>
            </Box>
          )}

          {/* Options */}
          {hasOptions && (
            <Box sx={{ mt: 2, display: 'grid', gap: 0.75 }}>
              {options.map((option, i) => {
                const picked = selectedOption === option
                const isAnswer = normalizeAnswer(option) === normalizeAnswer(exercise.correctAnswer)
                const state = answered ? (isAnswer ? 'right' : picked ? 'wrong' : 'dim') : picked ? 'picked' : 'idle'
                const ring = { right: cv.green, wrong: cv.coral, picked: '#fff', idle: cv.border, dim: cv.border }[state]
                return (
                  <Box key={option + i} component="button" disabled={answered} onClick={() => { setSelectedOption(option); soundManager.playSelect() }}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', minHeight: 46, p: '7px 12px 7px 8px', border: 0, borderRadius: '14px', textAlign: 'left',
                      font: 'inherit', fontSize: 14.5, lineHeight: 1.35, color: cv.text, cursor: answered ? 'default' : 'pointer',
                      bgcolor: state === 'right' ? 'rgba(125,219,168,.1)' : state === 'wrong' ? 'rgba(255,159,136,.1)' : picked ? cv.surface : 'transparent',
                      boxShadow: `inset 0 0 0 ${state === 'idle' || state === 'dim' ? 1 : 1.5}px ${ring}`,
                      opacity: state === 'dim' ? 0.45 : 1,
                      transition: 'background-color .15s, box-shadow .15s, opacity .25s, transform .15s',
                      '&:hover:not(:disabled)': { bgcolor: picked ? cv.surface : 'rgba(255,255,255,.03)' },
                      '&:active:not(:disabled)': { transform: 'scale(.99)' },
                      ...fadeUp(0.1 + i * 0.04),
                    }}>
                    <Box component="span" sx={{ width: 26, height: 26, flexShrink: 0, borderRadius: '8px', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600,
                      bgcolor: state === 'right' ? cv.green : state === 'wrong' ? cv.coral : picked ? '#fff' : cv.surface, color: state === 'idle' || state === 'dim' ? cv.muted : '#0d0d0d' }}>
                      {state === 'right' ? <Check sx={{ fontSize: 16 }} /> : state === 'wrong' ? <Close sx={{ fontSize: 16 }} /> : String.fromCharCode(65 + i)}
                    </Box>
                    {option}
                  </Box>
                )
              })}
            </Box>
          )}

          {/* Typing */}
          {kind === 'typing' && (
            <Box sx={{ mt: 2, ...fadeUp(0.1) }}>
              <Box component="input" ref={typingRef} value={userAnswer} disabled={answered || checking} placeholder="Escreve aqui…" autoComplete="off" spellCheck={false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserAnswer(e.target.value)}
                sx={{ width: '100%', boxSizing: 'border-box', height: 50, px: 2, borderRadius: '14px', border: 0, outline: 'none', font: 'inherit', fontSize: 16, color: cv.text, bgcolor: cv.paper,
                  boxShadow: `inset 0 0 0 ${answered ? 1.5 : 1}px ${answered ? tone : cv.borderStrong}`, transition: 'box-shadow .15s',
                  '&:focus': { boxShadow: `inset 0 0 0 1.5px ${answered ? tone : 'rgba(255,255,255,.5)'}` }, '&::placeholder': { color: cv.faint } }} />
              {!answered && <Typography sx={{ fontSize: 12, color: cv.faint, mt: 0.75 }}>Não precisas de escrever igual: respostas com o mesmo sentido também contam.</Typography>}
            </Box>
          )}
        </Box>

        {/* Bottom sheet: check → result */}
        <Box sx={{ position: 'fixed', left: 0, right: `${inset}px`, bottom: 0, zIndex: 10, transition: 'right .3s cubic-bezier(.22,1,.36,1)' }}>
          {answered ? (
            <Box sx={{ maxWidth: 600, mx: 'auto', px: 1.5, pb: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
              <Box sx={{ p: 1.75, borderRadius: '20px', bgcolor: '#1f1f1f',
                boxShadow: `inset 0 0 0 1px ${outcome === 'right' ? 'rgba(125,219,168,.28)' : 'rgba(255,159,136,.28)'}, 0 16px 40px rgba(0,0,0,.55)`,
                animation: 'lsCard .35s cubic-bezier(.22,1,.36,1) both', '@keyframes lsCard': { from: { opacity: 0, transform: 'translateY(20px)' } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Mascot size={34} mood={outcome === 'right' ? 'happy' : 'sad'} outfit={currentOutfit} animated={false} />
                  <Typography sx={{ flex: 1, fontFamily: cv.display, fontSize: 17, fontWeight: 700, color: tone }}>
                    {aiFeedback?.feedback && aiFeedback.feedback.length < 28 ? aiFeedback.feedback : outcome === 'right' ? 'Muito bem!' : 'Ainda não'}
                  </Typography>
                  <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: tone, color: '#0d0d0d', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {outcome === 'right' ? <Check sx={{ fontSize: 16 }} /> : <Close sx={{ fontSize: 16 }} />}
                  </Box>
                </Box>

                {(outcome === 'wrong' || acceptedSimilar) && (
                  <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1, p: '8px 10px', borderRadius: '12px', bgcolor: 'rgba(125,219,168,.08)' }}>
                    <Check sx={{ fontSize: 16, color: cv.green }} />
                    <Typography sx={{ fontSize: 13.5 }}><Box component="span" sx={{ color: cv.muted }}>{acceptedSimilar ? 'Também se diz: ' : 'Resposta certa: '}</Box><strong>{exercise.correctAnswer}</strong></Typography>
                  </Box>
                )}

                <Box sx={{ mt: 1.25, minHeight: 20 }}>
                  {aiFeedback ? (
                    <Typography sx={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.5, animation: 'lsUp .3s ease both' }}>{aiFeedback.explanation}</Typography>
                  ) : (
                    <Typography sx={{ fontSize: 13, ...shimmer }}>O Mivvi está a escrever uma explicação…</Typography>
                  )}
                </Box>

                <Box component="button" onClick={handleNext} sx={{ ...pillPrimary, width: '100%', height: 44, mt: 1.5 }}>
                  {isLast ? 'Terminar' : 'Continuar'}<ArrowForward sx={{ fontSize: 17 }} />
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ bgcolor: cv.bg, borderTop: `1px solid ${cv.border}` }}>
              <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: 1.5, pb: 'calc(12px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ flex: 1, fontSize: 12, color: cv.faint, display: { xs: 'none', sm: 'block' } }}>{hasOptions ? 'Usa 1–4 e Enter' : 'Enter para verificar'}</Typography>
                <Box component="button" onClick={handleSubmit} disabled={!answer.trim() || checking} sx={{ ...pillPrimary, height: 46, minWidth: { xs: '100%', sm: 170 } }}>
                  {checking ? <><CircularProgress size={15} sx={{ color: cv.muted }} />A verificar…</> : 'Verificar'}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </>
  )
}

const pillBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: 42, px: 2.5, border: 0, borderRadius: 999,
  font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', transition: 'background-color .15s, opacity .15s, transform .15s',
  '&:active:not(:disabled)': { transform: 'scale(.98)' },
} as const
const pillPrimary = { ...pillBase, bgcolor: '#fff', color: '#0d0d0d', '&:hover:not(:disabled)': { bgcolor: '#e6e6e6' }, '&:disabled': { bgcolor: cv.surface, color: cv.faint, cursor: 'default' } }
const pillSecondary = { ...pillBase, bgcolor: 'transparent', color: cv.text, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, '&:hover': { bgcolor: cv.surface } }
const pillGhost = { ...pillBase, height: 30, px: 1.5, fontSize: 13, fontWeight: 500, bgcolor: 'transparent', color: cv.muted, boxShadow: `inset 0 0 0 1px ${cv.border}`, '&:hover': { color: cv.text, bgcolor: 'rgba(255,255,255,.03)' } }
