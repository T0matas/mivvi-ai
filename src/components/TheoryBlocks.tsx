import { Box, Typography, Skeleton } from '@mui/material'
import { ArrowForward, ArrowDownward, LoopRounded, CheckRounded } from '@mui/icons-material'
import { TheoryDiagram } from '../types'
import { useWikiImage, useCutout, WikiImage } from '../services/wikiImage'
import { cv } from '../theme'

// The pieces of a lesson explanation, drawn in the app's style: a diagram
// (steps, comparison, layers or cycle), a real picture of the topic, key
// terms and short bullet facts.

const label = { fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const }
const tint = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}`

export function Diagram({ diagram, color }: { diagram: TheoryDiagram; color: string }) {
  const { kind, items, title } = diagram
  return (
    <Box sx={{ mt: 2, p: { xs: 1.5, sm: 2 }, borderRadius: '18px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
      {title && <Typography sx={{ ...label, color: cv.muted, mb: 1.5 }}>{title}</Typography>}

      {kind === 'steps' && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', gap: 0.75 }}>
          {items.map((it, i) => (
            <Box key={i} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0 }}>
              <Box sx={{ flex: 1, width: '100%', alignSelf: 'stretch', p: 1.25, borderRadius: '14px', bgcolor: tint(color, 0.1), boxShadow: `inset 0 0 0 1px ${tint(color, 0.25)}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box component="span" sx={{ width: 20, height: 20, borderRadius: '7px', bgcolor: color, color: '#1d2742', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{i + 1}</Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 650, lineHeight: 1.25 }}>{it.label}</Typography>
                </Box>
                {it.text && <Typography sx={{ fontSize: 12.5, color: cv.muted, mt: 0.5, lineHeight: 1.4 }}>{it.text}</Typography>}
              </Box>
              {i < items.length - 1 && (
                <Box sx={{ color: cv.faint, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <ArrowForward sx={{ fontSize: 16, display: { xs: 'none', sm: 'block' } }} />
                  <ArrowDownward sx={{ fontSize: 16, display: { xs: 'block', sm: 'none' } }} />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {kind === 'compare' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(items.length, 3)}, 1fr)` }, gap: 1 }}>
          {items.map((it, i) => (
            <Box key={i} sx={{ p: 1.5, borderRadius: '14px', bgcolor: i % 2 ? 'rgba(255,255,255,.03)' : tint(color, 0.1), boxShadow: `inset 0 0 0 1px ${i % 2 ? cv.border : tint(color, 0.25)}` }}>
              <Typography sx={{ fontFamily: cv.display, fontSize: 15, fontWeight: 700 }}>{it.label}</Typography>
              {it.text && <Typography sx={{ fontSize: 13, color: '#cfcfd4', mt: 0.5, lineHeight: 1.45 }}>{it.text}</Typography>}
            </Box>
          ))}
        </Box>
      )}

      {kind === 'layers' && (
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          {items.map((it, i) => (
            <Box key={i} sx={{ mx: { sm: `${i * 14}px` }, display: 'flex', alignItems: 'baseline', gap: 1.25, p: '10px 14px', borderRadius: '12px', bgcolor: tint(color, 0.08 + (i / Math.max(1, items.length - 1)) * 0.22) }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, minWidth: { sm: 120 } }}>{it.label}</Typography>
              {it.text && <Typography sx={{ fontSize: 12.5, color: '#d0d0d5', lineHeight: 1.4 }}>{it.text}</Typography>}
            </Box>
          ))}
        </Box>
      )}

      {kind === 'cycle' && (
        <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
          {items.map((it, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, p: 1.25, borderRadius: '14px', bgcolor: 'rgba(255,255,255,.03)', boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
              <Box component="span" sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: color, color: '#1d2742', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{i + 1}</Box>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 650 }}>{it.label}</Typography>
                {it.text && <Typography sx={{ fontSize: 12.5, color: cv.muted, mt: 0.25, lineHeight: 1.4 }}>{it.text}</Typography>}
              </Box>
            </Box>
          ))}
          <Box sx={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: cv.faint, fontSize: 12 }}>
            <LoopRounded sx={{ fontSize: 16 }} />e o ciclo recomeça
          </Box>
        </Box>
      )}
    </Box>
  )
}

/** The main picture of a Wikipedia article about the section's idea: no frame and no caption,
 *  and without its background when it's a plain one (an object on white). */
export function TopicImage(props: { query?: string; hideTitle?: boolean; /** Already chosen (see useUniqueImages): undefined = still looking, null = none. */ image?: WikiImage | null }) {
  const chosen = 'image' in props
  const looked = useWikiImage(chosen ? undefined : props.query)
  const img = chosen ? props.image : looked
  const cut = useCutout(img?.src || undefined)
  if (img === null) return null
  const ready = img && cut !== undefined
  return (
    <Box component="figure" sx={{ m: 0, mt: 2, display: 'grid', placeItems: 'center', minHeight: { xs: 150, sm: 190 } }}>
      {!ready ? (
        <Skeleton variant="rounded" animation="wave" sx={{ width: '100%', height: { xs: 150, sm: 190 }, borderRadius: '18px', bgcolor: '#1f1f1f' }} />
      ) : (
        <Box component="img" src={cut || img.src} alt={img.title} referrerPolicy="no-referrer"
          sx={{ display: 'block', maxWidth: '100%', maxHeight: { xs: 190, sm: 240 }, objectFit: 'contain',
            // A cut-out object floats with a soft shadow; a photo keeps rounded corners.
            ...(cut ? { filter: 'drop-shadow(0 10px 22px rgba(0,0,0,.5))' } : { borderRadius: '16px' }),
            animation: 'thImg .5s ease both', '@keyframes thImg': { from: { opacity: 0, transform: 'scale(.97)' } } }} />
      )}
    </Box>
  )
}

export function Points({ points, color }: { points: string[]; color: string }) {
  return (
    <Box component="ul" sx={{ m: 0, mt: 1.5, p: 0, listStyle: 'none', display: 'grid', gap: 0.75 }}>
      {points.map((p, i) => (
        <Box component="li" key={i} sx={{ display: 'flex', gap: 1, fontSize: 14.5, lineHeight: 1.5, color: '#dcdce0' }}>
          <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, mt: '9px', flexShrink: 0 }} />
          <span>{p.replace(/\*\*/g, '')}</span>
        </Box>
      ))}
    </Box>
  )
}

export function Terms({ terms, color }: { terms: { term: string; meaning: string }[]; color: string }) {
  return (
    <Box sx={{ mt: 1.75, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 0.75 }}>
      {terms.map((t, i) => (
        <Box key={i} sx={{ p: '10px 12px', borderRadius: '12px', bgcolor: 'rgba(255,255,255,.03)', boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CheckRounded sx={{ fontSize: 14, color }} />
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{t.term}</Typography>
          </Box>
          <Typography sx={{ fontSize: 12.5, color: cv.muted, mt: 0.25, lineHeight: 1.4 }}>{t.meaning}</Typography>
        </Box>
      ))}
    </Box>
  )
}
