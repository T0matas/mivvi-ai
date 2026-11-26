import { Box, SxProps, Theme } from '@mui/material'
import { ReactNode } from 'react'

// Mivvi, the mascot: a plain white head with two pointed ears and two blue pill
// eyes. Accessories are drawn like Codevantum's doodles: a dark outline and
// flat pastel fills.

export type MascotMood = 'idle' | 'happy' | 'thinking' | 'sad' | 'celebrating'

export const MASCOT_NAME = 'Mivvi'

interface MascotProps {
    size?: number
    mood?: MascotMood
    /** Accessory id (see ACCESSORIES). */
    outfit?: string
    /** Blinks and breathes gently. */
    animated?: boolean
    /** Small eye movement used for cursor tracking. */
    gaze?: { x: number; y: number }
    sx?: SxProps<Theme>
}

const EYE = '#1e4fd8'
const INK = '#171725'
const line = { stroke: INK, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

/** Drawn in front of the head (glasses, patches, masks). */
const FRONT: Record<string, ReactNode> = {
    scientist: (
        <>
            <circle cx="38" cy="57" r="10.5" fill="rgba(159,201,255,.25)" {...line} />
            <circle cx="62" cy="57" r="10.5" fill="rgba(159,201,255,.25)" {...line} />
            <path d="M48.5 56q1.5-2 3 0M27.5 55l-9-3M72.5 55l9-3" fill="none" {...line} />
        </>
    ),
    pirate: (
        <>
            <path d="M14 44L86 34" fill="none" {...line} />
            <path d="M54 50h16v12c0 5-4 8-8 8s-8-3-8-8z" fill={INK} {...line} />
        </>
    ),
    ninja: (
        <>
            <path d="M10 46c12-4 68-4 80 0v20c-12 4-68 4-80 0z" fill="#2f2f3a" {...line} />
            <path d="M90 52l8-4M90 58l9 2" fill="none" {...line} />
        </>
    ),
    detective: <path d="M68 74c6 0 9 3 13 1M81 75c2 4 7 4 8 0l-1-3h-6z" fill="#8a5a3c" {...line} />,
    artist: <circle cx="24" cy="72" r="3.5" fill="#ff9fbb" />,
}

/** Drawn on top of the head (hats, helmets). */
const TOP: Record<string, ReactNode> = {
    artist: (
        <>
            <path d="M26 30c-2-12 14-20 30-18s22 10 18 18c-8 4-40 6-48 0z" fill="#ff6b6b" {...line} />
            <path d="M52 12l2-6" fill="none" {...line} />
        </>
    ),
    athlete: (
        <>
            <path d="M12 38c22-8 54-8 76 0l-1 9c-22-7-52-7-74 0z" fill="#ff9f88" {...line} />
            <path d="M13 43c22-7 52-7 74 0" fill="none" stroke="#fff" strokeWidth="2" />
        </>
    ),
    chef: (
        <>
            <path d="M32 30V18c-8-2-10-14 0-16c2-8 14-10 18-4c4-6 16-4 18 4c10 2 8 14 0 16v12z" fill="#fff" {...line} />
            <path d="M32 24h36" fill="none" {...line} />
        </>
    ),
    pirate: (
        <>
            <path d="M24 30c0-14 12-20 26-20s26 6 26 20c-14 4-38 4-52 0z" fill="#ff6b6b" {...line} />
            <path d="M74 26l12 6l-4 8M76 28l4 12" fill="none" {...line} />
            <circle cx="40" cy="20" r="2" fill="#fff" /><circle cx="56" cy="17" r="2" fill="#fff" /><circle cx="64" cy="24" r="2" fill="#fff" />
        </>
    ),
    wizard: (
        <>
            <path d="M26 30L54 -12L72 30c-14 5-32 5-46 0z" fill="#7aa7ff" {...line} />
            <path d="M20 30c18 6 42 6 60 0" fill="none" {...line} />
            <path d="M46 10l2 4l4 1l-3 3l1 4l-4-2l-4 2l1-4l-3-3l4-1z" fill="#ffdb7c" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        </>
    ),
    detective: (
        <>
            <path d="M24 30c0-12 12-18 26-18s26 6 26 18z" fill="#c79a6b" {...line} />
            <path d="M18 30h64c0 4-8 6-32 6s-32-2-32-6z" fill="#a87a4f" {...line} />
            <path d="M28 24c10-3 34-3 44 0" fill="none" stroke="#8a5a3c" strokeWidth="2" />
        </>
    ),
    superhero: <path d="M14 46c10-6 26-6 36 0c10-6 26-6 36 0v14c-10 4-26 4-36-2c-10 6-26 6-36 2z" fill="#ff6b6b" {...line} />,
    ninja: <path d="M10 40c14-6 66-6 80 0v6c-14-4-66-4-80 0z" fill="#2f2f3a" {...line} />,
}

/** Behind the head (helmet, cape). */
const BACK: Record<string, ReactNode> = {
    astronaut: (
        <>
            <circle cx="50" cy="52" r="48" fill="rgba(159,201,255,.18)" {...line} />
            <path d="M24 26c6-8 14-12 22-13" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".8" />
            <path d="M50 4v-10" fill="none" {...line} />
            <circle cx="50" cy="-11" r="4" fill="#ff9f88" {...line} />
        </>
    ),
    superhero: <path d="M18 80c-8 10-10 18-6 24h76c4-6 2-14-6-24z" fill="#7aa7ff" {...line} />,
}

export const ACCESSORIES = ['naked', 'scientist', 'artist', 'athlete', 'chef', 'astronaut', 'pirate', 'wizard', 'detective', 'ninja', 'superhero']

/** The wardrobe was removed, so saved outfits from before are not drawn. */
const OUTFITS_ENABLED = false

export default function Mascot({ size = 96, mood = 'idle', outfit: savedOutfit = 'naked', animated = true, gaze, sx }: MascotProps) {
    const outfit = OUTFITS_ENABLED ? savedOutfit : 'naked'
    const look = mood === 'thinking' ? { x: 3, y: -5 } : mood === 'sad' ? { x: 0, y: 5 } : { x: 0, y: 0 }
    const happy = mood === 'happy' || mood === 'celebrating'
    const covered = outfit === 'ninja' || outfit === 'superhero' // eyes sit on the mask

    return (
        <Box
            role="img"
            aria-label={MASCOT_NAME}
            sx={{
                width: size,
                height: size,
                display: 'inline-block',
                flexShrink: 0,
                animation: animated ? (mood === 'celebrating' ? 'mascotHop .9s ease-in-out infinite' : 'mascotBreathe 4s ease-in-out infinite') : 'none',
                transformOrigin: '50% 90%',
                '@keyframes mascotBreathe': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.025, 0.985)' } },
                '@keyframes mascotHop': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8%)' } },
                '& .mascot-eyes': animated && (!happy || gaze) ? { animation: 'mascotBlink 5s infinite', transformOrigin: '50% 60%' } : {},
                '@keyframes mascotBlink': { '0%, 94%, 100%': { transform: 'scaleY(1)' }, '96%': { transform: 'scaleY(0.1)' } },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none', '& .mascot-eyes': { animation: 'none' } },
                ...sx,
            }}
        >
            <svg viewBox="-6 -16 112 120" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
                {BACK[outfit]}
                {/* Head with ears: one soft shape */}
                <path
                    d="M50 22C58 22 64 23 69 25C73 17 78 10 84 8C87 16 87 27 85 36C90 44 92 52 92 60C92 80 74 92 50 92C26 92 8 80 8 60C8 52 10 44 15 36C13 27 13 16 16 8C22 10 27 17 31 25C36 23 42 22 50 22Z"
                    fill="#ffffff"
                    stroke={outfit === 'chef' ? '#e6e6ea' : 'none'}
                    strokeWidth="1.5"
                />
                {(mood === 'happy' || mood === 'celebrating') && (
                    <>
                        <ellipse cx="27" cy="70" rx="5" ry="3" fill="#ffb3c4" opacity=".7" />
                        <ellipse cx="73" cy="70" rx="5" ry="3" fill="#ffb3c4" opacity=".7" />
                    </>
                )}
                {TOP[outfit]}
                {outfit !== 'pirate' && FRONT[outfit]}
                <g className="mascot-gaze" transform={`translate(${gaze?.x ?? look.x} ${gaze?.y ?? look.y})`}>
                    <g className="mascot-eyes">
                    {happy && !gaze ? (
                        <>
                            <path d="M33 60 Q38 52 43 60" stroke={covered ? '#fff' : EYE} strokeWidth="5" strokeLinecap="round" fill="none" />
                            <path d="M57 60 Q62 52 67 60" stroke={covered ? '#fff' : EYE} strokeWidth="5" strokeLinecap="round" fill="none" />
                        </>
                    ) : (
                        <>
                            <rect x="34" y="48" width="8" height="18" rx="4" fill={covered ? '#fff' : EYE} />
                            {outfit !== 'pirate' && <rect x="58" y="48" width="8" height="18" rx="4" fill={covered ? '#fff' : EYE} />}
                        </>
                    )}
                    </g>
                </g>
                {outfit === 'pirate' && FRONT.pirate}
            </svg>
        </Box>
    )
}
