import { Box, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Add, ArrowForward, LockOutlined, Search, ExpandMore } from '@mui/icons-material'
import { Subject, UserProfile, UserProgress } from '../types'
import { getLessonsBySubject } from '../services/lessonService'
import { useLessonPlan, getCachedPlan } from '../services/lessonPlan'
import { soundManager } from '../utils/soundEffects'
import Mascot from './Mascot'
import { SubjectTile } from './SubjectDoodle'
import { subjectColor, subjectName } from '../data/ptCurriculum'
import { cv } from '../theme'

// Mivvi's home: a greeting, one big "carry on" card for the subject in focus
// (its lesson titles come from the AI plan for the student's year and course),
// and the subjects. With many subjects, the most
// recent ones come first and the rest open on demand, with a search.

interface SubjectHomeProps {
    userProfile: UserProfile
    userProgress: UserProgress
    currentSubject: Subject | null
    onSelectSubject: (subject: Subject) => void
    onOpenSubject: (subject: Subject, lessonId: number) => void
    onAddSubject: () => void
}

const VISIBLE = 6
const RECENT_KEY = 'mivvi_recentSubjects'

const readRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] } }
const pushRecent = (s: string) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify([s, ...readRecent().filter((x) => x !== s)].slice(0, 20))) } catch { /* private mode */ } }

const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite'
}


const shimmerText = {
    color: 'transparent', backgroundImage: 'linear-gradient(90deg, #8e8e93 0%, #8e8e93 40%, #f2f2f7 50%, #8e8e93 60%, #8e8e93 100%)', backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text', backgroundClip: 'text', animation: 'homeShimmer 2.2s linear infinite',
    '@keyframes homeShimmer': { from: { backgroundPosition: '100% 0' }, to: { backgroundPosition: '0% 0' } },
}
const rise = (delay = 0) => ({ animation: `homeIn .45s cubic-bezier(.22,1,.36,1) ${delay}s both`, '@keyframes homeIn': { from: { opacity: 0, transform: 'translateY(12px)' } } })

