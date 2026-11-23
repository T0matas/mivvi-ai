import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import Mascot from './Mascot';
import { SubjectTile } from './SubjectDoodle';
import { cv } from '../theme';

interface SplashScreenProps {
    onComplete: () => void;
}

// Opening: eight subject tiles pop into a 3×3 grid one after another, Mivvi
// lands in the middle square and waves, then everything gathers and fades.
const TILES = ['matematica', 'portugues', 'fq_a', 'ingles', 'historia', 'biologia', 'geografia', 'tic'];
const ORDER = [0, 1, 2, 5, 8, 7, 6, 3]; // clockwise around the centre

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const out = setTimeout(() => setLeaving(true), 1700);
        const done = setTimeout(onComplete, 2100);
        return () => { clearTimeout(out); clearTimeout(done); };
    }, [onComplete]);

    return (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 9999, bgcolor: cv.bg, display: 'grid', placeItems: 'center',
            opacity: leaving ? 0 : 1, transition: 'opacity .35s ease .05s',
            '@keyframes spTile': { from: { opacity: 0, transform: 'scale(.3) rotate(-12deg)' } },
            '@keyframes spMivvi': { '0%': { opacity: 0, transform: 'translateY(-40px) scale(.6)' }, '70%': { opacity: 1, transform: 'translateY(4px) scale(1.04)' }, '100%': { transform: 'none' } } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 1.25, transform: leaving ? 'scale(.85)' : 'none', transition: 'transform .4s cubic-bezier(.65,0,.35,1)' }}>
                {Array.from({ length: 9 }).map((_, cell) => {
                    if (cell === 4) {
                        return (
                            <Box key="mivvi" sx={{ width: 64, height: 64, borderRadius: '18px', bgcolor: cv.surface, display: 'grid', placeItems: 'center', animation: 'spMivvi .6s cubic-bezier(.22,1,.36,1) .75s both' }}>
                                <Mascot size={52} mood="happy" />
                            </Box>
                        );
                    }
                    const step = ORDER.indexOf(cell);
                    return (
                        <Box key={cell} sx={{ animation: `spTile .45s cubic-bezier(.34,1.56,.64,1) ${0.05 + step * 0.07}s both` }}>
                            <SubjectTile subject={TILES[step]} size={64} />
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default SplashScreen;
