import { Dialog, Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Subject } from '../types'
import { soundManager } from '../utils/soundEffects'
import { SubjectTile } from './SubjectDoodle'
import { subjectName, subjectGroupsFor, SUBJECTS, AREA_COLORS, AREA_NAMES, COURSES, isSecondary } from '../data/ptCurriculum'
import { cv } from '../theme'

// Choosing subjects: tiles grouped by area. The order you tap them in is shown
// as a small number, and that is the order they appear on the home screen.

interface SubjectPickerProps {
    open: boolean
    selected: Subject[]
    language: string
    schoolYear?: string | null
    course?: string | null
    onClose: () => void
    /** The course is passed too when the student chose it here (secundário without one saved). */
    onSave: (subjects: Subject[], course?: string) => void
}

const COPY: Record<string, { title: string; lede: string; cancel: string; save: string; count: string }> = {
    pt: { title: 'Disciplinas', lede: 'Escolhe o que queres estudar. Podes mudar quando quiseres.', cancel: 'Cancelar', save: 'Guardar', count: 'escolhidas' },
    en: { title: 'Subjects', lede: 'Pick what you want to study. You can change it any time.', cancel: 'Cancel', save: 'Save', count: 'selected' },
    es: { title: 'Asignaturas', lede: 'Elige lo que quieres estudiar. Puedes cambiarlo cuando quieras.', cancel: 'Cancelar', save: 'Guardar', count: 'elegidas' },
}

export default function SubjectPicker({ open, selected, language, schoolYear, course, onClose, onSave }: SubjectPickerProps) {
    const [picked, setPicked] = useState<Subject[]>(selected)
    const lk = language.slice(0, 2)
    const c = COPY[lk] || COPY.en

    const [chosenCourse, setChosenCourse] = useState<string | null>(course || null)
    useEffect(() => { if (open) { setPicked(selected); setChosenCourse(course || null) } }, [open, selected, course])
    const needsCourse = isSecondary(schoolYear) && !course

    // The student's own year/course first; without one, every subject by area.
    const own = schoolYear ? subjectGroupsFor(schoolYear, chosenCourse) : []
    const groups = own.length ? own : (Object.keys(AREA_COLORS) as (keyof typeof AREA_COLORS)[]).map((area) => ({ title: AREA_NAMES[area], items: Object.values(SUBJECTS).filter((s) => s.area === area).map((s) => s.id) }))

    const toggle = (s: Subject) => {
        soundManager.playClick()
        setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
            PaperProps={{ sx: { bgcolor: '#2a2a2a', borderRadius: '24px', color: cv.text, textAlign: 'left', m: 2, maxHeight: 'calc(100% - 32px)' } }}>
            <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: 0 }}>
                <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{c.title}</Typography>
                <Typography sx={{ fontSize: 14, color: cv.muted, mt: 0.5 }}>{c.lede}</Typography>
            </Box>

            <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2, overflowY: 'auto' }}>
                {needsCourse && (
                    <Box sx={{ mb: 2.5 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: cv.muted, mb: 1 }}>O teu curso</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {COURSES.map((co) => {
                                const on = chosenCourse === co.id
                                return (
                                    <Box key={co.id} component="button" title={co.name} onClick={() => { soundManager.playClick(); setChosenCourse(on ? null : co.id) }}
                                        sx={{ height: 34, px: 1.5, border: 0, borderRadius: 999, font: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', bgcolor: on ? '#fff' : 'rgba(255,255,255,.06)', color: on ? '#0d0d0d' : cv.text, transition: 'background-color .15s', '&:hover': { bgcolor: on ? '#fff' : 'rgba(255,255,255,.1)' } }}>
                                        {co.short}
                                    </Box>
                                )
                            })}
                        </Box>
                        {chosenCourse && <Typography sx={{ fontSize: 13, color: cv.muted, mt: 1 }}>{COURSES.find((co) => co.id === chosenCourse)?.name}</Typography>}
                    </Box>
                )}
                {groups.map((g) => (
                    <Box key={g.items[0]} sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: cv.muted, mb: 1 }}>{g.title}</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 1 }}>
                            {g.items.map((s) => {
                                const order = picked.indexOf(s)
                                const on = order >= 0
                                return (
                                    <Box key={s} component="button" aria-pressed={on} onClick={() => toggle(s)}
                                        sx={{ position: 'relative', display: 'grid', justifyItems: 'center', gap: 0.75, p: '10px 6px', border: 0, borderRadius: '16px', bgcolor: 'transparent', font: 'inherit', color: on ? cv.text : '#c9c9cc', cursor: 'pointer', transition: 'background-color .15s', '&:hover': { bgcolor: 'rgba(255,255,255,.04)' } }}>
                                        <Box sx={{ borderRadius: '15px', boxShadow: on ? '0 0 0 2.5px #2a2a2a, 0 0 0 4.5px #fff' : 'none', transition: 'box-shadow .15s' }}>
                                            <SubjectTile subject={s} size={54} />
                                        </Box>
                                        <Box component="span" sx={{ fontSize: 12.5, fontWeight: on ? 600 : 500, lineHeight: 1.25, textAlign: 'center' }}>{subjectName(s)}</Box>
                                        {on && (
                                            <Box sx={{ position: 'absolute', top: 2, right: 'calc(50% - 36px)', minWidth: 20, height: 20, px: 0.5, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', fontSize: 11.5, fontWeight: 700, display: 'grid', placeItems: 'center', boxShadow: '0 0 0 2px #2a2a2a',
                                                animation: 'spPop .25s cubic-bezier(.34,1.56,.64,1)', '@keyframes spPop': { from: { transform: 'scale(0)' } } }}>
                                                {order + 1}
                                            </Box>
                                        )}
                                    </Box>
                                )
                            })}
                        </Box>
                    </Box>
                ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: { xs: 2.5, sm: 3 }, pt: 1 }}>
                <Typography sx={{ flex: 1, fontSize: 13, color: cv.muted }}>{picked.length} {c.count}</Typography>
                <Box component="button" onClick={onClose} sx={{ height: 40, px: 2.25, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,.05)' } }}>{c.cancel}</Box>
                <Box component="button" disabled={!picked.length} onClick={() => { soundManager.playSuccess(); onSave(picked, needsCourse ? chosenCourse || undefined : undefined) }}
                    sx={{ height: 40, px: 2.5, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', '&:hover:not(:disabled)': { bgcolor: '#e6e6e6' }, '&:disabled': { opacity: 0.4, cursor: 'default' } }}>{c.save}</Box>
            </Box>
        </Dialog>
    )
}
