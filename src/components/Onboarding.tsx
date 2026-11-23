import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { ArrowBack, ArrowForward, Check, Search } from '@mui/icons-material'
import { SchoolYear, Subject, UserProfile } from '../types'
import Mascot from './Mascot'
import { SubjectTile } from './SubjectDoodle'
import { soundManager } from '../utils/soundEffects'
import { COURSES, COURSE_TYPES, YEARS, isSecondary, subjectGroupsFor, subjectName, courseInfo, yearNumber, CourseInfo } from '../data/ptCurriculum'
import { cv } from '../theme'

// Getting to know the student. On the left, Mivvi comments on each choice and
// a profile card fills in as the student answers; on the right, one question
// at a time. On a phone the side panel shrinks to a strip at the top.
// For now the app follows the Portuguese curriculum, in European Portuguese.

interface OnboardingProps {
    onComplete: (profile: UserProfile) => void
}

type Step = 'year' | 'course' | 'subjects'

const TITLES: Record<Step, { title: string; hint: string }> = {
    year: { title: 'Em que ano andas?', hint: 'As lições seguem o programa português do teu ano.' },
    course: { title: 'Qual é o teu curso?', hint: 'No secundário, as disciplinas dependem do curso.' },
    subjects: { title: 'Que disciplinas queres estudar?', hint: 'Escolhe uma ou mais. Podes mudar quando quiseres.' },
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [stepIndex, setStepIndex] = useState(0)
    const [year, setYear] = useState<SchoolYear | null>(null)
    const [course, setCourse] = useState<string | null>(null)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [query, setQuery] = useState('')

    const steps: Step[] = ['year', ...(isSecondary(year) ? ['course' as Step] : []), 'subjects']
    const step = steps[stepIndex]
    const groups = subjectGroupsFor(year, course)
    const allSubjects = [...new Set(groups.flatMap((g) => g.items))]
    const many = allSubjects.length > 10
    const q = query.trim().toLowerCase()

    const valid = (step === 'year' && !!year) || (step === 'course' && !!course) || (step === 'subjects' && subjects.length > 0)

    const next = () => {
        if (!valid) return
        if (stepIndex < steps.length - 1) { soundManager.playClick(); setStepIndex(stepIndex + 1); setQuery(''); return }
        soundManager.playSuccess()
        onComplete({ schoolYear: year!, course: isSecondary(year) ? course || undefined : undefined, selectedSubjects: subjects, difficulty: 'medium', language: 'pt-PT', isOnboarded: true })
    }
    const back = () => { if (stepIndex > 0) { soundManager.playClick(); setStepIndex(stepIndex - 1) } }

    const pickYear = (y: SchoolYear) => { soundManager.playClick(); setYear(y); setSubjects([]); if (!isSecondary(y)) setCourse(null) }
    const pickCourse = (c: string) => { soundManager.playClick(); setCourse(c); setSubjects([]) }
    const toggle = (s: Subject) => { soundManager.playClick(); setSubjects((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s])) }
    const toggleGroup = (items: string[]) => {
        soundManager.playClick()
        const all = items.every((s) => subjects.includes(s))
        setSubjects((p) => (all ? p.filter((s) => !items.includes(s)) : [...new Set([...p, ...items])]))
    }

    // What Mivvi says, reacting to the answers so far.
    const comment = (() => {
        if (step === 'year') return year ? `${yearNumber(year)}.º ano, boa! Vamos a isso.` : 'Olá! Sou o Mivvi. Vamos montar o teu plano de estudo.'
        if (step === 'course') return course ? `${courseInfo(course)?.name}? Fixe!` : 'E o teu curso? Assim sei que disciplinas tens.'
        return subjects.length ? `${subjects.length} ${subjects.length === 1 ? 'disciplina' : 'disciplinas'}. Vou preparar um plano para cada uma, ao nível do teu ano.` : 'Agora escolhe o que queres praticar comigo.'
    })()

    const summary: { step: Step; label: string; value: string | null }[] = [
        { step: 'year', label: 'Ano', value: year ? `${yearNumber(year)}.º ano` : null },
        ...(isSecondary(year) ? [{ step: 'course' as Step, label: 'Curso', value: courseInfo(course)?.name || null }] : []),
        { step: 'subjects', label: 'Disciplinas', value: subjects.length ? `${subjects.length} escolhidas` : null },
    ]

    const card = (on: boolean) => ({
        border: 0, font: 'inherit', color: cv.text, cursor: 'pointer', textAlign: 'left' as const,
        bgcolor: on ? cv.surface : cv.paper, boxShadow: `inset 0 0 0 ${on ? 2 : 1}px ${on ? '#fff' : cv.border}`,
        transition: 'background-color .15s, box-shadow .15s, transform .15s',
        '&:hover': { boxShadow: `inset 0 0 0 ${on ? 2 : 1}px ${on ? '#fff' : cv.borderStrong}` },
        '&:active': { transform: 'scale(.98)' },
    })
    const tick = (on: boolean) => (
        <Box component="span" sx={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: on ? '#fff' : 'transparent', boxShadow: on ? 'none' : `inset 0 0 0 1.5px ${cv.borderStrong}`, color: '#0d0d0d' }}>
            {on && <Check sx={{ fontSize: 15, animation: 'obPop .25s cubic-bezier(.34,1.56,.64,1)' }} />}
        </Box>
    )
    const groupLabel = (text: string, extra?: React.ReactNode) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: cv.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>{text}</Typography>
            {extra}
        </Box>
    )

    const cycles = [...new Set(YEARS.map((y) => y.cycle))]
    const courseTypes = Object.keys(COURSE_TYPES) as CourseInfo['type'][]

    return (
        <Box sx={{ minHeight: '100dvh', bgcolor: cv.bg, color: cv.text, textAlign: 'left',
            '@keyframes obIn': { from: { opacity: 0, transform: 'translateY(10px)' } },
            '@keyframes obPop': { from: { transform: 'scale(0)' } },
            '@keyframes obBubble': { from: { opacity: 0, transform: 'translateY(4px) scale(.98)' } } }}>
            <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' }, gap: { xs: 2.5, md: 4 }, alignItems: 'start' }}>

                {/* Side panel: Mivvi + profile */}
                <Box sx={{ position: { md: 'sticky' }, top: { md: 32 }, p: { xs: 2, md: 3 }, borderRadius: '28px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
                    <Box sx={{ display: 'flex', alignItems: { xs: 'center', md: 'flex-start' }, flexDirection: { xs: 'row', md: 'column' }, gap: { xs: 1.5, md: 2 } }}>
                        <Box sx={{ width: { xs: 52, md: 96 }, height: { xs: 52, md: 96 }, borderRadius: { xs: '16px', md: '28px' }, bgcolor: cv.surface, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <Mascot size={70} mood={valid ? 'happy' : 'idle'} sx={{ width: { xs: 40, md: 70 }, height: { xs: 40, md: 70 } }} />
                        </Box>
                        <Box key={comment} sx={{ px: 1.75, py: 1.25, borderRadius: { xs: '16px 16px 16px 4px', md: '4px 18px 18px 18px' }, bgcolor: cv.surface, fontSize: 14.5, fontWeight: 500, lineHeight: 1.45, animation: 'obBubble .3s ease both' }}>
                            {comment}
                        </Box>
                    </Box>

                    {/* Profile filling in (desktop) */}
                    <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 3 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: cv.muted, textTransform: 'uppercase', letterSpacing: '.06em', mb: 1 }}>O teu perfil</Typography>
                        {summary.map((row) => {
                            const current = row.step === step
                            const idx = steps.indexOf(row.step)
                            return (
                                <Box key={row.step} component="button" disabled={idx > stepIndex} onClick={() => { if (idx <= stepIndex) { soundManager.playClick(); setStepIndex(idx) } }}
                                    sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.25, py: 1.25, border: 0, borderTop: `1px solid ${cv.border}`, bgcolor: 'transparent', font: 'inherit', color: cv.text, textAlign: 'left', cursor: idx <= stepIndex ? 'pointer' : 'default' }}>
                                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: row.value && !current ? cv.green : 'transparent', boxShadow: row.value && !current ? 'none' : `inset 0 0 0 1.5px ${current ? '#fff' : cv.borderStrong}`, color: '#0d0d0d', transition: 'background-color .2s' }}>
                                        {row.value && !current ? <Check sx={{ fontSize: 14 }} /> : current ? <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fff' }} /> : null}
                                    </Box>
                                    <Typography sx={{ fontSize: 14, color: current ? cv.text : cv.muted, fontWeight: current ? 600 : 500, width: 82 }}>{row.label}</Typography>
                                    <Typography sx={{ fontSize: 13.5, color: row.value ? cv.text : cv.faint, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{row.value || '—'}</Typography>
                                </Box>
                            )
                        })}
                    </Box>

                    {/* Progress dots (phone) */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 0.75, mt: 1.75 }}>
                        {steps.map((s, i) => <Box key={s} sx={{ height: 4, flex: i === stepIndex ? 2 : 1, borderRadius: 999, bgcolor: i <= stepIndex ? '#fff' : 'rgba(255,255,255,.12)', transition: 'flex .3s, background-color .3s' }} />)}
                    </Box>
                </Box>

                {/* Question */}
                <Box key={step} sx={{ minWidth: 0, pb: '110px', animation: 'obIn .4s cubic-bezier(.22,1,.36,1) both' }}>
                    <Typography sx={{ fontSize: 13, color: cv.muted, fontWeight: 600 }}>Passo {stepIndex + 1} de {steps.length}</Typography>
                    <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 26, sm: 32 }, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, mt: 0.5 }}>{TITLES[step].title}</Typography>
                    <Typography sx={{ color: cv.muted, fontSize: 15, mt: 0.75, mb: 3 }}>{TITLES[step].hint}</Typography>

                    {/* Year: number tiles by cycle */}
                    {step === 'year' && cycles.map((cycle) => (
                        <Box key={cycle} sx={{ mb: 2.25 }}>
                            {groupLabel(cycle)}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                                {YEARS.filter((y) => y.cycle === cycle).map((y) => (
                                    <Box key={y.value} component="button" aria-label={`${y.n}.º ano`} onClick={() => pickYear(y.value)}
                                        sx={{ ...card(year === y.value), height: { xs: 64, sm: 76 }, borderRadius: '18px', display: 'grid', placeItems: 'center' }}>
                                        <Box component="span" sx={{ fontFamily: cv.display, fontSize: { xs: 24, sm: 28 }, fontWeight: 700, lineHeight: 1 }}>
                                            {y.n}<Box component="span" sx={{ fontSize: 13, color: cv.muted }}>.º</Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}

                    {/* Course: cards with code + name */}
                    {step === 'course' && courseTypes.map((type) => (
                        <Box key={type} sx={{ mb: 2.25 }}>
                            {groupLabel(COURSE_TYPES[type])}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                                {COURSES.filter((c) => c.type === type).map((c) => (
                                    <Box key={c.id} component="button" onClick={() => pickCourse(c.id)} sx={{ ...card(course === c.id), display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, pr: 1.75, borderRadius: '18px' }}>
                                        <Box component="span" sx={{ minWidth: 48, height: 40, px: 0.75, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: { ch: '#a9c8f5', prof: '#9fe3c9', art: '#ff9fbb' }[type], color: '#1d2742', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{c.short}</Box>
                                        <Box component="span" sx={{ flex: 1, fontSize: 14.5, fontWeight: 500, lineHeight: 1.3 }}>{c.name}</Box>
                                        {tick(course === c.id)}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}

                    {/* Subjects: tiles by group, with search when there are many */}
                    {step === 'subjects' && (
                        <>
                            {many && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 44, px: 1.75, mb: 2.5, borderRadius: 999, bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, '&:focus-within': { boxShadow: `inset 0 0 0 1px ${cv.borderStrong}` } }}>
                                    <Search sx={{ fontSize: 19, color: cv.muted }} />
                                    <Box component="input" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder={`Procurar entre ${allSubjects.length} disciplinas`} aria-label="Procurar disciplina"
                                        sx={{ flex: 1, minWidth: 0, border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14.5, '&::placeholder': { color: cv.faint } }} />
                                    <Box component="button" onClick={() => toggleGroup(allSubjects)} sx={{ border: 0, bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        {allSubjects.every((s) => subjects.includes(s)) ? 'Limpar' : 'Todas'}
                                    </Box>
                                </Box>
                            )}
                            {groups.map((g) => {
                                const items = g.items.filter((s) => !q || subjectName(s).toLowerCase().includes(q))
                                if (!items.length) return null
                                const all = g.items.every((s) => subjects.includes(s))
                                return (
                                    <Box key={g.title} sx={{ mb: 2.25 }}>
                                        {groupLabel(g.title, !q && g.items.length > 1 && (
                                            <Box component="button" onClick={() => toggleGroup(g.items)} sx={{ border: 0, bgcolor: 'transparent', color: cv.muted, font: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', '&:hover': { color: cv.text } }}>
                                                {all ? 'Tirar todas' : 'Escolher todas'}
                                            </Box>
                                        ))}
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1 }}>
                                            {items.map((s) => {
                                                const on = subjects.includes(s)
                                                return (
                                                    <Box key={s} component="button" aria-pressed={on} onClick={() => toggle(s)} sx={{ ...card(on), display: 'flex', alignItems: 'center', gap: 1.25, p: 1, pr: 1.5, borderRadius: '16px' }}>
                                                        <SubjectTile subject={s} size={38} />
                                                        <Box component="span" sx={{ flex: 1, fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{subjectName(s)}</Box>
                                                        {tick(on)}
                                                    </Box>
                                                )
                                            })}
                                        </Box>
                                    </Box>
                                )
                            })}
                            {q && !allSubjects.some((s) => subjectName(s).toLowerCase().includes(q)) && (
                                <Typography sx={{ color: cv.muted, fontSize: 14 }}>Nenhuma disciplina com “{query}”.</Typography>
                            )}
                        </>
                    )}

                </Box>
            </Box>

            {/* Bottom bar */}
            <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, bgcolor: 'rgba(20,20,20,.92)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${cv.border}` }}>
                <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: 1.5, pb: 'calc(12px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', gap: 1.5, boxSizing: 'border-box' }}>
                    <Box component="button" onClick={back} disabled={stepIndex === 0}
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 46, px: 2, border: 0, borderRadius: 999, bgcolor: 'transparent', color: cv.muted, font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', visibility: stepIndex === 0 ? 'hidden' : 'visible', '&:hover': { color: cv.text } }}>
                        <ArrowBack sx={{ fontSize: 18 }} /> Voltar
                    </Box>
                    <Box sx={{ flex: 1 }} />
                    <Box component="button" onClick={next} disabled={!valid}
                        sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: 46, minWidth: { xs: 160, sm: 200 }, px: 3, border: 0, borderRadius: 999, font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                            bgcolor: '#fff', color: '#0d0d0d', transition: 'background-color .15s, opacity .2s',
                            '&:hover:not(:disabled)': { bgcolor: '#e6e6e6' }, '&:disabled': { bgcolor: cv.surface, color: cv.faint, cursor: 'default' } }}>
                        {stepIndex === steps.length - 1 ? 'Começar' : 'Continuar'}
                        {stepIndex === steps.length - 1 ? <Check sx={{ fontSize: 19 }} /> : <ArrowForward sx={{ fontSize: 19 }} />}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
