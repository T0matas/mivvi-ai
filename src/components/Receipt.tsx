import { Box, Typography } from '@mui/material'
import { PhotoOutlined, AttachFileRounded, MicNoneRounded, CallRounded, PhoneMissedRounded, VideocamOutlined, BlockRounded } from '@mui/icons-material'
import { Receipt } from '../services/social'
import { Avatar } from './Friends'
import { cv } from '../theme'

// Read receipts in Mivvi's quiet style: no ticks, just words and, once seen,
// the friend's tiny avatar — like a teacher's nod.

export const RECEIPT_LABEL: Record<Receipt, string> = { pending: 'A enviar…', sent: 'Enviada', delivered: 'Entregue', seen: 'Vista' }

/** Under my last message: "Enviada", "Entregue" or [avatar] "Vista · 17:02". */
export function SeenLine({ state, at, friend }: { state: Receipt; at?: string; friend: { name: string; photo?: string | null } }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75, mt: 0.75, pr: 0.25 }}>
      {state === 'seen' ? <Avatar name={friend.name} photo={friend.photo} size={16} />
        : <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: state === 'delivered' ? cv.muted : 'transparent', boxShadow: state === 'delivered' ? 'none' : `inset 0 0 0 1.5px ${cv.faint}` }} />}
      <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: state === 'seen' ? cv.muted : cv.faint }}>
        {RECEIPT_LABEL[state]}{state === 'seen' && at ? ` · ${at}` : ''}
      </Typography>
    </Box>
  )
}

/** In the conversation list: the friend's tiny avatar once they've seen my last message. */
export function SeenAvatar({ friend }: { friend: { name: string; photo?: string | null } }) {
  return <Box title="Vista" sx={{ display: 'inline-flex', opacity: 0.9 }}><Avatar name={friend.name} photo={friend.photo} size={14} /></Box>
}

const KINDS: [RegExp, typeof PhotoOutlined, string?][] = [
  [/^📷\s*/, PhotoOutlined],
  [/^📎\s*/, AttachFileRounded],
  [/^🎤\s*/, MicNoneRounded],
  [/^📹\s*/, VideocamOutlined],
  [/^📞\s*Chamada perdida/, PhoneMissedRounded, cv.coral],
  [/^📞\s*/, CallRounded],
  [/^🚫\s*/, BlockRounded],
]

/** A chat preview where "📷 Foto"-style labels get the app's icons instead of emoji. */
export function PreviewText({ text }: { text: string }) {
  for (const [re, Icon, color] of KINDS) {
    if (re.test(text)) {
      return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: color || 'inherit', minWidth: 0 }}>
          <Icon sx={{ fontSize: 14, flexShrink: 0 }} />
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{text.replace(/^(📷|📎|🎤|📹|📞|🚫)\s*/, '')}</Box>
        </Box>
      )
    }
  }
  return <>{text}</>
}
