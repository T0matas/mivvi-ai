import { Box, Typography, Dialog, DialogContent, TextField, DialogActions, Button } from '@mui/material'
import { EditOutlined, LocalFireDepartmentRounded, StarRounded, BoltRounded, SchoolRounded, PersonAddAlt1Outlined, TuneRounded } from '@mui/icons-material'
import { SubjectTile } from './SubjectDoodle'
import { subjectName, yearLabel as ptYearLabel, courseInfo } from '../data/ptCurriculum'
import SubjectPicker from './SubjectPicker'
import { cv } from '../theme'
import { useState, useEffect } from 'react'
import { UserProfile, UserProgress } from '../types'
import BeardMascot from './BeardMascot';
import { soundManager } from '../utils/soundEffects'
import { t } from '../utils/translations'

import { api } from '../utils/api'

interface ProfileProps {
    userProfile: UserProfile
    userProgress: UserProgress
    onUpdateProfile?: (updates: Partial<UserProfile>) => void
    onClaimReward?: (amount: number) => void
}

export default function Profile({ userProfile, userProgress, onUpdateProfile }: ProfileProps) {

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [nameError, setNameError] = useState('')

    // Restriction Dialog State
    const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false)
    const [restrictionMessage, setRestrictionMessage] = useState('')

    // Add Friend Dialog State
    const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
    const [friendNameInput, setFriendNameInput] = useState('')
    const [friendsList, setFriendsList] = useState<string[]>(userProfile.friends || [])

    const [friendError, setFriendError] = useState('')
    useEffect(() => { setFriendsList(userProfile.friends || []) }, [userProfile.friends])

    // Friends are kept on the profile (this device). With an account, the
    // server list is tried too, but the app never depends on it.
    const handleAddFriend = async () => {
        const name = friendNameInput.trim().replace(/s+/g, ' ')
        if (name.length < 2) { setFriendError('Escreve pelo menos 2 letras.'); return }
        if (friendsList.some((f) => f.toLowerCase() === name.toLowerCase())) { setFriendError('Esse amigo já está na tua lista.'); return }
        if (userProfile.name && name.toLowerCase() === userProfile.name.toLowerCase()) { setFriendError('Não te podes adicionar a ti próprio 🙂'); return }
        const next = [...friendsList, name]
        setFriendsList(next)
        onUpdateProfile?.({ friends: next })
        if (userProfile.uid) api.addFriend(userProfile.uid, name).catch(() => { /* offline: the local list is enough */ })
        soundManager.playSuccess()
        setFriendNameInput('')
        setFriendError('')
        setIsAddFriendOpen(false)
    }

    const removeFriend = (name: string) => {
        const next = friendsList.filter((f) => f !== name)
        setFriendsList(next)
        onUpdateProfile?.({ friends: next })
        soundManager.playClick()
    }

    const lang = userProfile.language || 'pt-BR'

    // Stats Data
    const stats = [
        { label: t('streak', lang), value: userProgress.streak, icon: <LocalFireDepartmentRounded />, color: '#ff9f88' },
        { label: t('total_xp', lang), value: userProgress.xp, icon: <StarRounded />, color: cv.butter },
        { label: t('daily_xp', lang), value: userProgress.dailyXP || 0, icon: <BoltRounded />, color: '#9fc9ff' },
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
        setEditName(userProfile.name || '')
        setIsEditDialogOpen(true)
    }

    const handleSaveName = () => {
        if (editName.trim().length < 3) {
            setNameError(t('profile_name_error_short', lang))
            return
        }

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
    const level = Math.floor(userProgress.xp / 100) + 1
    const levelPct = userProgress.xp % 100
    const pt = lang.startsWith('pt')
    const R = 34, C = 2 * Math.PI * R
    const heading = { fontSize: 15, fontWeight: 600 }
    const card = { bgcolor: cv.paper, borderRadius: '24px', boxShadow: `inset 0 0 0 1px ${cv.border}` }
    const ghost = { display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 34, px: 1.5, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'background-color .15s', '&:hover': { bgcolor: 'rgba(255,255,255,.05)' } }
    const rise = (d: number) => ({ animation: `pfIn .45s cubic-bezier(.22,1,.36,1) ${d}s both`, '@keyframes pfIn': { from: { opacity: 0, transform: 'translateY(10px)' } } })
    const field = { '& .MuiOutlinedInput-root': { color: cv.text } }
    const chip = { display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 28, px: 1.25, borderRadius: 999, bgcolor: cv.surface, fontSize: 13, color: '#d4d4d8' }

    return (
        <Box component="main" sx={{ maxWidth: 760, mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 4 }, pb: 4, boxSizing: 'border-box', textAlign: 'left', color: cv.text }}>
            {/* Identity */}
            <Box sx={{ ...card, p: { xs: 2.25, sm: 3 }, display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 2.5 }, flexWrap: 'wrap', ...rise(0) }}>
                <Box sx={{ width: 84, height: 84, borderRadius: '24px', bgcolor: cv.surface, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <BeardMascot size={64} variant="happy" outfit={userProgress.currentOutfit} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 24, sm: 28 }, fontWeight: 700, letterSpacing: '-0.025em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {userProfile.name || (pt ? 'Estudante' : 'Student')}
                        </Typography>
                        <Box component="button" aria-label={t('profile_name_edit_title', lang)} onClick={handleNameEditClick} sx={{ width: 32, height: 32, border: 0, borderRadius: '50%', bgcolor: 'transparent', color: cv.muted, cursor: 'pointer', display: 'grid', placeItems: 'center', '&:hover': { bgcolor: cv.surface, color: cv.text } }}>
                            <EditOutlined sx={{ fontSize: 17 }} />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                        {ptYearLabel(userProfile.schoolYear) && <Box component="span" sx={chip}>{ptYearLabel(userProfile.schoolYear)}</Box>}
                        {courseInfo(userProfile.course) && <Box component="span" sx={chip}>{courseInfo(userProfile.course)!.name}</Box>}
                    </Box>
                </Box>
                {/* Level ring */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ position: 'relative', width: 80, height: 80 }}>
                        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                            <circle cx="40" cy="40" r={R} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - levelPct / 100)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)' }} />
                        </svg>
                        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1 }}>
                            <Box>
                                <Typography sx={{ fontFamily: cv.display, fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{level}</Typography>
                                <Typography sx={{ fontSize: 10.5, color: cv.muted, mt: 0.25 }}>{pt ? 'nível' : 'level'}</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: 12.5, color: cv.muted, maxWidth: 90, lineHeight: 1.4 }}>{100 - levelPct} XP {pt ? 'para o próximo' : 'to next level'}</Typography>
                </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.25, mt: 1.25 }}>
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
                <Typography sx={heading}>{t('friends_list', lang)}</Typography>
                <Box component="button" onClick={() => setIsAddFriendOpen(true)} sx={ghost}><PersonAddAlt1Outlined sx={{ fontSize: 16 }} />{t('add_friend', lang)}</Box>
            </Box>
            <Box sx={{ ...card, overflow: 'hidden', ...rise(0.32) }}>
                {friendsList.length ? friendsList.map((friend, i) => (
                    <Box key={friend + i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderTop: i ? `1px solid ${cv.border}` : 0 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: '11px', bgcolor: ['#a9c8f5', '#c0eadb', '#ffdb7c', '#ff9fbb'][i % 4], color: '#1d2742', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700 }}>{friend.charAt(0).toUpperCase()}</Box>
                        <Typography sx={{ fontWeight: 500, flex: 1 }}>{friend}</Typography>
                        <Box component="button" onClick={() => removeFriend(friend)} sx={{ border: 0, bgcolor: 'transparent', color: cv.faint, font: 'inherit', fontSize: 13, cursor: 'pointer', '&:hover': { color: cv.coral } }}>Remover</Box>
                    </Box>
                )) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 2 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: cv.surface, display: 'grid', placeItems: 'center', flexShrink: 0 }}><BeardMascot size={30} variant="default" /></Box>
                        <Typography sx={{ color: cv.muted, fontSize: 14 }}>{t('no_friends', lang)}</Typography>
                    </Box>
                )}
            </Box>

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

            {/* Add friend */}
            <Dialog open={isAddFriendOpen} onClose={() => { setIsAddFriendOpen(false); setFriendError('') }} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#1f1f1f', borderRadius: '24px', m: 2 } }}>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700, mb: 2 }}>{t('add_friend', lang)}</Typography>
                    <TextField autoFocus fullWidth value={friendNameInput} placeholder={t('friend_name_placeholder', lang)} onChange={(e) => { setFriendNameInput(e.target.value); setFriendError('') }} onKeyDown={(e) => { if (e.key === 'Enter') handleAddFriend() }} error={!!friendError} helperText={friendError || ' '} sx={field} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button variant="text" onClick={() => setIsAddFriendOpen(false)}>{t('cancel', lang)}</Button>
                    <Button variant="contained" onClick={handleAddFriend} disabled={!friendNameInput.trim()}>{t('add_btn', lang)}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
