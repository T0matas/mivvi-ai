import { useEffect, useState } from 'react'
import { Box, Dialog, Typography, IconButton, CircularProgress } from '@mui/material'
import { Close, Check, ArrowForward, VisibilityRounded, SchoolRounded, EmojiEventsRounded } from '@mui/icons-material'
import { Exercise, UserProfile } from '../types'
import { GroupSession, SessionAnswers, subscribeSession, subscribeAnswers, submitAnswer, hostUpdate, setExplanation, startSession } from '../services/groupLesson'
import { generateLessonExercises, getAIFeedback, normalizeAnswer, isCloseEnough } from '../services/aiService'
import { fetchPlan, getCachedPlan } from '../services/lessonPlan'
import { subjectName, subjectColor } from '../data/ptCurriculum'
import { SubjectTile } from './SubjectDoodle'
import QuestionVisual from './QuestionVisual'
import Mascot from './Mascot'
import { Avatar } from './Friends'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// Lesson together in a group: the same question for everyone, answers
// appearing live, the host reveals the answer with Mivvi's explanation and
// moves on; at the end, who got the most right.

const btn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: 44, px: 2.5, border: 0, borderRadius: 999, font: 'inherit', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', bgcolor: '#fff', color: '#0d0d0d', '&:hover:not(:disabled)': { bgcolor: '#e6e6e6' }, '&:disabled': { bgcolor: cv.surface, color: cv.faint, cursor: 'default' } } as const

/** Choose a lesson of your plan and start it for the whole group. */
export function StartGroupLessonDialog({ open, onClose, gid, me, profile, onStarted }: { open: boolean; onClose: () => void; gid: string; me: { uid: string; name: string }; profile: UserProfile; onStarted: (sid: string) => void }) {
  const [subject, setSubject] = useState<string | null>(null)
  const [plan, setPlan] = useState<{ title: string }[] | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { if (open) { setSubject(null); setPlan(null); setError('') } }, [open])
  useEffect(() => {
    if (!subject) return
    setPlan(getCachedPlan(subject, profile.schoolYear, profile.course))
    fetchPlan(subject, profile.schoolYear || '1ano', profile.course).then((p) => setPlan(p))
  }, [subject, profile.schoolYear, profile.course])

  const start = async (i: number) => {
    if (!subject || !plan) return
    setBusy(i); setError('')
    try {
      const qs = await generateLessonExercises({ lessonId: 100 + i + 1, subject, schoolYear: profile.schoolYear || '1ano', course: profile.course, language: 'pt-PT' })
      const sid = await startSession(gid, me, subject, plan[i].title, qs.slice(0, 6))
      soundManager.playStart()
      onStarted(sid)
    } catch {
      setError('Não foi possível preparar a aula. Tenta outra vez.')
      soundManager.playError()
    } finally { setBusy(null) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#1c1c1c', borderRadius: '24px', m: 1.5, color: cv.text, textAlign: 'left', maxHeight: 'calc(100% - 24px)' } }}>
      <Box sx={{ p: 2.5, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ flex: 1, fontFamily: cv.display, fontSize: 20, fontWeight: 700 }}>Aula em grupo</Typography>
          <IconButton onClick={onClose} aria-label="Fechar" sx={{ width: 34, height: 34 }}><Close sx={{ fontSize: 19 }} /></IconButton>
        </Box>
        <Typography sx={{ fontSize: 13.5, color: cv.muted, mt: 0.5, lineHeight: 1.5 }}>Escolhe uma lição. Todos respondem às mesmas perguntas ao mesmo tempo e o Mivvi explica cada resposta.</Typography>

        {!subject ? (
          <Box sx={{ display: 'grid', gap: 0.5, mt: 2 }}>
            {profile.selectedSubjects.map((s) => (
              <Box key={s} component="button" onClick={() => { soundManager.playClick(); setSubject(s) }} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: '8px', border: 0, borderRadius: '12px', bgcolor: 'transparent', color: cv.text, font: 'inherit', fontSize: 14, fontWeight: 600, textAlign: 'left', cursor: 'pointer', '&:hover': { bgcolor: cv.soft } }}>
                <SubjectTile subject={s} size={32} />{subjectName(s)}
              </Box>
            ))}
          </Box>
        ) : (
          <>
            <Box component="button" onClick={() => setSubject(null)} sx={{ mt: 2, display: 'inline-flex', alignItems: 'center', gap: 1, border: 0, bgcolor: 'transparent', color: subjectColor(subject), font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', p: 0 }}>
              <SubjectTile subject={subject} size={24} />{subjectName(subject)} · mudar
            </Box>
            <Box sx={{ display: 'grid', gap: 0.5, mt: 1.25, maxHeight: 340, overflowY: 'auto' }}>
              {!plan && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, color: cv.muted, fontSize: 13.5 }}><CircularProgress size={14} sx={{ color: cv.muted }} />A preparar o plano…</Box>}
              {plan?.map((l, i) => (
                <Box key={i} component="button" disabled={busy !== null} onClick={() => start(i)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: '8px 10px', border: 0, borderRadius: '12px', bgcolor: busy === i ? cv.surface : 'transparent', color: cv.text, font: 'inherit', fontSize: 14, textAlign: 'left', cursor: 'pointer', '&:hover:not(:disabled)': { bgcolor: cv.soft } }}>
                  <Box component="span" sx={{ width: 24, height: 24, borderRadius: '8px', bgcolor: cv.surface, color: cv.muted, fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{i + 1}</Box>
                  <Box component="span" sx={{ flex: 1 }}>{l.title}</Box>
                  {busy === i && <CircularProgress size={15} sx={{ color: cv.muted }} />}
                </Box>
              ))}
            </Box>
          </>
        )}
        {error && <Typography sx={{ fontSize: 13, color: cv.coral, mt: 1.5 }}>{error}</Typography>}
      </Box>
    </Dialog>
  )
}

