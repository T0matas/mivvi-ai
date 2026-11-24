import { Box, Typography, Skeleton } from '@mui/material'
import { ArrowForward, ArrowDownward, LoopRounded, CheckRounded, OpenInNewRounded } from '@mui/icons-material'
import { TheoryDiagram } from '../types'
import { useWikiImage } from '../services/wikiImage'
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

/** The main picture of a Wikipedia article about the section's idea. */
export function TopicImage({ query }: { query: string }) {
  const img = useWikiImage(query)
  if (img === null) return null
  return (
    <Box component="figure" sx={{ m: 0, mt: 2 }}>
      <Box sx={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', bgcolor: '#e9e9ec', boxShadow: `inset 0 0 0 1px ${cv.border}`, height: { xs: 190, sm: 240 }, display: 'grid', placeItems: 'center' }}>
        {img === undefined ? (
          <Skeleton variant="rectangular" animation="wave" sx={{ position: 'absolute', inset: 0, height: '100%', bgcolor: '#232323' }} />
        ) : (
          <>
            {/* Blurred copy fills the frame; the full picture sits on top, never cropped. */}
            <Box component="img" src={img.src} alt="" aria-hidden sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) saturate(1.1)', transform: 'scale(1.15)', opacity: 0.55 }} />
            <Box component="img" src={img.src} alt={img.title} loading="lazy" referrerPolicy="no-referrer" sx={{ position: 'absolute', inset: 8, width: 'calc(100% - 16px)', height: 'calc(100% - 16px)', objectFit: 'contain', animation: 'thImg .5s ease both', '@keyframes thImg': { from: { opacity: 0 } } }} />
          </>
        )}
      </Box>
      {img && (
        <Box component="figcaption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, fontSize: 12, color: cv.faint }}>
          <span>{img.title}</span>
          <Box component="a" href={img.page} target="_blank" rel="noopener noreferrer" sx={{ ml: 'auto', display: 'inline-flex', alignItems: 'center', gap: 0.25, color: cv.faint, textDecoration: 'none', '&:hover': { color: cv.muted } }}>
            Wikipédia <OpenInNewRounded sx={{ fontSize: 12 }} />
          </Box>
        </Box>
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
