import { AppBar, Toolbar, Box, Typography, styled, Popover, Dialog } from '@mui/material';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { yearLabel, courseInfo } from '../data/ptCurriculum';
import { useEffect, useState } from 'react';
import { LocalFireDepartment, Bolt } from '@mui/icons-material';
import { UserProgress, UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../utils/soundEffects';
import { cv } from '../theme';

interface TopBarProps {
    userProgress: UserProgress;
    userProfile: UserProfile;
    onRefillHearts?: () => void;
    onPurchaseOutfit?: (outfitId: string, cost: number) => boolean;
    onEquipOutfit?: (outfitId: string) => void;
    currentOutfit?: string;
    onOpenProfile?: () => void;
    onOpenAccount?: () => void;
    onHome?: () => void;
}

const StatBox = styled('button')(() => ({
    border: 0,
    background: 'none',
    font: 'inherit',
    display: 'flex',
    alignItems: 'center',
    padding: '4px 12px', // More compact
    borderRadius: '50px', // Full pill
    gap: '4px',
    fontWeight: 500,
    fontSize: '0.9rem',
    fontVariantNumeric: 'tabular-nums',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
        backgroundColor: cv.surface
    }
}));

export default function TopBar({ userProgress, userProfile, onOpenProfile, onOpenAccount, onHome }: TopBarProps) {
    const navigate = useNavigate();
    const [info, setInfo] = useState<{ el: HTMLElement; kind: 'xp' | 'streak' } | null>(null);
    const [menu, setMenu] = useState<HTMLElement | null>(null);
    const [confirmOut, setConfirmOut] = useState(false);
    const [account, setAccount] = useState<User | null>(auth.currentUser);
    const [photoFailed, setPhotoFailed] = useState(false);
    useEffect(() => onAuthStateChanged(auth, (u) => { setAccount(u); setPhotoFailed(false); }), []);
    const name = userProfile?.name || account?.displayName || 'Estudante';
    const meta = [yearLabel(userProfile?.schoolYear), courseInfo(userProfile?.course)?.short].filter(Boolean).join(' · ') || (account ? 'Com conta' : 'Sem conta');

    // Ending the session signs out of the account and clears this device's
    // profile and progress, then goes back to the welcome screen.
    const endSession = async () => {
        try { await signOut(auth); } catch { /* not signed in */ }
        ['mivvi_userProfile', 'mivvi_userProgress', 'mivvi_selectedSubject', 'mivvi_recentSubjects', 'mivvi_lastActivity', 'userProfile']
            .forEach((k) => localStorage.removeItem(k));
        window.location.href = '/welcome';
    };
    const menuItem = { display: 'block', width: '100%', textAlign: 'left' as const, border: 0, bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14.5, fontWeight: 500, px: 2, py: 1.25, borderRadius: '12px', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } };
    const level = Math.floor(userProgress.xp / 100) + 1;
    const levelPct = userProgress.xp % 100;

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: cv.bg,
                borderBottom: `1px solid ${cv.border}`,
                color: cv.text,
                zIndex: 1100,
                pt: 'env(safe-area-inset-top, 0px)',
                height: 'auto',
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: '56px', sm: '56px' }, py: 0, px: { xs: 1.5, sm: 3 }, gap: 1 }}>
                {/* Brand (left): back to the home screen */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box component="button" type="button" aria-label="Início" onClick={() => { soundManager.playClick(); onHome ? onHome() : navigate('/dashboard'); }}
                                            sx={{ border: 0, bgcolor: 'transparent', p: '4px 8px', ml: -1, borderRadius: '10px', cursor: 'pointer', font: 'inherit', fontWeight: 600, fontSize: 15, letterSpacing: '-0.015em', color: '#f2f2f7', transition: 'background-color .15s', '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}>mivvi</Box>
                    
                </Box>

                <Box sx={{ flex: 1 }} />

                {/* Stats (Right) */}
                <Box id="tutorial-stats" sx={{ display: 'flex', gap: { xs: 0.5, sm: 2 } }}>
                    

                    <StatBox id="tutorial-xp" aria-label="XP" onClick={(e) => { soundManager.playClick(); setInfo({ el: e.currentTarget, kind: 'xp' }); }} sx={{ color: cv.accent, padding: { xs: '2px 6px', sm: '6px 12px' }, gap: { xs: '4px', sm: '6px' } }}>
                        <Bolt sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        <Typography variant="subtitle1" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, color: cv.text, fontVariantNumeric: 'tabular-nums' }}>
                            {userProgress.xp}
                        </Typography>
                    </StatBox>

                    <StatBox id="tutorial-streak" aria-label="Lições perfeitas seguidas" onClick={(e) => { soundManager.playClick(); setInfo({ el: e.currentTarget, kind: 'streak' }); }} sx={{
                        color: cv.butter,
                        padding: { xs: '2px 6px', sm: '6px 12px' },
                        gap: { xs: '4px', sm: '6px' }
                    }}>
                        <LocalFireDepartment sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        <Typography variant="subtitle1" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, color: cv.text }}>
                            {userProgress.streak}
                        </Typography>
                    </StatBox>

                    
                </Box>
                <Box
                    component="button"
                    type="button"
                    aria-label="Conta"
                    aria-haspopup="menu"
                    onClick={(e) => { soundManager.playClick(); setMenu(e.currentTarget); }}
                    sx={{ width: 32, height: 32, flexShrink: 0, ml: { xs: 0.5, sm: 1.5 }, borderRadius: '50%', border: 0, p: 0, overflow: 'hidden', cursor: 'pointer', bgcolor: account?.photoURL && !photoFailed ? 'transparent' : cv.accentStrong, color: '#fff', font: 'inherit', fontSize: 14, fontWeight: 500, display: 'grid', placeItems: 'center' }}
                >
                    {account?.photoURL && !photoFailed
                        ? <Box component="img" src={account.photoURL} alt="" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} sx={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                        : name.trim().charAt(0).toUpperCase()}
                </Box>
                {/* Account menu */}
                <Popover open={!!menu} anchorEl={menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ sx: { mt: 1, p: 0.75, width: 240, bgcolor: '#2a2a2a', borderRadius: '20px', color: cv.text, textAlign: 'left' } }}>
                    <Box component="button" onClick={() => { setMenu(null); onOpenProfile?.(); }} sx={{ ...menuItem, py: 1.5 }}>
                        <Box sx={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Box>
                        <Box sx={{ fontSize: 13, color: cv.muted, mt: 0.25 }}>{meta}</Box>
                    </Box>
                    <Box sx={{ height: '1px', bgcolor: cv.border, mx: 1.5, my: 0.5 }} />
                    <Box component="button" onClick={() => { setMenu(null); (onOpenAccount || onOpenProfile)?.(); }} sx={menuItem}>Conta e privacidade</Box>
                    <Box component="button" onClick={() => { setMenu(null); setConfirmOut(true); }} sx={menuItem}>Terminar sessão</Box>
                </Popover>

                {/* Confirm ending the session */}
                <Dialog open={confirmOut} onClose={() => setConfirmOut(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#1f1f1f', borderRadius: '24px', m: 2, p: 3, color: cv.text, textAlign: 'left' } }}>
                    <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700 }}>Terminar sessão?</Typography>
                    <Typography sx={{ fontSize: 14.5, color: cv.muted, mt: 1, lineHeight: 1.5 }}>
                        {account
                            ? 'Vais sair da tua conta neste dispositivo. O progresso guardado aqui será apagado.'
                            : 'Estás a usar o Mivvi sem conta: ao terminar a sessão, o teu progresso neste dispositivo é apagado e não pode ser recuperado.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                        <Box component="button" autoFocus onClick={() => setConfirmOut(false)} sx={{ flex: 1, height: 44, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: '#e6e6e6' } }}>Cancelar</Box>
                        <Box component="button" onClick={endSession} sx={{ flex: 1, height: 44, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,159,136,.4)', color: cv.coral, font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,159,136,.08)' } }}>Terminar sessão</Box>
                    </Box>
                </Dialog>

                <Popover open={!!info} anchorEl={info?.el} onClose={() => setInfo(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    PaperProps={{ sx: { mt: 1, p: 2, width: 240, bgcolor: '#222', borderRadius: '18px', color: cv.text, textAlign: 'left' } }}>
                    {info?.kind === 'xp' ? (
                        <>
                            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Nível {level}</Typography>
                            <Box sx={{ height: 5, borderRadius: 999, bgcolor: 'rgba(255,255,255,.1)', overflow: 'hidden', mt: 1.25 }}>
                                <Box sx={{ width: `${levelPct}%`, height: '100%', bgcolor: cv.accent, borderRadius: 999 }} />
                            </Box>
                            <Typography sx={{ fontSize: 13, color: cv.muted, mt: 1 }}>{userProgress.xp} XP no total · faltam {100 - levelPct} XP para o nível {level + 1}.</Typography>
                            <Typography sx={{ fontSize: 13, color: cv.muted, mt: 0.75 }}>Ganhas XP ao terminar lições e missões.</Typography>
                        </>
                    ) : (
                        <>
                            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{userProgress.streak} {userProgress.streak === 1 ? 'lição perfeita' : 'lições perfeitas'} seguidas</Typography>
                            <Typography sx={{ fontSize: 13, color: cv.muted, mt: 0.75 }}>A sequência cresce cada vez que acabas uma lição sem erros, e volta a zero quando falhas.</Typography>
                        </>
                    )}
                </Popover>
            </Toolbar>
            
        </AppBar>
    );
}
