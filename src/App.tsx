import { useState, useEffect, useRef } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Snackbar,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LessonContainer from './components/LessonContainer';
import Welcome from './components/Welcome';
import Onboarding from './components/Onboarding';
import SplashScreen from './components/SplashScreen';
import AITutor from './components/AITutor';
import APITester from './components/APITester';
import ResetData from './components/ResetData';
import PageTransition from './components/PageTransition';
import { UserProgress, UserProfile, Subject } from './types';
import { soundManager } from './utils/soundEffects';
import { theme, cv } from './theme';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { readCloud, saveToCloud, mergeProgress } from './services/cloudSync';
import { claimName, updatePublicProfile, heartbeat, toHandle, NameTakenError } from './services/social';
import { syncLibrary } from './services/library';
import NameClaimDialog from './components/NameClaimDialog';
import Exam from './components/Exam';
import { ExamResult } from './types';

/** /add/<name> (from a friend's QR code): remember who to add, then open the app. */
/** /exam?s=<subject>: the subject's final exam. */
function ExamRoute({ userProfile, userProgress, onRecord }: { userProfile: UserProfile | null; userProgress: UserProgress; onRecord: (subject: string, r: ExamResult['last']) => void }) {
  const navigate = useNavigate();
  const subject = new URLSearchParams(window.location.search).get('s') || '';
  if (!userProfile || !subject) return <Navigate to="/dashboard" replace />;
  return <Exam subject={subject} userProfile={userProfile} previous={userProgress.exams?.[subject]} onRecord={(r) => onRecord(subject, r)} onExit={() => navigate('/dashboard')} />;
}

function AddFriendLink() {
  const { handle } = useParams();
  if (handle) localStorage.setItem('mivvi_pendingAdd', handle);
  return <Navigate to="/dashboard" replace />;
}

