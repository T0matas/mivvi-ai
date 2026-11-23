import { Box } from '@mui/material'
import { useState, useEffect } from 'react'
import { UserProgress, UserProfile, Subject } from '../types'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import SubjectHome from './SubjectHome'
import SubjectPicker from './SubjectPicker'
import AccountPrivacy from './AccountPrivacy'
// ... imports
import Missions from './Missions'
import Profile from './Profile'
import AITutor from './AITutor'
import { cv } from '../theme'

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

export default function Dashboard({ userProgress, userProfile, onStartLesson, onRefillHearts, onPurchaseOutfit, onEquipOutfit, onUpdateProfile, onClaimMission }: DashboardProps) {
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

  // Use userProfile.language for translations
  const lang = userProfile.language || 'pt-BR';

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
    <Box sx={{ minHeight: '100dvh', bgcolor: cv.bg, pb: '96px' }}>
      <TopBar
        userProgress={userProgress}
        userProfile={userProfile}
        onRefillHearts={onRefillHearts}
        onPurchaseOutfit={onPurchaseOutfit}
        onEquipOutfit={onEquipOutfit}
        currentOutfit={userProgress.currentOutfit}
        onOpenProfile={() => setActiveTab(3)}
        onOpenAccount={() => setActiveTab(4)}
        onHome={() => setActiveTab(0)}
      />



      {/* Header removed - moved to GameMap Unit Banner */}
      {/* Each section fades in when the tab changes (opacity only, so fixed children stay put). */}
      <Box key={activeTab} sx={{ animation: 'tabIn .28s ease both', '@keyframes tabIn': { from: { opacity: 0 } }, '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}>
      {activeTab === 0 && (
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

      {activeTab === 1 && (
        <Missions
          language={lang}
          gems={userProgress.gems}
          dailyXP={userProgress.dailyXP || 0}
          dailyLessons={userProgress.dailyLessons || 0}
          streak={userProgress.streak}
          dailyPerfectLessons={userProgress.dailyPerfectLessons || 0}
          weeklyXP={userProgress.weeklyXP || 0}
          claimedMissionIds={userProgress.claimedMissionIds || []}
          onClaimReward={(amount, missionId) => {
            if (onClaimMission && missionId) {
              onClaimMission(missionId, amount);
            }
          }}
        />
      )}

      {activeTab === 2 && (
        <AITutor
          embedded
          userProfile={userProfile}
          currentOutfit={userProgress.currentOutfit}
          subject={selectedSubject}
        />
      )}

      {activeTab === 4 && (
        <AccountPrivacy userProfile={userProfile} userProgress={userProgress} onUpdateProfile={onUpdateProfile} />
      )}

      {activeTab === 3 && (
        <Profile
          userProfile={userProfile}
          userProgress={userProgress}
          onUpdateProfile={onUpdateProfile}
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

      <BottomNav value={activeTab} onChange={setActiveTab} />
    </Box>
  )
}
