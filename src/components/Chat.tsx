import { useEffect, useMemo, useState } from 'react'
import { Box, Typography, IconButton, Menu, MenuItem, Divider } from '@mui/material'
import { Search, PersonAddAlt1Rounded, ChatBubbleOutlineRounded, AddRounded, MoreVertRounded, ArchiveOutlined, UnarchiveOutlined, BlockRounded, PersonRemoveRounded } from '@mui/icons-material'
import { ChatSummary, GroupInfo, PublicProfile, BlockedContact, isOnline, isUnread, pairId, receiptOf, dmRef, groupRef, archiveContact, unarchiveContact, blockContact, unblockContact, removeFriendship, subscribeArchivedContacts, subscribeBlockedContacts } from '../services/social'
import { PreviewText, SeenAvatar } from './Receipt'
import Conversation, { GroupAvatar, Thread } from './Conversation'
import { CreateGroupDialog, GroupInfoDialog } from './Groups'
import { FriendView } from '../services/useSocial'
import { UserProfile } from '../types'
import { Avatar } from './Friends'
import Mascot from './Mascot'
import { soundManager } from '../utils/soundEffects'
import useIsMobile from '../hooks/useIsMobile'
import { cv } from '../theme'

// Messages, built like Slack: groups and direct messages on the left with
// unread marks and who is online; on the right the conversation. On a phone
// the list and the conversation are two screens.

interface Props {
  me: PublicProfile
  friends: FriendView[]
  incomingCount: number
  chats: ChatSummary[]
  groups: GroupInfo[]
  openWith?: string | null
  onAddFriend: () => void
  onOpenRequests: () => void
  profile?: UserProfile
}

const time = (ms: number) => new Date(ms).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
const shortWhen = (ms?: number) => {
  if (!ms) return ''
  const d = new Date(ms)
  return d.toDateString() === new Date().toDateString() ? time(ms) : d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}

