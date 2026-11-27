import { Fragment, ReactNode, useEffect, useRef, useState } from 'react'
import { Box, Typography, IconButton, Popover, CircularProgress } from '@mui/material'
import { Close, ArrowForward, ArrowBack, FormatListBulletedRounded, AutoStoriesRounded, CheckRounded } from '@mui/icons-material'
import { LessonTheory } from '../types'
import Mascot from './Mascot'
import { SubjectTile } from './SubjectDoodle'
import { subjectColor, subjectName } from '../data/ptCurriculum'
import { soundManager } from '../utils/soundEffects'
import { Diagram, TopicImage, Points, Terms } from './TheoryBlocks'
import StepDots, { StepState } from './StepDots'
import { cv } from '../theme'
import { useUniqueImages } from '../services/wikiImage'
import { MivviAlive } from './MivviLoader'

// The "aula", step by step: Mivvi explains the topic one part per screen.
// First the opening (what you'll learn), then each part (concept, example…),
// then "Para guardar" and a question to think about. "Anterior / Seguinte"
// (or the arrow keys) move between parts. In a lesson the last step starts the
// exercises; in the Library the same steps are the lesson's summary.

/** **bold** and line breaks, nothing else. */
export function rich(text: string): ReactNode {
  return text.split('\n').map((line, li, lines) => (
    <Fragment key={li}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? <Box key={i} component="strong" sx={{ color: '#fff', fontWeight: 650 }}>{part.slice(2, -2)}</Box> : part)}
      {li < lines.length - 1 && <br />}
    </Fragment>
  ))
}

interface Props {
  theory: LessonTheory
  subject: string
  lessonNumber?: number
  /** In a lesson: the exercises are ready to start. */
  ready?: boolean
  failed?: boolean
  onStart?: () => void
  onRetry?: () => void
  onClose: () => void
  mode?: 'lesson' | 'library' | 'review'
  /** Room on the right for the Mivvi panel (px). */
  rightInset?: number
  /** Extra control in the top bar (e.g. "Pergunta ao Mivvi"). */
  extra?: ReactNode
}

const KINDS = ['Conceito', 'Como funciona', 'Na prática', 'Vai mais longe', 'Extra']

