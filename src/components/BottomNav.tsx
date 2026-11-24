import { Box } from '@mui/material';
import { HomeRounded, LocalLibraryRounded, ForumRounded } from '@mui/icons-material';
import Mascot from './Mascot';
import { soundManager } from '../utils/soundEffects';
import { cv } from '../theme';

interface BottomNavProps {
    value: number;
    onChange: (newValue: number) => void;
    /** Small counters on the icons (e.g. unread messages), by tab index. */
    badges?: Record<number, number>;
}

// Mivvi's dock: a small floating bar at the bottom. The active section grows
// into a white pill with its name; the others stay as quiet icons.
const ITEMS = [
    { icon: HomeRounded, label: 'Início' },
    { icon: LocalLibraryRounded, label: 'Biblioteca' },
    { icon: ForumRounded, label: 'Chat' },
    { icon: null, label: 'Mivvi' },
];

export default function BottomNav({ value, onChange, badges = {} }: BottomNavProps) {
    return (
        <Box
            component="nav"
            aria-label="Secções"
            sx={{
                position: 'fixed',
                left: '50%',
                bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                transform: 'translateX(-50%)',
                zIndex: 1100,
                display: 'flex',
                gap: '2px',
                p: '6px',
                borderRadius: 999,
                bgcolor: 'rgba(32, 32, 32, 0.92)',
                backdropFilter: 'blur(12px)',
                boxShadow: `inset 0 0 0 1px ${cv.border}, 0 14px 34px rgba(0, 0, 0, 0.45)`,
                animation: 'dockIn .5s cubic-bezier(.22,1,.36,1) both',
                '@keyframes dockIn': { from: { opacity: 0, transform: 'translate(-50%, 16px)' } },
            }}
        >
            {ITEMS.map(({ icon: Icon, label }, index) => {
                const active = value === index;
                return (
                    <Box
                        key={label}
                        component="button"
                        type="button"
                        aria-label={label}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => { if (!active) { soundManager.playClick(); onChange(index); } }}
                        sx={{
                            position: 'relative',
                            display: 'inline-flex', alignItems: 'center', gap: active ? 1 : 0,
                            height: 44, px: active ? 2 : { xs: 1.25, sm: 1.5 }, border: 0, borderRadius: 999, cursor: 'pointer',
                            font: 'inherit', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
                            color: active ? '#0d0d0d' : cv.muted,
                            bgcolor: active ? '#fff' : 'transparent',
                            transition: 'background-color .25s, color .2s, padding .3s cubic-bezier(.22,1,.36,1), gap .3s',
                            '&:hover': { color: active ? '#0d0d0d' : cv.text },
                            '& .dock-label': { maxWidth: active ? 100 : 0, opacity: active ? 1 : 0, overflow: 'hidden', transition: 'max-width .3s cubic-bezier(.22,1,.36,1), opacity .2s' },
                        }}
                    >
                        {Icon ? <Icon sx={{ fontSize: 21 }} /> : <Mascot size={22} mood={active ? 'happy' : 'idle'} animated={false} />}
                        <span className="dock-label">{label}</span>
                        {!!badges[index] && (
                            <Box component="span" aria-label={`${badges[index]} novas`} sx={{ position: 'absolute', top: 5, right: active ? 6 : 4, minWidth: 16, height: 16, px: '4px', borderRadius: 999, bgcolor: cv.accent, color: '#0d0d0d', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center', boxShadow: '0 0 0 2px rgba(32,32,32,.95)' }}>
                                {badges[index] > 9 ? '9+' : badges[index]}
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
