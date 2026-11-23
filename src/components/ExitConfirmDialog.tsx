import { Dialog, Box, Typography } from '@mui/material';
import { t } from '../utils/translations';
import Mascot from './Mascot';
import { cv } from '../theme';

// Leaving a lesson: Mivvi looks sad, one line of text, and two buttons side by
// side — stay (white) or leave (quiet coral outline).

interface ExitConfirmDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    language?: string;
    outfit?: string;
    isTutorial?: boolean;
}

export default function ExitConfirmDialog({ open, onConfirm, onCancel, language = 'pt-BR', outfit = 'default' }: ExitConfirmDialogProps) {
    const pill = { flex: 1, height: 46, border: 0, borderRadius: 999, font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', transition: 'background-color .15s, transform .15s', '&:active': { transform: 'scale(.98)' } };
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth
            PaperProps={{ sx: { bgcolor: '#1f1f1f', borderRadius: '26px', color: cv.text, m: 2, overflow: 'visible',
                animation: 'exIn .32s cubic-bezier(.22,1,.36,1) both', '@keyframes exIn': { from: { opacity: 0, transform: 'translateY(12px) scale(.97)' } } } }}>
            <Box sx={{ p: 3, pt: 3.5, display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
                <Box sx={{ width: 88, height: 88, borderRadius: '50%', bgcolor: 'rgba(255,159,136,.1)', display: 'grid', placeItems: 'center' }}>
                    <Mascot size={64} mood="sad" outfit={outfit} />
                </Box>
                <Typography sx={{ fontFamily: cv.display, fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', mt: 2 }}>
                    {t('exit_confirm_title', language)}
                </Typography>
                <Typography sx={{ fontSize: 14.5, color: cv.muted, mt: 0.75, lineHeight: 1.5, maxWidth: 300 }}>
                    {t('exit_confirm_message', language)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, width: '100%', mt: 3 }}>
                    <Box component="button" onClick={onConfirm} sx={{ ...pill, bgcolor: 'transparent', color: cv.coral, boxShadow: 'inset 0 0 0 1px rgba(255,159,136,.35)', '&:hover': { bgcolor: 'rgba(255,159,136,.08)' } }}>
                        {t('exit_anyway', language)}
                    </Box>
                    <Box component="button" autoFocus onClick={onCancel} sx={{ ...pill, bgcolor: '#fff', color: '#0d0d0d', '&:hover': { bgcolor: '#e6e6e6' } }}>
                        {t('continue_learning', language)}
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
}
