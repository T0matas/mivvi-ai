import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import Mascot from './Mascot'

// Mivvi getting the lesson ready: floats up and down, reads from side to side
// (the eyes follow imaginary lines), and little ideas in the subject's colour
// rise around it.

// Where the eyes look, in a loop: reading a line left → right, twice, then up thinking.
const GAZE = [{ x: -5, y: 1 }, { x: 0, y: 1 }, { x: 5, y: 1 }, { x: -5, y: 3 }, { x: 0, y: 3 }, { x: 5, y: 3 }, { x: 2, y: -6 }, { x: 2, y: -6 }]

const IDEAS = [
  { left: '8%', size: 9, delay: 0, round: true },
  { left: '82%', size: 7, delay: 0.7, round: false },
  { left: '20%', size: 6, delay: 1.4, round: false },
  { left: '72%', size: 10, delay: 2.1, round: true },
]

export default function MivviLoader({ color, size = 84, outfit }: { color: string; size?: number; outfit?: string }) {
  const [g, setG] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setG((i) => (i + 1) % GAZE.length), 420)
    return () => window.clearInterval(t)
  }, [])

  return (
    <Box aria-hidden sx={{ position: 'relative', width: size * 1.7, height: size * 1.55, display: 'grid', placeItems: 'end center',
      '@keyframes mlFloat': { '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' }, '50%': { transform: 'translateY(-10px) rotate(2deg)' } },
      '@keyframes mlShadow': { '0%, 100%': { transform: 'scaleX(1)', opacity: 0.5 }, '50%': { transform: 'scaleX(.72)', opacity: 0.25 } },
      '@keyframes mlIdea': { '0%': { transform: 'translateY(0) scale(.4) rotate(0deg)', opacity: 0 }, '20%': { opacity: 1 }, '100%': { transform: 'translateY(-70px) scale(1) rotate(90deg)', opacity: 0 } },
      '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important' } } }}>
      {/* Ideas rising */}
      {IDEAS.map((d, i) => (
        <Box key={i} sx={{ position: 'absolute', left: d.left, bottom: size * 0.45, width: d.size, height: d.size, borderRadius: d.round ? '50%' : '3px',
          bgcolor: i % 2 ? color : '#fff', opacity: 0, animation: `mlIdea 2.8s ease-out ${d.delay}s infinite` }} />
      ))}
      {/* Mivvi */}
      <Box sx={{ position: 'relative', mb: '14px', animation: 'mlFloat 2.4s ease-in-out infinite', '& .mascot-gaze': { transition: 'transform .28s ease-out' } }}>
        <Mascot size={size} mood="idle" outfit={outfit} gaze={GAZE[g]} />
      </Box>
      {/* Shadow on the floor */}
      <Box sx={{ position: 'absolute', bottom: 0, width: size * 0.62, height: 8, borderRadius: '50%', bgcolor: 'rgba(0,0,0,.6)', filter: 'blur(3px)', animation: 'mlShadow 2.4s ease-in-out infinite' }} />
    </Box>
  )
}

// ── A small living Mivvi for other places ────────────────────────────────────

const LOOK_AROUND = [{ x: 0, y: 0 }, { x: -4, y: 0 }, { x: -4, y: 0 }, { x: 0, y: -3 }, { x: 4, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]
// While talking: mostly at the text it's saying, now and then at the student.
const TALK_LOOK = [{ x: 5, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 5, y: 1 }, { x: 4, y: -1 }, { x: 5, y: 1 }]

/**
 * `talk`: next to something Mivvi says. It speaks in little bounces (squash
 * and stretch) and looks from the text to the student. `wait`: it floats and looks around, waiting for a question.
 */
export function MivviAlive({ size = 40, mode = 'wait', outfit }: { size?: number; mode?: 'talk' | 'wait'; outfit?: string }) {
  const talk = mode === 'talk'
  const [g, setG] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setG((i) => (i + 1) % 8), talk ? 600 : 700)
    return () => window.clearInterval(t)
  }, [talk])

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0,
      '@keyframes maSpeak': {
        '0%, 100%': { transform: 'translateY(0) scale(1, 1) rotate(0deg)' },
        '8%': { transform: 'translateY(-3px) scale(1.04, .96) rotate(2deg)' },
        '16%': { transform: 'translateY(0) scale(.97, 1.03) rotate(0deg)' },
        '28%': { transform: 'translateY(-4px) scale(1.05, .95) rotate(4deg)' },
        '38%': { transform: 'translateY(0) scale(1, 1) rotate(1deg)' },
        '50%': { transform: 'translateY(-2px) scale(1.03, .97) rotate(-2deg)' },
        '58%': { transform: 'translateY(0) scale(.98, 1.02) rotate(0deg)' },
        '72%': { transform: 'translateY(-3px) scale(1.04, .96) rotate(3deg)' },
        '84%': { transform: 'translateY(0) scale(1, 1) rotate(0deg)' } },
      '@keyframes maFloat': { '0%, 100%': { transform: 'translateY(0) rotate(-3deg)' }, '50%': { transform: 'translateY(-6px) rotate(3deg)' } },
      '@keyframes maHop': { '0%, 80%, 100%': { transform: 'translateY(0) scale(1, 1)' }, '85%': { transform: 'translateY(0) scale(1.08, .9)' }, '90%': { transform: 'translateY(-9px) scale(.95, 1.06)' }, '95%': { transform: 'translateY(0) scale(1.05, .95)' } },
      '@keyframes maShadow': { '0%, 100%': { transform: 'scaleX(1)', opacity: 0.45 }, '50%': { transform: 'scaleX(.75)', opacity: 0.22 } },
      '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important' } } }}>
      {/* Mivvi (an outer box hops now and then, the inner one floats or speaks) */}
      <Box sx={{ display: 'inline-flex', animation: talk ? 'none' : 'maHop 6s ease-in-out 2s infinite', transformOrigin: '50% 100%' }}>
        <Box sx={{ display: 'inline-flex', transformOrigin: '50% 90%', '& .mascot-gaze': { transition: 'transform .3s ease-out' },
          animation: talk ? 'maSpeak 2.2s ease-in-out infinite' : 'maFloat 2.8s ease-in-out infinite' }}>
          <Mascot size={size} mood={talk ? 'happy' : 'idle'} outfit={outfit} gaze={(talk ? TALK_LOOK : LOOK_AROUND)[g]} />
        </Box>
      </Box>
      {/* A soft shadow under the floating Mivvi */}
      {!talk && (
        <Box sx={{ position: 'absolute', left: '50%', bottom: -size * 0.14, width: size * 0.6, height: Math.max(4, size * 0.1), ml: `${-size * 0.3}px`, borderRadius: '50%', bgcolor: 'rgba(0,0,0,.55)', filter: 'blur(2px)', animation: 'maShadow 2.8s ease-in-out infinite' }} />
      )}
    </Box>
  )
}
