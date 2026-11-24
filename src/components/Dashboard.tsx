import { Box, Typography } from '@mui/material'
import { useState, useEffect, useRef } from 'react'
import { UserProgress, UserProfile, Subject } from '../types'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import SubjectHome from './SubjectHome'
import SubjectPicker from './SubjectPicker'
import AccountPrivacy from './AccountPrivacy'
// ... imports
import Profile from './Profile'
import AITutor from './AITutor'
import Library from './Library'
import Chat from './Chat'
import { AddFriendDialog } from './Friends'
import SocialSetup from './SocialSetup'
import CallProvider from './CallProvider'
import Mascot from './Mascot'
import { useAuthUser, useSocial, FriendView } from '../services/useSocial'
import { PublicProfile } from '../services/social'
import { soundManager } from '../utils/soundEffects'
import { cv } from '../theme'

// Tabs: 0 Início · 1 Biblioteca · 2 Chat · 3 Mivvi · 4 Perfil · 5 Conta
const TAB = { home: 0, library: 1, chat: 2, tutor: 3, profile: 4, account: 5 } as const

interface DashboardProps {
  // ...
  userProgress: UserProgress
  userProfile: UserProfile
  onStartLesson: (lessonId: number, clickCoords?: { x: number, y: number } | null) => void // Updated signature
  onRefillHearts?: () => void
  onPurchaseOutfit?: (outfitId: string, cost: number) => boolean
  onEquipOutfit?: (outfitId: string) => void
  onTutorialComplete?: () => void
  onUpdateProfile?: (updates: Partial<UserProfile>) => void
  onClaimMission?: (missionId: string, reward: number) => void
}

