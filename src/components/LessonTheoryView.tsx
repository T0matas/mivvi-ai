import { Fragment, ReactNode, useEffect, useRef, useState } from 'react'
import { Box, Typography, IconButton, Popover, CircularProgress } from '@mui/material'
import { Close, ArrowForward, FormatListBulletedRounded, AutoStoriesRounded } from '@mui/icons-material'
import { LessonTheory } from '../types'
import Mascot from './Mascot'
import { SubjectTile } from './SubjectDoodle'
import { subjectColor, subjectName } from '../data/ptCurriculum'
import { soundManager } from '../utils/soundEffects'
import { Diagram, TopicImage, Points, Terms } from './TheoryBlocks'
import { cv } from '../theme'

// The "aula": Mivvi explains the topic like a teacher, in short numbered
// blocks (concept, example), then "Para guardar" and a question to think
// about. In a lesson it ends with the button to the exercises; in the Library
// the same page is the lesson's summary.

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
  const [read, setRead] = useState(0)
  const [index, setIndex] = useState<HTMLElement | null>(null)
  const total = theory.sections.reduce((n, s) => n + (s.minutes || 2), 0)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      setRead(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100)
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (id: string) => {
    setIndex(null)
    soundManager.playPage()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const label = { fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const }

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, right: `${rightInset}px`, transition: 'right .3s cubic-bezier(.22,1,.36,1)', zIndex: 1300, bgcolor: cv.bg, color: cv.text, display: 'flex', flexDirection: 'column', textAlign: 'left',
      '@keyframes thIn': { from: { opacity: 0, transform: 'translateY(10px)' } } }}>
      {/* Top bar */}
      <Box sx={{ flexShrink: 0, pt: 'env(safe-area-inset-top, 0px)', borderBottom: `1px solid ${cv.border}`, position: 'relative' }}>
        <Box sx={{ maxWidth: 760, mx: 'auto', height: 52, px: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => { soundManager.playBack(); onClose() }} aria-label="Fechar" sx={{ width: 36, height: 36 }}><Close sx={{ fontSize: 19 }} /></IconButton>
          <Typography sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{theory.title}</Typography>
          <Typography sx={{ fontSize: 12.5, color: cv.muted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', display: { xs: extra ? 'none' : 'block', sm: 'block' } }}>{read}% lido</Typography>
          {extra}
          <Box component="button" onClick={(e: React.MouseEvent<HTMLElement>) => { soundManager.playClick(); setIndex(e.currentTarget) }}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 32, px: 1.25, border: 0, borderRadius: 999, bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: cv.soft } }}>
            <FormatListBulletedRounded sx={{ fontSize: 17 }} />Índice
          </Box>
        </Box>
        <Box sx={{ position: 'absolute', left: 0, bottom: -1, height: 2, width: `${read}%`, bgcolor: color, transition: 'width .15s linear' }} />
      </Box>

      <Popover open={!!index} anchorEl={index} onClose={() => setIndex(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { mt: 1, p: 0.75, borderRadius: '16px', bgcolor: '#222', minWidth: 240, maxWidth: 320 } }}>
        {theory.sections.map((s, i) => (
          <Box key={i} component="button" onClick={() => goTo(`th-${i}`)} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', textAlign: 'left', border: 0, bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14, p: '9px 10px', borderRadius: '10px', cursor: 'pointer', '&:hover': { bgcolor: cv.soft } }}>
            <Box component="span" sx={{ width: 22, height: 22, borderRadius: '7px', bgcolor: cv.surface, color: cv.muted, fontSize: 11.5, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{i + 1}</Box>
            {s.heading}
          </Box>
        ))}
        {theory.keyPoints.length > 0 && (
          <Box component="button" onClick={() => goTo('th-keep')} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', textAlign: 'left', border: 0, bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14, p: '9px 10px', borderRadius: '10px', cursor: 'pointer', '&:hover': { bgcolor: cv.soft } }}>
            <Box component="span" sx={{ width: 22, height: 22, borderRadius: '7px', bgcolor: color, color: '#1d2742', display: 'grid', placeItems: 'center', flexShrink: 0 }}><AutoStoriesRounded sx={{ fontSize: 13 }} /></Box>
            Para guardar
          </Box>
        )}
      </Popover>

      {/* Article */}
      <Box ref={scroller} sx={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Box component="article" sx={{ maxWidth: 680, mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 4 }, pb: mode === 'lesson' ? '130px' : 6, boxSizing: 'border-box' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, animation: 'thIn .4s ease both' }}>
            <SubjectTile subject={subject} size={30} />
            <Typography sx={{ fontSize: 13, color: cv.muted, fontWeight: 600 }}>
              {subjectName(subject)}{lessonNumber ? ` · Lição ${lessonNumber}` : ''} · {total} min
            </Typography>
          </Box>
          <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 25, sm: 30 }, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, mt: 1.5, animation: 'thIn .4s ease .04s both' }}>
            {theory.title}
          </Typography>

          {theory.intro && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mt: 2.25, animation: 'thIn .4s ease .08s both' }}>
              <Mascot size={40} mood="happy" />
              <Box sx={{ flex: 1, px: 1.75, py: 1.25, borderRadius: '4px 18px 18px 18px', bgcolor: cv.surface, fontSize: 14.5, lineHeight: 1.55 }}>{rich(theory.intro)}</Box>
            </Box>
          )}

          {/* What you'll learn */}
          {!!theory.goals?.length && (
            <Box sx={{ mt: 2.5, p: 1.75, borderRadius: '18px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, animation: 'thIn .4s ease .1s both' }}>
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

          {/* Sections */}
          {theory.sections.map((s, i) => (
            <Box key={i} id={`th-${i}`} component="section" sx={{ mt: 3, pt: 3, borderTop: `1px solid ${cv.border}`, scrollMarginTop: 16, animation: `thIn .45s ease ${0.1 + i * 0.05}s both` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ minWidth: 26, height: 22, px: 0.75, borderRadius: '7px', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, fontSize: 11.5, fontWeight: 700, color: cv.muted, display: 'grid', placeItems: 'center', fontVariantNumeric: 'tabular-nums' }}>
                  {String(i + 1).padStart(2, '0')}
                </Box>
                <Typography sx={{ ...label, color }}>{KINDS[i] || 'Ideia'} · {s.minutes || 2} min</Typography>
              </Box>
              <Typography component="h2" sx={{ fontFamily: cv.display, fontSize: { xs: 19, sm: 21 }, fontWeight: 700, letterSpacing: '-0.02em', mt: 1.25 }}>{s.heading}</Typography>
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#d6d6da', mt: 1 }}>{rich(s.body)}</Typography>
              {!!s.points?.length && <Points points={s.points} color={color} />}
              {s.diagram && <Diagram diagram={s.diagram} color={color} />}
              {s.image && <TopicImage query={s.image} />}
              {!!s.terms?.length && <Terms terms={s.terms} color={color} />}
              {s.example && (
                <Box sx={{ mt: 1.75, p: '12px 14px 12px 16px', borderRadius: '14px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, position: 'relative',
                  '&::before': { content: '""', position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 999, bgcolor: color } }}>
                  <Typography sx={{ ...label, color: cv.muted, mb: 0.5 }}>Exemplo</Typography>
                  <Typography sx={{ fontSize: 14.5, lineHeight: 1.6 }}>{rich(s.example)}</Typography>
                </Box>
              )}
            </Box>
          ))}

          {/* To remember */}
          {theory.keyPoints.length > 0 && (
            <Box id="th-keep" sx={{ mt: 4, scrollMarginTop: 16 }}>
              <Typography sx={{ ...label, fontSize: 12.5, color: cv.text, pb: 1.25, borderBottom: `1px solid ${cv.border}` }}>Para guardar</Typography>
              {theory.keyPoints.map((k, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 1.75, py: 1.25, borderBottom: `1px solid ${cv.border}` }}>
                  <Typography sx={{ fontFamily: cv.display, fontSize: 17, fontWeight: 700, color, minWidth: 16, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</Typography>
                  <Typography sx={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.5 }}>{rich(k)}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Think about it */}
          {theory.think && (
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.75, borderRadius: '18px', bgcolor: 'rgba(96,165,250,.07)', boxShadow: 'inset 0 0 0 1px rgba(96,165,250,.18)' }}>
              <Mascot size={36} mood="thinking" animated={false} />
              <Box>
                <Typography sx={{ ...label, color: cv.accent }}>Pensa um pouco</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, mt: 0.5 }}>{theory.think}</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Go to the exercises */}
      {mode !== 'library' && (
        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, bgcolor: 'rgba(20,20,20,.94)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${cv.border}` }}>
          <Box sx={{ maxWidth: 680, mx: 'auto', px: 2, pt: 1.5, pb: 'calc(14px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', gap: 1.5, boxSizing: 'border-box' }}>
            <Typography sx={{ flex: 1, fontSize: 12.5, color: cv.muted, display: { xs: 'none', sm: 'block' } }}>
              {mode === 'review' ? 'Volta às perguntas quando quiseres.' : failed ? 'Os exercícios não ficaram prontos.' : ready ? '10 perguntas sobre esta aula.' : 'O Mivvi está a preparar os exercícios…'}
            </Typography>
            {failed && mode === 'lesson' ? (
              <Box component="button" onClick={onRetry} sx={{ ...btn, minWidth: { xs: '100%', sm: 220 } }}>Tentar outra vez</Box>
            ) : (
              <Box component="button" disabled={mode === 'lesson' && !ready} onClick={() => { soundManager.playStart(); onStart?.() }} sx={{ ...btn, minWidth: { xs: '100%', sm: 220 } }}>
                {mode === 'review' ? 'Voltar às perguntas' : ready ? 'Começar exercícios' : <><CircularProgress size={15} sx={{ color: cv.muted }} /> A preparar…</>}
                {(ready || mode === 'review') && <ArrowForward sx={{ fontSize: 18 }} />}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}

const btn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: 46, px: 2.75, border: 0, borderRadius: 999,
  font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', bgcolor: '#fff', color: '#0d0d0d', transition: 'background-color .15s, transform .15s',
  '&:hover:not(:disabled)': { bgcolor: '#e6e6e6' }, '&:active:not(:disabled)': { transform: 'scale(.98)' },
  '&:disabled': { bgcolor: cv.surface, color: cv.muted, cursor: 'default' },
} as const
