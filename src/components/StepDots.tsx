import { Box } from '@mui/material'
import { cv } from '../theme'

// The steps along the top of a lesson and its exercises: a dot per step,
// joined by a line that fills in as you go.

export type StepState = 'done' | 'now' | 'next' | 'right' | 'wrong'

export default function StepDots({ states, color, onPick, label }: {
  states: StepState[]
  color: string
  /** Makes the dots buttons (jump to a step). */
  onPick?: (i: number) => void
  label?: (i: number) => string
}) {
  const fill = (s: StepState) => (s === 'right' ? cv.green : s === 'wrong' ? cv.coral : s === 'done' || s === 'now' ? color : 'transparent')
  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }} role="progressbar" aria-valuemin={1} aria-valuemax={states.length} aria-valuenow={states.indexOf('now') + 1}>
      {states.map((s, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', flex: i === 0 ? '0 0 auto' : 1, minWidth: 0 }}>
          {i > 0 && (
            <Box sx={{ flex: 1, height: 2, mx: '3px', borderRadius: 999, bgcolor: s === 'next' ? 'rgba(255,255,255,.1)' : s === 'now' ? `${color}88` : fill(s), transition: 'background-color .3s' }} />
          )}
          <Box component={onPick ? 'button' : 'span'} onClick={onPick ? () => onPick(i) : undefined} title={label?.(i)} aria-label={label?.(i)}
            sx={{ flexShrink: 0, width: 10, height: 10, p: 0, border: 0, borderRadius: '50%', boxSizing: 'border-box', cursor: onPick ? 'pointer' : 'default', transition: 'all .3s',
              bgcolor: s === 'now' ? 'transparent' : fill(s),
              boxShadow: s === 'now' ? `inset 0 0 0 2.5px ${color}, 0 0 0 4px ${color}26` : s === 'next' ? `inset 0 0 0 1.5px ${cv.borderStrong}` : 'none',
              transform: s === 'now' ? 'scale(1.25)' : 'none',
              ...(onPick && { '&:hover': { transform: 'scale(1.35)' } }) }} />
        </Box>
      ))}
    </Box>
  )
}
