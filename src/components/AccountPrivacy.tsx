import { Box, Typography, Dialog } from '@mui/material'
import { useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { CheckRounded, DownloadRounded, RefreshRounded, DeleteOutlineRounded, PhoneIphoneRounded, AutoAwesomeRounded, AccountCircleRounded, VolumeUpRounded } from '@mui/icons-material'
import { auth } from '../firebase'
import { UserProfile, UserProgress, SchoolYear } from '../types'
import { YEARS, COURSES, isSecondary, subjectsFor, subjectGroupsFor, courseInfo } from '../data/ptCurriculum'
import { soundManager } from '../utils/soundEffects'
import LoginButtons from './LoginButtons'
import Mascot from './Mascot'
import { cv } from '../theme'

// Account & privacy: who is signed in, the school settings the lessons depend
// on, preferences, a plain explanation of what is stored where, and the
// student's controls over their data (download, rebuild plans, delete all).

interface AccountPrivacyProps {
    userProfile: UserProfile
    userProgress: UserProgress
    onUpdateProfile?: (updates: Partial<UserProfile>) => void
}

const MIVVI_KEY = /^(mivvi_|userProfile$)/

function Section({ title, children, delay = 0 }: { title: string; children: ReactNode; delay?: number }) {
    return (
        <Box sx={{ mt: 4, animation: `apIn .45s cubic-bezier(.22,1,.36,1) ${delay}s both` }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 1.5 }}>{title}</Typography>
            <Box sx={{ bgcolor: cv.paper, borderRadius: '22px', boxShadow: `inset 0 0 0 1px ${cv.border}`, overflow: 'hidden' }}>{children}</Box>
        </Box>
    )
}

function Row({ icon, title, detail, children, first }: { icon?: ReactNode; title: string; detail?: ReactNode; children?: ReactNode; first?: boolean }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, px: 2.25, py: 1.75, borderTop: first ? 0 : `1px solid ${cv.border}`, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {icon && <Box sx={{ width: 36, height: 36, borderRadius: '11px', bgcolor: cv.surface, color: cv.text, display: 'grid', placeItems: 'center', flexShrink: 0, '& svg': { fontSize: 19 } }}>{icon}</Box>}
            <Box sx={{ flex: 1, minWidth: 160 }}>
                <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>{title}</Typography>
                {detail && <Typography component="div" sx={{ fontSize: 13, color: cv.muted, mt: 0.25, lineHeight: 1.5 }}>{detail}</Typography>}
            </Box>
            {children}
        </Box>
    )
}

