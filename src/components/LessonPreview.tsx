import { Box, Typography, Button, Popover } from '@mui/material';
import { Lock, Check, PlayArrow, Loop } from '@mui/icons-material';
import { Lesson } from '../types';
import { t } from '../utils/translations';
import { getLessonContent } from '../utils/lessonContentTranslations';
import { handleButtonClick } from '../services/feedbackService';
import { useState } from 'react';

interface LessonPreviewProps {
    lesson: Lesson | null;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onStart: () => void;
    language?: string;
    isLocked?: boolean;
    userXp?: number;
}

const LessonPreview = ({ lesson, anchorEl, onClose, onStart, language = 'pt-BR', isLocked = false, userXp = 0 }: LessonPreviewProps) => {
    // Component for handling lesson preview popover
    const [isStarting, setIsStarting] = useState(false);

    // Get translated content
    const lessonNumber = lesson ? (lesson.lessonNumber || parseInt(lesson.id.toString().slice(-2)) || 1) : 1
    const translatedContent = lesson ? getLessonContent(lesson.subject, lessonNumber, language) : null
    const open = Boolean(anchorEl);

    if (!lesson || !anchorEl) return null;

    const handleStart = () => {
        if (!isLocked && !isStarting) {
            handleButtonClick();
            setIsStarting(true);

            // Immediate start for seamless transition
            handleButtonClick();
            setIsStarting(true);
            onStart();
            // setIsStarting(false); // Unnecessary if unmounting, but harmless if kept short
            // setTimeout(() => setIsStarting(false), 500);
        }
    };

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(20, 20, 20, 0.9)', // Slightly more opaque
                    
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '32px', // Aggressive Bubble Rounding
                    p: 0,
                    width: 'auto',
                    minWidth: { xs: 200, sm: 220 }, // Significantly narrower
                    maxWidth: { xs: 240, sm: 260 }, // Compact max width
                    mt: -1.5,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                    overflow: 'hidden',

                    // Transition Animations
                    opacity: 0,
                    // transformOrigin: 'bottom center', // Removed to let MUI handle origin based on placement
                    animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both', // More elastic "spring"

                    '@keyframes popIn': {
                        '0%': { opacity: 0, transform: 'scale(0.5)' },
                        '100%': { opacity: 1, transform: 'scale(1)' }
                    },
                    '@keyframes spinAndZoom': {
                        '0%': { transform: 'rotate(0deg) scale(1)', opacity: 1 },
                        '60%': { transform: 'rotate(360deg) scale(1)', opacity: 1 },
                        '70%': { transform: 'rotate(360deg) scale(0.5)', opacity: 1 },
                        '100%': { transform: 'rotate(360deg) scale(30)', opacity: 0 }
                    },
                }
            }}
            TransitionProps={{ timeout: 0 }}
        >
            <Box sx={{
                position: 'relative',
                p: 2, // Reduced padding (was 3)
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
            }}>
                {/* Decorative glow */}
                <Box sx={{
                    position: 'absolute',
                    top: -30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100px',
                    height: '60px',
                    background: 'radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, rgba(0,0,0,0) 70%)',
                    filter: 'blur(15px)',
                    zIndex: 0
                }} />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'white',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            mb: 0.25,
                            fontSize: '0.95rem', // Smaller title
                            letterSpacing: '-0.01em',
                            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                        }}
                    >
                        {translatedContent?.title || lesson.title}
                    </Typography>

                    {/* Subtitle/Description */}
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#9b9b9b',
                            mb: 1.5, // Reduced margin
                            fontSize: '0.8rem', // Smaller description
                            fontWeight: 500,
                            lineHeight: 1.4,
                        }}
                    >
                        {translatedContent?.description || lesson.description}
                    </Typography>

                    {/* Locked State OR XP Info */}
                    {(isLocked || typeof lesson.requiredXp === 'number') && (
                        <Box
                            sx={{
                                bgcolor: (typeof lesson.requiredXp === 'number' && userXp >= lesson.requiredXp) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                py: 0.5,
                                px: 1.25,
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0.5,
                                border: (typeof lesson.requiredXp === 'number' && userXp >= lesson.requiredXp) ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                                mb: isLocked ? 0 : 2,
                            }}
                        >
                            {(typeof lesson.requiredXp === 'number' && userXp >= lesson.requiredXp) ? (
                                <Check sx={{ color: '#4ADE80', fontSize: 16 }} />
                            ) : (
                                <Lock sx={{ color: '#9b9b9b', fontSize: 16 }} />
                            )}

                            <Typography sx={{
                                color: (typeof lesson.requiredXp === 'number' && userXp >= lesson.requiredXp) ? '#4ADE80' : '#9b9b9b',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                letterSpacing: '0.02em',
                                textTransform: 'uppercase'
                            }}>
                                {typeof lesson.requiredXp === 'number'
                                    ? `${t('requires_xp', language)} ${lesson.requiredXp} XP`
                                    : t('locked', language).toUpperCase()
                                }
                            </Typography>
                        </Box>
                    )}

                    {/* Start Button */}
                    {!isLocked && (
                        <Button
                            fullWidth
                            onClick={handleStart}
                            disabled={isStarting}
                            sx={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                color: 'white',
                                py: 1.5, // Slightly taller for pill shape
                                borderRadius: '50px', // Full Pill
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                letterSpacing: '0.02em',
                                textTransform: 'none',
                                boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.5)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                                    transform: isStarting ? 'none' : 'translateY(-2px) scale(1.02)',
                                    boxShadow: isStarting ? 'none' : '0 12px 24px -4px rgba(59, 130, 246, 0.6)',
                                },
                                '&:active': {
                                    transform: 'scale(0.98)',
                                },
                            }}
                        >
                            {isStarting ? (
                                <Loop sx={{
                                    animation: 'spin 1s linear infinite',
                                    fontSize: 20,
                                    color: 'white'
                                }} />
                            ) : (
                                <>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        p: 0.5
                                    }}>
                                        <PlayArrow sx={{ fontSize: 14 }} />
                                    </Box>
                                    {t('start_now', language)}
                                </>
                            )}
                        </Button>
                    )}
                </Box>
            </Box>
        </Popover >
    );
};

export default LessonPreview;
