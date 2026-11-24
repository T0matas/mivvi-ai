import { useEffect, useState } from 'react'
import { Box, Dialog, Typography, IconButton, CircularProgress } from '@mui/material'
import { Close, CheckRounded, Search, EditRounded, LogoutRounded, PersonAddAlt1Rounded } from '@mui/icons-material'
import { createGroup, renameGroup, addGroupMembers, leaveGroup, GroupInfo, PublicProfile } from '../services/social'
import { FriendView } from '../services/useSocial'
import { Avatar } from './Friends'
import { GroupAvatar } from './Conversation'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// Study groups: a name and some friends. The creator is admin (can rename and
// add people); anyone can leave.

const paper = { bgcolor: '#1c1c1c', borderRadius: '24px', m: 1.5, color: cv.text, textAlign: 'left' as const, maxHeight: 'calc(100% - 24px)' }
const primary = { height: 44, px: 2.5, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, '&:disabled': { bgcolor: cv.surface, color: cv.faint, cursor: 'default' } } as const

function FriendPicker({ friends, picked, onToggle, exclude = [] }: { friends: FriendView[]; picked: string[]; onToggle: (uid: string) => void; exclude?: string[] }) {
  const [q, setQ] = useState('')
  const list = friends.filter((f) => !exclude.includes(f.uid) && (!q.trim() || f.name.toLowerCase().includes(q.trim().toLowerCase())))
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, height: 38, px: 1.25, mt: 1.5, borderRadius: '11px', bgcolor: cv.soft }}>
        <Search sx={{ fontSize: 17, color: cv.muted }} />
        <Box component="input" value={q} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} placeholder="Procurar amigos"
          sx={{ flex: 1, minWidth: 0, border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14, '&::placeholder': { color: cv.faint } }} />
      </Box>
      <Box sx={{ mt: 1, maxHeight: 280, overflowY: 'auto', display: 'grid', gap: 0.25 }}>
        {list.map((f) => {
          const on = picked.includes(f.uid)
          return (
            <Box key={f.uid} component="button" onClick={() => { soundManager.playSelect(); onToggle(f.uid) }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: '7px 8px', border: 0, borderRadius: '12px', bgcolor: on ? cv.surface : 'transparent', color: cv.text, font: 'inherit', textAlign: 'left', cursor: 'pointer', '&:hover': { bgcolor: on ? cv.surface : cv.soft } }}>
              <Avatar name={f.name} photo={f.profile?.photo} size={32} />
              <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{f.name}</Typography>
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: on ? '#fff' : 'transparent', boxShadow: on ? 'none' : `inset 0 0 0 1.5px ${cv.borderStrong}`, color: '#0d0d0d' }}>
                {on && <CheckRounded sx={{ fontSize: 15 }} />}
              </Box>
            </Box>
          )
        })}
        {!list.length && <Typography sx={{ fontSize: 13.5, color: cv.muted, p: 1 }}>{friends.length ? 'Ninguém encontrado.' : 'Adiciona amigos primeiro.'}</Typography>}
      </Box>
    </>
  )
}

export function CreateGroupDialog({ open, me, friends, onClose, onCreated }: { open: boolean; me: PublicProfile; friends: FriendView[]; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (open) { setName(''); setPicked([]); setError('') } }, [open])

  const create = async () => {
    if (!name.trim() || !picked.length) return
    setBusy(true); setError('')
    try {
      const id = await createGroup({ uid: me.uid, name: me.name }, name, picked.map((uid) => ({ uid, name: friends.find((f) => f.uid === uid)?.name || 'Amigo' })))
      soundManager.playSuccess()
      onCreated(id)
    } catch {
      soundManager.playError()
      setError('Não foi possível criar o grupo. Verifica a ligação.')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: paper }}>
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ flex: 1, fontFamily: cv.display, fontSize: 20, fontWeight: 700 }}>Novo grupo</Typography>
          <IconButton onClick={onClose} aria-label="Fechar" sx={{ width: 34, height: 34 }}><Close sx={{ fontSize: 19 }} /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 2 }}>
          <GroupAvatar name={name || 'Grupo'} size={46} />
          <Box component="input" autoFocus value={name} maxLength={40} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Nome do grupo (ex.: Turma 11.º B)"
            sx={{ flex: 1, minWidth: 0, height: 46, px: 1.5, border: 0, outline: 'none', borderRadius: '14px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 15, fontWeight: 600, '&:focus': { boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.5)' }, '&::placeholder': { color: cv.faint, fontWeight: 500 } }} />
        </Box>
        <Typography sx={{ fontSize: 12.5, color: cv.muted, mt: 2 }}>Escolhe quem entra{picked.length ? ` · ${picked.length}` : ''}</Typography>
        <FriendPicker friends={friends} picked={picked} onToggle={(uid) => setPicked((p) => (p.includes(uid) ? p.filter((x) => x !== uid) : [...p, uid]))} />
        {error && <Typography sx={{ fontSize: 13, color: cv.coral, mt: 1 }}>{error}</Typography>}
        <Box component="button" onClick={create} disabled={busy || !name.trim() || !picked.length} sx={{ ...primary, width: '100%', mt: 2 }}>
          {busy && <CircularProgress size={15} sx={{ color: '#0d0d0d' }} />}Criar grupo
        </Box>
      </Box>
    </Dialog>
  )
}

