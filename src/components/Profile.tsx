import { Box, Typography, Dialog, DialogContent, TextField, DialogActions, Button } from '@mui/material'
import { EditOutlined, LocalFireDepartmentRounded, SchoolRounded, PersonAddAlt1Outlined, TuneRounded, QrCode2Rounded } from '@mui/icons-material'
import { SubjectTile } from './SubjectDoodle'
import { subjectName, yearLabel as ptYearLabel, courseInfo } from '../data/ptCurriculum'
import SubjectPicker from './SubjectPicker'
import { cv } from '../theme'
import { useState } from 'react'
import { UserProfile, UserProgress } from '../types'
import BeardMascot from './BeardMascot';
import { soundManager } from '../utils/soundEffects'
import { t } from '../utils/translations'

import SchoolYearDialog from './SchoolYearDialog'
import NameClaimDialog from './NameClaimDialog'
import { FriendsPanel } from './Friends'
import { FriendView } from '../services/useSocial'
import { PublicProfile, nameProblem, isNameFree, toHandle } from '../services/social'
import SocialSetup from './SocialSetup'
import { useAuthUser } from '../services/useSocial'

interface ProfileProps {
    userProfile: UserProfile
    userProgress: UserProgress
    onUpdateProfile?: (updates: Partial<UserProfile>) => void
    onClaimReward?: (amount: number) => void
    /** The signed-in student's public card (null without an account). */
    me?: PublicProfile | null
    social?: { friends: FriendView[]; incoming: FriendView[]; outgoing: FriendView[] }
    onAddFriend?: () => void
    onMessage?: (f: FriendView) => void
}

