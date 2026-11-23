import { Box, Menu, MenuItem, Button, Typography } from '@mui/material'
import { KeyboardArrowDown, Edit, MenuBook, School, Science, Calculate, Public, Translate, MusicNote, Brush, EmojiEvents, Star } from '@mui/icons-material'
import { Lesson, UserProgress, Subject } from '../types'
import { useState } from 'react'
import { t } from '../utils/translations'
import { handleButtonClick } from '../services/feedbackService'
import LessonPreview from './LessonPreview'

// Itens escolares para os círculos do roadmap (Ícones Flat MUI)
const schoolIcons = [Edit, MenuBook, School, Science, Calculate, Public, Translate, MusicNote, Brush, EmojiEvents]

interface GameMapProps {
    lessons: Lesson[]
    userProgress: UserProgress
    onStartLesson: (lessonId: number, backgroundGradient?: string, clickCoords?: { x: number, y: number } | null) => void
    currentSubject: Subject
    availableSubjects: Subject[]
    onSubjectChange: (subject: Subject) => void
    language?: string
}

const subjectIcons: Record<Subject, string> = {
    matematica: '🔢',
    portugues: '📚',
    ciencias: '🔬',
    historia: '🏛️',
    geografia: '🌍',
    fisica: '⚛️',
    quimica: '🧪',
    biologia: '🧬',
    ingles: '🇬🇧',
    frances: '🇫🇷',
    espanhol: '🇪🇸',
    alemao: '🇩🇪',
    italiano: '🇮🇹'
}

// Helper to get key for subject
const getSubjectKey = (s: Subject): any => {
    const map: Record<Subject, string> = {
        matematica: 'math',
        portugues: 'portuguese',
        ciencias: 'science',
        historia: 'history',
        geografia: 'geography',
        fisica: 'physics',
        quimica: 'chemistry',
        biologia: 'biology',
        ingles: 'english',
        frances: 'french',
        espanhol: 'spanish',
        alemao: 'german',
        italiano: 'italian'
    }
    return map[s];
}

