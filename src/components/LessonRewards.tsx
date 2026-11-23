import { Dialog, Box, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { BoltOutlined, TrackChangesOutlined, CheckCircleOutline, ArrowForward } from '@mui/icons-material';
import { soundManager } from '../utils/soundEffects';
import { t } from '../utils/translations';
import Mascot from './Mascot';
import { cv } from '../theme';

// End of a lesson: Mivvi celebrating, a short line, and three numbers that
// count up in a quiet hairline grid.

interface LessonRewardsProps {
    open: boolean;
    xpGained: number;
    correctAnswers: number;
    totalQuestions: number;
    onClose: () => void;
    gemsEarned?: number;
    language?: string;
    outfit?: string;
}

function CountUp({ to, run, suffix = '' }: { to: number; run: boolean; suffix?: string }) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!run) { setValue(0); return; }
        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / 900);
            setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [to, run]);
    return <>{value}{suffix}</>;
}

export default function LessonRewards({ open, xpGained, correctAnswers, totalQuestions, onClose, language = 'pt-BR', outfit }: LessonRewardsProps) {
    const [ready, setReady] = useState(false);
    const accuracy = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const great = accuracy >= 80;

    useEffect(() => {
        if (!open) return;
        setReady(false);
        const timer = setTimeout(() => { setReady(true); soundManager.playSuccess(); }, 250);
        return () => clearTimeout(timer);
    }, [open]);

    const line = great ? 'Excelente! Estás a dominar esta matéria.' : accuracy >= 50 ? 'Bom trabalho! Mais uma lição e fica perfeito.' : 'Cada erro é uma pista. Vamos continuar!';
    const stats = [
        { icon: <BoltOutlined />, color: cv.butter, value: xpGained, suffix: '', label: 'XP' },
        { icon: <TrackChangesOutlined />, color: '#9fc9ff', value: accuracy, suffix: '%', label: t('accuracy', language) },
        { icon: <CheckCircleOutline />, color: cv.mint, value: correctAnswers, suffix: `/${totalQuestions}`, label: t('hits', language) },
    ];
    const up = (delay: number) => ({ animation: ready ? `rwUp .45s cubic-bezier(.22,1,.36,1) ${delay}s both` : 'none', opacity: ready ? undefined : 0, '@keyframes rwUp': { from: { opacity: 0, transform: 'translateY(10px)' } } });

    return (
        <Dialog open={open} fullScreen PaperProps={{ sx: { bgcolor: cv.bg, border: 0, borderRadius: 0, color: cv.text } }}>
            <Box sx={{ minHeight: '100%', display: 'grid', placeItems: 'center', px: 3, py: 4, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                {/* A few pastel confetti pieces falling once */}
                {ready && great && Array.from({ length: 18 }).map((_, i) => (
                    <Box key={i} aria-hidden sx={{
                        position: 'absolute', top: -20, left: `${(i * 53) % 100}%`, width: 8, height: 14, borderRadius: '3px',
                        bgcolor: [cv.mint, cv.butter, '#9fc9ff', cv.coral, '#ff9fbb'][i % 5],
                        animation: `rwFall ${1.8 + (i % 5) * 0.3}s cubic-bezier(.3,.6,.5,1) ${(i % 6) * 0.08}s both`,
                        '@keyframes rwFall': { from: { transform: 'translateY(0) rotate(0)' }, to: { transform: `translateY(105vh) rotate(${(i % 2 ? 1 : -1) * 420}deg)`, opacity: 0.2 } },
                    }} />
                ))}

                <Box sx={{ width: '100%', maxWidth: 440, display: 'grid', justifyItems: 'center' }}>
                    <Box sx={up(0)}><Mascot size={120} mood="celebrating" outfit={outfit} /></Box>
                    <Typography sx={{ fontFamily: cv.display, fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', mt: 2.5, ...up(0.08) }}>
                        {t('training_complete', language)}
                    </Typography>
                    <Typography sx={{ color: cv.muted, mt: 1, ...up(0.14) }}>{line}</Typography>

                    <Box sx={{ width: '100%', mt: 4, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1px solid ${cv.border}`, borderRadius: '18px', overflow: 'hidden', ...up(0.2) }}>
                        {stats.map((s, i) => (
                            <Box key={s.label} sx={{ py: 2.25, px: 1, borderLeft: i ? `1px solid ${cv.border}` : 0 }}>
                                <Box sx={{ color: s.color, '& svg': { fontSize: 20 } }}>{s.icon}</Box>
                                <Typography sx={{ fontFamily: cv.display, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                                    <CountUp to={s.value} run={ready} suffix={s.suffix} />
                                </Typography>
                                <Typography sx={{ fontSize: 12.5, color: cv.muted }}>{s.label}</Typography>
                            </Box>
                        ))}
                    </Box>

                    <Box component="button" autoFocus onClick={() => { soundManager.playClick(); onClose(); }}
                        sx={{ mt: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: 48, width: '100%', maxWidth: 320, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer', '&:hover': { bgcolor: '#e6e6e6' }, ...up(0.28) }}>
                        {t('continue_journey', language)} <ArrowForward sx={{ fontSize: 18 }} />
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
}
