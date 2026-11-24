import { useEffect, useMemo, useState } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { Search, PersonAddAlt1Rounded, ChatBubbleOutlineRounded } from '@mui/icons-material'
import { ChatSummary, PublicProfile, isOnline, isUnread, pairId, receiptOf } from '../services/social'
import { PreviewText, SeenAvatar } from './Receipt'
import Conversation from './Conversation'
import { FriendView } from '../services/useSocial'
import { Avatar } from './Friends'
import Mascot from './Mascot'
import { soundManager } from '../utils/soundEffects'
import useIsMobile from '../hooks/useIsMobile'
import { cv } from '../theme'

// Messages between friends, live (Firestore). Built like Slack: direct
// messages on the left with unread marks and who is online; on the right the
// conversation, grouped by person and by day, with the composer at the
// bottom (Enter sends, Shift+Enter starts a new line). On a phone the list
// and the conversation are two screens.

interface Props {
  me: PublicProfile
  friends: FriendView[]
  incomingCount: number
  chats: ChatSummary[]
  openWith?: string | null
  onAddFriend: () => void
  onOpenRequests: () => void
}

const time = (ms: number) => new Date(ms).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
const shortWhen = (ms?: number) => {
  if (!ms) return ''
  const d = new Date(ms)
  return d.toDateString() === new Date().toDateString() ? time(ms) : d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}
