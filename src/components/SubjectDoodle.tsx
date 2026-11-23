import { Box, SxProps, Theme } from '@mui/material'
import { ReactNode } from 'react'
import { Subject } from '../types'
import { IconKind, subjectColor, subjectInfo } from '../data/ptCurriculum'

// Subject icons in one flat sticker style: a dark outline with a few warm and
// cool spots of colour, sitting still on a rounded tile in the subject colour.

const INK = '#1d2742'
const ORANGE = '#ff8a5c'
const TEAL = '#7fd8c4'
const YELLOW = '#ffd166'
const PINK = '#ff9fbb'
const s = { stroke: INK, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const ICONS: Record<Exclude<IconKind, 'lang'>, ReactNode> = {
    calculator: (<>
        <rect x="16" y="10" width="32" height="44" rx="6" fill="#fff" {...s} />
        <rect x="21" y="15" width="22" height="9" rx="2" fill={TEAL} {...s} />
        <circle cx="25" cy="32" r="2" fill={INK} /><circle cx="32" cy="32" r="2" fill={INK} /><circle cx="39" cy="32" r="2" fill={ORANGE} />
        <circle cx="25" cy="40" r="2" fill={INK} /><circle cx="32" cy="40" r="2" fill={INK} /><circle cx="39" cy="40" r="2" fill={ORANGE} />
        <path d="M23 47h18" fill="none" {...s} />
    </>),
    book: (<>
        <path d="M12 16c7-3 14-3 20 2c6-5 13-5 20-2v32c-7-3-14-3-20 2c-6-5-13-5-20-2z" fill="#fff" {...s} />
        <path d="M32 18v32" fill="none" {...s} />
        <path d="M38 22v10l3-2l3 2V21" fill={ORANGE} {...s} />
    </>),
    microscope: (<>
        <path d="M14 52h36M22 52c0-10 6-16 16-16M26 36h14" fill="none" {...s} />
        <rect x="30" y="10" width="9" height="22" rx="3" transform="rotate(-25 34 21)" fill="#fff" {...s} />
        <circle cx="40" cy="44" r="4" fill={TEAL} {...s} />
    </>),
    columns: (<>
        <path d="M12 24L32 12l20 12z" fill={ORANGE} {...s} />
        <path d="M16 28v18M27 28v18M37 28v18M48 28v18M12 50h40" fill="none" {...s} />
    </>),
    globe: (<>
        <circle cx="32" cy="30" r="17" fill={TEAL} {...s} />
        <path d="M22 22c5 1 6 6 3 9s1 7 6 7M38 15c-3 4 0 7 4 7s5 5 2 8M24 50h16M32 47v3" fill="none" {...s} />
    </>),
    atom: (<>
        <ellipse cx="32" cy="32" rx="20" ry="8" fill="none" {...s} />
        <ellipse cx="32" cy="32" rx="20" ry="8" transform="rotate(60 32 32)" fill="none" {...s} />
        <ellipse cx="32" cy="32" rx="20" ry="8" transform="rotate(-60 32 32)" fill="none" {...s} />
        <circle cx="32" cy="32" r="4.5" fill={ORANGE} {...s} />
    </>),
    flask: (<>
        <path d="M26 12h12M28 12v14L16 48c-1.5 3 .5 5 3.5 5h25c3 0 5-2 3.5-5L36 26V12" fill="#fff" {...s} />
        <path d="M20 41h24l4 7c1.5 3-.5 5-3.5 5h-25c-3 0-5-2-3.5-5z" fill={TEAL} {...s} />
    </>),
    leaf: (<>
        <path d="M14 50C12 28 28 14 50 14c0 22-14 38-36 36z" fill={TEAL} {...s} />
        <path d="M14 50L38 26" fill="none" {...s} />
    </>),
    rock: (<>
        <path d="M10 46l10-20l10 6l8-14l16 28z" fill="#fff" {...s} />
        <path d="M20 26l4 10M38 18l-2 12M10 46h44" fill="none" {...s} />
        <circle cx="44" cy="38" r="3" fill={ORANGE} />
    </>),
    palette: (<>
        <path d="M32 12c-12 0-21 9-21 20s8 20 18 20c3 0 4-2 3-4s0-5 3-5h6c6 0 11-4 11-11c0-11-9-20-20-20z" fill="#fff" {...s} />
        <circle cx="23" cy="30" r="3" fill={ORANGE} /><circle cx="30" cy="21" r="3" fill={TEAL} /><circle cx="41" cy="23" r="3" fill={YELLOW} /><circle cx="44" cy="33" r="3" fill={PINK} />
    </>),
    pencil: (<>
        <path d="M14 50l4-12l26-26l8 8l-26 26z" fill={YELLOW} {...s} />
        <path d="M38 18l8 8" fill="none" {...s} />
        <path d="M14 50l4-12l8 8z" fill="#fff" {...s} />
    </>),
    music: (<>
        <path d="M24 44V16l24-5v28M24 23l24-5" fill="none" {...s} />
        <ellipse cx="19" cy="45" rx="6" ry="5" fill={ORANGE} {...s} />
        <ellipse cx="43" cy="40" rx="6" ry="5" fill={TEAL} {...s} />
    </>),
    ball: (<>
        <circle cx="32" cy="32" r="19" fill="#fff" {...s} />
        <path d="M32 24l7 5l-3 8h-8l-3-8z" fill={INK} />
        <path d="M32 13v11M39 29l12-4M36 37l6 10M28 37l-6 10M25 29l-12-4" fill="none" {...s} />
    </>),
    heart: (<>
        <path d="M32 50S12 38 12 24c0-7 5-12 11-12c4 0 7 2 9 5c2-3 5-5 9-5c6 0 11 5 11 12c0 14-20 26-20 26z" fill={PINK} {...s} />
        <path d="M22 22c1-3 3-4 5-4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </>),
    people: (<>
        <circle cx="24" cy="22" r="7" fill="#fff" {...s} />
        <circle cx="42" cy="24" r="6" fill={ORANGE} {...s} />
        <path d="M11 50c0-9 6-15 13-15s13 6 13 15z" fill="#fff" {...s} />
        <path d="M34 50c0-7 3-13 8-13s9 6 9 13z" fill={TEAL} {...s} />
    </>),
    monitor: (<>
        <rect x="10" y="12" width="44" height="30" rx="4" fill="#fff" {...s} />
        <path d="M18 22l6 5l-6 5M28 33h10M26 52h12M32 42v10" fill="none" {...s} />
        <circle cx="46" cy="20" r="2.5" fill={ORANGE} />
    </>),
    gear: (<>
        <path d="M28 10h8l1 6l5 2l5-4l6 6l-4 5l2 5l6 1v8l-6 1l-2 5l4 5l-6 6l-5-4l-5 2l-1 6h-8l-1-6l-5-2l-5 4l-6-6l4-5l-2-5l-6-1v-8l6-1l2-5l-4-5l6-6l5 4l5-2z" fill="#fff" {...s} />
        <circle cx="32" cy="32" r="7" fill={TEAL} {...s} />
    </>),
    scales: (<>
        <path d="M32 12v38M20 52h24M14 20h36M14 20l-6 14M14 20l6 14M50 20l-6 14M50 20l6 14" fill="none" {...s} />
        <path d="M8 34c0 4 3 6 6 6s6-2 6-6z" fill={YELLOW} {...s} />
        <path d="M44 34c0 4 3 6 6 6s6-2 6-6z" fill={YELLOW} {...s} />
    </>),
    chart: (<>
        <path d="M12 12v40h40" fill="none" {...s} />
        <rect x="18" y="34" width="7" height="14" rx="1.5" fill={TEAL} {...s} />
        <rect x="29" y="26" width="7" height="22" rx="1.5" fill="#fff" {...s} />
        <rect x="40" y="18" width="7" height="30" rx="1.5" fill={ORANGE} {...s} />
    </>),
    brain: (<>
        <path d="M30 14c-6-3-14 1-14 8c-5 2-6 9-2 12c-2 5 2 11 8 11c2 4 6 5 8 4z" fill={PINK} {...s} />
        <path d="M34 14c6-3 14 1 14 8c5 2 6 9 2 12c2 5-2 11-8 11c-2 4-6 5-8 4z" fill="#fff" {...s} />
        <path d="M32 14v36" fill="none" {...s} />
    </>),
    ruler: (<>
        <path d="M10 46L46 10l8 8l-36 36z" fill={YELLOW} {...s} />
        <path d="M20 36l4 4M26 30l3 3M32 24l4 4M38 18l3 3" fill="none" {...s} />
    </>),
    quill: (<>
        <path d="M48 10C30 14 20 26 16 46c12-4 24-12 32-36z" fill="#fff" {...s} />
        <path d="M16 46l-4 8M22 38c6-6 12-12 18-20" fill="none" {...s} />
        <circle cx="46" cy="48" r="5" fill={INK} />
    </>),
    bulb: (<>
        <path d="M32 10c-9 0-16 7-16 16c0 6 3 10 7 13v6h18v-6c4-3 7-7 7-13c0-9-7-16-16-16z" fill={YELLOW} {...s} />
        <path d="M24 49h16M27 54h10M28 30l4 4l4-4" fill="none" {...s} />
    </>),
    film: (<>
        <rect x="10" y="16" width="44" height="32" rx="5" fill="#fff" {...s} />
        <path d="M28 25v14l12-7z" fill={ORANGE} {...s} />
    </>),
    mask: (<>
        <path d="M12 16h40v14c0 12-9 22-20 22S12 42 12 30z" fill="#fff" {...s} />
        <path d="M20 28c2-3 6-3 8 0M36 28c2-3 6-3 8 0M24 38c4 4 12 4 16 0" fill="none" {...s} />
        <circle cx="47" cy="20" r="3" fill={PINK} />
    </>),
    chef: (<>
        <path d="M20 36V28c-7-1-9-11-1-14c1-6 10-8 13-3c3-5 12-3 13 3c8 3 6 13-1 14v8z" fill="#fff" {...s} />
        <rect x="20" y="36" width="24" height="12" rx="2" fill={ORANGE} {...s} />
    </>),
    plane: (<>
        <path d="M10 34l44-18l-14 34l-8-12z" fill="#fff" {...s} />
        <path d="M32 38l22-22" fill="none" {...s} />
        <path d="M32 38l-4 10l-2-8z" fill={TEAL} {...s} />
    </>),
    cross: (<>
        <rect x="12" y="12" width="40" height="40" rx="10" fill="#fff" {...s} />
        <path d="M27 20h10v7h7v10h-7v7H27v-7h-7V27h7z" fill={ORANGE} {...s} />
    </>),
}

/** Languages: a speech bubble with the language's code, so each one is easy to spot. */
const languageIcon = (code: string) => (
    <>
        <path d="M10 14h44v28H32l-11 9v-9H10z" fill="#fff" {...s} />
        <text x="32" y="33.5" textAnchor="middle" fontFamily="'Plus Jakarta Sans', Inter, sans-serif" fontWeight="800" fontSize="15" fill={INK}>{code}</text>
        <circle cx="50" cy="14" r="5" fill={ORANGE} {...s} />
    </>
)

export default function SubjectDoodle({ subject, size = 54, sx }: { subject: Subject; size?: number; sx?: SxProps<Theme> }) {
    const info = subjectInfo(subject)
    return (
        <Box component="svg" viewBox="0 0 64 64" aria-hidden sx={[{ width: size, height: size, flexShrink: 0, display: 'block' }, ...(Array.isArray(sx) ? sx : [sx])]}>
            {info.icon === 'lang' ? languageIcon(info.code || '?') : ICONS[info.icon]}
        </Box>
    )
}

/** The icon on its tile in the subject colour, the way subjects appear everywhere in the app. */
export function SubjectTile({ subject, size = 48, sx }: { subject: Subject; size?: number; sx?: SxProps<Theme> }) {
    return (
        <Box sx={[{ width: size, height: size, flexShrink: 0, borderRadius: `${Math.round(size * 0.28)}px`, bgcolor: subjectColor(subject), display: 'grid', placeItems: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}>
            <SubjectDoodle subject={subject} size={Math.round(size * 0.74)} />
        </Box>
    )
}
