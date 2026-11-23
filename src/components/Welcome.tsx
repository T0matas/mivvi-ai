import { Box, Typography, IconButton } from '@mui/material'
import { useState } from 'react'
import { ArrowBack, ArrowForward, AutoStoriesRounded, ChatBubbleRounded, SchoolRounded } from '@mui/icons-material'
import Mascot from './Mascot'
import { SubjectTile } from './SubjectDoodle'
import { soundManager } from '../utils/soundEffects'
import LoginButtons from './LoginButtons'
import { UserProfile } from '../types'
import { cv } from '../theme'

// The first screen: Mivvi in the middle of a slowly turning ring of subject
// tiles, the name and one line, two buttons side by side and three short
// promises. Signing in swaps the text for the account options.

interface WelcomeProps {
  onStart: () => void
  userProfile: UserProfile | null
}

const RING = ['matematica', 'portugues', 'fq_a', 'historia', 'ingles', 'biologia', 'geografia', 'tic']

export default function Welcome({ onStart }: WelcomeProps) {
  const [view, setView] = useState<'welcome' | 'login' | 'signup'>('welcome')
  const rise = (d: number) => ({ animation: `wlIn .55s cubic-bezier(.22,1,.36,1) ${d}s both` })
  const btn = { height: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, px: 3, border: 0, borderRadius: 999, font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background-color .15s, transform .15s', '&:active': { transform: 'scale(.98)' } }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: cv.bg, color: cv.text, display: 'grid', placeItems: 'center', px: 2.5, py: 5, position: 'relative', overflow: 'hidden',
      '@keyframes wlIn': { from: { opacity: 0, transform: 'translateY(14px)' } },
      '@keyframes wlSpin': { to: { transform: 'rotate(360deg)' } },
      '@keyframes wlUnspin': { to: { transform: 'rotate(-360deg)' } },
      '@keyframes wlPop': { from: { opacity: 0, transform: 'scale(.4)' } } }}>
      {view !== 'welcome' && (
        <IconButton onClick={() => { soundManager.playBack(); setView('welcome') }} aria-label="Voltar"
          sx={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', left: 16, width: 40, height: 40, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}` }}>
          <ArrowBack />
        </IconButton>
      )}

      <Box sx={{ width: '100%', maxWidth: 520, display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
        {/* Mivvi in a ring of subjects */}
        <Box sx={{ position: 'relative', width: { xs: 250, sm: 300 }, height: { xs: 250, sm: 300 }, ...rise(0) }}>
          <Box sx={{ position: 'absolute', inset: '14%', borderRadius: '50%', boxShadow: `inset 0 0 0 1px ${cv.border}` }} />
          <Box sx={{ position: 'absolute', inset: 0, animation: 'wlSpin 60s linear infinite', '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}>
            {RING.map((s, i) => {
              const a = (i / RING.length) * 2 * Math.PI
              return (
                <Box key={s} sx={{ position: 'absolute', left: `${50 + 43 * Math.cos(a)}%`, top: `${50 + 43 * Math.sin(a)}%`, transform: 'translate(-50%, -50%)' }}>
                  <Box sx={{ animation: 'wlUnspin 60s linear infinite', '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}>
                    <Box sx={{ animation: `wlPop .5s cubic-bezier(.34,1.56,.64,1) ${0.15 + i * 0.06}s both` }}>
                      <SubjectTile subject={s} size={46} />
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Box>
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <Mascot size={view === 'welcome' ? 120 : 104} mood="happy" />
          </Box>
        </Box>

        {view === 'welcome' ? (
          <Box key="welcome" sx={{ display: 'grid', justifyItems: 'center' }}>
            <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: { xs: 40, sm: 48 }, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, mt: 3, ...rise(0.1) }}>mivvi</Typography>
            <Typography sx={{ color: cv.muted, fontSize: 16, lineHeight: 1.5, mt: 1.5, maxWidth: 380, ...rise(0.16) }}>
              Estuda o programa do teu ano com um tutor que te explica tudo, ao teu ritmo.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 3.5, ...rise(0.22) }}>
              <Box component="button" onClick={() => { soundManager.playStart(); setView('signup') }} sx={{ ...btn, bgcolor: '#fff', color: '#0d0d0d', '&:hover': { bgcolor: '#e6e6e6' } }}>
                Começar <ArrowForward sx={{ fontSize: 19 }} />
              </Box>
              <Box component="button" onClick={() => { soundManager.playSelect(); setView('login') }} sx={{ ...btn, bgcolor: 'transparent', color: cv.text, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}`, '&:hover': { bgcolor: 'rgba(255,255,255,.05)' } }}>
                Já tenho conta
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 1.5, sm: 2.5 }, mt: 4.5, color: cv.muted, fontSize: 13, ...rise(0.28) }}>
              {[
                { icon: <SchoolRounded />, text: 'Do 1.º ao 12.º ano' },
                { icon: <AutoStoriesRounded />, text: 'Lições pelo programa' },
                { icon: <ChatBubbleRounded />, text: 'Explicações com IA' },
              ].map((f) => (
                <Box key={f.text} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, '& svg': { fontSize: 17, color: cv.text } }}>{f.icon}{f.text}</Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box key="login" sx={{ width: '100%', maxWidth: 380, display: 'grid', justifyItems: 'center', mt: 3, ...rise(0) }}>
            <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}>{view === 'signup' ? 'Cria a tua conta' : 'Bem-vindo de volta'}</Typography>
            <Typography sx={{ color: cv.muted, fontSize: 15, mt: 0.75, mb: 3 }}>{view === 'signup' ? 'Guarda o teu progresso e continua em qualquer dispositivo.' : 'Entra para continuares onde ficaste.'}</Typography>
            <Box sx={{ width: '100%', p: 2.5, borderRadius: '24px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
              <LoginButtons onSuccess={() => { soundManager.playSuccess(); onStart() }} onError={() => soundManager.playError()} language="pt-PT" />
            </Box>
            {view === 'signup' ? (
              <Box component="button" onClick={() => { soundManager.playClick(); onStart() }} sx={{ mt: 2.5, border: 0, bgcolor: 'transparent', color: cv.muted, font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', '&:hover': { color: cv.text } }}>
                Continuar sem conta
              </Box>
            ) : (
              <Box component="button" onClick={() => { soundManager.playClick(); setView('signup') }} sx={{ mt: 2.5, border: 0, bgcolor: 'transparent', color: cv.muted, font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', '&:hover': { color: cv.text } }}>
                Ainda não tens conta? <Box component="span" sx={{ color: cv.text }}>Criar conta</Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
