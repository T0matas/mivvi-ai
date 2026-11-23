import { useState, useEffect } from 'react';
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Lesson from './components/Lesson';
import Welcome from './components/Welcome';
import Onboarding from './components/Onboarding';
import SplashScreen from './components/SplashScreen';
import AITutor from './components/AITutor';
import APITester from './components/APITester';
import ResetData from './components/ResetData';
import { UserProgress, UserProfile } from './types';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1E88E5',
            light: '#42A5F5',
            dark: '#1565C0',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#5C6BC0',
            light: '#7986CB',
            dark: '#3949AB',
            contrastText: '#FFFFFF',
        },
        success: {
            main: '#4CAF50',
            light: '#81C784',
            dark: '#388E3C',
            contrastText: '#FFFFFF',
        },
        warning: {
            main: '#FF9800',
            light: '#FFB74D',
            dark: '#F57C00',
            contrastText: '#000000',
        },
        error: {
            main: '#F44336',
            light: '#E57373',
            dark: '#D32F2F',
        },
        background: {
            default: '#F5F7FA',
            paper: '#FFFFFF',
        },
    },
    typography: {
        fontFamily: '"Nunito", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
        fontSize: 16,
        fontWeightLight: 400,
        fontWeightRegular: 500,
        fontWeightMedium: 600,
        fontWeightBold: 700,
        h1: {
            fontWeight: 800,
            fontSize: '2.5rem',
            lineHeight: 1.2,
            letterSpacing: '-0.01562em',
        },
        h2: {
            fontWeight: 800,
            fontSize: '2rem',
            lineHeight: 1.3,
            letterSpacing: '-0.00833em',
        },
        h3: {
            fontWeight: 700,
            fontSize: '1.75rem',
            lineHeight: 1.4,
        },
        h4: {
            fontWeight: 700,
            fontSize: '1.5rem',
            lineHeight: 1.4,
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.5,
        },
        h6: {
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: 1.5,
        },
        subtitle1: {
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.75,
        },
        subtitle2: {
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1.57,
        },
        body1: {
            fontWeight: 500,
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontWeight: 500,
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
        button: {
            fontWeight: 700,
            fontSize: '0.9375rem',
            lineHeight: 1.75,
            textTransform: 'none',
            letterSpacing: '0.02857em',
        },
        caption: {
            fontWeight: 500,
            fontSize: '0.75rem',
            lineHeight: 1.66,
        },
        overline: {
            fontWeight: 600,
            fontSize: '0.75rem',
            lineHeight: 2.66,
            textTransform: 'uppercase',
            letterSpacing: '0.08333em',
        },
    },
    shape: {
        borderRadius: 16,
    },
})

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

    const [selectedLesson, setSelectedLesson] = useState<number | null>(null)

    // User Profile State (School Year, Subjects)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
        const saved = localStorage.getItem('mivvi_userProfile')
        return saved ? JSON.parse(saved) : null
    })

    // User Progress State
    const [userProgress, setUserProgress] = useState<UserProgress>(() => {
        const saved = localStorage.getItem('mivvi_userProgress')
        return saved ? JSON.parse(saved) : {
            level: 1,
            xp: 0,
            streak: 0,
            hearts: 5,
            completedLessons: [],
            currentLesson: 1,
            subjectProgress: {},
        }
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

    const navigate = useNavigate();

    const handleStartLearning = () => {
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
            return { ...prev, subjectProgress: newSubjectProgress };
        });
        // Clear last activity to show splash after onboarding
        localStorage.removeItem('mivvi_lastActivity');
        navigate('/welcome')
    }

    const handleStartLesson = (lessonId: number) => {
        if (userProgress.hearts <= 0) {
            alert("Você está sem vidas! Clique no coração para recarregar.")
            return
        }
        updateActivity(); // Track activity
        setSelectedLesson(lessonId)
        navigate(`/lesson/${lessonId}`)
    }

    const handleLessonComplete = (xpGained: number, correct: number, total: number) => {
        updateActivity(); // Track activity
        setUserProgress(prev => ({
            ...prev,
            xp: prev.xp + xpGained,
            streak: correct === total ? prev.streak + 1 : 0,
            completedLessons: [...prev.completedLessons, selectedLesson!],
            currentLesson: Math.max(prev.currentLesson, (selectedLesson || 0) + 1),
        }))
        navigate('/dashboard')
    }

    const handleMistake = () => {
        setUserProgress(prev => ({
            ...prev,
            hearts: Math.max(0, prev.hearts - 1)
        }))
    }

    const handleRefillHearts = () => {
        setUserProgress(prev => ({ ...prev, hearts: 5 }))
    }

    // Set initial route - only run once on mount
    useEffect(() => {
        const path = window.location.pathname;
        console.log('🔍 Initial path:', path);
        console.log('👤 User onboarded:', userProfile?.isOnboarded);

        // Don't navigate if we're on root - let splash screen handle it
        if (path === '/' || path === '') {
            // Splash screen will handle navigation after completion
            return;
        } else if (path.startsWith('/lesson/')) {
            const lessonId = parseInt(path.split('/')[2]);
            setSelectedLesson(lessonId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

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
                        <Onboarding onComplete={handleOnboardingComplete} />
                    } />
                    <Route path="/welcome" element={
                        <Welcome onStart={handleStartLearning} userProfile={userProfile} />
                    } />
                    <Route path="/dashboard" element={
                        userProfile ? (
                            <Dashboard
                                userProgress={userProgress}
                                onStartLesson={handleStartLesson}
                                onRefillHearts={handleRefillHearts}
                                userProfile={userProfile}
                            />
                        ) : (
                            <Welcome onStart={handleStartLearning} userProfile={userProfile} />
                        )
                    } />
                    <Route path="/lesson/:id" element={
                        selectedLesson ? (
                            <Lesson
                                lessonId={selectedLesson}
                                onComplete={handleLessonComplete}
                                onMistake={handleMistake}
                                onBack={() => navigate('/dashboard')}
                                userProfile={userProfile}
                            />
                        ) : (
                            <Welcome onStart={handleStartLearning} userProfile={userProfile} />
                        )
                    } />
                    <Route path="/ai-tutor" element={<AITutor userProfile={userProfile} />} />
                    <Route path="/api-test" element={<APITester />} />
                    <Route path="/reset" element={<ResetData />} />
                    <Route path="/" element={
                        <div>Loading...</div>
                    } />
                </Routes>
            )}
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