export default function Profile({ userProfile, userProgress, onUpdateProfile, me, social, onAddFriend, onMessage }: ProfileProps) {
    const user = useAuthUser()
    const [yearOpen, setYearOpen] = useState(false)
    const [claimOpen, setClaimOpen] = useState(false)

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [nameError, setNameError] = useState('')

    // Restriction Dialog State
    const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false)
    const [restrictionMessage, setRestrictionMessage] = useState('')

    const lang = userProfile.language || 'pt-BR'

    // Stats Data
    const stats = [
        { label: t('streak', lang), value: userProgress.streak, icon: <LocalFireDepartmentRounded />, color: '#ff9f88' },
        { label: t('lessons', lang), value: userProgress.completedLessons.length, icon: <SchoolRounded />, color: cv.mint },
    ]

    const handleNameEditClick = () => {
        if (userProfile.lastNameChangeDate) {
            const lastChange = new Date(userProfile.lastNameChangeDate)
            const now = new Date()
            const diffTime = Math.abs(now.getTime() - lastChange.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays <= 15) {
                const daysRemaining = 15 - diffDays
                if (diffDays < 15) {
                    setRestrictionMessage(t('profile_name_restriction_error', lang).replace('{days}', daysRemaining.toString()))
                    setIsRestrictionDialogOpen(true)
                    return
                }
            }
        }
        if (me) { setClaimOpen(true); return }
        setEditName(userProfile.name || '')
        setIsEditDialogOpen(true)
    }

    const handleSaveName = async () => {
        const problem = nameProblem(editName)
        if (problem) { setNameError(problem); return }
        try {
            if (!(await isNameFree(editName))) { setNameError('Esse nome já existe. Escolhe outro.'); return }
        } catch { /* offline: checked again when an account is linked */ }

        onUpdateProfile?.({
            name: editName.trim(),
            lastNameChangeDate: new Date().toISOString()
        })
        soundManager.playSuccess()
        setIsEditDialogOpen(false)
        setNameError('')
    }

    const [pickerOpen, setPickerOpen] = useState(false)
    const [allSubjects, setAllSubjects] = useState(false)
    const SUBJECTS_SHOWN = 6
    const pt = lang.startsWith('pt')
    const heading = { fontSize: 15, fontWeight: 600 }
    const card = { bgcolor: cv.paper, borderRadius: '24px', boxShadow: `inset 0 0 0 1px ${cv.border}` }
    const ghost = { display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 34, px: 1.5, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'background-color .15s', '&:hover': { bgcolor: 'rgba(255,255,255,.05)' } }
    const rise = (d: number) => ({ animation: `pfIn .45s cubic-bezier(.22,1,.36,1) ${d}s both`, '@keyframes pfIn': { from: { opacity: 0, transform: 'translateY(10px)' } } })
    const field = { '& .MuiOutlinedInput-root': { color: cv.text } }

    return (
        <Box component="main" sx={{ maxWidth: 760, mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 4 }, pb: 4, boxSizing: 'border-box', textAlign: 'left', color: cv.text }}>
            {/* Identity: who, which year, level — one quiet card */}
            <Box sx={{ ...card, p: { xs: 2, sm: 2.5 }, ...rise(0) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                    <Box sx={{ width: 60, height: 60, borderRadius: '18px', bgcolor: cv.surface, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <BeardMascot size={46} variant="happy" outfit={userProgress.currentOutfit} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 21, sm: 24 }, fontWeight: 700, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {userProfile.name || 'Estudante'}
                            </Typography>
                            <Box component="button" aria-label="Mudar o nome" onClick={handleNameEditClick} sx={{ width: 28, height: 28, border: 0, borderRadius: '50%', bgcolor: 'transparent', color: cv.faint, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, '&:hover': { bgcolor: cv.surface, color: cv.text } }}>
                                <EditOutlined sx={{ fontSize: 15 }} />
                            </Box>
                        </Box>
                        <Typography sx={{ fontSize: 13.5, color: cv.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {[me?.handle && `@${me.handle}`, ptYearLabel(userProfile.schoolYear), courseInfo(userProfile.course)?.short].filter(Boolean).join(' · ')}
                        </Typography>
                    </Box>
                    <Box component="button" onClick={() => { soundManager.playClick(); setYearOpen(true) }} sx={{ ...ghost, flexShrink: 0 }}>
                        <SchoolRounded sx={{ fontSize: 16 }} />Mudar ano
                    </Box>
                </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25, mt: 1.25 }}>
                {stats.map((st, i) => (
                    <Box key={st.label} sx={{ ...card, borderRadius: '20px', p: 2, ...rise(0.05 + i * 0.04) }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '11px', bgcolor: st.color, color: '#1d2742', display: 'grid', placeItems: 'center', '& svg': { fontSize: 20 } }}>{st.icon}</Box>
                        <Typography sx={{ fontFamily: cv.display, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', mt: 1.25, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{st.value}</Typography>
                        <Typography sx={{ fontSize: 13, color: cv.muted, mt: 0.25 }}>{st.label}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Subjects */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 1.5, ...rise(0.2) }}>
                <Typography sx={heading}>As tuas disciplinas <Box component="span" sx={{ color: cv.muted, fontWeight: 500 }}>· {userProfile.selectedSubjects.length}</Box></Typography>
                <Box component="button" onClick={() => { soundManager.playClick(); setPickerOpen(true) }} sx={ghost}><TuneRounded sx={{ fontSize: 16 }} />{pt ? 'Editar' : 'Edit'}</Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ...rise(0.24) }}>
                {(allSubjects ? userProfile.selectedSubjects : userProfile.selectedSubjects.slice(0, SUBJECTS_SHOWN)).map((s) => (
                    <Box key={s} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, p: '6px 14px 6px 6px', borderRadius: '16px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
                        <SubjectTile subject={s} size={34} />
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{subjectName(s)}</Typography>
                    </Box>
                ))}
                {userProfile.selectedSubjects.length > SUBJECTS_SHOWN && (
                    <Box component="button" onClick={() => { soundManager.playClick(); setAllSubjects((v) => !v) }}
                        sx={{ display: 'inline-flex', alignItems: 'center', height: 46, px: 1.75, border: 0, borderRadius: '16px', bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,.04)' } }}>
                        {allSubjects ? 'Mostrar menos' : `+${userProfile.selectedSubjects.length - SUBJECTS_SHOWN} mais`}
                    </Box>
                )}
            </Box>

            {/* Friends */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 1.5, ...rise(0.28) }}>
                <Typography sx={heading}>Amigos{social ? <Box component="span" sx={{ color: cv.muted, fontWeight: 500 }}> · {social.friends.length}</Box> : null}</Typography>
                {me && <Box component="button" onClick={onAddFriend} sx={ghost}><PersonAddAlt1Outlined sx={{ fontSize: 16 }} />Adicionar<QrCode2Rounded sx={{ fontSize: 16, color: cv.muted }} /></Box>}
            </Box>
            <Box sx={rise(0.32)}>
                {me && social ? (
                    <FriendsPanel me={me} friends={social.friends} incoming={social.incoming} outgoing={social.outgoing} onAdd={() => onAddFriend?.()} onMessage={onMessage} />
                ) : (
                    <Box sx={{ ...card, p: 2.25 }}>
                        <SocialSetup user={user} userProfile={userProfile} xp={userProgress.xp} onUpdateProfile={onUpdateProfile} />
                    </Box>
                )}
            </Box>

            <SchoolYearDialog open={yearOpen} profile={userProfile} onClose={() => setYearOpen(false)} onSave={(u) => { onUpdateProfile?.(u); setYearOpen(false) }} />
            {me && (
                <NameClaimDialog open={claimOpen} uid={me.uid} currentName={userProfile.name || ''} title="Mudar o teu nome" text="O teu nome é o teu ID no Mivvi: tem de ser único. Só o podes mudar de 15 em 15 dias."
                    extra={{ year: userProfile.schoolYear, xp: userProgress.xp }} onClose={() => setClaimOpen(false)}
                    onDone={(name) => { onUpdateProfile?.({ name, handle: toHandle(name), lastNameChangeDate: new Date().toISOString() }); setClaimOpen(false) }} />
            )}

            <SubjectPicker open={pickerOpen} selected={userProfile.selectedSubjects} language={lang} schoolYear={userProfile.schoolYear} course={userProfile.course} onClose={() => setPickerOpen(false)}
                onSave={(subjects, course) => { onUpdateProfile?.({ selectedSubjects: subjects, ...(course && { course }) }); setPickerOpen(false) }} />

            {/* Edit name */}
            <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#1f1f1f', borderRadius: '24px', m: 2 } }}>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700, mb: 2 }}>{t('profile_name_edit_title', lang)}</Typography>
                    <TextField autoFocus fullWidth value={editName} placeholder={t('profile_name_placeholder', lang)} onChange={(e) => { setEditName(e.target.value); setNameError('') }} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName() }} error={!!nameError} helperText={nameError} sx={field} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button variant="text" onClick={() => setIsEditDialogOpen(false)}>{t('cancel', lang)}</Button>
                    <Button variant="contained" onClick={handleSaveName}>{t('save', lang)}</Button>
                </DialogActions>
            </Dialog>

            {/* Name change limit */}
            <Dialog open={isRestrictionDialogOpen} onClose={() => setIsRestrictionDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#1f1f1f', borderRadius: '24px', m: 2 } }}>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography sx={{ color: cv.muted }}>{restrictionMessage}</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button variant="contained" onClick={() => setIsRestrictionDialogOpen(false)}>{t('profile_understood', lang)}</Button>
                </DialogActions>
            </Dialog>

        </Box>
    )
}
