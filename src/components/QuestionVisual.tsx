import { Box, Typography } from '@mui/material'
import { FormatQuoteRounded } from '@mui/icons-material'
import { ExerciseVisual, Subject } from '../types'
import { SubjectTile } from './SubjectDoodle'
import { subjectColor, subjectName } from '../data/ptCurriculum'
import { cv } from '../theme'

// Something to look at with every question, in the app's quiet card style:
// an excerpt, a formula, a small table, a bar chart or a list — and when the
// AI sends none, a card with the subject and the lesson topic.

interface QuestionVisualProps {
    visual?: ExerciseVisual
    subject?: string | null
    topic?: string
}

const card = { borderRadius: '20px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, overflow: 'hidden' }
const label = { fontSize: 12, fontWeight: 600, color: cv.muted, textTransform: 'uppercase' as const, letterSpacing: '.06em' }

export default function QuestionVisual({ visual, subject, topic }: QuestionVisualProps) {
    const accent = subject ? subjectColor(subject) : cv.accent

    if (!visual) {
        if (!subject) return null
        return (
            <Box sx={{ ...card, display: 'flex', alignItems: 'center', gap: 1.75, p: 1.75 }}>
                <SubjectTile subject={subject as Subject} size={52} />
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={label}>{subjectName(subject)}</Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, mt: 0.25 }}>{topic || 'Pensa com calma antes de responder.'}</Typography>
                </Box>
            </Box>
        )
    }

    switch (visual.kind) {
        case 'excerpt':
            return (
                <Box sx={{ ...card, position: 'relative', p: '18px 20px 18px 22px', '&::before': { content: '""', position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderRadius: 999, bgcolor: accent } }}>
                    <FormatQuoteRounded sx={{ position: 'absolute', right: 14, top: 10, fontSize: 30, color: 'rgba(255,255,255,.08)' }} />
                    <Typography sx={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 16.5, lineHeight: 1.6, color: '#e6e6ea', whiteSpace: 'pre-line', pr: 3 }}>{visual.text}</Typography>
                    {visual.source && <Typography sx={{ fontSize: 13, color: cv.muted, mt: 1.25 }}>— {visual.source}</Typography>}
                </Box>
            )

        case 'formula':
            return (
                <Box sx={{ ...card, display: 'grid', placeItems: 'center', py: 3.5, px: 2, background: `radial-gradient(120% 140% at 50% 120%, ${accent}14, transparent 60%), ${cv.paper}` }}>
                    <Typography sx={{ fontFamily: "'Cambria Math', 'STIX Two Math', Georgia, serif", fontSize: { xs: 24, sm: 30 }, fontWeight: 500, letterSpacing: '.02em', textAlign: 'center', color: '#f2f2f7' }}>
                        {visual.text}
                    </Typography>
                </Box>
            )

        case 'table':
            return (
                <Box sx={{ ...card, overflowX: 'auto' }}>
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5,
                        '& th, & td': { textAlign: 'left', px: 2, py: 1.25 }, '& th': { fontSize: 12.5, fontWeight: 600, color: cv.muted, bgcolor: 'rgba(255,255,255,.03)' },
                        '& td': { borderTop: `1px solid ${cv.border}` }, '& td:first-of-type': { fontWeight: 600 } }}>
                        <thead><tr>{visual.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                        <tbody>{visual.rows.map((r, ri) => <tr key={ri}>{visual.headers.map((_, ci) => <td key={ci}>{r[ci] ?? ''}</td>)}</tr>)}</tbody>
                    </Box>
                </Box>
            )

        case 'bars': {
            const max = Math.max(...visual.items.map((i) => Math.abs(i.value)), 1)
            return (
                <Box sx={{ ...card, p: 2 }}>
                    {visual.title && <Typography sx={{ ...label, mb: 1.5 }}>{visual.title}</Typography>}
                    <Box sx={{ display: 'grid', gap: 1 }}>
                        {visual.items.map((item, i) => (
                            <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'minmax(70px, 30%) 1fr auto', alignItems: 'center', gap: 1.25 }}>
                                <Typography sx={{ fontSize: 13.5, color: cv.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</Typography>
                                <Box sx={{ height: 12, borderRadius: 999, bgcolor: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                                    <Box sx={{ height: '100%', width: `${(Math.abs(item.value) / max) * 100}%`, bgcolor: accent, borderRadius: 999, transformOrigin: 'left',
                                        animation: `qvGrow .7s cubic-bezier(.22,1,.36,1) ${0.1 + i * 0.06}s both`, '@keyframes qvGrow': { from: { transform: 'scaleX(0)' } } }} />
                                </Box>
                                <Typography sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>{item.value}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )
        }

        case 'list':
            return (
                <Box sx={{ ...card, p: 2 }}>
                    {visual.title && <Typography sx={{ ...label, mb: 1.25 }}>{visual.title}</Typography>}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {visual.items.map((item, i) => (
                            <Box key={i} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.9, borderRadius: '12px', bgcolor: 'rgba(255,255,255,.05)', fontSize: 14.5 }}>
                                <Box component="span" sx={{ width: 20, height: 20, borderRadius: '6px', bgcolor: accent, color: '#1d2742', fontSize: 11.5, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{i + 1}</Box>
                                {item}
                            </Box>
                        ))}
                    </Box>
                </Box>
            )
    }
}
