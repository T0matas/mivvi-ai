import { Dialog, Box, Typography } from '@mui/material';
import { LogoutRounded } from '@mui/icons-material';
import Mascot from './Mascot';
import { soundManager } from '../utils/soundEffects';
import { cv } from '../theme';

// Leaving a lesson: the same quiet card as the app's other dialogs — Mivvi
// beside the title, one plain line, and the two choices as pills (stay is
// the white one).

interface ExitConfirmDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    language?: string;
    outfit?: string;
    isTutorial?: boolean;
    /** Optional custom text (e.g. for the final exam). */
    title?: string;
    message?: string;
    confirmLabel?: string;
}

export default function ExitConfirmDialog({ open, onConfirm, onCancel, outfit = 'default', title, message, confirmLabel }: ExitConfirmDialogProps) {
    const pill = { height: 42, px: 2.25, border: 0, borderRadius: 999, font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.75, transition: 'background-color .15s, transform .15s', '&:active': { transform: 'scale(.98)' } };
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth sx={{ zIndex: 2100 }}
            PaperProps={{ sx: { bgcolor: '#1c1c1c', borderRadius: '24px', color: cv.text, m: 2, p: 2.5, textAlign: 'left', boxShadow: `inset 0 0 0 1px ${cv.border}, 0 24px 60px rgba(0,0,0,.55)`,
                animation: 'exIn .28s cubic-bezier(.22,1,.36,1) both', '@keyframes exIn': { from: { opacity: 0, transform: 'translateY(10px)' } } } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: cv.surface, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Mascot size={34} mood="sad" outfit={outfit} animated={false} />
                </Box>
                <Typography sx={{ fontFamily: cv.display, fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em' }}>{title || 'Sair da lição?'}</Typography>
            </Box>
            <Typography sx={{ fontSize: 14.5, color: cv.muted, mt: 1.5, lineHeight: 1.55 }}>
                {message || 'O que fizeste nesta lição não fica guardado. Podes voltar a começá-la quando quiseres.'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2.5 }}>
                <Box component="button" onClick={() => { soundManager.playBack(); onConfirm() }} sx={{ ...pill, bgcolor: 'transparent', color: cv.coral, '&:hover': { bgcolor: 'rgba(255,159,136,.08)' } }}>
                    <LogoutRounded sx={{ fontSize: 17 }} />{confirmLabel || 'Sair'}
                </Box>
                <Box component="button" autoFocus onClick={() => { soundManager.playClick(); onCancel() }} sx={{ ...pill, bgcolor: '#fff', color: '#0d0d0d', '&:hover': { bgcolor: '#e6e6e6' } }}>
                    Continuar
                </Box>
            </Box>
        </Dialog>
    );
}
