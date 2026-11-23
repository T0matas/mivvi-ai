import { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Snackbar,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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
import { loadFromCloud, saveToCloud } from './services/cloudSync';

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

  // With an account, the profile and progress are also kept in the cloud.
  useEffect(() => {
    if (auth.currentUser && userProfile?.isOnboarded) saveToCloud({ profile: userProfile, progress: userProgress })
  }, [userProfile, userProgress])

  // Restores an account's data when it was saved before (e.g. on another device).
  const restoreFromCloud = async (): Promise<boolean> => {
    const user = auth.currentUser
    if (!user) return false
    const cloud = await loadFromCloud(user.uid)
    if (cloud?.profile?.isOnboarded) {
      setUserProfile({ ...cloud.profile, uid: user.uid })
      if (cloud.progress) setUserProgress((prev) => ({ ...prev, ...cloud.progress }))
      return true
    }
    return false
  }

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) return
    const restored = await restoreFromCloud()
    if (restored) {
      if (['/welcome', '/onboarding', '/'].includes(window.location.pathname)) navigate('/dashboard')
    } else {
      // First time with this account: keep what was done on this device.
      const local = JSON.parse(localStorage.getItem('mivvi_userProfile') || 'null')
      if (local?.isOnboarded) {
        const progress = JSON.parse(localStorage.getItem('mivvi_userProgress') || 'null')
        saveToCloud({ profile: { ...local, uid: user.uid }, ...(progress && { progress }) }, user.uid)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  // Daily Bonus Check


  const navigate = useNavigate();

  const handleStartLearning = async () => {
    // Signed in but nothing on this device yet: look for the account's data first.
    if (!userProfile?.isOnboarded && auth.currentUser && await restoreFromCloud()) {
      navigate('/dashboard')
      return
    }
    if (userProfile?.isOnboarded) {
      navigate('/dashboard')
    } else {
      // If not onboarded, force them to onboarding (clear any stale data)
      localStorage.removeItem('mivvi_userProfile');
      localStorage.removeItem('mivvi_userProgress');
      navigate('/onboarding')
    }
  }

  const handleSplashComplete = () => {
    setShowSplash(false);
    updateActivity(); // Mark user as active
    // After splash, check if user is onboarded
    if (userProfile?.isOnboarded) {
      // User is already onboarded/logged in, go straight to dashboard
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  }

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile)
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
    // Clear last activity to show splash after onboarding
    localStorage.removeItem('mivvi_lastActivity');
    navigate('/welcome')
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
    // Pass coordinates to generating screen for connected animation
    navigate(`/lesson/${lessonId}`, { state: { clickCoords } })
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
        navigate('/onboarding');
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
                  onRefillHearts={handleRefillHearts}
                  onPurchaseOutfit={handlePurchaseOutfit}
                  onEquipOutfit={handleEquipOutfit}
                  onTutorialComplete={handleTutorialComplete}
                  onClaimMission={handleClaimMission}
                  onUpdateProfile={(updates: Partial<UserProfile>) => { // Explicit type
                    const newProfile = { ...userProfile, ...updates };
                    setUserProfile(newProfile);
                    localStorage.setItem('userProfile', JSON.stringify(newProfile));
                  }}
                  userProfile={userProfile}
                />
              ) : (
                <Welcome onStart={handleStartLearning} userProfile={userProfile} />
              )}
            </PageTransition>
          } />
          <Route path="/lesson/:id" element={
            <PageTransition>
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