export default function LessonTheoryView({ theory, subject, lessonNumber, ready, failed, onStart, onRetry, onClose, mode = 'lesson', rightInset = 0, extra }: Props) {
  const color = subjectColor(subject)
  const scroller = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState<HTMLElement | null>(null)
  const total = theory.sections.reduce((n, s) => n + (s.minutes || 2), 0)

  // Steps: 0 = opening, 1..n = the parts, last = "Para guardar".
  const n = theory.sections.length
  const hasEnd = theory.keyPoints.length > 0 || !!theory.think
  const steps = 1 + n + (hasEnd ? 1 : 0)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const last = step === steps - 1

  const go = (to: number) => {
    if (to < 0 || to >= steps || to === step) return
    setIndex(null)
    soundManager.playPage()
    setDir(to > step ? 1 : -1)
    setStep(to)
  }

  // Each step starts at its top.
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }) }, [step])

  // ← → move between steps (not while typing, e.g. in the Mivvi panel).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'ArrowRight') go(step + 1)
      if (e.key === 'ArrowLeft') go(step - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const label = { fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const }
  const stepName = (i: number) => (i === 0 ? 'Início' : i <= n ? theory.sections[i - 1].heading : 'Para guardar')
  const states: StepState[] = Array.from({ length: steps }, (_, i) => (i < step ? 'done' : i === step ? 'now' : 'next'))

  const s = step >= 1 && step <= n ? theory.sections[step - 1] : null
  // The parts' pictures, chosen together so none repeats (in this lesson or the student's others).
  const images = useUniqueImages(`${subject}:${lessonNumber || theory.title}`, theory.sections.map((x) => x.image))

  // The main button: next part, or what to do at the end.
  const primary = !last ? (
    <Box component="button" onClick={() => go(step + 1)} sx={{ ...btn, minWidth: { xs: 0, sm: 190 }, flex: { xs: 1, sm: 'none' } }}>
      {step === 0 ? 'Começar a aula' : 'Seguinte'}<ArrowForward sx={{ fontSize: 18 }} />
    </Box>
  ) : mode === 'library' ? (
    <Box component="button" onClick={() => { soundManager.playBack(); onClose() }} sx={{ ...btn, minWidth: { xs: 0, sm: 190 }, flex: { xs: 1, sm: 'none' } }}>
      Terminar<CheckRounded sx={{ fontSize: 18 }} />
    </Box>
  ) : failed && mode === 'lesson' ? (
    <Box component="button" onClick={onRetry} sx={{ ...btn, minWidth: { xs: 0, sm: 220 }, flex: { xs: 1, sm: 'none' } }}>Tentar outra vez</Box>
  ) : (
    <Box component="button" disabled={mode === 'lesson' && !ready} onClick={() => { soundManager.playStart(); onStart?.() }} sx={{ ...btn, minWidth: { xs: 0, sm: 220 }, flex: { xs: 1, sm: 'none' } }}>
      {mode === 'review' ? 'Voltar às perguntas' : ready ? 'Começar exercícios' : <><CircularProgress size={15} sx={{ color: cv.muted }} /> A preparar…</>}
      {(ready || mode === 'review') && <ArrowForward sx={{ fontSize: 18 }} />}
    </Box>
  )

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, right: `${rightInset}px`, transition: 'right .3s cubic-bezier(.22,1,.36,1)', zIndex: 1300, bgcolor: cv.bg, color: cv.text, display: 'flex', flexDirection: 'column', textAlign: 'left',
      '@keyframes thNext': { from: { opacity: 0, transform: 'translateX(28px)' } },
      '@keyframes thPrev': { from: { opacity: 0, transform: 'translateX(-28px)' } } }}>
      {/* Top bar: close, the steps, where you are */}
      <Box sx={{ flexShrink: 0, pt: 'env(safe-area-inset-top, 0px)', borderBottom: `1px solid ${cv.border}` }}>
        <Box sx={{ maxWidth: 760, mx: 'auto', height: 56, px: 1, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          <IconButton onClick={() => { soundManager.playBack(); onClose() }} aria-label="Fechar" sx={{ width: 36, height: 36 }}><Close sx={{ fontSize: 19 }} /></IconButton>
          <StepDots states={states} color={color} onPick={go} label={stepName} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: cv.muted, fontVariantNumeric: 'tabular-nums', minWidth: 30, textAlign: 'right' }}>{step + 1}/{steps}</Typography>
          <IconButton onClick={(e: React.MouseEvent<HTMLElement>) => { soundManager.playClick(); setIndex(e.currentTarget) }} aria-label="Índice" title="Índice" sx={{ width: 36, height: 36 }}>
            <FormatListBulletedRounded sx={{ fontSize: 19 }} />
          </IconButton>
          {extra}
        </Box>
      </Box>

      <Popover open={!!index} anchorEl={index} onClose={() => setIndex(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { mt: 1, p: 0.75, borderRadius: '16px', bgcolor: '#222', minWidth: 240, maxWidth: 320 } }}>
        {Array.from({ length: steps }, (_, i) => (
          <Box key={i} component="button" onClick={() => go(i)} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', textAlign: 'left', border: 0, bgcolor: i === step ? cv.soft : 'transparent', color: cv.text, font: 'inherit', fontSize: 14, p: '9px 10px', borderRadius: '10px', cursor: 'pointer', '&:hover': { bgcolor: cv.soft } }}>
            <Box component="span" sx={{ width: 22, height: 22, borderRadius: '7px', fontSize: 11.5, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0,
              bgcolor: i < step ? color : cv.surface, color: i < step ? '#0d0d0d' : cv.muted }}>
              {i < step ? <CheckRounded sx={{ fontSize: 14 }} /> : i === steps - 1 && hasEnd ? <AutoStoriesRounded sx={{ fontSize: 13 }} /> : i + 1}
            </Box>
            {stepName(i)}
          </Box>
        ))}
      </Popover>

      {/* The current step */}
      <Box ref={scroller} sx={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Box key={step} component="article" sx={{ maxWidth: 680, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 5 }, pb: 5, boxSizing: 'border-box',
          animation: `${dir === 1 ? 'thNext' : 'thPrev'} .35s cubic-bezier(.22,1,.36,1) both` }}>

          {/* Opening */}
          {step === 0 && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <SubjectTile subject={subject} size={30} />
                <Typography sx={{ fontSize: 13, color: cv.muted, fontWeight: 600 }}>
                  {subjectName(subject)}{lessonNumber ? ` · Lição ${lessonNumber}` : ''} · {total} min
                </Typography>
              </Box>
              <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 26, sm: 32 }, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, mt: 1.5 }}>
                {theory.title}
              </Typography>
              {theory.intro && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mt: 2.5 }}>
                  <MivviAlive mode="talk" size={40} />
                  <Box sx={{ flex: 1, px: 1.75, py: 1.25, borderRadius: '4px 18px 18px 18px', bgcolor: cv.surface, fontSize: 14.5, lineHeight: 1.55 }}>{rich(theory.intro)}</Box>
                </Box>
              )}
              {!!theory.goals?.length && (
                <Box sx={{ mt: 2.5, p: 1.75, borderRadius: '18px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
                  <Typography sx={{ ...label, color: cv.muted, mb: 1 }}>Nesta aula vais aprender</Typography>
                  <Box sx={{ display: 'grid', gap: 0.75 }}>
                    {theory.goals.map((g, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box component="span" sx={{ width: 20, height: 20, borderRadius: '50%', boxShadow: `inset 0 0 0 1.5px ${color}`, color, fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0, mt: '1px' }}>{i + 1}</Box>
                        <Typography sx={{ fontSize: 14.5, lineHeight: 1.45 }}>{g}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              {/* The parts ahead */}
              <Box sx={{ mt: 2.5 }}>
                <Typography sx={{ ...label, color: cv.muted, mb: 0.75 }}>A aula em {n} partes</Typography>
                {theory.sections.map((x, i) => (
                  <Box key={i} component="button" onClick={() => go(i + 1)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', p: '9px 4px', border: 0, borderBottom: `1px solid ${cv.border}`, bgcolor: 'transparent', color: cv.text, font: 'inherit', textAlign: 'left', cursor: 'pointer', '&:hover .th-go': { color: cv.text } }}>
                    <Box component="span" sx={{ fontSize: 12, fontWeight: 700, color: cv.faint, fontVariantNumeric: 'tabular-nums', minWidth: 20 }}>{String(i + 1).padStart(2, '0')}</Box>
                    <Box component="span" sx={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{x.heading}</Box>
                    <Box component="span" className="th-go" sx={{ fontSize: 12.5, color: cv.faint }}>{x.minutes || 2} min</Box>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* A part */}
          {s && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ minWidth: 26, height: 22, px: 0.75, borderRadius: '7px', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, fontSize: 11.5, fontWeight: 700, color: cv.muted, display: 'grid', placeItems: 'center', fontVariantNumeric: 'tabular-nums' }}>
                  {String(step).padStart(2, '0')}
                </Box>
                <Typography sx={{ ...label, color }}>{KINDS[step - 1] || 'Ideia'} · {s.minutes || 2} min</Typography>
              </Box>
              <Typography component="h2" sx={{ fontFamily: cv.display, fontSize: { xs: 22, sm: 26 }, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, mt: 1.5 }}>{s.heading}</Typography>
              <Typography sx={{ fontSize: 15.5, lineHeight: 1.7, color: '#d6d6da', mt: 1.25 }}>{rich(s.body)}</Typography>
              {!!s.points?.length && <Points points={s.points} color={color} />}
              {s.diagram && <Diagram diagram={s.diagram} color={color} />}
              {s.image && <TopicImage image={images?.[step - 1]} />}
              {!!s.terms?.length && <Terms terms={s.terms} color={color} />}
              {s.example && (
                <Box sx={{ mt: 1.75, p: '12px 14px 12px 16px', borderRadius: '14px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, position: 'relative',
                  '&::before': { content: '""', position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 999, bgcolor: color } }}>
                  <Typography sx={{ ...label, color: cv.muted, mb: 0.5 }}>Exemplo</Typography>
                  <Typography sx={{ fontSize: 14.5, lineHeight: 1.6 }}>{rich(s.example)}</Typography>
                </Box>
              )}
            </>
          )}

          {/* To remember + think about it */}
          {hasEnd && last && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ width: 26, height: 22, borderRadius: '7px', bgcolor: color, color: '#0d0d0d', display: 'grid', placeItems: 'center' }}><AutoStoriesRounded sx={{ fontSize: 14 }} /></Box>
                <Typography sx={{ ...label, color }}>Para guardar</Typography>
              </Box>
              <Typography component="h2" sx={{ fontFamily: cv.display, fontSize: { xs: 22, sm: 26 }, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, mt: 1.5 }}>O mais importante</Typography>
              {theory.keyPoints.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  {theory.keyPoints.map((k, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 1.75, py: 1.25, borderBottom: `1px solid ${cv.border}` }}>
                      <Typography sx={{ fontFamily: cv.display, fontSize: 17, fontWeight: 700, color, minWidth: 16, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</Typography>
                      <Typography sx={{ fontSize: 15, fontWeight: 500, lineHeight: 1.5 }}>{rich(k)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {theory.think && (
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.75, borderRadius: '18px', bgcolor: 'rgba(96,165,250,.07)', boxShadow: 'inset 0 0 0 1px rgba(96,165,250,.18)' }}>
                  <Mascot size={36} mood="thinking" animated={false} />
                  <Box>
                    <Typography sx={{ ...label, color: cv.accent }}>Pensa um pouco</Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, mt: 0.5 }}>{theory.think}</Typography>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Bottom: back and next */}
      <Box sx={{ flexShrink: 0, bgcolor: 'rgba(20,20,20,.94)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${cv.border}` }}>
        <Box sx={{ maxWidth: 680, mx: 'auto', px: 2, pt: 1.5, pb: 'calc(14px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', gap: 1.5, boxSizing: 'border-box' }}>
          <Box component="button" onClick={() => go(step - 1)} disabled={step === 0}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 46, px: 2, border: 0, borderRadius: 999, bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
              boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, transition: 'opacity .2s, background-color .15s', '&:hover:not(:disabled)': { bgcolor: cv.surface }, '&:disabled': { opacity: 0, pointerEvents: 'none' } }}>
            <ArrowBack sx={{ fontSize: 18 }} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Anterior</Box>
          </Box>
          <Typography sx={{ flex: 1, textAlign: 'center', fontSize: 12.5, color: cv.muted, display: { xs: 'none', sm: 'block' } }}>
            {last && mode === 'lesson' ? (failed ? 'Os exercícios não ficaram prontos.' : ready ? '10 perguntas sobre esta aula.' : 'O Mivvi está a preparar os exercícios…') : last && mode === 'review' ? 'Volta às perguntas quando quiseres.' : stepName(step)}
          </Typography>
          {primary}
        </Box>
      </Box>
    </Box>
  )
}

const btn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: 46, px: 2.75, border: 0, borderRadius: 999,
  font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', bgcolor: '#fff', color: '#0d0d0d', transition: 'background-color .15s, transform .15s',
  '&:hover:not(:disabled)': { bgcolor: '#e6e6e6' }, '&:active:not(:disabled)': { transform: 'scale(.98)' },
  '&:disabled': { bgcolor: cv.surface, color: cv.muted, cursor: 'default' },
} as const
