import { useState } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { User } from 'firebase/auth'
import { claimName, nameProblem, NameTakenError, toHandle } from '../services/social'
import { UserProfile } from '../types'
import LoginButtons from './LoginButtons'
import NameClaimDialog from './NameClaimDialog'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// What to show where friends/chat would be when they aren't ready yet:
// not signed in → sign in; signed in but the name (unique id) isn't reserved
// yet → reserve it now, with the real reason when that fails.

interface Props {
  user: User | null
  userProfile: UserProfile
  xp: number
  onUpdateProfile?: (updates: Partial<UserProfile>) => void
}

export default function SocialSetup({ user, userProfile, xp, onUpdateProfile }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pick, setPick] = useState(false)

  if (!user) {
    return (
      <Box>
        <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>Cria uma conta para teres amigos</Typography>
        <Typography sx={{ fontSize: 13, color: cv.muted, mt: 0.5, mb: 2, lineHeight: 1.5 }}>Com conta, os teus amigos encontram-te pelo teu nome ou QR code e podem falar contigo no chat.</Typography>
        <Box sx={{ maxWidth: 340 }}><LoginButtons onSuccess={() => soundManager.playSuccess()} onError={() => soundManager.playError()} /></Box>
      </Box>
    )
  }

  const extra = { year: userProfile.schoolYear, xp, photo: user.photoURL }
  const name = userProfile.name || ''

  const activate = async () => {
    if (!name || nameProblem(name)) { setPick(true); return }
    setBusy(true); setError('')
    try {
      await claimName(user.uid, name, extra)
      soundManager.playSuccess()
      onUpdateProfile?.({ handle: toHandle(name) })
    } catch (e: any) {
      soundManager.playError()
      if (e instanceof NameTakenError) { setPick(true); return }
      setError(e?.code === 'permission-denied'
        ? 'O Firebase recusou o pedido: as regras do Firestore (ficheiro firestore.rules) ainda não estão publicadas no Firebase Console.'
        : e?.code === 'unavailable' ? 'Sem ligação à internet. Tenta outra vez.' : 'Não foi possível ativar agora. Tenta outra vez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box>
      <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>Falta ativar os amigos</Typography>
      <Typography sx={{ fontSize: 13, color: cv.muted, mt: 0.5, lineHeight: 1.5 }}>
        Tens sessão iniciada como <Box component="span" sx={{ color: cv.text }}>{user.email}</Box>. Para os teus amigos te encontrarem, o Mivvi reserva o teu nome{name ? <> (<b>@{name}</b>)</> : ''} como ID único.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
        <Box component="button" onClick={activate} disabled={busy} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, height: 40, px: 2.25, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', '&:disabled': { opacity: 0.7 } }}>
          {busy && <CircularProgress size={15} sx={{ color: '#0d0d0d' }} />}Ativar amigos
        </Box>
        <Box component="button" onClick={() => setPick(true)} sx={{ height: 40, px: 2, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Usar outro nome
        </Box>
      </Box>
      {error && <Typography sx={{ fontSize: 13, color: cv.coral, mt: 1.5, lineHeight: 1.5 }}>{error}</Typography>}
      <NameClaimDialog open={pick} uid={user.uid} currentName={name} extra={extra} title="Escolhe o teu nome" text="O teu nome é o teu ID no Mivvi: tem de ser único."
        onClose={() => setPick(false)} onDone={(n) => { setPick(false); onUpdateProfile?.({ name: n, handle: toHandle(n) }) }} />
    </Box>
  )
}