export function GroupInfoDialog({ open, me, group, friends, onClose, onLeft }: { open: boolean; me: PublicProfile; group: GroupInfo; friends: FriendView[]; onClose: () => void; onLeft: () => void }) {
  const isAdmin = group.admins.includes(me.uid)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(group.name)
  const [adding, setAdding] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setRenaming(false); setAdding(false); setPicked([]); setName(group.name) } }, [open, group.name])

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try { await fn(); soundManager.playSuccess() } catch { soundManager.playError() } finally { setBusy(false) }
  }
  const photoOf = (uid: string) => (uid === me.uid ? me.photo : friends.find((f) => f.uid === uid)?.profile?.photo)
  const nameOf = (uid: string) => (uid === me.uid ? 'Tu' : friends.find((f) => f.uid === uid)?.name || group.memberNames[uid] || 'Alguém')

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: paper }}>
      <Box sx={{ p: 2.5, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={onClose} aria-label="Fechar" sx={{ width: 34, height: 34 }}><Close sx={{ fontSize: 19 }} /></IconButton>
        </Box>
        <Box sx={{ display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 1, mt: -1 }}>
          <GroupAvatar name={group.name} color={group.color} size={64} />
          {renaming ? (
            <Box sx={{ display: 'flex', gap: 1, width: '100%', mt: 1 }}>
              <Box component="input" autoFocus value={name} maxLength={40} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && name.trim()) run(async () => { await renameGroup(group.id, name); setRenaming(false) }) }}
                sx={{ flex: 1, minWidth: 0, height: 40, px: 1.25, border: 0, outline: 'none', borderRadius: '12px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 15, fontWeight: 600 }} />
              <Box component="button" disabled={busy || !name.trim()} onClick={() => run(async () => { await renameGroup(group.id, name); setRenaming(false) })} sx={{ ...primary, height: 40, px: 1.75 }}>Guardar</Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700 }}>{group.name}</Typography>
              {isAdmin && <IconButton onClick={() => setRenaming(true)} aria-label="Mudar o nome" sx={{ width: 30, height: 30 }}><EditRounded sx={{ fontSize: 16 }} /></IconButton>}
            </Box>
          )}
          <Typography sx={{ fontSize: 13, color: cv.muted }}>{group.members.length} membros</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2.5, mb: 0.75 }}>
          <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: cv.faint, textTransform: 'uppercase', letterSpacing: '.07em' }}>Membros</Typography>
          {isAdmin && !adding && <Box component="button" onClick={() => setAdding(true)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 30, px: 1.25, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}><PersonAddAlt1Rounded sx={{ fontSize: 15 }} />Adicionar</Box>}
        </Box>

        {adding ? (
          <>
            <FriendPicker friends={friends} picked={picked} exclude={group.members} onToggle={(uid) => setPicked((p) => (p.includes(uid) ? p.filter((x) => x !== uid) : [...p, uid]))} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Box component="button" onClick={() => setAdding(false)} sx={{ ...primary, flex: 1, bgcolor: 'transparent', color: cv.text, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}` }}>Cancelar</Box>
              <Box component="button" disabled={busy || !picked.length} onClick={() => run(async () => { await addGroupMembers(group, picked.map((uid) => ({ uid, name: friends.find((f) => f.uid === uid)?.name || 'Amigo' }))); setAdding(false); setPicked([]) })} sx={{ ...primary, flex: 1 }}>Adicionar{picked.length ? ` (${picked.length})` : ''}</Box>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'grid', gap: 0.25 }}>
            {group.members.map((uid) => (
              <Box key={uid} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: '6px 4px' }}>
                <Avatar name={nameOf(uid)} photo={photoOf(uid)} size={32} />
                <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{nameOf(uid)}</Typography>
                {group.admins.includes(uid) && <Typography sx={{ fontSize: 11.5, color: cv.muted, px: 1, py: 0.25, borderRadius: 999, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>admin</Typography>}
              </Box>
            ))}
          </Box>
        )}

        <Box component="button" disabled={busy} onClick={() => { if (window.confirm(`Sair de "${group.name}"?`)) run(async () => { await leaveGroup(group, me.uid); onLeft() }) }}
          sx={{ mt: 2.5, width: '100%', height: 44, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,159,136,.4)', color: cv.coral, font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <LogoutRounded sx={{ fontSize: 18 }} />Sair do grupo
        </Box>
      </Box>
    </Dialog>
  )
}