export default function Chat({ me, friends, incomingCount, chats, groups, openWith, onAddFriend, onOpenRequests, profile }: Props) {
  const isMobile = useIsMobile()
  const [active, setActive] = useState<string | null>(openWith ? `dm:${openWith}` : null)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [archived, setArchived] = useState<BlockedContact[]>([])
  const [blocked, setBlocked] = useState<BlockedContact[]>([])
  const [contactMenu, setContactMenu] = useState<{ anchor: HTMLElement; friend: FriendView; archived: boolean } | null>(null)
  useEffect(() => { if (openWith) setActive(`dm:${openWith}`) }, [openWith])
  useEffect(() => {
    const a = subscribeArchivedContacts(me.uid, setArchived)
    const b = subscribeBlockedContacts(me.uid, setBlocked)
    return () => { a(); b() }
  }, [me.uid])

  const q = query.trim().toLowerCase()
  const byChat = useMemo(() => Object.fromEntries(chats.map((c) => [c.id, c])), [chats])
  const dms = useMemo(() => friends
    .map((f) => ({ f, chat: byChat[pairId(me.uid, f.uid)] }))
    .filter(({ f }) => !archived.some((a) => a.uid === f.uid) && (!q || f.name.toLowerCase().includes(q)))
    .sort((a, b) => (b.chat?.lastAt || 0) - (a.chat?.lastAt || 0) || a.f.name.localeCompare(b.f.name)), [friends, byChat, me.uid, q, archived])
  const archivedDms = useMemo(() => friends
    .filter((f) => archived.some((a) => a.uid === f.uid) && (!q || f.name.toLowerCase().includes(q)))
    .map((f) => ({ f, chat: byChat[pairId(me.uid, f.uid)] }))
    .sort((a, b) => (b.chat?.lastAt || 0) - (a.chat?.lastAt || 0)), [friends, byChat, me.uid, q, archived])
  const groupList = useMemo(() => groups.filter((g) => !q || g.name.toLowerCase().includes(q)).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)), [groups, q])

  // Desktop opens the most recent conversation.
  useEffect(() => {
    if (isMobile || active) return
    const g = groupList[0], d = dms[0]
    if (g && (!d || (g.lastAt || 0) > (d.chat?.lastAt || 0))) setActive(`g:${g.id}`)
    else if (d) setActive(`dm:${d.f.uid}`)
  }, [isMobile, active, groupList, dms])

  const nameOf = (uid: string) => (uid === me.uid ? me.name : friends.find((f) => f.uid === uid)?.name)
  let thread: Thread | null = null
  let summary: ChatSummary | undefined
  if (active?.startsWith('dm:')) {
    const f = friends.find((x) => x.uid === active.slice(3))
    if (f) {
      thread = { ref: dmRef(me.uid, f.uid), title: f.name, isGroup: false, friend: f, members: [{ uid: me.uid, name: me.name, photo: me.photo }, { uid: f.uid, name: f.name, photo: f.profile?.photo }] }
      summary = byChat[pairId(me.uid, f.uid)]
    }
  } else if (active?.startsWith('g:')) {
    const g = groups.find((x) => x.id === active.slice(2))
    if (g) {
      thread = {
        ref: groupRef(g.id), title: g.name, isGroup: true, group: g, color: g.color,
        members: g.members.map((uid) => ({ uid, name: nameOf(uid) || g.memberNames[uid] || 'Alguém', photo: uid === me.uid ? me.photo : friends.find((f) => f.uid === uid)?.profile?.photo })),
      }
      summary = g
    }
  }
  const showList = !isMobile || !thread
  const currentGroup = thread?.group || null

  const row = (key: string, on: boolean, unread: boolean, avatar: React.ReactNode, title: string, when: number | undefined, preview: React.ReactNode, trailing?: React.ReactNode) => (
    <Box key={key} component="div" role="button" tabIndex={0} onClick={() => { soundManager.playClick(); setActive(key) }} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(key) } }}
      sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.25, p: '8px 10px', border: 0, borderRadius: '12px', textAlign: 'left', font: 'inherit', color: cv.text, cursor: 'pointer',
        bgcolor: on ? cv.surface : 'transparent', '&:hover': { bgcolor: on ? cv.surface : cv.soft } }}>
      {avatar}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography sx={{ flex: 1, fontSize: 14, fontWeight: unread ? 700 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
          <Typography sx={{ fontSize: 11.5, color: unread ? cv.accent : cv.faint, flexShrink: 0 }}>{shortWhen(when)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography component="div" sx={{ flex: 1, minWidth: 0, fontSize: 12.5, color: unread ? cv.text : cv.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</Typography>
          {trailing}
          {unread && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cv.accent, flexShrink: 0 }} />}
        </Box>
      </Box>
    </Box>
  )
  const sectionTitle = (text: string, action?: React.ReactNode) => (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 1.25, pb: 0.5, minHeight: 24 }}>
      <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: cv.faint, textTransform: 'uppercase', letterSpacing: '.07em' }}>{text}</Typography>
      {action}
    </Box>
  )
  const previewOf = (c: ChatSummary | undefined, fromName?: string) => c?.lastText ? (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}>
      {c.lastFrom === me.uid ? <Box component="span" sx={{ flexShrink: 0 }}>Tu:</Box> : fromName ? <Box component="span" sx={{ flexShrink: 0 }}>{fromName}:</Box> : null}
      <PreviewText text={c.lastText} />
    </Box>
  ) : 'Diz olá'

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 0, sm: 2, md: 3 }, pt: { xs: 0, sm: 3 }, boxSizing: 'border-box', textAlign: 'left', color: cv.text }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '260px 1fr', md: '300px 1fr' }, height: { xs: 'auto', sm: 'calc(100dvh - 56px - 24px - 108px)' }, minHeight: { sm: 420 },
        borderRadius: { sm: '24px' }, boxShadow: { sm: `inset 0 0 0 1px ${cv.border}` }, overflow: 'hidden', bgcolor: { sm: cv.paper } }}>

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
                <Box component="input" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Procurar" aria-label="Procurar conversas"
                  sx={{ flex: 1, minWidth: 0, border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 13.5, '&::placeholder': { color: cv.faint } }} />
              </Box>
            </Box>

            {incomingCount > 0 && (
              <Box component="button" onClick={onOpenRequests} sx={{ mx: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1, p: '8px 10px', border: 0, borderRadius: '11px', bgcolor: 'rgba(96,165,250,.1)', color: cv.text, font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                <Box component="span" sx={{ minWidth: 20, height: 20, px: 0.5, borderRadius: 999, bgcolor: cv.accent, color: '#0d0d0d', fontSize: 11.5, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{incomingCount}</Box>
                {incomingCount === 1 ? 'pedido de amizade' : 'pedidos de amizade'}
              </Box>
            )}

            <Box sx={{ flex: 1, overflowY: 'auto', pb: { xs: 14, sm: 1 } }}>
              {/* Groups */}
              {sectionTitle('Grupos', friends.length > 0 && (
                <IconButton onClick={() => { soundManager.playClick(); setCreating(true) }} aria-label="Criar grupo" title="Criar grupo" sx={{ width: 24, height: 24, color: cv.muted }}><AddRounded sx={{ fontSize: 18 }} /></IconButton>
              ))}
              <Box sx={{ px: 0.75 }}>
                {groupList.map((g) => row(`g:${g.id}`, active === `g:${g.id}` && !isMobile, isUnread(g, me.uid), <GroupAvatar name={g.name} color={g.color} size={36} />, g.name, g.lastAt,
                  previewOf(g, g.lastFrom && g.lastFrom !== me.uid ? (g.lastFromName || g.memberNames[g.lastFrom])?.split(' ')[0] : undefined)))}
                {!groupList.length && !q && friends.length > 0 && (
                  <Box component="button" onClick={() => setCreating(true)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.25, p: '8px 10px', border: 0, borderRadius: '12px', bgcolor: 'transparent', color: cv.muted, font: 'inherit', fontSize: 13.5, cursor: 'pointer', textAlign: 'left', '&:hover': { bgcolor: cv.soft, color: cv.text } }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '12px', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, display: 'grid', placeItems: 'center' }}><AddRounded sx={{ fontSize: 19 }} /></Box>
                    Criar um grupo de estudo
                  </Box>
                )}
              </Box>

              {/* Direct messages */}
              {sectionTitle('Mensagens diretas')}
              <Box sx={{ px: 0.75 }}>
                {dms.map(({ f, chat }) => row(`dm:${f.uid}`, active === `dm:${f.uid}` && !isMobile, chat ? isUnread(chat, me.uid) : false,
                  <Avatar name={f.name} photo={f.profile?.photo} size={36} online={isOnline(f.profile)} />, f.name, chat?.lastAt, previewOf(chat),
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.2, flexShrink: 0 }}>
                    {chat?.lastText && chat.lastFrom === me.uid && receiptOf({ at: chat.lastAt || 0 }, chat, f.uid) === 'seen' && <SeenAvatar friend={{ name: f.name, photo: f.profile?.photo }} />}
                    <IconButton aria-label={`Opções de ${f.name}`} onClick={(e) => { e.stopPropagation(); setContactMenu({ anchor: e.currentTarget, friend: f, archived: false }) }} sx={{ width: 30, height: 30 }}><MoreVertRounded sx={{ fontSize: 19 }} /></IconButton>
                  </Box>))}
                {!friends.length && (
                  <Box sx={{ px: 1.5, py: 3, display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 1 }}>
                    <Mascot size={56} mood="happy" animated={false} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600, mt: 1 }}>Ainda não tens amigos</Typography>
                    <Typography sx={{ fontSize: 13, color: cv.muted, maxWidth: 220 }}>Adiciona amigos pelo nome ou pelo QR code para conversarem aqui.</Typography>
                    <Box component="button" onClick={onAddFriend} sx={{ mt: 1, height: 36, px: 2, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Adicionar amigo</Box>
                  </Box>
                )}
                {q && !dms.length && !groupList.length && <Typography sx={{ px: 1.5, py: 2, fontSize: 13, color: cv.muted }}>Nada com “{query}”.</Typography>}
              </Box>
              {archivedDms.length > 0 && <>
                {sectionTitle('Arquivadas')}
                <Box sx={{ px: 0.75 }}>
                  {archivedDms.map(({ f, chat }) => row(`dm:${f.uid}`, active === `dm:${f.uid}` && !isMobile, chat ? isUnread(chat, me.uid) : false,
                    <Avatar name={f.name} photo={f.profile?.photo} size={36} />, f.name, chat?.lastAt, previewOf(chat),
                    <IconButton aria-label={`Opções de ${f.name}`} onClick={(e) => { e.stopPropagation(); setContactMenu({ anchor: e.currentTarget, friend: f, archived: true }) }} sx={{ width: 30, height: 30 }}><MoreVertRounded sx={{ fontSize: 19 }} /></IconButton>))}
                </Box>
              </>}
              {blocked.length > 0 && <>
                {sectionTitle('Contactos bloqueados')}
                <Box sx={{ px: 0.75 }}>
                  {blocked.map((f) => <Box key={f.uid} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: '8px 10px' }}>
                    <Avatar name={f.name} photo={f.photo} size={36} />
                    <Typography sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                    <IconButton aria-label={`Desbloquear ${f.name}`} title="Desbloquear" onClick={() => unblockContact(me.uid, f.uid).catch(() => window.alert('Não foi possível desbloquear este contacto.'))} sx={{ width: 32, height: 32 }}><BlockRounded sx={{ fontSize: 17 }} /></IconButton>
                  </Box>)}
                </Box>
              </>}
            </Box>
          </Box>
        )}

        {thread ? (
          <Conversation key={active!} me={me} thread={thread} chat={summary} mobile={isMobile} onBack={() => setActive(null)} onOpenInfo={() => setInfoOpen(true)} profile={profile} />
        ) : !isMobile && (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', p: 4 }}>
            <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1 }}>
              <ChatBubbleOutlineRounded sx={{ fontSize: 34, color: cv.faint }} />
              <Typography sx={{ color: cv.muted, fontSize: 14 }}>Escolhe uma conversa.</Typography>
            </Box>
          </Box>
        )}
      </Box>

      <CreateGroupDialog open={creating} me={me} friends={friends} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setActive(`g:${id}`) }} />
      <Menu anchorEl={contactMenu?.anchor} open={!!contactMenu} onClose={() => setContactMenu(null)} PaperProps={{ sx: { minWidth: 200, bgcolor: '#242424', color: cv.text, border: `1px solid ${cv.border}`, borderRadius: '14px' } }}>
        {contactMenu && <>
          <MenuItem onClick={async () => {
            const item = contactMenu
            setContactMenu(null)
            try {
              if (item.archived) await unarchiveContact(me.uid, item.friend.uid)
              else await archiveContact(me.uid, { uid: item.friend.uid, name: item.friend.name, handle: item.friend.profile?.handle || '', photo: item.friend.profile?.photo })
              if (!item.archived && active === `dm:${item.friend.uid}`) setActive(null)
            } catch { window.alert('Não foi possível atualizar as conversas arquivadas.') }
          }}>
            {contactMenu.archived ? <UnarchiveOutlined sx={{ mr: 1.5, fontSize: 18 }} /> : <ArchiveOutlined sx={{ mr: 1.5, fontSize: 18 }} />}{contactMenu.archived ? 'Desarquivar' : 'Arquivar conversa'}
          </MenuItem>
          <Divider sx={{ borderColor: cv.border }} />
          <MenuItem sx={{ color: '#ff9f9f' }} onClick={async () => {
            const item = contactMenu
            setContactMenu(null)
            if (!window.confirm(`Bloquear ${item.friend.name}? Esta pessoa deixará de poder falar contigo.`)) return
            try {
              await blockContact(me.uid, { uid: item.friend.uid, name: item.friend.name, handle: item.friend.profile?.handle || '', photo: item.friend.profile?.photo }, item.friend.friendship.id)
              if (active === `dm:${item.friend.uid}`) setActive(null)
            } catch { window.alert('Não foi possível bloquear este contacto.') }
          }}><BlockRounded sx={{ mr: 1.5, fontSize: 18 }} />Bloquear</MenuItem>
          <MenuItem sx={{ color: '#ff9f9f' }} onClick={async () => {
            const item = contactMenu
            setContactMenu(null)
            if (!window.confirm(`Apagar ${item.friend.name} dos teus contactos?`)) return
            try {
              await removeFriendship(item.friend.friendship.id)
              if (active === `dm:${item.friend.uid}`) setActive(null)
            } catch { window.alert('Não foi possível apagar este contacto.') }
          }}><PersonRemoveRounded sx={{ mr: 1.5, fontSize: 18 }} />Apagar contacto</MenuItem>
        </>}
      </Menu>
      {currentGroup && <GroupInfoDialog open={infoOpen} me={me} group={currentGroup} friends={friends} onClose={() => setInfoOpen(false)} onLeft={() => { setInfoOpen(false); setActive(null) }} />}
    </Box>
  )
}