function App() {
  // Check if user should see splash screen
  const shouldShowSplash = () => {
    const lastActivity = localStorage.getItem('mivvi_lastActivity');
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (!lastActivity) {
      // First time user or just completed onboarding
      return true;
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    return timeSinceLastActivity > FIVE_MINUTES;
  };

  const [showSplash, setShowSplash] = useState(shouldShowSplash());

  // Global Notification State
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Update activity timestamp
  const updateActivity = () => {
    localStorage.setItem('mivvi_lastActivity', Date.now().toString());
  };

  // Update activity on mount and user interactions
  useEffect(() => {
    if (!showSplash) {
      updateActivity();
    }
  }, [showSplash]);

  // Update activity on mount and user interactions
  useEffect(() => {
    if (!showSplash) {
      updateActivity();
    }
  }, [showSplash]);

  // Initializes audio context only (without global click listener for sounds)
  useEffect(() => {
    // Initialize audio context on first user interaction
    const initAudio = () => {
      soundManager.init();
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };

    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const [selectedLesson, setSelectedLesson] = useState<number | null>(null)

  // User Profile State (School Year, Subjects)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('mivvi_userProfile')
    return saved ? JSON.parse(saved) : null
  })

  // User Progress State
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('mivvi_userProgress')
    const defaultProgress: UserProgress = {
      level: 1,
      xp: 0,
      streak: 0,
      hearts: 5,
      gems: 500, // Initial gems
      currentOutfit: 'naked',
      unlockedOutfits: ['naked'], // Initial unlocked outfit
      completedLessons: [],
      currentLesson: 1,
      subjectProgress: {},
      hasSeenTutorial: false,
      dailyXP: 0,
      lastXPDate: new Date().toDateString(),
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Ensure hearts is a valid number, otherwise default to 5
        // Ensure gems and unlockedOutfits are present for migration
        return {
          ...defaultProgress,
          ...parsed,
          hearts: (typeof parsed.hearts === 'number' && !isNaN(parsed.hearts)) ? parsed.hearts : 5,
          gems: (typeof parsed.gems === 'number' && !isNaN(parsed.gems)) ? parsed.gems : 500,
          currentOutfit: parsed.currentOutfit || 'naked',
          unlockedOutfits: Array.isArray(parsed.unlockedOutfits) ? parsed.unlockedOutfits : ['naked'],
          hasSeenTutorial: parsed.hasSeenTutorial ?? false,
        }
      } catch (e) {
        console.error('Error parsing progress:', e)
        return defaultProgress
      }
    }
    return defaultProgress
  })

  useEffect(() => {
    localStorage.setItem('mivvi_userProgress', JSON.stringify(userProgress))
  }, [userProgress])

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('mivvi_userProfile', JSON.stringify(userProfile))
    } else {
      localStorage.removeItem('mivvi_userProfile')
    }
  }, [userProfile])

  // ── Account sync ─────────────────────────────────────────────────────────
  // The cloud copy is only written after it was read successfully once, so a
  // failed read (offline, slow network) can never wipe an existing account.
  const [syncedUid, setSyncedUid] = useState<string | null>(null)
  const [nameConflict, setNameConflict] = useState(false)
  const profileRef = useRef(userProfile)
  const progressRef = useRef(userProgress)
  profileRef.current = userProfile
  progressRef.current = userProgress

  useEffect(() => {
    if (syncedUid && auth.currentUser?.uid === syncedUid && userProfile?.isOnboarded) saveToCloud({ profile: userProfile, progress: userProgress }, syncedUid)
  }, [userProfile, userProgress, syncedUid])

  /** Takes the profile's name as this account's unique id (asks for another one if taken). */
  const claimProfileName = async (uid: string, profile: UserProfile | null) => {
    if (!profile?.name) return
    const photo = auth.currentUser?.photoURL || null
    try {
      await claimName(uid, profile.name, { year: profile.schoolYear, xp: progressRef.current.xp, photo })
      if (profile.handle !== toHandle(profile.name)) setUserProfile((p) => (p ? { ...p, handle: toHandle(profile.name!) } : p))
      setNameConflict(false)
    } catch (e) {
      if (e instanceof NameTakenError) setNameConflict(true)
      else console.warn('Could not reserve the name', e)
    }
  }

  const syncAccount = async (uid: string) => {
    const result = await readCloud(uid)
    if (auth.currentUser?.uid !== uid) return
    if (result.status === 'error') return // try again later; never overwrite
    const local = profileRef.current
    if (result.status === 'ok') {
      // The account already exists: it wins over a fresh profile on this device.
      const cloud = result.data
      const sameAccount = !local?.uid || local.uid === uid
      const profile = { ...cloud.profile!, uid }
      setUserProfile(profile)
      setUserProgress((prev) => (cloud.progress ? (sameAccount ? mergeProgress(cloud.progress, prev) : { ...prev, ...cloud.progress }) : prev))
      setSyncedUid(uid)
      if (['/welcome', '/onboarding', '/'].includes(window.location.pathname)) navigate('/dashboard')
      if (!profile.handle && profile.name) claimProfileName(uid, profile)
    } else {
      // A new account: what was done on this device becomes the account's data.
      setSyncedUid(uid)
      if (local?.isOnboarded) {
        const linked = { ...local, uid }
        setUserProfile(linked)
        saveToCloud({ profile: linked, progress: progressRef.current }, uid)
        claimProfileName(uid, linked)
      }
    }
    syncLibrary(uid)
  }

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setSyncedUid(null)
    if (user) syncAccount(user.uid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  // Back online after a failed read: try again.
  useEffect(() => {
    const retry = () => { const u = auth.currentUser; if (u && !syncedUid) syncAccount(u.uid) }
    window.addEventListener('online', retry)
    const t = setInterval(retry, 30000)
    return () => { window.removeEventListener('online', retry); clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedUid])

  // Public card (name, year, xp) and "online" status for friends.
  useEffect(() => {
    if (!syncedUid || !userProfile?.handle) return
    const t = setTimeout(() => updatePublicProfile(syncedUid, { name: userProfile.name, handle: userProfile.handle, year: userProfile.schoolYear, xp: userProgress.xp, photo: auth.currentUser?.photoURL || null, lastSeen: Date.now() }), 2000)
    return () => clearTimeout(t)
  }, [syncedUid, userProfile?.name, userProfile?.handle, userProfile?.schoolYear, userProgress.xp])
  useEffect(() => {
    if (!syncedUid) return
    const beat = () => { if (document.visibilityState === 'visible') heartbeat(syncedUid) }
    const t = setInterval(beat, 60000)
    document.addEventListener('visibilitychange', beat)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', beat) }
  }, [syncedUid])

  // Daily Bonus Check


  const navigate = useNavigate();

  // From the welcome screen ("Começar", or after signing in).
  const handleStartLearning = async () => {
    if (profileRef.current?.isOnboarded) { navigate('/dashboard'); return }
    const user = auth.currentUser
    if (user) {
      // Signed in: an existing account goes straight to its data.
      const result = await readCloud(user.uid)
      if (result.status === 'ok') {
        setUserProfile({ ...result.data.profile!, uid: user.uid })
        if (result.data.progress) setUserProgress((prev) => mergeProgress(result.data.progress!, prev))
        setSyncedUid(user.uid)
        navigate('/dashboard')
        return
      }
    }
    navigate('/onboarding')
  }

  const handleSplashComplete = () => {
    setShowSplash(false);
    updateActivity(); // Mark user as active
    // After splash, check if user is onboarded
    if (userProfile?.isOnboarded) {
      // User is already onboarded/logged in, go straight to dashboard
      navigate('/dashboard');
    } else {
      navigate('/welcome');
    }
  }

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile)
    const user = auth.currentUser
    if (user && syncedUid === user.uid) {
      // Signed in with a new account: save and reserve the name now.
      saveToCloud({ profile: { ...profile, uid: user.uid }, progress: progressRef.current }, user.uid)
      claimProfileName(user.uid, profile)
    }
    // Initialize specific subject progress if needed
    setUserProgress(prev => {
      const newSubjectProgress = { ...prev.subjectProgress || {} };
      profile.selectedSubjects.forEach(sub => {
        if (!newSubjectProgress[sub]) {
          newSubjectProgress[sub] = { completedLessons: [], currentLesson: 1, xp: 0 }
        }
      });
      return { ...prev, subjectProgress: newSubjectProgress, hasSeenTutorial: false }; // Ensure tutorial runs after onboarding
    });
    updateActivity();
    navigate('/dashboard')
  }

  const handleStartLesson = (lessonId: number, clickCoords?: { x: number, y: number } | null) => {

    // Check Daily Training Limit
    if (lessonId === 99999) {
      const today = new Date().toDateString();
      if (userProgress.lastTrainingDate === today) {
        setNotification({
          open: true,
          message: "Treino Extra já realizado hoje! Volte amanhã para mais.",
          severity: 'info'
        });
        return;
      }
    }

    updateActivity(); // Track activity
    setSelectedLesson(lessonId)
    // The subject goes in the URL so the lesson never opens the wrong one.
    const subject = localStorage.getItem('mivvi_selectedSubject') || userProfile?.selectedSubjects?.[0] || ''
    navigate(`/lesson/${lessonId}?s=${encodeURIComponent(subject)}`, { state: { clickCoords } })
  }

  const handleLessonComplete = (xpGained: number, correct: number, total: number, gemsEarned: number = 0, subject?: string) => {
    updateActivity(); // Track activity
    const isPractice = selectedLesson === 99999;

    const today = new Date().toDateString();

    setUserProgress(prev => {
      // Check if it's a new day for dailyXP
      const isNewDay = prev.lastXPDate !== today;
      const currentDailyXP = isNewDay ? 0 : (prev.dailyXP || 0);
      const currentDailyLessons = isNewDay ? 0 : (prev.dailyLessons || 0);
      const currentDailyPerfectLessons = isNewDay ? 0 : (prev.dailyPerfectLessons || 0);

      const currentClaimedMissions = isNewDay ? [] : (prev.claimedMissionIds || []);

      const isPerfect = correct === total;

      // Update Subject Progress
      const newSubjectProgress = { ...prev.subjectProgress || {} };
      if (subject && !isPractice && selectedLesson) {
        const sub = subject as Subject;
        const currentSubFn = newSubjectProgress[sub] || { completedLessons: [], currentLesson: 1, xp: 0 };

        newSubjectProgress[sub] = {
          ...currentSubFn,
          xp: currentSubFn.xp + xpGained,
          completedLessons: !currentSubFn.completedLessons.includes(selectedLesson)
            ? [...currentSubFn.completedLessons, selectedLesson]
            : currentSubFn.completedLessons
        };
      }

      return {
        ...prev,
        xp: prev.xp + xpGained,
        gems: prev.gems + gemsEarned,
        streak: correct === total ? prev.streak + 1 : 0,
        completedLessons: (!isPractice && selectedLesson && !prev.completedLessons.includes(selectedLesson))
          ? [...prev.completedLessons, selectedLesson]
          : prev.completedLessons,
        currentLesson: (!isPractice && selectedLesson)
          ? Math.max(prev.currentLesson, selectedLesson + 1)
          : prev.currentLesson,
        lastTrainingDate: isPractice ? new Date().toDateString() : prev.lastTrainingDate,
        dailyXP: currentDailyXP + xpGained,
        dailyLessons: currentDailyLessons + 1,
        dailyPerfectLessons: isPerfect ? currentDailyPerfectLessons + 1 : currentDailyPerfectLessons,
        lastXPDate: today,
        weeklyXP: (prev.weeklyXP || 0) + xpGained,
        claimedMissionIds: currentClaimedMissions,
        subjectProgress: newSubjectProgress
      };
    })
    navigate('/dashboard')
  }

  const handleClaimMission = (missionId: string, reward: number) => {
    soundManager.playSuccess();
    setUserProgress(prev => {
      if (prev.claimedMissionIds?.includes(missionId)) return prev;
      return {
        ...prev,
        xp: prev.xp + reward,
        dailyXP: (prev.dailyXP || 0) + reward,
        claimedMissionIds: [...(prev.claimedMissionIds || []), missionId]
      }
    });
  }

  const handleMistake = () => {
    setUserProgress(prev => ({
      ...prev,
      hearts: Math.max(0, prev.hearts - 1)
    }))
  }

  const handleRefillHearts = () => {
    const today = new Date().toDateString();
    let currentCount = userProgress.heartsRefillCount || 0;

    // Reset count if it's a new day
    if (userProgress.lastRefillDate !== today) {
      currentCount = 0;
    }

    if (userProgress.hearts >= 5) {
      setNotification({
        open: true,
        message: "Suas vidas já estão cheias!",
        severity: 'info'
      });
      return;
    }

    if (currentCount >= 5) {
      setNotification({
        open: true,
        message: "Limite diário atingido! Você só pode recarregar 5 vezes por dia.",
        severity: 'error'
      });
      return;
    }

    setNotification({
      open: true,
      message: `Vidas recarregadas! (${currentCount + 1}/5 hoje)`,
      severity: 'success'
    });

    setUserProgress(prev => ({
      ...prev,
      hearts: 5,
      heartsRefillCount: currentCount + 1,
      lastRefillDate: today
    }))
  }

  const handlePurchaseOutfit = (outfitId: string, cost: number) => {
    if (userProgress.gems >= cost) {
      setUserProgress(prev => ({
        ...prev,
        gems: prev.gems - cost,
        unlockedOutfits: [...prev.unlockedOutfits, outfitId]
      }));
      // Play purchase sound?
      soundManager.playSuccess();
      return true;
    }
    return false;
  }

  const handleEquipOutfit = (outfitId: string) => {
    setUserProgress(prev => ({
      ...prev,
      currentOutfit: outfitId
    }));
  }

  const handleTutorialComplete = () => {
    setUserProgress(prev => ({ ...prev, hasSeenTutorial: true }));
  }


  // Set initial route - only run once on mount
  useEffect(() => {
    const path = window.location.pathname;
    console.log('🔍 Initial path:', path);
    console.log('👤 User onboarded:', userProfile?.isOnboarded);
    console.log('✨ Show splash:', showSplash);

    // If at root and NOT showing splash, redirect immediately
    if ((path === '/' || path === '') && !showSplash) {
      if (userProfile?.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/welcome');
      }
      return;
    }

    // Don't navigate if we're on root and splash IS showing - let splash screen handle it
    if (path === '/' || path === '') {
      return;
    } else if (path.startsWith('/lesson/')) {
      const lessonId = parseInt(path.split('/')[2]);
      setSelectedLesson(lessonId);
    }
  }, [showSplash, userProfile, navigate]);

  // Set a default background color
  // Set a default background color handled by CSS/MUI now
  // useEffect(() => {
  //   document.body.style.backgroundColor = '#F5F7FA';
  //   return () => {
  //     document.body.style.backgroundColor = '';
  //   };
  // }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <Routes>
          <Route path="/onboarding" element={
            <PageTransition>
              <Onboarding onComplete={handleOnboardingComplete} />
            </PageTransition>
          } />
          <Route path="/welcome" element={
            <PageTransition>
              <Welcome onStart={handleStartLearning} userProfile={userProfile} />
            </PageTransition>
          } />
          <Route path="/dashboard" element={
            <PageTransition>
              {userProfile ? (
                <Dashboard
                  userProgress={userProgress}
                  onStartLesson={handleStartLesson}
                  onStartExam={(subject: string) => navigate(`/exam?s=${encodeURIComponent(subject)}`)}
                  onRefillHearts={handleRefillHearts}
                  onPurchaseOutfit={handlePurchaseOutfit}
                  onEquipOutfit={handleEquipOutfit}
                  onTutorialComplete={handleTutorialComplete}
                  onClaimMission={handleClaimMission}
                  onUpdateProfile={(updates: Partial<UserProfile>) => {
                    setUserProfile((p) => (p ? { ...p, ...updates } : p));
                  }}
                  userProfile={userProfile}
                />
              ) : (
                <Navigate to="/welcome" replace />
              )}
            </PageTransition>
          } />
          <Route path="/lesson/:id" element={
            <PageTransition>
                <LessonContainer
                  onComplete={handleLessonComplete}
                  onMistake={handleMistake}
                  onBack={(skipTutorial?: boolean) => {
                    if (skipTutorial) {
                      handleTutorialComplete();
                    }
                    navigate('/dashboard');
                  }}
                  userProfile={userProfile}
                  currentOutfit={userProgress.currentOutfit}
                  isTutorial={false}
                  completedLessons={userProgress.completedLessons}
                />
            </PageTransition>
          } />
          <Route path="/ai-tutor" element={
            <PageTransition>
              <AITutor userProfile={userProfile} currentOutfit={userProgress.currentOutfit} />
            </PageTransition>
          } />
          <Route path="/api-test" element={
            <PageTransition>
              <APITester />
            </PageTransition>
          } />
          <Route path="/add/:handle" element={<AddFriendLink />} />
          <Route path="/exam" element={
            <ExamRoute userProfile={userProfile} userProgress={userProgress} onRecord={(subject, last) => setUserProgress((prev) => {
              const before = prev.exams?.[subject]
              const best = Math.max(before?.best || 0, last.annulled ? 0 : last.score)
              return { ...prev, exams: { ...(prev.exams || {}), [subject]: { best, last, attempts: (before?.attempts || 0) + 1 } } }
            })} />
          } />
          <Route path="/reset" element={
            <PageTransition>
              <ResetData />
            </PageTransition>
          } />
          <Route path="/" element={
            <PageTransition>
              <div>Loading...</div>
            </PageTransition>
          } />
        </Routes>
      )}
      <NameClaimDialog
        open={nameConflict && !!syncedUid}
        currentName={userProfile?.name || ''}
        uid={syncedUid || ''}
        onDone={(name) => {
          setNameConflict(false)
          setUserProfile((p) => (p ? { ...p, name, handle: toHandle(name), lastNameChangeDate: new Date().toISOString() } : p))
        }}
        extra={{ year: userProfile?.schoolYear, xp: userProgress.xp, photo: auth.currentUser?.photoURL || null }}
      />
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          zIndex: 99999,
          top: { xs: '80px !important', sm: '90px !important' } // Offset to appear below TopBar
        }}
      >
        <Box
          sx={{
            position: 'relative',
            padding: '8px 16px', // Smaller padding
            borderRadius: '50px', // Pill shape
            background: '#262626',
            border: `1px solid ${cv.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minWidth: 'auto', // Allow it to shrink
            maxWidth: '90vw',
            animation: 'slideDown 0.3s ease-out', // Changed animation name
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)'
          }}
        >
          {/* Icon based on severity or custom for XP */}
          {notification.severity === 'success' && <Typography sx={{ fontSize: '1.2rem' }}>🎉</Typography>}
          {notification.severity === 'error' && <Typography sx={{ fontSize: '1.2rem' }}>⚠️</Typography>}
          {notification.severity === 'warning' && <Typography sx={{ fontSize: '1.2rem' }}>✋</Typography>}
          {notification.severity === 'info' && <Typography sx={{ fontSize: '1.2rem' }}>ℹ️</Typography>}

          <Typography sx={{
            color: '#fff',
            fontWeight: 600,
            fontFamily: cv.font,
            fontSize: '0.9rem', // Smaller text
            whiteSpace: 'nowrap'
          }}>
            {notification.message}
          </Typography>

          <IconButton
            size="small"
            onClick={() => setNotification(prev => ({ ...prev, open: false }))}
            sx={{
              color: 'rgba(255,255,255,0.5)',
              marginLeft: 1,
              padding: 0.5,
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
      </Snackbar>
    </ThemeProvider>
  )
}

// Wrap App with Router
const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;