export default function AccountPrivacy({ userProfile, userProgress, onUpdateProfile }: AccountPrivacyProps) {
    const [user, setUser] = useState<User | null>(auth.currentUser)
    const [sound, setSound] = useState(soundManager.isEnabled())
    const [confirm, setConfirm] = useState<null | 'signout' | 'delete'>(null)
    const [done, setDone] = useState('')

    useEffect(() => onAuthStateChanged(auth, setUser), [])
    useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(''), 2500); return () => clearTimeout(t) }, [done])

    const action = (danger = false) => ({
        display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 36, px: 1.75, border: 0, borderRadius: 999, font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const,
        bgcolor: 'transparent', color: danger ? cv.coral : cv.text, boxShadow: `inset 0 0 0 1px ${danger ? 'rgba(255,159,136,.4)' : cv.borderStrong}`,
        '&:hover': { bgcolor: danger ? 'rgba(255,159,136,.08)' : 'rgba(255,255,255,.05)' },
    })

    // ── School settings: keep only the subjects that exist in the new year/course ──
    const changeSchool = (schoolYear: SchoolYear, course?: string) => {
        soundManager.playClick()
        const nextCourse = isSecondary(schoolYear) ? course : undefined
        const available = subjectsFor(schoolYear, nextCourse)
        let subjects = userProfile.selectedSubjects.filter((s) => available.includes(s))
        if (!subjects.length) subjects = subjectGroupsFor(schoolYear, nextCourse)[0]?.items.slice(0, 4) || []
        onUpdateProfile?.({ schoolYear, course: nextCourse, ...(subjects.length && { selectedSubjects: subjects }) })
    }

    // ── Data controls ──
    const download = () => {
        const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), account: user ? { name: user.displayName, email: user.email } : null }
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)!
            if (!MIVVI_KEY.test(k)) continue
            try { data[k] = JSON.parse(localStorage.getItem(k) || 'null') } catch { data[k] = localStorage.getItem(k) }
        }
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
        const a = document.createElement('a')
        a.href = url
        a.download = `mivvi-dados-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        setDone('Os teus dados foram descarregados.')
    }
    const resetPlans = () => {
        Object.keys(localStorage).filter((k) => k.startsWith('mivvi_plan_')).forEach((k) => localStorage.removeItem(k))
        soundManager.playClick()
        setDone('Os planos vão ser refeitos quando abrires cada disciplina.')
    }
    const leave = async (wipe: boolean) => {
        try { await signOut(auth) } catch { /* not signed in */ }
        const keys = Object.keys(localStorage).filter((k) => (wipe ? MIVVI_KEY.test(k) : ['mivvi_userProfile', 'mivvi_userProgress', 'mivvi_selectedSubject', 'mivvi_recentSubjects', 'mivvi_lastActivity', 'userProfile'].includes(k)))
        keys.forEach((k) => localStorage.removeItem(k))
        window.location.href = '/welcome'
    }

    const n = YEARS.find((y) => y.value === userProfile.schoolYear)?.n
    const plans = Object.keys(localStorage).filter((k) => k.startsWith('mivvi_plan_')).length

    return (
        <Box component="main" sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 4 }, pb: 4, boxSizing: 'border-box', textAlign: 'left', color: cv.text,
            '@keyframes apIn': { from: { opacity: 0, transform: 'translateY(10px)' } } }}>
            <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 26, sm: 30 }, fontWeight: 700, letterSpacing: '-0.03em', animation: 'apIn .45s cubic-bezier(.22,1,.36,1) both' }}>Conta e privacidade</Typography>
            <Typography sx={{ color: cv.muted, fontSize: 15, mt: 0.75, animation: 'apIn .45s cubic-bezier(.22,1,.36,1) .04s both' }}>Gere a tua conta, o que o Mivvi sabe sobre ti e os teus dados.</Typography>

            {/* Account */}
            <Section title="Conta" delay={0.06}>
                {user ? (
                    <Row first icon={user.photoURL ? <Box component="img" src={user.photoURL} alt="" referrerPolicy="no-referrer" sx={{ width: 36, height: 36, borderRadius: '11px' }} /> : <AccountCircleRounded />}
                        title={user.displayName || userProfile.name || 'A tua conta'}
                        detail={<>{user.email} · <Box component="span" sx={{ color: cv.green }}>ligada com Google</Box></>}>
                        <Box component="button" onClick={() => setConfirm('signout')} sx={action()}>Terminar sessão</Box>
                    </Row>
                ) : (
                    <Box sx={{ p: 2.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: '13px', bgcolor: cv.surface, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Mascot size={34} animated={false} /></Box>
                            <Box>
                                <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>Estás a usar o Mivvi sem conta</Typography>
                                <Typography sx={{ fontSize: 13, color: cv.muted, mt: 0.25, lineHeight: 1.5 }}>O teu progresso só existe neste dispositivo. Cria uma conta para não o perderes.</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ mt: 2, maxWidth: 360 }}>
                            <LoginButtons onSuccess={({ user: u }: { user?: User }) => {
                                soundManager.playSuccess()
                                if (u && !userProfile.name && u.displayName) onUpdateProfile?.({ name: u.displayName.split(' ')[0], uid: u.uid })
                                else if (u) onUpdateProfile?.({ uid: u.uid })
                                setDone('Conta ligada. O teu progresso foi mantido.')
                            }} onError={() => soundManager.playError()} />
                        </Box>
                    </Box>
                )}
            </Section>

            {/* School */}
            <Section title="Estudos" delay={0.1}>
                <Row first title="Ano" detail="As lições seguem o programa português deste ano.">
                    <Box component="select" value={userProfile.schoolYear || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeSchool(e.target.value as SchoolYear, userProfile.course)}
                        sx={{ height: 36, px: 1.5, border: 0, borderRadius: 999, bgcolor: 'rgba(255,255,255,.06)', color: cv.text, font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', colorScheme: 'dark', outline: 'none' }}>
                        {YEARS.map((y) => <option key={y.value} value={y.value}>{y.n}.º ano</option>)}
                    </Box>
                </Row>
                {isSecondary(userProfile.schoolYear) && (
                    <Row title="Curso" detail={courseInfo(userProfile.course)?.name || 'Ainda não escolheste o teu curso.'}>
                        <Box component="select" value={userProfile.course || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeSchool(userProfile.schoolYear!, e.target.value)}
                            sx={{ height: 36, px: 1.5, border: 0, borderRadius: 999, bgcolor: 'rgba(255,255,255,.06)', color: cv.text, font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', colorScheme: 'dark', outline: 'none', maxWidth: 220 }}>
                            <option value="" disabled>Escolher…</option>
                            {COURSES.map((c) => <option key={c.id} value={c.id}>{c.short} · {c.name}</option>)}
                        </Box>
                    </Row>
                )}
            </Section>

            {/* Preferences */}
            <Section title="Preferências" delay={0.14}>
                <Row first icon={<VolumeUpRounded />} title="Sons" detail="Efeitos ao responder e navegar.">
                    <Box component="button" role="switch" aria-checked={sound} onClick={() => { const on = soundManager.toggleSound(); setSound(on); if (on) soundManager.playClick() }}
                        sx={{ position: 'relative', width: 46, height: 28, border: 0, borderRadius: 999, cursor: 'pointer', bgcolor: sound ? cv.green : cv.surfaceHover, transition: 'background-color .2s', flexShrink: 0 }}>
                        <Box sx={{ position: 'absolute', top: 3, left: sound ? 21 : 3, width: 22, height: 22, borderRadius: '50%', bgcolor: '#fff', transition: 'left .2s cubic-bezier(.22,1,.36,1)' }} />
                    </Box>
                </Row>
            </Section>

            {/* Privacy */}
            <Section title="Privacidade" delay={0.18}>
                <Row first icon={<PhoneIphoneRounded />} title="Guardado neste dispositivo"
                    detail={`O teu perfil${n ? ` (${n}.º ano)` : ''}, progresso (${userProgress.xp} XP, ${userProgress.completedLessons.length} lições), amigos e ${plans} ${plans === 1 ? 'plano de lições' : 'planos de lições'}. Não saem do teu dispositivo.`} />
                <Row icon={<AutoAwesomeRounded />} title="Enviado para a IA"
                    detail="As tuas mensagens ao Mivvi, as fotos que anexas e o áudio do microfone vão para o serviço de IA (Groq) só para gerar a resposta. O Mivvi não os guarda." />
                <Row icon={<AccountCircleRounded />} title="Conta Google"
                    detail={user ? 'Usamos o teu nome e email apenas para iniciares sessão.' : 'Sem conta, nada fica associado a ti fora deste dispositivo.'} />
            </Section>

            {/* Data controls */}
            <Section title="Os teus dados" delay={0.22}>
                <Row first icon={<DownloadRounded />} title="Descarregar os meus dados" detail="Um ficheiro com o teu perfil, progresso e planos.">
                    <Box component="button" onClick={download} sx={action()}>Descarregar</Box>
                </Row>
                <Row icon={<RefreshRounded />} title="Refazer os planos de lições" detail="O Mivvi volta a planear os temas de cada disciplina.">
                    <Box component="button" onClick={resetPlans} sx={action()}>Refazer</Box>
                </Row>
                <Row icon={<DeleteOutlineRounded />} title="Apagar todos os dados" detail="Apaga tudo o que o Mivvi guardou neste dispositivo e termina a sessão.">
                    <Box component="button" onClick={() => setConfirm('delete')} sx={action(true)}>Apagar</Box>
                </Row>
            </Section>

            {done && (
                <Box sx={{ position: 'fixed', left: '50%', bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))', transform: 'translateX(-50%)', zIndex: 1200, display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, borderRadius: 999, bgcolor: '#2a2a2a', boxShadow: '0 10px 30px rgba(0,0,0,.4)', fontSize: 14, animation: 'apIn .3s ease both', whiteSpace: 'nowrap' }}>
                    <CheckRounded sx={{ fontSize: 18, color: cv.green }} />{done}
                </Box>
            )}

            <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#1f1f1f', borderRadius: '24px', m: 2, p: 3, color: cv.text, textAlign: 'left' } }}>
                <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700 }}>{confirm === 'delete' ? 'Apagar todos os dados?' : 'Terminar sessão?'}</Typography>
                <Typography sx={{ fontSize: 14.5, color: cv.muted, mt: 1, lineHeight: 1.5 }}>
                    {confirm === 'delete'
                        ? 'O teu perfil, progresso, amigos e planos de lições vão ser apagados deste dispositivo. Isto não pode ser desfeito.'
                        : 'Vais sair da tua conta. O progresso guardado neste dispositivo será apagado.'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                    <Box component="button" autoFocus onClick={() => setConfirm(null)} sx={{ flex: 1, height: 44, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: '#e6e6e6' } }}>Cancelar</Box>
                    <Box component="button" onClick={() => leave(confirm === 'delete')} sx={{ flex: 1, height: 44, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,159,136,.4)', color: cv.coral, font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,159,136,.08)' } }}>
                        {confirm === 'delete' ? 'Apagar tudo' : 'Terminar sessão'}
                    </Box>
                </Box>
            </Dialog>
        </Box>
    )
}
