import { SxProps, Theme } from '@mui/material'
import Mascot, { MascotMood } from './Mascot'

// The old bear drawing was replaced by the new mascot (Mascot.tsx). This
// wrapper keeps the old props so every screen picks up the new design.

interface BeardMascotProps {
    size?: number
    animated?: boolean
    sx?: SxProps<Theme>
    variant?: 'default' | 'happy' | 'thinking' | 'celebrating' | 'pulling' | 'presenting' | 'generating' | 'sad' | 'sitting' | 'splash'
    interactive?: boolean
    mousePosition?: { x: number; y: number }
    outfit?: string
    isSpeaking?: boolean
    headOnly?: boolean
}

const MOODS: Partial<Record<NonNullable<BeardMascotProps['variant']>, MascotMood>> = {
    happy: 'happy',
    presenting: 'happy',
    celebrating: 'celebrating',
    thinking: 'thinking',
    generating: 'thinking',
    sad: 'sad',
}

export default function BeardMascot({ size = 200, sx, variant = 'default', outfit, animated = true }: BeardMascotProps) {
    return <Mascot size={size} mood={MOODS[variant] || 'idle'} outfit={outfit} animated={animated} sx={sx} />
}
