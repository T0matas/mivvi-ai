import { useEffect, useState } from 'react'
import { Box, Dialog, Typography } from '@mui/material'
import { Check } from '@mui/icons-material'
import { SchoolYear, UserProfile } from '../types'
import { YEARS, COURSES, COURSE_TYPES, CourseInfo, isSecondary, subjectsFor, subjectGroupsFor } from '../data/ptCurriculum'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// Changing school year (and course, from the 10.º on). Subjects that don't
// exist in the new year are dropped; if none is left, the year's core ones
// are picked so the home screen is never empty. Progress is kept per year.

interface Props {
  open: boolean
  profile: UserProfile
  onClose: () => void
  onSave: (updates: Partial<UserProfile>) => void
}

export function schoolChange(profile: UserProfile, schoolYear: SchoolYear, course?: string | null): Partial<UserProfile> {
  const nextCourse = isSecondary(schoolYear) ? course || undefined : undefined
  const available = subjectsFor(schoolYear, nextCourse)
  let subjects = profile.selectedSubjects.filter((s) => available.includes(s))
  if (!subjects.length) subjects = subjectGroupsFor(schoolYear, nextCourse)[0]?.items.slice(0, 4) || []
  return { schoolYear, course: nextCourse, selectedSubjects: subjects }
}

export default function SchoolYearDialog({ open, profile, onClose, onSave }: Props) {
  const [year, setYear] = useState<SchoolYear | null>(profile.schoolYear)
  const [course, setCourse] = useState<string | null>(profile.course || null)
  useEffect(() => { if (open) { setYear(profile.schoolYear); setCourse(profile.course || null) } }, [open, profile.schoolYear, profile.course])

  const needsCourse = isSecondary(year) && !course
  const changed = year !== profile.schoolYear || (isSecondary(year) && course !== (profile.course || null))
  const cycles = [...new Set(YEARS.map((y) => y.cycle))]
  const tile = (on: boolean) => ({
    border: 0, font: 'inherit', color: cv.text, cursor: 'pointer', bgcolor: on ? cv.surface : 'transparent',
    boxShadow: `inset 0 0 0 ${on ? 2 : 1}px ${on ? '#fff' : cv.border}`, transition: 'box-shadow .15s, background-color .15s',
    '&:hover': { boxShadow: `inset 0 0 0 ${on ? 2 : 1}px ${on ? '#fff' : cv.borderStrong}` },
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1c1c1c', borderRadius: '24px', m: 1.5, color: cv.text, textAlign: 'left', maxHeight: 'calc(100% - 24px)' } }}>
      <Box sx={{ p: { xs: 2.25, sm: 3 }, overflowY: 'auto' }}>
        <Typography sx={{ fontFamily: cv.display, fontSize: 21, fontWeight: 700 }}>Ano escolar</Typography>
        <Typography sx={{ fontSize: 14, color: cv.muted, mt: 0.5 }}>As lições seguem o programa do ano que escolheres. O progresso de cada ano fica guardado.</Typography>

        {cycles.map((cycle) => (
          <Box key={cycle} sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: cv.muted, textTransform: 'uppercase', letterSpacing: '.07em', mb: 0.75 }}>{cycle}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
              {YEARS.filter((y) => y.cycle === cycle).map((y) => (
                <Box key={y.value} component="button" onClick={() => { soundManager.playSelect(); setYear(y.value); if (!isSecondary(y.value)) setCourse(null) }}
                  sx={{ ...tile(year === y.value), height: 48, borderRadius: '14px', fontFamily: cv.display, fontSize: 19, fontWeight: 700 }}>
                  {y.n}<Box component="span" sx={{ fontSize: 11, color: cv.muted }}>.º</Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}

        {isSecondary(year) && (
          <Box sx={{ mt: 2.5 }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: cv.muted, textTransform: 'uppercase', letterSpacing: '.07em', mb: 0.75 }}>Curso</Typography>
            {(Object.keys(COURSE_TYPES) as CourseInfo['type'][]).map((type) => (
              <Box key={type} sx={{ mb: 1.25 }}>
                <Typography sx={{ fontSize: 12.5, color: cv.faint, mb: 0.5 }}>{COURSE_TYPES[type]}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.75 }}>
                  {COURSES.filter((c) => c.type === type).map((c) => (
                    <Box key={c.id} component="button" onClick={() => { soundManager.playSelect(); setCourse(c.id) }}
                      sx={{ ...tile(course === c.id), display: 'flex', alignItems: 'center', gap: 1, p: '8px 10px', borderRadius: '12px', textAlign: 'left', fontSize: 13.5 }}>
                      <Box component="span" sx={{ minWidth: 38, height: 28, px: 0.5, borderRadius: '8px', display: 'grid', placeItems: 'center', bgcolor: { ch: '#a9c8f5', prof: '#9fe3c9', art: '#ff9fbb' }[type], color: '#1d2742', fontSize: 11, fontWeight: 800 }}>{c.short}</Box>
                      <Box component="span" sx={{ flex: 1 }}>{c.name}</Box>
                      {course === c.id && <Check sx={{ fontSize: 17 }} />}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
          <Box component="button" onClick={onClose} sx={{ flex: 1, height: 44, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</Box>
          <Box component="button" disabled={!year || needsCourse || !changed} onClick={() => { soundManager.playSuccess(); onSave(schoolChange(profile, year!, course)) }}
            sx={{ flex: 1, height: 44, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', '&:disabled': { bgcolor: cv.surface, color: cv.faint, cursor: 'default' } }}>
            {needsCourse ? 'Escolhe o curso' : 'Guardar'}
          </Box>
        </Box>
      </Box>
    </Dialog>
  )
}