export default function GameMap({
    lessons,
    userProgress,
    onStartLesson,
    currentSubject,
    availableSubjects,
    onSubjectChange,
    language = 'pt-BR'
}: GameMapProps) {
    const nodeSpacing = 120 // Reduced slightly for denser wave
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [previewAnchorEl, setPreviewAnchorEl] = useState<null | HTMLElement>(null)
    const [animatingLessonId, setAnimatingLessonId] = useState<number | null>(null)
    const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)

    // Ripple origin removed as we use instant transition
    const [clickCoords, setClickCoords] = useState<{ x: number, y: number } | null>(null);

    const open = Boolean(anchorEl)

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleSelect = (subject: Subject) => {
        handleButtonClick();
        onSubjectChange(subject)
        handleClose()
    }

    const handleNodeClick = (lesson: Lesson, event: React.MouseEvent<HTMLElement>) => {
        handleButtonClick();
        setPreviewAnchorEl(event.currentTarget);
        setPreviewLesson(lesson);
        // Store click coordinates relative to viewport for ripple origin
        const rect = event.currentTarget.getBoundingClientRect();
        setClickCoords({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        });
    }

    const handleStartLesson = () => {
        if (previewLesson && clickCoords) {
            setPreviewAnchorEl(null);
            setAnimatingLessonId(previewLesson.id);

            setPreviewAnchorEl(null);
            setAnimatingLessonId(previewLesson.id);

            // Navigate immediately to merge animations with coordinates
            if (onStartLesson.length > 2 || (onStartLesson as any).length === undefined) {
                // @ts-ignore - Dynamic dispatch if TS complains about signature change not propagation
                onStartLesson(previewLesson.id, undefined, clickCoords);
            } else {
                onStartLesson(previewLesson.id);
            }

            setAnimatingLessonId(null);
            setPreviewLesson(null);
            setClickCoords(null);

            // setRippleOrigin(clickCoords); // Removed as we navigate immediately
            // setTimeout(() => { ... }, 1000); // Removed delay
        }
    }

    const handleClosePreview = () => {
        setPreviewAnchorEl(null);
        setTimeout(() => setPreviewLesson(null), 300);
    }

    // Calculate if preview lesson is locked
    const getIsPreviewLocked = () => {
        if (!previewLesson) return false;
        const lessonIndex = lessons.findIndex(l => l.id === previewLesson.id);
        if (lessonIndex === 0) return false;
        const previousLesson = lessons[lessonIndex - 1];
        const prevLocked = !userProgress.completedLessons.includes(previousLesson.id);
        const xpLocked = (previewLesson.requiredXp || 0) > userProgress.xp;

        return prevLocked || xpLocked;
    };

    // --- SINE WAVE LOGIC ---
    // Calculate positions for all nodes
    const getPosition = (index: number) => {
        const y = 80 + (index * nodeSpacing)
        // Sine wave: Center is 50%. Amplitude 28%. Frequency 0.6
        // Reduced amplitude to ensure nodes stay within viewport on mobile
        const xPercent = 50 + Math.sin(index * 0.6) * 28;
        return { x: xPercent, y };
    }

    // Generate Single Segment Path
    const getSegmentPath = (index: number) => {
        const current = getPosition(index);
        const next = getPosition(index + 1);

        const x1 = current.x * 4;
        const y1 = current.y;
        const x2 = next.x * 4;
        const y2 = next.y;

        const cp1x = x1;
        const cp1y = y1 + (nodeSpacing / 2);
        const cp2x = x2;
        const cp2y = y2 - (nodeSpacing / 2);

        return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    }

    return (
        <Box sx={{
            // Modern Premium Background - Inherited from Global Body
            background: 'transparent',
            position: 'relative',
            minHeight: '100dvh',
            height: '100%',
            overflowX: 'hidden',
            overflowY: 'auto',
            pb: 15,
            pt: 0,
            // Grid removed (handled globally)
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0, right: 0, height: '500px',
                background: 'radial-gradient(circle at 50% -50%, rgba(56, 189, 248, 0.15), transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0
            },
            '@keyframes bounce': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-8px)' }
            },
            '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
            },
            '@keyframes rotateRing': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
            },
            '@keyframes shimmer': {
                '0%': { backgroundPosition: '-100px 0' },
                '100%': { backgroundPosition: '200px 0' }
            },
            '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-10px)' }
            },
            '@keyframes float-centered': {
                '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
                '50%': { transform: 'translateX(-50%) translateY(-8px)' }
            },
            '@keyframes float-node': {
                '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
                '50%': { transform: 'scale(1.1)', filter: 'brightness(1.2)' }
            },
            '@keyframes draw-path': {
                '0%': { strokeDashoffset: '100%' },
                '100%': { strokeDashoffset: '0%' }
            },
            '@keyframes pulse-ring': {
                '0%': { transform: 'scale(1)', opacity: 1 },
                '100%': { transform: 'scale(1.5)', opacity: 0 }
            },
            '@keyframes zoomToFullScreen': {
                '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                '100%': { transform: 'translate(-50%, -50%) scale(10)', opacity: 0 }
            },
            '@keyframes rippleExpand': {
                '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: 0.5 },
                '100%': { transform: 'translate(-50%, -50%) scale(40)', opacity: 1 } // Massive scale to fill screen
            }
        }}>
            {/* Unit Header Banner - Floating Glass Card */}
            <Box sx={{
                mt: 2,
                mx: 2,
                borderRadius: '32px', // Super rounded
                background: 'linear-gradient(135deg, rgba(28, 28, 28, 0.8) 0%, rgba(20, 20, 20, 0.9) 100%)',
                
                color: 'white',
                p: 3,
                pb: 4,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)', // Deep soft shadow
                mb: 6,
                position: 'relative',
                zIndex: 10
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: 600, mx: 'auto' }}>
                    <Box>
                        <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 600, letterSpacing: 1.5, display: 'block', mb: -0.5 }}>
                            {t('section_unit', language)}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: 'Inter', textTransform: 'capitalize', textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}>
                            {t(getSubjectKey(currentSubject), language)}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5, fontWeight: 500 }}>
                            {t('your_journey', language)}
                        </Typography>

                        {/* Integrated Subject Switcher */}
                        <Button
                            onClick={handleClick}
                            endIcon={<KeyboardArrowDown />}
                            sx={{
                                mt: 2,
                                color: '#60a5fa',
                                border: '2px solid #60a5fa',
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2,
                                bgcolor: 'rgba(96, 165, 250, 0.1)',
                                // Solid "Complete" Bottom Contour (No transparency)
                                boxShadow: '0 4px 0 #60a5fa',
                                transition: 'all 0.1s ease',
                                '&:hover': {
                                    bgcolor: 'rgba(96, 165, 250, 0.2)',
                                    transform: 'translateY(2px)', // Press effect
                                    boxShadow: '0 2px 0 #60a5fa',
                                },
                                '&:active': {
                                    boxShadow: 'none',
                                }
                            }}
                            id="tutorial-change-subject"
                        >
                            {subjectIcons[currentSubject]} <Box component="span" sx={{ ml: 1 }}>{t('change_subject', language)}</Box>
                        </Button>
                    </Box>

                    {/* Guidebook Icon Placeholder */}
                    <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        p: 1.5,
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: '2px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)', transform: 'translateY(-2px)' },
                        '&:active': { transform: 'translateY(2px)' }
                    }}>
                        <MenuBook sx={{ fontSize: 28 }} />
                    </Box>
                </Box>

                {/* Subject Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    PaperProps={{
                        sx: {
                            bgcolor: 'background.paper', color: 'text.primary',
                            mt: 1,
                            borderRadius: 3,
                            minWidth: 200,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                        }
                    }}
                >
                    {availableSubjects.map((subj) => (
                        <MenuItem
                            key={subj}
                            onClick={() => handleSelect(subj)}
                            selected={subj === currentSubject}
                            sx={{ py: 1.5, fontWeight: 600, gap: 1.5 }}
                        >
                            <span>{subjectIcons[subj]}</span>
                            {t(getSubjectKey(subj), language)}
                        </MenuItem>
                    ))}
                </Menu>
            </Box >

            <Box sx={{
                position: 'relative',
                maxWidth: 400,
                width: '100%',
                mx: 'auto',
                height: lessons.length * nodeSpacing + 200,
            }}>
                {/* Connecting Paths (Segmented) */}
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                    viewBox={`0 0 400 ${lessons.length * nodeSpacing + 200}`}
                    preserveAspectRatio="none"
                >
                    {lessons.map((lesson, index) => {
                        if (index === lessons.length - 1) return null; // No path after last lesson

                        // Logic: Path connects Lesson(i) -> Lesson(i+1)
                        // It should be unlocked/green if Lesson(i) is completed.
                        const isCompleted = userProgress.completedLessons.includes(lesson.id);
                        // Check if this path leads TO the current active lesson
                        // The current lesson is the first uncompleted one.




                        return (
                            <path
                                key={`path-${index}`}
                                d={getSegmentPath(index)}
                                fill="none"
                                stroke={isCompleted ? '#66BB6A' : '#455A64'} // Bright Green if completed
                                strokeWidth="8"
                                strokeLinecap="round"
                                style={{
                                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))',
                                    transition: 'stroke 0.5s ease',
                                }}
                            />
                        );
                    })}
                </svg>




                {/* Lesson Nodes */}
                {lessons.map((lesson, index) => {
                    const isCompleted = userProgress.completedLessons.includes(lesson.id)
                    const prevLocked = index === 0 ? false : !userProgress.completedLessons.includes(lessons[index - 1].id)
                    const xpLocked = (lesson.requiredXp || 0) > userProgress.xp
                    const isLocked = prevLocked || xpLocked
                    const isCurrent = !isLocked && !isCompleted
                    const isAnimating = animatingLessonId === lesson.id
                    const isSelected = previewLesson?.id === lesson.id

                    const { x, y } = getPosition(index);

                    // Select icon based on index
                    const CurrentIcon = schoolIcons[index % schoolIcons.length];

                    return (
                        <Box
                            key={lesson.id}
                            id={index === 0 ? undefined : (isCurrent ? 'current-active-lesson' : undefined)}
                            onClick={(e) => handleNodeClick(lesson, e)}
                            sx={{
                                position: 'absolute',
                                left: `${x}%`,
                                top: y,
                                transform: 'translate(-50%, -50%)',
                                zIndex: isAnimating ? 99 : 2,
                                cursor: isLocked ? 'default' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                // Apply the ZOOM animation to the container
                                animation: isAnimating ? 'zoomToFullScreen 1.5s ease-in-out forwards' : 'none',
                                animationDelay: isAnimating ? '0.8s' : '0s', // Wait for initial spin
                                '&:hover': !isLocked && !isAnimating ? {
                                    transform: 'translate(-50%, -56%)', // Lift slightly
                                    filter: 'brightness(1.1)'
                                } : {}
                            }}>
                            {/* GRID LAYOUT WRAPPER - Forces strict centering */}
                            <Box
                                id={index === 0 ? 'tutorial-first-lesson' : undefined}
                                sx={{
                                    width: 80,
                                    height: 80,
                                    display: 'grid',         // Centers children perfectly
                                    placeItems: 'center',
                                    position: 'relative',
                                    animation: isCurrent ? 'float-node 3s ease-in-out infinite' : 'none',
                                    transformOrigin: 'center center'
                                }}>
                                {/* 1. PULSE RING (Only for Current Active Lesson) */}
                                {isCurrent && (
                                    <Box sx={{
                                        gridArea: '1/1', // Stacks in the center cell
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        border: '4px solid rgba(255, 255, 255, 0.4)',
                                        animation: 'pulse-ring 2s infinite cubic-bezier(0.4, 0, 0.6, 1)',
                                        zIndex: 0,
                                        pointerEvents: 'none'
                                    }} />
                                )}

                                {/* 2. INNER DASHED RING (On ALL icons) */}
                                <Box sx={{
                                    gridArea: '1/1',
                                    width: 66,           // Inner ring (smaller than 80px)
                                    height: 66,
                                    borderRadius: '50%',
                                    border: '2px dashed rgba(255, 255, 255, 0.5)', // Default visible dashed line
                                    zIndex: 2,           // On top of gradient
                                    pointerEvents: 'none',
                                    animation: isSelected ? 'rotateRing 4s linear infinite' : 'none',
                                    borderColor: isSelected
                                        ? (isCompleted ? '#FFD700' : 'white')
                                        : 'rgba(255, 255, 255, 0.3)'
                                }} />

                                {/* Outer Glow/Border for Selection (External) */}
                                {isSelected && (
                                    <Box sx={{
                                        gridArea: '1/1',
                                        width: 90,
                                        height: 90,
                                        borderRadius: '50%',
                                        border: `2px solid ${isCompleted ? '#FFD700' : 'white'}`,
                                        opacity: 0.5,
                                        zIndex: 0,
                                        pointerEvents: 'none'
                                    }} />
                                )}



                                {/* 3. MAIN LESSON NODE VISUAL */}
                                <Box sx={{
                                    gridArea: '1/1',
                                    width: 80,
                                    height: 80,
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    {/* Inner Circle with Gradient */}
                                    <Box sx={{
                                        width: '100%',
                                        height: '100%',
                                        background: isLocked
                                            ? 'linear-gradient(135deg, #78909C 0%, #37474F 100%)'
                                            : (isCompleted
                                                ? 'linear-gradient(135deg, #FFD54F 0%, #FF6F00 100%)'
                                                : 'linear-gradient(135deg, #64B5F6 0%, #2563eb 100%)'),
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.1s',
                                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                        boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.2)'
                                    }}>
                                        {/* Dynamic Icon */}
                                        <CurrentIcon sx={{
                                            color: isLocked ? '#CFD8DC' : 'white',
                                            fontSize: 32,
                                            filter: isCompleted ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' : 'none',
                                            animation: isAnimating ? 'spin 1s ease-in-out infinite' : 'none'
                                        }} />

                                        {/* Completed Stars */}
                                        {isCompleted && (
                                            <>
                                                <Star sx={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', color: '#FFF', fontSize: 24, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))', animation: 'float-centered 3s ease-in-out infinite' }} />
                                                <Star sx={{ position: 'absolute', top: -5, left: 10, color: '#FFECB3', fontSize: 16, transform: 'rotate(-20deg)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }} />
                                                <Star sx={{ position: 'absolute', top: -5, right: 10, color: '#FFECB3', fontSize: 16, transform: 'rotate(20deg)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }} />
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )
                })}
            </Box>

            {/* Ripple Animation Overlay */}


            {/* Lesson Preview Popover - Conditional Render to prevent Mobile Ghosting */}
            {
                previewAnchorEl && (
                    <LessonPreview
                        key={previewLesson?.id || 'preview'}
                        lesson={previewLesson}
                        anchorEl={previewAnchorEl}
                        onClose={handleClosePreview}
                        onStart={handleStartLesson}
                        language={language}
                        isLocked={getIsPreviewLocked()}
                        userXp={userProgress.xp}
                    />
                )
            }
        </Box >
    )
}