export default function SubjectHome({ userProfile, userProgress, currentSubject, onSelectSubject, onOpenSubject, onAddSubject }: SubjectHomeProps) {
    const lang = userProfile.language || 'pt-PT'
    const year = userProfile.schoolYear
    const course = userProfile.course
    const subjects = userProfile.selectedSubjects
    const focus = currentSubject && subjects.includes(currentSubject) ? currentSubject : subjects[0]
    const [showAll, setShowAll] = useState(false)
    const [query, setQuery] = useState('')

    const { plan, loading } = useLessonPlan(focus, year, course)

    const progressOf = (subject: Subject) => {
        // The number of lessons comes from the subject's plan (official curriculum); unknown until planned.
        const lessons = year ? getLessonsBySubject(subject, year, lang, subject === focus ? plan : getCachedPlan(subject, year, course)) : []
        const done = lessons.filter((l) => userProgress.completedLessons.includes(l.id)).length
        return { done, total: lessons.length }
    }

    const heroLessons = focus && year ? getLessonsBySubject(focus, year, lang, plan) : []
    const done = heroLessons.filter((l) => userProgress.completedLessons.includes(l.id)).length
    const next = heroLessons.find((l) => !userProgress.completedLessons.includes(l.id))
    const locked = false
    const upcoming = next ? heroLessons.slice(next.lessonNumber, next.lessonNumber + 2) : []
    const color = focus ? subjectColor(focus) : cv.accent
    const planning = !plan && loading


    // Recent first, then the profile order.
    const ordered = useMemo(() => {
        const recent = readRecent().filter((s) => subjects.includes(s))
        return [...recent, ...subjects.filter((s) => !recent.includes(s))]
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subjects, focus])
    const many = ordered.length > VISIBLE
    const q = query.trim().toLowerCase()
    const shown = showAll || !many
        ? ordered.filter((s) => !q || subjectName(s).toLowerCase().includes(q))
        : ordered.slice(0, VISIBLE)

    const select = (s: Subject) => { soundManager.playClick(); pushRecent(s); onSelectSubject(s); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    const open = () => { if (focus && next && !locked) { soundManager.playClick(); pushRecent(focus); onOpenSubject(focus, next.id) } }

    return (
        <Box component="main" sx={{ maxWidth: 880, mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 4 }, pb: 4, boxSizing: 'border-box', textAlign: 'left', color: cv.text }}>
            {/* Greeting */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', ...rise() }}>
                <Mascot size={48} mood="happy" />
                <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 21, sm: 24 }, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                        {greeting()}{userProfile.name ? `, ${userProfile.name}` : ''}
                    </Typography>
                    <Typography sx={{ color: cv.muted, fontSize: 14 }}>
                        Bora aprender um bocadinho hoje?
                    </Typography>
                </Box>
            </Box>

            {/* Carry on: one simple card with the next lesson */}
            {focus && (
                <Box key={focus} sx={{ mt: 2.5, p: { xs: 2.25, sm: 3 }, borderRadius: '24px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, ...rise(0.06) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SubjectTile subject={focus} size={28} />
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subjectName(focus)}</Typography>
                        {next && <Typography sx={{ fontSize: 12.5, color: cv.muted, whiteSpace: 'nowrap' }}>Lição {next.lessonNumber} de {heroLessons.length}</Typography>}
                    </Box>

                    <Typography sx={{ fontFamily: cv.display, fontSize: { xs: 23, sm: 28 }, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, mt: 1.75, ...(planning && shimmerText) }}>
                        {planning ? 'A preparar o teu plano…' : next ? next.title : 'Tudo concluído!'}
                    </Typography>
                    {(planning || locked || next?.description) && (
                        <Typography sx={{ color: cv.muted, fontSize: 14.5, mt: 0.75, maxWidth: 520, lineHeight: 1.5 }}>
                            {planning ? `O Mivvi está a organizar os temas de ${subjectName(focus)} do teu ano.` : locked && next ? `Precisas de ${next.requiredXp} XP para abrir esta lição.` : next?.description}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
                        {next && (
                            <Box component="button" id="tutorial-first-lesson" disabled={locked || planning} onClick={open}
                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, height: 44, px: 2.5, border: 0, borderRadius: 999, font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                    bgcolor: '#fff', color: '#0d0d0d', transition: 'background-color .15s, transform .15s',
                                    '&:hover:not(:disabled)': { bgcolor: '#e6e6e6', '& .hero-go': { transform: 'translateX(3px)' } }, '&:active:not(:disabled)': { transform: 'scale(.98)' },
                                    '&:disabled': { bgcolor: cv.surface, color: cv.muted, cursor: 'default' } }}>
                                {locked && <LockOutlined sx={{ fontSize: 17 }} />}
                                {done ? 'Continuar' : 'Começar'}
                                {!locked && <ArrowForward className="hero-go" sx={{ fontSize: 18, transition: 'transform .2s' }} />}
                            </Box>
                        )}
                        {upcoming[0] && !planning && (
                            <Typography sx={{ flex: 1, minWidth: 0, fontSize: 13, color: cv.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                A seguir: <Box component="span" sx={{ color: cv.muted }}>{upcoming[0].title}</Box>
                            </Typography>
                        )}
                    </Box>

                    {/* Progress in the subject */}
                    <Box sx={{ mt: 2.5, height: 4, borderRadius: 999, bgcolor: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${heroLessons.length ? (done / heroLessons.length) * 100 : 0}%`, minWidth: done ? 6 : 0, bgcolor: color, borderRadius: 999, transition: 'width .6s ease' }} />
                    </Box>
                </Box>
            )}

            {/* Subjects */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mt: 3.5, mb: 1.5, ...rise(0.12) }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                    As tuas disciplinas <Box component="span" sx={{ color: cv.muted, fontWeight: 500 }}>· {subjects.length}</Box>
                </Typography>
                {showAll && many && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 36, px: 1.5, borderRadius: 999, bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, width: { xs: 170, sm: 240 }, '&:focus-within': { boxShadow: `inset 0 0 0 1px ${cv.borderStrong}` } }}>
                        <Search sx={{ fontSize: 18, color: cv.muted }} />
                        <Box component="input" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Procurar" aria-label="Procurar disciplina"
                            sx={{ flex: 1, minWidth: 0, border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14, '&::placeholder': { color: cv.faint } }} />
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 1.25 }}>
                {shown.map((subject, i) => {
                    const p = progressOf(subject)
                    const active = subject === focus
                    return (
                        <Box key={subject} component="button" aria-pressed={active} onClick={() => select(subject)} title={subjectName(subject)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, pr: 1.75, border: 0, borderRadius: '20px', textAlign: 'left', font: 'inherit', color: cv.text, cursor: 'pointer',
                                bgcolor: active ? cv.surface : 'transparent', boxShadow: `inset 0 0 0 ${active ? 1.5 : 1}px ${active ? cv.borderStrong : cv.border}`,
                                transition: 'background-color .15s, box-shadow .15s',
                                '&:hover': { bgcolor: active ? cv.surface : 'rgba(255,255,255,.03)' },
                                animation: `homeIn .4s cubic-bezier(.22,1,.36,1) ${Math.min(i, 10) * 0.03}s both`,
                            }}>
                            <SubjectTile subject={subject} size={44} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{subjectName(subject)}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                                    <Box sx={{ flex: 1, height: 4, borderRadius: 999, bgcolor: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                                        <Box sx={{ height: '100%', width: `${p.total ? (p.done / p.total) * 100 : 0}%`, minWidth: p.done ? 6 : 0, bgcolor: subjectColor(subject), borderRadius: 999 }} />
                                    </Box>
                                    <Typography component="span" sx={{ fontSize: 12, color: cv.muted, fontVariantNumeric: 'tabular-nums' }}>{p.total ? `${p.done}/${p.total}` : '—'}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    )
                })}
                {(showAll || !many) && (
                    <Box component="button" onClick={() => { soundManager.playClick(); onAddSubject() }}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, border: `1px dashed ${cv.borderStrong}`, borderRadius: '20px', bgcolor: 'transparent', color: cv.muted, font: 'inherit', fontSize: 14, cursor: 'pointer', '&:hover': { color: cv.text, bgcolor: 'rgba(255,255,255,.03)' } }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: '14px', display: 'grid', placeItems: 'center', boxShadow: `inset 0 0 0 1px ${cv.border}` }}><Add /></Box>
                        Editar disciplinas
                    </Box>
                )}
            </Box>
            {showAll && q && shown.length === 0 && (
                <Typography sx={{ color: cv.muted, fontSize: 14, mt: 1.5 }}>Nenhuma disciplina com “{query}”.</Typography>
            )}

            {many && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Box component="button" onClick={() => { soundManager.playClick(); setShowAll((v) => !v); setQuery('') }}
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 38, px: 2, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,.04)' } }}>
                        {showAll ? 'Mostrar menos' : `Ver todas (${subjects.length})`}
                        <ExpandMore sx={{ fontSize: 18, transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                    </Box>
                </Box>
            )}
        </Box>
    )
}