export default function Dashboard({ userProgress, userProfile, onStartLesson, onRefillHearts, onPurchaseOutfit, onEquipOutfit, onUpdateProfile }: DashboardProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Initialize selected subject from localStorage or default to first subject
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(() => {
    const saved = localStorage.getItem('mivvi_selectedSubject');
    if (saved && userProfile.selectedSubjects.includes(saved as Subject)) {
      return saved as Subject;
    }
    return userProfile.selectedSubjects.length > 0 ? userProfile.selectedSubjects[0] : null;
  });


  // ── Friends and chat ──
  const user = useAuthUser()
  const me: PublicProfile | null = user && userProfile.handle && userProfile.name
    ? { uid: user.uid, name: userProfile.name, handle: userProfile.handle, photo: user.photoURL, year: userProfile.schoolYear }
    : null
  const social = useSocial(me?.uid)
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState<string | undefined>()
  const [chatWith, setChatWith] = useState<string | null>(null)

  // Opened from a friend's QR code / link (/add/<name>).
  useEffect(() => {
    const pending = localStorage.getItem('mivvi_pendingAdd')
    if (!pending) return
    if (me) { localStorage.removeItem('mivvi_pendingAdd'); setAddName(pending); setAddOpen(true) }
    else setActiveTab(TAB.profile)
  }, [me?.uid])  // eslint-disable-line react-hooks/exhaustive-deps

  // Gentle sounds for new requests and messages.
  const counts = useRef({ incoming: 0, unread: 0 })
  useEffect(() => {
    if (social.incoming.length > counts.current.incoming) soundManager.playNotify()
    if (social.unread > counts.current.unread && activeTab !== TAB.chat) soundManager.playMessage()
    counts.current = { incoming: social.incoming.length, unread: social.unread }
  }, [social.incoming.length, social.unread])  // eslint-disable-line react-hooks/exhaustive-deps

  const openChat = (f: FriendView) => { setChatWith(f.uid); setActiveTab(TAB.chat) }
  const openAdd = () => { setAddName(undefined); setAddOpen(true) }

  // Save selected subject to localStorage whenever it changes
  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem('mivvi_selectedSubject', selectedSubject);
    }
  }, [selectedSubject]);

  // Initialize selected subject if not set
  useEffect(() => {
    if (!selectedSubject && userProfile.selectedSubjects.length > 0) {
      setSelectedSubject(userProfile.selectedSubjects[0])
    }
  }, [userProfile.selectedSubjects, selectedSubject])


  const handleStartLesson = (id: number, _backgroundGradient?: string, clickCoords?: { x: number, y: number } | null) => {
    // Sound is handled by the caller (GameMap) or explicit onStartLesson calls
    onStartLesson(id, clickCoords)
  }

  // ... existing code ...

  return (
    <CallProvider me={me} friends={social.friends}>
    <Box sx={{ minHeight: '100dvh', bgcolor: cv.bg, pb: '96px' }}>
      <TopBar
        userProgress={userProgress}
        userProfile={userProfile}
        onRefillHearts={onRefillHearts}
        onPurchaseOutfit={onPurchaseOutfit}
        onEquipOutfit={onEquipOutfit}
        currentOutfit={userProgress.currentOutfit}
        onOpenProfile={() => setActiveTab(TAB.profile)}
        onOpenAccount={() => setActiveTab(TAB.account)}
        onHome={() => setActiveTab(TAB.home)}
      />



      {/* Header removed - moved to GameMap Unit Banner */}
      {/* Each section fades in when the tab changes (opacity only, so fixed children stay put). */}
      <Box key={activeTab} sx={{ animation: 'tabIn .28s ease backwards', '@keyframes tabIn': { from: { opacity: 0 } }, '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}>
      {activeTab === TAB.home && (
        <SubjectHome
          userProfile={userProfile}
          userProgress={userProgress}
          currentSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          onOpenSubject={(subject, lessonId) => {
            // Lesson reads the subject from storage, so save it before starting.
            localStorage.setItem('mivvi_selectedSubject', subject)
            setSelectedSubject(subject)
            handleStartLesson(lessonId)
          }}
          onAddSubject={() => setPickerOpen(true)}
        />
      )}


      {activeTab === TAB.library && <Library userProfile={userProfile} />}

      {activeTab === TAB.chat && (me ? (
        <Chat me={me} friends={social.friends} incomingCount={social.incoming.length} chats={social.chats} groups={social.groups} openWith={chatWith}
          onAddFriend={openAdd} onOpenRequests={() => setActiveTab(TAB.profile)} />
      ) : (
        <Box sx={{ maxWidth: 440, mx: 'auto', px: 2.5, pt: 6, display: 'grid', justifyItems: 'center', textAlign: 'center', color: cv.text }}>
          <Mascot size={80} mood="happy" />
          <Typography sx={{ fontFamily: cv.display, fontSize: 22, fontWeight: 700, mt: 2 }}>Fala com os teus amigos</Typography>
          <Box sx={{ width: '100%', mt: 3, p: 2.25, borderRadius: '22px', bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}`, textAlign: 'left' }}>
            <SocialSetup user={user} userProfile={userProfile} xp={userProgress.xp} onUpdateProfile={onUpdateProfile} />
          </Box>
        </Box>
      ))}

      {activeTab === TAB.tutor && (
        <AITutor
          embedded
          userProfile={userProfile}
          currentOutfit={userProgress.currentOutfit}
          subject={selectedSubject}
        />
      )}

      {activeTab === TAB.account && (
        <AccountPrivacy userProfile={userProfile} userProgress={userProgress} onUpdateProfile={onUpdateProfile} />
      )}

      {activeTab === TAB.profile && (
        <Profile
          userProfile={userProfile}
          userProgress={userProgress}
          onUpdateProfile={onUpdateProfile}
          me={me}
          social={social}
          onAddFriend={openAdd}
          onMessage={openChat}
        />
      )}

      </Box>

      <SubjectPicker
        open={pickerOpen}
        selected={userProfile.selectedSubjects}
        language={userProfile.language || 'pt-PT'}
        schoolYear={userProfile.schoolYear}
        course={userProfile.course}
        onClose={() => setPickerOpen(false)}
        onSave={(subjects, course) => {
          onUpdateProfile?.({ selectedSubjects: subjects, ...(course && { course }) })
          if (selectedSubject && !subjects.includes(selectedSubject)) setSelectedSubject(subjects[0])
          setPickerOpen(false)
        }}
      />

      {me && <AddFriendDialog open={addOpen} onClose={() => setAddOpen(false)} me={me} initialName={addName} />}

      <BottomNav value={activeTab} onChange={(v) => { if (v !== TAB.chat) setChatWith(null); setActiveTab(v) }} badges={{ [TAB.chat]: social.unread + social.incoming.length }} />
    </Box>
    </CallProvider>
  )
}