export default function Chat({ me, friends, incomingCount, chats, openWith, onAddFriend, onOpenRequests }: Props) {
  const isMobile = useIsMobile()
  const [active, setActive] = useState<string | null>(openWith || null)
  const [query, setQuery] = useState('')
  useEffect(() => { if (openWith) setActive(openWith) }, [openWith])

  // Desktop opens the most recent conversation.
  const byChat = useMemo(() => Object.fromEntries(chats.map((c) => [c.id, c])), [chats])
  const list = useMemo(() => friends
    .map((f) => ({ f, chat: byChat[pairId(me.uid, f.uid)] }))
    .filter(({ f }) => !query.trim() || f.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (b.chat?.lastAt || 0) - (a.chat?.lastAt || 0) || a.f.name.localeCompare(b.f.name)), [friends, byChat, me.uid, query])
  useEffect(() => { if (!isMobile && !active && list.length) setActive(list[0].f.uid) }, [isMobile, active, list])

  const current = friends.find((f) => f.uid === active) || null
  const showList = !isMobile || !current
  const showConversation = !!current

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 0, sm: 2, md: 3 }, pt: { xs: 0, sm: 3 }, boxSizing: 'border-box', textAlign: 'left', color: cv.text }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '260px 1fr', md: '300px 1fr' }, height: { xs: 'auto', sm: 'calc(100dvh - 56px - 24px - 108px)' }, minHeight: { sm: 420 },
        borderRadius: { sm: '24px' }, boxShadow: { sm: `inset 0 0 0 1px ${cv.border}` }, overflow: 'hidden', bgcolor: { sm: cv.paper } }}>

        {/* Sidebar: direct messages */}
        {showList && (
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: { sm: `1px solid ${cv.border}` }, bgcolor: { sm: '#181818' } }}>
            <Box sx={{ px: 2, pt: { xs: 2.5, md: 2 }, pb: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography component="h1" sx={{ flex: 1, fontFamily: cv.display, fontSize: { xs: 24, md: 18 }, fontWeight: 700, letterSpacing: '-0.02em' }}>Mensagens</Typography>
              <IconButton onClick={() => { soundManager.playClick(); onAddFriend() }} aria-label="Adicionar amigo" title="Adicionar amigo" sx={{ width: 34, height: 34, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
                <PersonAddAlt1Rounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Box sx={{ px: 1.5, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, height: 36, px: 1.25, borderRadius: '11px', bgcolor: cv.soft }}>
                <Search sx={{ fontSize: 17, color: cv.muted }} />
                <Box component="input" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Procurar amigos" aria-label="Procurar amigos"
                  sx={{ flex: 1, minWidth: 0, border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 13.5, '&::placeholder': { color: cv.faint } }} />
              </Box>
            </Box>

            {incomingCount > 0 && (
              <Box component="button" onClick={onOpenRequests} sx={{ mx: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1, p: '8px 10px', border: 0, borderRadius: '11px', bgcolor: 'rgba(96,165,250,.1)', color: cv.text, font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                <Box component="span" sx={{ minWidth: 20, height: 20, px: 0.5, borderRadius: 999, bgcolor: cv.accent, color: '#0d0d0d', fontSize: 11.5, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{incomingCount}</Box>
                {incomingCount === 1 ? 'pedido de amizade' : 'pedidos de amizade'}
              </Box>
            )}

            <Typography sx={{ px: 2, pt: 0.5, pb: 0.5, fontSize: 11.5, fontWeight: 700, color: cv.faint, textTransform: 'uppercase', letterSpacing: '.07em' }}>Mensagens diretas</Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', px: 0.75, pb: { xs: 14, md: 1 } }}>
              {list.map(({ f, chat }) => {
                const unread = chat ? isUnread(chat, me.uid) : false
                const on = f.uid === active && !isMobile
                return (
                  <Box key={f.uid} component="button" onClick={() => { soundManager.playClick(); setActive(f.uid) }}
                    sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.25, p: '8px 10px', border: 0, borderRadius: '12px', textAlign: 'left', font: 'inherit', color: cv.text, cursor: 'pointer',
                      bgcolor: on ? cv.surface : 'transparent', '&:hover': { bgcolor: on ? cv.surface : cv.soft } }}>
                    <Avatar name={f.name} photo={f.profile?.photo} size={36} online={isOnline(f.profile)} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography sx={{ flex: 1, fontSize: 14, fontWeight: unread ? 700 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: unread ? cv.accent : cv.faint, flexShrink: 0 }}>{shortWhen(chat?.lastAt)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ flex: 1, fontSize: 12.5, color: unread ? cv.text : cv.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chat?.lastText ? (
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}>
                              {chat.lastFrom === me.uid && <Box component="span" sx={{ flexShrink: 0 }}>Tu:</Box>}
                              <PreviewText text={chat.lastText} />
                            </Box>
                          ) : 'Diz olá'}
                        </Typography>
                        {chat?.lastText && chat.lastFrom === me.uid && receiptOf({ at: chat.lastAt || 0 }, chat, f.uid) === 'seen' && <SeenAvatar friend={{ name: f.name, photo: f.profile?.photo }} />}
                        {unread && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cv.accent, flexShrink: 0 }} />}
                      </Box>
                    </Box>
                  </Box>
                )
              })}
              {!friends.length && (
                <Box sx={{ px: 1.5, py: 3, display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 1 }}>
                  <Mascot size={56} mood="happy" animated={false} />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, mt: 1 }}>Ainda não tens amigos</Typography>
                  <Typography sx={{ fontSize: 13, color: cv.muted, maxWidth: 220 }}>Adiciona amigos pelo nome ou pelo QR code para conversarem aqui.</Typography>
                  <Box component="button" onClick={onAddFriend} sx={{ mt: 1, height: 36, px: 2, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Adicionar amigo</Box>
                </Box>
              )}
              {friends.length > 0 && !list.length && <Typography sx={{ px: 1.5, py: 2, fontSize: 13, color: cv.muted }}>Ninguém com “{query}”.</Typography>}
            </Box>
          </Box>
        )}

        {/* Conversation */}
        {showConversation ? (
          <Conversation key={current!.uid} me={me} friend={current!} chat={byChat[pairId(me.uid, current!.uid)]} mobile={isMobile} onBack={() => setActive(null)} />
        ) : !isMobile && (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', p: 4 }}>
            <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1 }}>
              <ChatBubbleOutlineRounded sx={{ fontSize: 34, color: cv.faint }} />
              <Typography sx={{ color: cv.muted, fontSize: 14 }}>Escolhe um amigo para conversar.</Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

