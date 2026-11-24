import { Box } from '@mui/material'
import { DoneRounded, DoneAllRounded, ScheduleRounded } from '@mui/icons-material'
import { Receipt } from '../services/social'
import { cv } from '../theme'

// ✓ sent · ✓✓ delivered · blue ✓✓ seen · clock while sending.
export const RECEIPT_LABEL: Record<Receipt, string> = { pending: 'A enviar', sent: 'Enviada', delivered: 'Entregue', seen: 'Vista' }

export default function ReceiptIcon({ state, size = 15 }: { state: Receipt; size?: number }) {
  const sx = { fontSize: size, color: state === 'seen' ? cv.accent : cv.faint, verticalAlign: 'middle', flexShrink: 0 }
  return (
    <Box component="span" title={RECEIPT_LABEL[state]} aria-label={RECEIPT_LABEL[state]} sx={{ display: 'inline-flex' }}>
      {state === 'pending' ? <ScheduleRounded sx={{ ...sx, fontSize: size - 2 }} /> : state === 'sent' ? <DoneRounded sx={sx} /> : <DoneAllRounded sx={sx} />}
    </Box>
  )
}
