import { useEffect, useState } from 'react'
import { Box, Dialog, Typography, CircularProgress } from '@mui/material'
import { claimName, nameProblem, NameTakenError, PublicProfile } from '../services/social'
import Mascot from './Mascot'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// Names are unique ids. When the name chosen on this device already belongs
// to someone else (found when the account is linked), or when the student
// renames themself, this dialog reserves a new one.

interface Props {
  open: boolean
  uid: string
  currentName: string
  onDone: (name: string) => void
  onClose?: () => void
  extra?: Partial<PublicProfile>
  title?: string
  text?: string
}

export default function NameClaimDialog({ open, uid, currentName, onDone, onClose, extra, title, text }: Props) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (open) { setName(currentName); setError('') } }, [open, currentName])

  const save = async () => {
    const problem = nameProblem(name)
    if (problem) { setError(problem); return }
    setBusy(true)
    try {
      await claimName(uid, name.trim(), extra)
      soundManager.playSuccess()
      onDone(name.trim())
    } catch (e) {
      soundManager.playError()
      setError(e instanceof NameTakenError ? e.message : 'Não foi possível guardar o nome. Verifica a ligação.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#1f1f1f', borderRadius: '24px', m: 2, p: 3, color: cv.text, textAlign: 'left' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Mascot size={44} mood="thinking" animated={false} />
        <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700 }}>{title || 'Esse nome já existe'}</Typography>
      </Box>
      <Typography sx={{ fontSize: 14.5, color: cv.muted, mt: 1.5, lineHeight: 1.5 }}>
        {text || `Já há alguém no Mivvi chamado "${currentName}". Escolhe outro nome: é o teu ID para os amigos te encontrarem.`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 50, px: 1.75, mt: 2.5, borderRadius: '16px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1.5px ${error ? cv.coral : cv.borderStrong}` }}>
        <Box component="span" sx={{ color: cv.faint, fontWeight: 600 }}>@</Box>
        <Box component="input" autoFocus value={name} maxLength={20} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setName(e.target.value.replace(/\s/g, '')); setError('') }}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') save() }}
          sx={{ flex: 1, minWidth: 0, border: 0, outline: 'none', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 16, fontWeight: 600 }} />
      </Box>
      <Typography sx={{ fontSize: 13, color: cv.coral, mt: 1, minHeight: 18 }}>{error}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        {onClose && <Box component="button" onClick={onClose} sx={{ flex: 1, height: 44, border: 0, borderRadius: 999, bgcolor: 'transparent', boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, color: cv.text, font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</Box>}
        <Box component="button" onClick={save} disabled={busy || !name.trim()} sx={{ flex: 1, height: 44, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, '&:disabled': { opacity: 0.6 } }}>
          {busy && <CircularProgress size={15} sx={{ color: '#0d0d0d' }} />}Guardar nome
        </Box>
      </Box>
    </Dialog>
  )
}
