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
    pie: (<>
        <circle cx="32" cy="33" r="19" fill="#fff" {...s} />
        <path d="M32 33V14a19 19 0 0 1 18.5 23z" fill={ORANGE} {...s} />
        <path d="M32 33l-13 13" fill="none" {...s} />
    </>),
    coins: (<>
        <ellipse cx="26" cy="44" rx="13" ry="5" fill={YELLOW} {...s} />
        <path d="M13 44v-7c0 3 6 5 13 5s13-2 13-5v7" fill={YELLOW} {...s} />
        <ellipse cx="26" cy="37" rx="13" ry="5" fill={YELLOW} {...s} />
        <circle cx="43" cy="23" r="10" fill="#fff" {...s} />
        <path d="M43 18v10M40 20.5h5M40 25.5h5" fill="none" {...s} />
    </>),
    piggy: (<>
        <path d="M14 34c0-10 9-16 19-16c6 0 11 2 14 5l5-2v8c2 1 3 3 3 5h-3c-1 4-4 7-7 8v6h-6v-4h-10v4h-6v-7c-6-2-9-6-9-11z" fill={PINK} {...s} />
        <circle cx="42" cy="30" r="1.8" fill={INK} />
        <path d="M27 18c0-4 6-4 6 0" fill="none" {...s} />
    </>),
    receipt: (<>
        <path d="M18 10h28v44l-4.5-3-4.5 3-4.5-3-4.5 3-4.5-3-5.5 3z" fill="#fff" {...s} />
        <path d="M24 20h16M24 28h16M24 36h9" fill="none" {...s} />
        <circle cx="40" cy="42" r="3" fill={ORANGE} />
    </>),
    clipboard: (<>
        <rect x="14" y="14" width="36" height="40" rx="5" fill="#fff" {...s} />
        <rect x="24" y="10" width="16" height="8" rx="3" fill={TEAL} {...s} />
        <path d="M21 31l3 3l5-6M33 31h9M21 43l3 3l5-6M33 43h9" fill="none" {...s} />
    </>),
    trophy: (<>
        <path d="M20 12h24v12c0 7-5 12-12 12s-12-5-12-12z" fill={YELLOW} {...s} />
        <path d="M20 16h-6c0 6 3 10 8 10M44 16h6c0 6-3 10-8 10M32 36v8M22 52h20M25 44h14v8H25z" fill="none" {...s} />
    </>),
    briefcase: (<>
        <rect x="10" y="20" width="44" height="30" rx="5" fill={ORANGE} {...s} />
        <path d="M24 20v-5h16v5M10 32h44" fill="none" {...s} />
        <rect x="28" y="29" width="8" height="7" rx="2" fill="#fff" {...s} />
    </>),
    vase: (<>
        <path d="M24 10h16M26 10c0 5-8 8-8 18c0 9 5 16 7 22h14c2-6 7-13 7-22c0-10-8-13-8-18" fill={ORANGE} {...s} />
        <path d="M20 26c-5 0-6 8-1 9M44 26c5 0 6 8 1 9M22 34h20" fill="none" {...s} />
    </>),
    puzzle: (<>
        <path d="M14 22h10c-2-8 12-8 10 0h10v10c8-2 8 12 0 10v10H34c2 8-12 8-10 0H14V42c-8 2-8-12 0-10z" fill={TEAL} {...s} />
    </>),
    flag: (<>
        <path d="M16 54V10" fill="none" {...s} />
        <path d="M16 12c10-4 16 4 32 0v22c-16 4-22-4-32 0z" fill={ORANGE} {...s} />
        <circle cx="32" cy="23" r="4" fill="#fff" {...s} />
    </>),
    chat: (<>
        <path d="M10 14h28v20H24l-8 6v-6h-6z" fill="#fff" {...s} />
        <path d="M30 28h24v18h-5v6l-8-6H30z" fill={TEAL} {...s} />
        <path d="M16 22h16M16 28h10" fill="none" {...s} />
    </>),
    brush: (<>
        <path d="M44 10l10 10l-18 18l-10-10z" fill={YELLOW} {...s} />
        <path d="M26 28l10 10c-2 8-10 14-22 14c4-4 2-10 4-16c1-4 4-7 8-8z" fill={PINK} {...s} />
    </>),
    pentool: (<>
        <path d="M32 10l14 22l-6 14H24l-6-14z" fill="#fff" {...s} />
        <path d="M32 10v22M24 46h16v8H24z" fill="none" {...s} />
        <circle cx="32" cy="34" r="3" fill={ORANGE} {...s} />
    </>),
    sparkle: (<>
        <path d="M28 10c2 12 6 16 18 18c-12 2-16 6-18 18c-2-12-6-16-18-18c12-2 16-6 18-18z" fill={YELLOW} {...s} />
        <path d="M46 38c1 6 3 8 8 9c-5 1-7 3-8 8c-1-5-3-7-8-8c5-1 7-3 8-9z" fill={PINK} {...s} />
    </>),
    scissors: (<>
        <circle cx="20" cy="44" r="7" fill={ORANGE} {...s} />
        <circle cx="44" cy="44" r="7" fill={TEAL} {...s} />
        <path d="M25 39L46 10M39 39L18 10" fill="none" {...s} />
    </>),
    code: (<>
        <rect x="8" y="12" width="48" height="40" rx="7" fill="#fff" {...s} />
        <path d="M25 24l-8 8l8 8M39 24l8 8l-8 8M35 21l-6 22" fill="none" {...s} />
        <circle cx="15" cy="18" r="1.6" fill={ORANGE} />
    </>),
    window: (<>
        <rect x="18" y="10" width="36" height="28" rx="5" fill={TEAL} {...s} />
        <rect x="10" y="24" width="36" height="28" rx="5" fill="#fff" {...s} />
        <path d="M10 32h36M16 28h2M21 28h2" fill="none" {...s} />
    </>),
    logic: (<>
        <path d="M18 16h12c10 0 16 7 16 16s-6 16-16 16H18z" fill="#fff" {...s} />
        <path d="M8 24h10M8 40h10M46 32h10" fill="none" {...s} />
        <circle cx="56" cy="32" r="2.5" fill={ORANGE} {...s} />
    </>),
    laptop: (<>
        <rect x="14" y="14" width="36" height="24" rx="4" fill="#fff" {...s} />
        <path d="M8 46h48l-4 6H12z" fill={TEAL} {...s} />
        <rect x="21" y="20" width="9" height="8" rx="1.5" fill={ORANGE} {...s} />
        <path d="M34 22h9M34 27h6" fill="none" {...s} />
    </>),
    chip: (<>
        <rect x="16" y="16" width="32" height="32" rx="5" fill="#fff" {...s} />
        <rect x="25" y="25" width="14" height="14" rx="2" fill={ORANGE} {...s} />
        <path d="M24 16V9M32 16V9M40 16V9M24 55v-7M32 55v-7M40 55v-7M16 24H9M16 32H9M16 40H9M55 24h-7M55 32h-7M55 40h-7" fill="none" {...s} />
    </>),
    network: (<>
        <path d="M32 18L16 44M32 18l16 26M16 44h32" fill="none" {...s} />
        <circle cx="32" cy="16" r="7" fill={ORANGE} {...s} />
        <circle cx="15" cy="46" r="7" fill="#fff" {...s} />
        <circle cx="49" cy="46" r="7" fill={TEAL} {...s} />
    </>),
    bolt: (<>
        <path d="M36 8L14 36h14l-4 20l24-30H34z" fill={YELLOW} {...s} />
    </>),
    hammer: (<>
        <path d="M30 26l-16 24l6 4l16-24" fill={ORANGE} {...s} />
        <path d="M20 18l8-8h14l8 8l-6 6l-6-4l-10 12l-8-6l6-4z" fill="#fff" {...s} />
    </>),
    castle: (<>
        <path d="M10 54V22h8v6h6v-6h8v6h6v-6h8v6h6v-6h2v32z" fill="#fff" {...s} />
        <path d="M27 54V42c0-3 2-5 5-5s5 2 5 5v12" fill={ORANGE} {...s} />
        <path d="M24 10v10M24 10h10l-3 3l3 3H24" fill="none" {...s} />
    </>),
    frame: (<>
        <rect x="10" y="12" width="44" height="40" rx="3" fill={YELLOW} {...s} />
        <rect x="17" y="19" width="30" height="26" rx="2" fill="#fff" {...s} />
        <path d="M17 41l9-10l7 7l5-5l9 9" fill="none" {...s} />
        <circle cx="38" cy="26" r="3" fill={ORANGE} />
    </>),
    scroll: (<>
        <path d="M18 14h30v34a6 6 0 0 1-6 6H16" fill="#fff" {...s} />
        <path d="M18 14a5 5 0 0 0-10 0v4h10M16 54a6 6 0 0 1-6-6h26v0a6 6 0 0 0 6 6" fill={YELLOW} {...s} />
        <path d="M26 24h14M26 31h14M26 38h9" fill="none" {...s} />
    </>),
    hourglass: (<>
        <path d="M18 10h28M18 54h28" fill="none" {...s} />
        <path d="M21 10c0 12 11 16 11 22s-11 10-11 22h22c0-12-11-16-11-22s11-10 11-22z" fill="#fff" {...s} />
        <path d="M25 50c2-6 5-8 7-8s5 2 7 8z" fill={ORANGE} />
    </>),
    metronome: (<>
        <path d="M24 10h16l8 44H16z" fill="#fff" {...s} />
        <path d="M18 44h28" fill="none" {...s} />
        <path d="M32 44L44 16" fill="none" {...s} />
        <circle cx="40" cy="25" r="3.5" fill={ORANGE} {...s} />
    </>),
    guitar: (<>
        <path d="M30 34c-6-6-16-2-16 6c0 7 3 10 3 10s3 3 10 3c8 0 12-10 6-16" fill={ORANGE} {...s} />
        <circle cx="26" cy="42" r="3" fill={INK} />
        <path d="M30 38L50 18" fill="none" {...s} />
        <path d="M48 12l6 6l-4 4l-6-6z" fill="#fff" {...s} />
    </>),
    vinyl: (<>
        <circle cx="32" cy="32" r="21" fill={INK} {...s} />
        <circle cx="32" cy="32" r="8" fill={ORANGE} {...s} />
        <circle cx="32" cy="32" r="2" fill="#fff" />
        <path d="M18 26a15 15 0 0 1 8-8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </>),
    whistle: (<>
        <path d="M10 30h30a12 12 0 1 1-12 14H22a12 12 0 0 1-12-12z" fill="#fff" {...s} />
        <circle cx="40" cy="40" r="5" fill={TEAL} {...s} />
        <path d="M40 30h12v-8" fill="none" {...s} />
        <path d="M46 12l4 4M54 12l-3 5" fill="none" {...s} />
    </>),
    stopwatch: (<>
        <circle cx="32" cy="36" r="17" fill="#fff" {...s} />
        <path d="M28 10h8M32 10v9M47 21l3-3M32 36l7-7" fill="none" {...s} />
        <path d="M32 19a17 17 0 0 1 17 17H32z" fill={TEAL} opacity=".7" />
        <circle cx="32" cy="36" r="2.5" fill={ORANGE} {...s} />
    </>),
    ribbon: (<>
        <path d="M8 38c8-16 16-16 20-4s12 12 20-4" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
        <path d="M8 38c8-16 16-16 20-4s12 12 20-4" fill="none" stroke={PINK} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M48 30l4-14" fill="none" {...s} />
        <circle cx="53" cy="13" r="3" fill={YELLOW} {...s} />
    </>),
    dna: (<>
        <path d="M22 10c0 14 20 16 20 30c0 6-3 10-6 14M42 10c0 14-20 16-20 30c0 6 3 10 6 14" fill="none" {...s} />
        <path d="M25 18h14M26 30h12M26 44h12" fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />
    </>),
    sun: (<>
        <circle cx="26" cy="26" r="10" fill={YELLOW} {...s} />
        <path d="M26 8v4M8 26h4M13 13l3 3M39 13l-3 3M13 39l3-3" fill="none" {...s} />
        <path d="M24 50a9 9 0 0 1 2-17a12 12 0 0 1 22 4a7 7 0 0 1 0 13z" fill="#fff" {...s} />
    </>),
    map: (<>
        <path d="M10 16l14-5l16 5l14-5v38l-14 5l-16-5l-14 5z" fill="#fff" {...s} />
        <path d="M24 11v38M40 16v38" fill="none" {...s} />
        <path d="M30 26c0-4 6-4 6 0c0 3-3 6-3 6s-3-3-3-6z" fill={ORANGE} {...s} />
    </>),
    compass: (<>
        <circle cx="32" cy="32" r="21" fill="#fff" {...s} />
        <path d="M32 18l5 14h-10z" fill={ORANGE} {...s} />
        <path d="M32 46l-5-14h10z" fill={TEAL} {...s} />
        <circle cx="32" cy="32" r="2" fill={INK} />
    </>),
    molecule: (<>
        <path d="M22 40l10-16l12 14" fill="none" {...s} />
        <circle cx="32" cy="22" r="8" fill={ORANGE} {...s} />
        <circle cx="19" cy="44" r="7" fill="#fff" {...s} />
        <circle cx="46" cy="41" r="7" fill={TEAL} {...s} />
    </>),
    testtube: (<>
        <path d="M20 10h12M22 10v36a4 4 0 0 0 8 0V10M38 18h12M40 18v28a4 4 0 0 0 8 0V18" fill="#fff" {...s} />
        <path d="M22 32h8v14a4 4 0 0 1-8 0zM40 38h8v8a4 4 0 0 1-8 0z" fill={TEAL} {...s} />
        <path d="M12 54h40" fill="none" {...s} />
    </>),
    fn: (<>
        <path d="M12 10v42h42" fill="none" {...s} />
        <path d="M14 46c10 0 12-30 22-30s8 22 16 22" fill="none" stroke={ORANGE} strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="36" cy="16" r="3" fill="#fff" {...s} />
    </>),
    geometry: (<>
        <path d="M12 50L32 14l20 36z" fill="#fff" {...s} />
        <path d="M24 50a8 8 0 0 0-4-7" fill="none" {...s} />
        <path d="M32 14v36" fill="none" strokeDasharray="3 4" {...s} />
        <circle cx="32" cy="14" r="3" fill={ORANGE} {...s} />
    </>),
    vote: (<>
        <rect x="12" y="30" width="40" height="24" rx="4" fill="#fff" {...s} />
        <path d="M22 30h20" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <path d="M24 10h16v18H24z" fill={YELLOW} {...s} />
        <path d="M28 19l3 3l5-6" fill="none" {...s} />
    </>),
    suitcase: (<>
        <rect x="14" y="20" width="36" height="32" rx="5" fill={TEAL} {...s} />
        <path d="M26 20v-6h12v6M24 20v32M40 20v32M20 56h0M44 56h0" fill="none" {...s} />
    </>),
    mic: (<>
        <rect x="24" y="8" width="16" height="28" rx="8" fill="#fff" {...s} />
        <path d="M16 30c0 9 7 16 16 16s16-7 16-16M32 46v8M24 54h16" fill="none" {...s} />
        <path d="M28 16h8M28 22h8" fill="none" stroke={ORANGE} strokeWidth="2.6" strokeLinecap="round" />
    </>),
    camera: (<>
        <path d="M10 22h10l4-6h16l4 6h10v28H10z" fill="#fff" {...s} />
        <circle cx="32" cy="35" r="9" fill={TEAL} {...s} />
        <circle cx="47" cy="27" r="2" fill={ORANGE} />
    </>),
    shield: (<>
        <path d="M32 8l20 7v14c0 13-8 22-20 27c-12-5-20-14-20-27V15z" fill="#fff" {...s} />
        <path d="M24 31l6 6l11-12" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </>),
    apple: (<>
        <path d="M32 20c-4-4-18-4-18 12c0 12 8 22 13 22c3 0 3-2 5-2s2 2 5 2c5 0 13-10 13-22c0-16-14-16-18-12z" fill={ORANGE} {...s} />
        <path d="M32 20c0-5 2-9 6-11" fill="none" {...s} />
        <path d="M34 14c4-4 10-3 12 0c-4 4-9 3-12 0z" fill={TEAL} {...s} />
    </>),
    question: (<>
        <path d="M10 12h44v30H32l-11 10V42H10z" fill={YELLOW} {...s} />
        <path d="M26 22c0-4 3-6 6-6s6 2 6 5c0 5-6 5-6 9" fill="none" {...s} />
        <circle cx="32" cy="36" r="1.8" fill={INK} />
    </>),
    eye: (<>
        <path d="M8 32c6-10 14-16 24-16s18 6 24 16c-6 10-14 16-24 16S14 42 8 32z" fill="#fff" {...s} />
        <circle cx="32" cy="32" r="9" fill={TEAL} {...s} />
        <circle cx="32" cy="32" r="3.5" fill={INK} />
    </>),
    magnet: (<>
        <path d="M14 12h12v20a6 6 0 0 0 12 0V12h12v20a18 18 0 0 1-36 0z" fill={ORANGE} {...s} />
        <path d="M14 12h12v8H14zM38 12h12v8H38z" fill="#fff" {...s} />
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