/** The live lesson, full screen, for host and members. */
export default function GroupLesson({ gid, sid, me, members, onClose }: { gid: string; sid: string; me: { uid: string; name: string; photo?: string | null }; members: { uid: string; name: string; photo?: string | null }[]; onClose: () => void }) {
  const [session, setSession] = useState<GroupSession | null>(null)
  const [answers, setAnswers] = useState<SessionAnswers[]>([])
  const [picked, setPicked] = useState('')
  const [typed, setTyped] = useState('')
  const [loadError, setLoadError] = useState(false)

  useEffect(() => subscribeSession(gid, sid, (s) => { setSession(s); setLoadError(false) }, () => setLoadError(true)), [gid, sid])
  useEffect(() => subscribeAnswers(gid, sid, setAnswers), [gid, sid])
  useEffect(() => { setPicked(''); setTyped('') }, [session?.index])

  const isHost = session?.host === me.uid
  const i = session?.index || 0
  const q = session?.questions?.[i] as Exercise | undefined
  const mine = answers.find((a) => a.uid === me.uid)?.answers?.[String(i)]
  const reveal = session?.phase === 'reveal'
  const ended = session?.phase === 'ended'
  const typing = !!q && (q.type === 'typing' || !q.options?.length)
  const answeredBy = answers.filter((a) => a.answers?.[String(i)])

  // When the host reveals, Mivvi writes one explanation for everyone.
  useEffect(() => {
    if (!isHost || !reveal || !q || session?.explanations?.[String(i)]) return
    getAIFeedback({ ...q, id: String(i), options: q.options || [] } as Exercise, true, 'pt-PT', q.correctAnswer, session?.subject)
      .then((f) => setExplanation(gid, sid, i, f.explanation)).catch(() => { /* fine */ })
  }, [isHost, reveal, i])  // eslint-disable-line react-hooks/exhaustive-deps

  // Answers can be changed until the host reveals the right one.
  const answer = (value: string) => {
    if (!q || reveal || mine?.answer === value) return
    const correct = typing ? isCloseEnough(value, q as Exercise) : normalizeAnswer(value) === normalizeAnswer(q.correctAnswer)
    submitAnswer(gid, sid, me, i, value, correct).catch(() => { /* offline */ })
    soundManager.playSelect()
  }

  const page = { position: 'fixed' as const, inset: 0, zIndex: 1450, bgcolor: cv.bg, color: cv.text, overflowY: 'auto' as const, textAlign: 'left' as const }
  if (!session) return (
    <Box sx={{ ...page, display: 'grid', placeItems: 'center', px: 3, textAlign: 'center' }}>
      {loadError ? (
        <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1.25 }}>
          <Mascot size={64} mood="sad" />
          <Typography sx={{ fontFamily: cv.display, fontSize: 19, fontWeight: 700 }}>Não foi possível abrir a aula</Typography>
          <Typography sx={{ color: cv.muted, fontSize: 14, maxWidth: 340 }}>Verifica a ligação. Se continuar, as regras do Firebase (firestore.rules) precisam de ser publicadas outra vez.</Typography>
          <Box component="button" onClick={onClose} sx={{ ...btn, mt: 1 }}>Voltar ao grupo</Box>
        </Box>
      ) : <CircularProgress size={24} sx={{ color: cv.muted }} />}
    </Box>
  )

  const nameOf = (uid: string) => members.find((m) => m.uid === uid)?.name || answers.find((a) => a.uid === uid)?.name || 'Alguém'
  const photoOf = (uid: string) => members.find((m) => m.uid === uid)?.photo
  const scores = answers.map((a) => ({ uid: a.uid, name: a.name, right: Object.values(a.answers || {}).filter((x) => x.correct).length })).sort((a, b) => b.right - a.right)

  return (
    <Box sx={page}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: cv.bg, borderBottom: `1px solid ${cv.border}` }}>
        <Box sx={{ maxWidth: 760, mx: 'auto', px: 2, height: 56, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <IconButton onClick={onClose} aria-label="Sair" sx={{ width: 34, height: 34 }}><Close sx={{ fontSize: 19 }} /></IconButton>
          <SubjectTile subject={session.subject} size={26} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.topic}</Typography>
            <Typography sx={{ fontSize: 12, color: cv.muted }}>Aula em grupo · com {session.hostName}</Typography>
          </Box>
          {!ended && <Typography sx={{ fontSize: 13, color: cv.muted, fontVariantNumeric: 'tabular-nums' }}>{i + 1}/{session.questions.length}</Typography>}
        </Box>
      </Box>

      {ended ? (
        <Box sx={{ maxWidth: 520, mx: 'auto', px: 2.5, py: 5, display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
          <Mascot size={72} mood="celebrating" />
          <Typography sx={{ fontFamily: cv.display, fontSize: 26, fontWeight: 700, mt: 2 }}>Aula terminada!</Typography>
          <Typography sx={{ color: cv.muted, mt: 0.5 }}>Quem acertou mais:</Typography>
          <Box sx={{ width: '100%', mt: 2.5, borderRadius: '20px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, overflow: 'hidden' }}>
            {scores.map((s, k) => (
              <Box key={s.uid} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderTop: k ? `1px solid ${cv.border}` : 0 }}>
                <Typography sx={{ width: 22, fontWeight: 700, color: k === 0 ? cv.butter : cv.muted }}>{k === 0 ? <EmojiEventsRounded sx={{ fontSize: 19 }} /> : k + 1}</Typography>
                <Avatar name={s.name} photo={photoOf(s.uid)} size={30} />
                <Typography sx={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{s.uid === me.uid ? 'Tu' : s.name}</Typography>
                <Typography sx={{ color: cv.muted, fontVariantNumeric: 'tabular-nums' }}>{s.right}/{session.questions.length}</Typography>
              </Box>
            ))}
          </Box>
          <Box component="button" onClick={onClose} sx={{ ...btn, mt: 3 }}>Voltar ao grupo</Box>
        </Box>
      ) : q && (
        <Box key={i} sx={{ maxWidth: 640, mx: 'auto', px: 2.5, pt: 3, pb: 16, animation: 'glIn .25s ease both', '@keyframes glIn': { from: { opacity: 0, transform: 'translateY(6px)' } } }}>
          {/* What to do now (for everyone who is not driving the lesson) */}
          {!isHost && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5, p: '10px 12px', borderRadius: '14px',
              bgcolor: reveal ? (mine?.correct ? 'rgba(125,219,168,.1)' : 'rgba(255,159,136,.1)') : mine ? cv.soft : 'rgba(96,165,250,.08)',
              boxShadow: `inset 0 0 0 1px ${reveal ? (mine?.correct ? 'rgba(125,219,168,.3)' : 'rgba(255,159,136,.3)') : mine ? cv.border : 'rgba(96,165,250,.22)'}` }}>
              <Mascot size={28} mood={reveal ? (mine?.correct ? 'happy' : 'sad') : mine ? 'idle' : 'thinking'} animated={false} />
              <Typography sx={{ fontSize: 13.5, lineHeight: 1.45 }}>
                {reveal
                  ? (mine ? (mine.correct ? 'Acertaste! ' : 'Desta vez não. ') : 'Não respondeste a tempo. ') + `Espera que ${session.hostName} passe à próxima.`
                  : mine ? `Resposta enviada. Ainda podes mudar até ${session.hostName} mostrar a resposta certa.`
                    : `${session.hostName} está a conduzir a aula. ${typing ? 'Escreve a tua resposta e carrega em Responder.' : 'Toca numa opção para responder.'}`}
              </Typography>
            </Box>
          )}
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cv.muted, textTransform: 'uppercase', letterSpacing: '.07em', mb: 0.75 }}>Pergunta {i + 1} de {session.questions.length}</Typography>
          <Typography sx={{ fontFamily: cv.display, fontSize: { xs: 19, sm: 22 }, fontWeight: 700, lineHeight: 1.35 }}>{q.question}</Typography>
          {q.visual && <Box sx={{ mt: 2 }}><QuestionVisual visual={q.visual} subject={session.subject} /></Box>}

          {typing ? (
            <Box sx={{ display: 'flex', gap: 1, mt: 2.25 }}>
              <Box component="input" value={typed || (mine ? mine.answer : '')} disabled={reveal} placeholder="A tua resposta" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTyped(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && typed.trim()) answer(typed) }}
                sx={{ flex: 1, minWidth: 0, height: 48, px: 1.75, borderRadius: '14px', border: 0, outline: 'none', font: 'inherit', fontSize: 15.5, color: cv.text, bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.borderStrong}` }} />
              {!reveal && <Box component="button" disabled={!typed.trim() || typed === mine?.answer} onClick={() => answer(typed)} sx={btn}>{mine ? 'Alterar' : 'Responder'}</Box>}
            </Box>
          ) : (
            <Box sx={{ mt: 2.25, display: 'grid', gap: 0.75 }}>
              {q.options.map((o, k) => {
                const isAnswer = normalizeAnswer(o) === normalizeAnswer(q.correctAnswer)
                const chosen = (picked || mine?.answer) === o
                const state = reveal ? (isAnswer ? 'right' : chosen ? 'wrong' : 'dim') : chosen ? 'picked' : 'idle'
                const who = reveal ? answeredBy.filter((a) => a.answers[String(i)].answer === o) : []
                return (
                  <Box key={o + k} component="button" disabled={reveal} onClick={() => { setPicked(o); answer(o) }}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', minHeight: 48, p: '8px 12px 8px 8px', border: 0, borderRadius: '14px', textAlign: 'left', font: 'inherit', fontSize: 14.5, color: cv.text, cursor: reveal ? 'default' : 'pointer', '&:hover:not(:disabled)': { bgcolor: cv.soft },
                      bgcolor: state === 'right' ? 'rgba(125,219,168,.1)' : state === 'wrong' ? 'rgba(255,159,136,.1)' : chosen ? cv.surface : 'transparent',
                      boxShadow: `inset 0 0 0 ${state === 'idle' || state === 'dim' ? 1 : 1.5}px ${{ right: cv.green, wrong: cv.coral, picked: '#fff', idle: cv.border, dim: cv.border }[state]}`, opacity: state === 'dim' ? 0.5 : 1 }}>
                    <Box component="span" sx={{ width: 26, height: 26, borderRadius: '8px', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, bgcolor: state === 'right' ? cv.green : state === 'wrong' ? cv.coral : chosen ? '#fff' : cv.surface, color: state === 'idle' || state === 'dim' ? cv.muted : '#0d0d0d' }}>
                      {state === 'right' ? <Check sx={{ fontSize: 16 }} /> : state === 'wrong' ? <Close sx={{ fontSize: 16 }} /> : String.fromCharCode(65 + k)}
                    </Box>
                    <Box component="span" sx={{ flex: 1 }}>{o}</Box>
                    {who.length > 0 && (
                      <Box sx={{ display: 'flex', ml: 1 }}>{who.slice(0, 5).map((a) => <Box key={a.uid} sx={{ ml: -0.5 }}><Avatar name={nameOf(a.uid)} photo={photoOf(a.uid)} size={22} /></Box>)}</Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          )}

          {/* Who has answered */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: 13, color: cv.muted }}>{answeredBy.length} de {members.length} responderam</Typography>
            {answeredBy.map((a) => <Avatar key={a.uid} name={nameOf(a.uid)} photo={photoOf(a.uid)} size={22} />)}
          </Box>

          {reveal && (
            <Box sx={{ mt: 2.5, display: 'flex', gap: 1.25, alignItems: 'flex-start', p: 1.75, borderRadius: '18px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
              <Mascot size={34} mood="happy" animated={false} />
              <Box>
                <Typography sx={{ fontSize: 13.5 }}><Box component="span" sx={{ color: cv.muted }}>Resposta certa: </Box><strong>{q.correctAnswer}</strong></Typography>
                <Typography sx={{ fontSize: 14, color: '#d4d4d8', mt: 0.5, lineHeight: 1.55 }}>{session.explanations?.[String(i)] || 'O Mivvi está a escrever a explicação…'}</Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Host controls */}
      {!ended && isHost && (
        <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', display: 'flex', justifyContent: 'center', px: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '6px 6px 6px 16px', borderRadius: 999, bgcolor: 'rgba(32,32,32,.94)', backdropFilter: 'blur(12px)', boxShadow: `inset 0 0 0 1px ${cv.border}, 0 14px 34px rgba(0,0,0,.45)` }}>
            <SchoolRounded sx={{ fontSize: 18, color: cv.muted }} />
            <Typography sx={{ fontSize: 13, color: cv.muted, mr: 1 }}>És tu que conduzes a aula</Typography>
            {!reveal ? (
              <Box component="button" onClick={() => { soundManager.playClick(); hostUpdate(gid, sid, { phase: 'reveal' }) }} sx={btn}><VisibilityRounded sx={{ fontSize: 18 }} />Mostrar resposta</Box>
            ) : i < session.questions.length - 1 ? (
              <Box component="button" onClick={() => { soundManager.playClick(); hostUpdate(gid, sid, { phase: 'question', index: i + 1 }) }} sx={btn}>Próxima<ArrowForward sx={{ fontSize: 18 }} /></Box>
            ) : (
              <Box component="button" onClick={() => { soundManager.playLevelUp(); hostUpdate(gid, sid, { phase: 'ended' }) }} sx={btn}>Terminar aula</Box>
            )}
          </Box>
        </Box>
      )}
      {!ended && !isHost && (
        <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', display: 'flex', justifyContent: 'center' }}>
          <Typography sx={{ px: 2, py: 1, borderRadius: 999, bgcolor: 'rgba(32,32,32,.94)', fontSize: 13, color: cv.muted, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
            {reveal ? `${session.hostName} vai passar à próxima…` : mine ? 'Resposta enviada · podes mudar' : 'Escolhe a tua resposta'}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
