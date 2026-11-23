import { Box } from '@mui/material';
import { HomeRounded, FlagRounded, ChatBubbleRounded } from '@mui/icons-material';
import { soundManager } from '../utils/soundEffects';
import { cv } from '../theme';

interface BottomNavProps {
    value: number;
    onChange: (newValue: number) => void;
}

// Mivvi's dock: a small floating bar at the bottom. The active section grows
// into a white pill with its name; the others stay as quiet icons.
const ITEMS = [
    { icon: HomeRounded, label: 'Início' },
    { icon: FlagRounded, label: 'Missões', id: 'tutorial-missions-tab' },
    { icon: ChatBubbleRounded, label: 'Mivvi' },
];

export default function BottomNav({ value, onChange }: BottomNavProps) {
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
            {ITEMS.map(({ icon: Icon, label, id }, index) => {
                const active = value === index;
                return (
                    <Box
                        key={label}
                        component="button"
                        id={id}
                        type="button"
                        aria-label={label}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => { if (!active) { soundManager.playClick(); onChange(index); } }}
                        sx={{
                            display: 'inline-flex', alignItems: 'center', gap: active ? 1 : 0,
                            height: 44, px: active ? 2 : 1.5, border: 0, borderRadius: 999, cursor: 'pointer',
                            font: 'inherit', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
                            color: active ? '#0d0d0d' : cv.muted,
                            bgcolor: active ? '#fff' : 'transparent',
                            transition: 'background-color .25s, color .2s, padding .3s cubic-bezier(.22,1,.36,1), gap .3s',
                            '&:hover': { color: active ? '#0d0d0d' : cv.text },
                            '& .dock-label': { maxWidth: active ? 90 : 0, opacity: active ? 1 : 0, overflow: 'hidden', transition: 'max-width .3s cubic-bezier(.22,1,.36,1), opacity .2s' },
                        }}
                    >
                        <Icon sx={{ fontSize: 21 }} />
                        <span className="dock-label">{label}</span>
                    </Box>
                );
            })}
        </Box>
    );
}
