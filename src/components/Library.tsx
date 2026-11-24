import { useMemo, useState } from 'react'
import { Box, Typography, Portal } from '@mui/material'
import { Search, AutoStoriesRounded, CheckRounded } from '@mui/icons-material'
import { useLibrary } from '../services/library'
import { LibraryItem, UserProfile } from '../types'
import { SubjectTile } from './SubjectDoodle'
import { subjectColor, subjectName } from '../data/ptCurriculum'
import LessonTheoryView from './LessonTheoryView'
import Mascot from './Mascot'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// The Library: one card per finished lesson with the summary of its class
// ("aula"), filed by subject. Opening a card shows the whole explanation and
// the points to remember again — handy before a test.

const when = (ms: number) => {
  const days = Math.floor((Date.now() - ms) / 86400000)
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `Há ${days} dias`
  return new Date(ms).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}

export default function Library({ userProfile }: { userProfile: UserProfile }) {
  const items = useLibrary()
  const [subject, setSubject] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<LibraryItem | null>(null)

  const subjects = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach((i) => counts.set(i.subject, (counts.get(i.subject) || 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [items])

  const q = query.trim().toLowerCase()
  const shown = items.filter((i) => (!subject || i.subject === subject)
    && (!q || i.title.toLowerCase().includes(q) || i.theory.keyPoints.some((k) => k.toLowerCase().includes(q)) || subjectName(i.subject).toLowerCase().includes(q)))

  const chip = (on: boolean) => ({
    display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 34, px: 1.5, border: 0, borderRadius: 999, font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0,
    bgcolor: on ? '#fff' : 'transparent', color: on ? '#0d0d0d' : cv.muted, boxShadow: on ? 'none' : `inset 0 0 0 1px ${cv.border}`, '&:hover': { color: on ? '#0d0d0d' : cv.text },
  })

  return (
    <Box component="main" sx={{ maxWidth: 880, mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 4 }, pb: 4, boxSizing: 'border-box', textAlign: 'left', color: cv.text,
      '@keyframes lbIn': { from: { opacity: 0, transform: 'translateY(10px)' } } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', animation: 'lbIn .4s ease both' }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 26, sm: 30 }, fontWeight: 700, letterSpacing: '-0.03em' }}>Biblioteca</Typography>
          <Typography sx={{ color: cv.muted, fontSize: 14.5, mt: 0.5 }}>Os resumos das aulas que já fizeste{items.length ? ` · ${items.length}` : ''}.</Typography>
        </Box>
        {items.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 40, px: 1.5, borderRadius: 999, bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, width: { xs: '100%', sm: 260 }, '&:focus-within': { boxShadow: `inset 0 0 0 1px ${cv.borderStrong}` } }}>
            <Search sx={{ fontSize: 18, color: cv.muted }} />
            <Box component="input" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Procurar um tema" aria-label="Procurar"
              sx={{ flex: 1, minWidth: 0, border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14, '&::placeholder': { color: cv.faint } }} />
          </Box>
        )}
      </Box>

      {subjects.length > 1 && (
        <Box sx={{ display: 'flex', gap: 0.75, mt: 2.5, overflowX: 'auto', pb: 0.5, mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          <Box component="button" onClick={() => { soundManager.playClick(); setSubject(null) }} sx={chip(!subject)}>Tudo</Box>
          {subjects.map(([s, n]) => (
            <Box key={s} component="button" onClick={() => { soundManager.playClick(); setSubject(s) }} sx={chip(subject === s)}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: subjectColor(s) }} />{subjectName(s)} <Box component="span" sx={{ opacity: 0.6 }}>{n}</Box>
            </Box>
          ))}
        </Box>
      )}

      {items.length === 0 ? (
        <Box sx={{ mt: 4, p: { xs: 3, sm: 5 }, borderRadius: '28px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, display: 'grid', justifyItems: 'center', textAlign: 'center', animation: 'lbIn .4s ease .05s both' }}>
          <Mascot size={78} mood="happy" />
          <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700, mt: 2 }}>A tua biblioteca está vazia</Typography>
          <Typography sx={{ color: cv.muted, fontSize: 14.5, mt: 0.75, maxWidth: 380, lineHeight: 1.5 }}>
            Cada aula que terminares fica aqui guardada, com a explicação e os pontos para recordar. Ótimo para estudar para os testes!
          </Typography>
          {userProfile.selectedSubjects[0] && (
            <Box sx={{ display: 'flex', gap: 0.75, mt: 2.5 }}>
              {userProfile.selectedSubjects.slice(0, 5).map((s) => <SubjectTile key={s} subject={s} size={34} />)}
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 1.25 }}>
          {shown.map((item, i) => (
            <Box key={item.id} component="button" onClick={() => { soundManager.playPage(); setOpen(item) }}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1.25, p: 2, border: 0, borderRadius: '22px', textAlign: 'left', font: 'inherit', color: cv.text, cursor: 'pointer',
                bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, transition: 'box-shadow .15s, transform .15s, background-color .15s',
                '&:hover': { boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, bgcolor: '#202020' }, '&:active': { transform: 'scale(.99)' },
                animation: `lbIn .4s ease ${Math.min(i, 12) * 0.03}s both` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SubjectTile subject={item.subject} size={28} />
                <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: subjectColor(item.subject), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {subjectName(item.subject)}{item.lessonNumber ? ` · Lição ${item.lessonNumber}` : ''}
                </Typography>
                <Typography sx={{ fontSize: 12, color: cv.faint }}>{when(item.date)}</Typography>
              </Box>
              <Typography sx={{ fontFamily: cv.display, fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.25 }}>{item.title}</Typography>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 0.5 }}>
                {item.theory.keyPoints.slice(0, 2).map((k, j) => (
                  <Box component="li" key={j} sx={{ display: 'flex', gap: 0.75, fontSize: 13, color: cv.muted, lineHeight: 1.4 }}>
                    <CheckRounded sx={{ fontSize: 15, color: cv.faint, mt: '1px', flexShrink: 0 }} />
                    <Box component="span" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{k.replace(/\*\*/g, '')}</Box>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', pt: 0.5 }}>
                <AutoStoriesRounded sx={{ fontSize: 15, color: cv.faint }} />
                <Typography sx={{ flex: 1, fontSize: 12.5, color: cv.faint }}>{item.theory.sections.length} partes</Typography>
                <Box sx={{ fontSize: 12, fontWeight: 600, px: 1, py: 0.25, borderRadius: 999, bgcolor: item.correct >= item.total * 0.8 ? 'rgba(125,219,168,.12)' : cv.soft, color: item.correct >= item.total * 0.8 ? cv.green : cv.muted }}>
                  {item.correct}/{item.total} certas
                </Box>
              </Box>
            </Box>
          ))}
          {shown.length === 0 && <Typography sx={{ color: cv.muted, fontSize: 14 }}>Nada encontrado{q ? ` para “${query}”` : ''}.</Typography>}
        </Box>
      )}

      {open && <Portal><LessonTheoryView mode="library" theory={open.theory} subject={open.subject} lessonNumber={open.lessonNumber} onClose={() => setOpen(null)} /></Portal>}
    </Box>
  )
}
