import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { LocalFireDepartmentRounded } from '@mui/icons-material';
import Mascot from './Mascot';
import { cv } from '../theme';

interface StreakCelebrationProps {
    streak: number;
    onComplete: () => void;
}

// A streak of right answers: a quiet card over the lesson. The flame sits on a
// butter tile inside a ring of dots that light up one by one up to the streak,
// the number pops in, Mivvi cheers, and it all leaves after about two seconds
// (or on a tap).
const StreakCelebration: React.FC<StreakCelebrationProps> = ({ streak, onComplete }) => {
    const [leaving, setLeaving] = useState(false);
    const dots = Math.max(5, Math.min(streak, 12));

    useEffect(() => {
        const out = setTimeout(() => setLeaving(true), 2300);
        const done = setTimeout(onComplete, 2650);
        return () => { clearTimeout(out); clearTimeout(done); };
    }, [onComplete]);

    const close = () => { setLeaving(true); setTimeout(onComplete, 300); };

    return (
        <Box onClick={close} role="status" aria-live="polite"
            sx={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'grid', placeItems: 'center', bgcolor: 'rgba(0,0,0,.55)', cursor: 'pointer',
                opacity: leaving ? 0 : 1, transition: 'opacity .3s ease',
                '@keyframes scCard': { from: { opacity: 0, transform: 'translateY(16px) scale(.94)' } },
                '@keyframes scDot': { from: { transform: 'scale(0)' }, '60%': { transform: 'scale(1.3)' } },
                '@keyframes scFlame': { '0%': { transform: 'scale(.4) rotate(-12deg)', opacity: 0 }, '60%': { transform: 'scale(1.15) rotate(4deg)', opacity: 1 }, '100%': { transform: 'none' } },
                '@keyframes scFlicker': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.06) rotate(-3deg)' } },
                '@keyframes scNum': { from: { opacity: 0, transform: 'translateY(8px)' } } }}>
            <Box sx={{ width: 'min(320px, calc(100vw - 48px))', p: 3, pt: 3.5, borderRadius: '28px', bgcolor: '#1f1f1f', boxShadow: `inset 0 0 0 1px ${cv.border}, 0 24px 60px rgba(0,0,0,.5)`, display: 'grid', justifyItems: 'center', textAlign: 'center',
                animation: 'scCard .45s cubic-bezier(.22,1,.36,1) both' }}>
                {/* Flame inside a ring of dots */}
                <Box sx={{ position: 'relative', width: 150, height: 150 }}>
                    {Array.from({ length: dots }).map((_, i) => {
                        const a = (i / dots) * 2 * Math.PI - Math.PI / 2;
                        const lit = i < streak;
                        return (
                            <Box key={i} sx={{ position: 'absolute', left: `${50 + 44 * Math.cos(a)}%`, top: `${50 + 44 * Math.sin(a)}%`, width: 12, height: 12, ml: '-6px', mt: '-6px', borderRadius: '50%',
                                bgcolor: lit ? cv.butter : 'rgba(255,255,255,.1)',
                                animation: lit ? `scDot .35s cubic-bezier(.34,1.56,.64,1) ${0.25 + i * 0.07}s both` : 'none' }} />
                        );
                    })}
                    <Box sx={{ position: 'absolute', inset: 34, borderRadius: '26px', bgcolor: cv.butter, display: 'grid', placeItems: 'center', animation: 'scFlame .6s cubic-bezier(.22,1,.36,1) .1s both' }}>
                        <LocalFireDepartmentRounded sx={{ fontSize: 50, color: '#1d2742', animation: 'scFlicker 1.6s ease-in-out .8s infinite' }} />
                    </Box>
                </Box>

                <Typography sx={{ fontFamily: cv.display, fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, mt: 2, animation: `scNum .4s cubic-bezier(.22,1,.36,1) ${0.3 + Math.min(streak, 12) * 0.07}s both` }}>
                    {streak} seguidas!
                </Typography>
                <Typography sx={{ fontSize: 14.5, color: cv.muted, mt: 1, animation: `scNum .4s ease ${0.4 + Math.min(streak, 12) * 0.07}s both` }}>
                    {streak >= 10 ? 'Imparável. Continua assim!' : 'Estás em grande. Mantém o ritmo!'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2.5, animation: `scNum .4s ease ${0.5 + Math.min(streak, 12) * 0.07}s both` }}>
                    <Mascot size={34} mood="celebrating" />
                    <Typography sx={{ fontSize: 13, color: cv.faint }}>Toca para continuar</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default StreakCelebration;
