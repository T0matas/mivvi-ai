import { Box, Typography, Button, Paper, TextField, InputAdornment } from '@mui/material';
import { useState, useLayoutEffect, useMemo } from 'react';
import BeardMascot from './BeardMascot';
import { tutorialTranslations } from '../utils/translations';
import { Check } from '@mui/icons-material';
import { soundManager } from '../utils/soundEffects';

interface TutorialStep {
    id: string;
    targetId: string | null;
    titleKey: string;
    descKey: string;
    placement: string;
    hideNext: boolean;
    btnKey?: string;
    isNameInput?: boolean;
}

interface TutorialOverlayProps {
    onComplete: () => void;
    mode: 'intro' | 'success';
    language?: string;
    onUpdateName?: (name: string) => void;
    initialName?: string;
}

const introSteps: TutorialStep[] = [
    {
        id: 'welcome',
        targetId: null, // Center
        titleKey: "welcome_title",
        descKey: "welcome_desc",
        placement: 'center',
        hideNext: false,
        btnKey: "btn_start"
    },
    {
        id: 'name',
        targetId: null,
        titleKey: "name_q",
        descKey: "welcome_desc",
        placement: 'center',
        hideNext: false,
        isNameInput: true
    },
    // Step 1: Hearts (Lives)
    {
        id: 'hearts',
        targetId: 'tutorial-hearts',
        titleKey: "hearts_title",
        descKey: "hearts_desc",
        placement: 'bottom',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 2: Streak
    {
        id: 'streak',
        targetId: 'tutorial-streak',
        titleKey: "streak_title",
        descKey: "streak_desc",
        placement: 'bottom',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 3: XP
    {
        id: 'xp',
        targetId: 'tutorial-xp',
        titleKey: "xp_title",
        descKey: "xp_desc",
        placement: 'bottom',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 4: Gems
    {
        id: 'gems',
        targetId: 'tutorial-gems',
        titleKey: "gems_title",
        descKey: "gems_desc",
        placement: 'bottom',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 5: AI Tutor
    {
        id: 'aitutor',
        targetId: 'tutorial-ai-tutor',
        titleKey: "aitutor_title",
        descKey: "aitutor_desc",
        placement: 'bottom',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 6: Mascot
    {
        id: 'mascot',
        targetId: 'tutorial-mascot-btn',
        titleKey: "mascot_title",
        descKey: "mascot_desc",
        placement: 'bottom-right',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 7: Extra Training
    {
        id: 'extra_training',
        targetId: 'tutorial-extra-training',
        titleKey: "tutorial_extra_training_title",
        descKey: "tutorial_extra_training_desc",
        placement: 'top',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 8: Change Subject
    {
        id: 'change_subject',
        targetId: 'tutorial-change-subject',
        titleKey: "tutorial_change_subject_title",
        descKey: "tutorial_change_subject_desc",
        placement: 'bottom',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 9: Missions
    {
        id: 'missions',
        targetId: 'tutorial-missions-tab',
        titleKey: "tutorial_missions_title",
        descKey: "tutorial_missions_desc",
        placement: 'top',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 10: Profile
    {
        id: 'profile',
        targetId: 'tutorial-profile-tab',
        titleKey: "tutorial_profile_title",
        descKey: "tutorial_profile_desc",
        placement: 'top',
        hideNext: false,
        btnKey: "btn_next"
    },
    // Step 7: Lesson
    {
        id: 'lesson',
        targetId: 'tutorial-first-lesson',
        titleKey: "lesson_title",
        descKey: "lesson_desc",
        placement: 'top',
        hideNext: true
    }
];

const successSteps: TutorialStep[] = [
    {
        id: 'success',
        targetId: null,
        titleKey: "success_title",
        descKey: "success_desc",
        placement: 'center',
        hideNext: false,
        btnKey: "btn_finish"
    }
];

export default function TutorialOverlay({ onComplete, mode, language = 'pt-BR', onUpdateName, initialName }: TutorialOverlayProps) {
    const [step, setStep] = useState(0);
    const [coords, setCoords] = useState<{ top: number, left: number, placement: string } | null>(null);
    const [targetCenter, setTargetCenter] = useState<{ x: number, y: number } | null>(null);
    const [highlightRect, setHighlightRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [userName, setUserName] = useState(initialName || '');

    const [shouldSkipIntro] = useState(!!initialName && mode === 'intro');

    const t = (key: string) => {
        const langObj = tutorialTranslations[language] || tutorialTranslations['en'];
        return langObj[key] || key;
    };


    const steps = useMemo(() => {
        const rawSteps = mode === 'success' ? successSteps : introSteps;
        return rawSteps.filter(s => {
            if (shouldSkipIntro && (s.id === 'welcome' || s.id === 'name')) {
                return false;
            }
            return true;
        });
    }, [mode, shouldSkipIntro]);

    const current = steps[step];

    useLayoutEffect(() => {
        let animationFrameId: number;

        const updatePosition = () => {
            if (!current?.targetId) {
                setCoords(null);
                setTargetCenter(null);
                setHighlightRect(null);
                return;
            }

            const el = document.getElementById(current.targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                const tCenterX = rect.left + rect.width / 2;
                const tCenterY = rect.top + rect.height / 2;

                // Optimized state update: Only update if position changed significantly
                setTargetCenter(prev => {
                    if (prev && Math.abs(prev.x - tCenterX) < 1 && Math.abs(prev.y - tCenterY) < 1) return prev;
                    return { x: tCenterX, y: tCenterY };
                });

                let newHighlight: { x: number, y: number, w: number, h: number };
                if (current.id === 'lesson') {
                    const size = 120; // Increased size to 120px to show click area clearly
                    newHighlight = {
                        x: (tCenterX - size / 2) + 10, // Offset right
                        y: (tCenterY - size / 2) + 10, // Offset down
                        w: size,
                        h: size
                    };
                } else {
                    newHighlight = {
                        x: rect.left,
                        y: rect.top,
                        w: rect.width,
                        h: rect.height
                    };
                }

                setHighlightRect(prev => {
                    if (prev &&
                        Math.abs(prev.x - newHighlight.x) < 1 &&
                        Math.abs(prev.y - newHighlight.y) < 1 &&
                        Math.abs(prev.w - newHighlight.w) < 1 &&
                        Math.abs(prev.h - newHighlight.h) < 1
                    ) return prev;
                    return newHighlight;
                });

                const arrowSpace = 30; // Reduced space
                const cardWidth = 240; // Smaller width (was 280)
                const cardHeight = 200;
                let top = 0;
                let left = 0;

                // Offset logic matches the circle offset to ensure arrow is vertical
                const offsetX = current.id === 'lesson' ? 10 : 0;

                if (current.placement === 'bottom' || current.placement === 'bottom-left' || current.placement === 'bottom-right') {
                    top = rect.bottom + arrowSpace;
                    left = rect.left + rect.width / 2 - cardWidth / 2 + offsetX;
                } else if (current.placement === 'top') {
                    top = rect.top - cardHeight - arrowSpace;
                    left = rect.left + rect.width / 2 - cardWidth / 2 + offsetX;
                } else {
                    top = window.innerHeight / 2 - cardHeight / 2;
                    left = window.innerWidth / 2 - cardWidth / 2;
                }

                if (left < 20) left = 20;
                if (left > window.innerWidth - cardWidth - 20) left = window.innerWidth - cardWidth - 20;
                if (top < 20) top = 20;
                if (top > window.innerHeight - cardHeight) top = window.innerHeight - cardHeight - 20;

                setCoords(prev => {
                    if (prev &&
                        Math.abs(prev.top - top) < 1 &&
                        Math.abs(prev.left - left) < 1 &&
                        prev.placement === current.placement
                    ) return prev;
                    return { top, left, placement: current.placement };
                });
            }

            animationFrameId = requestAnimationFrame(updatePosition);
        };

        // Initial scroll to target
        if (current?.targetId) {
            const el = document.getElementById(current.targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }

        updatePosition();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [step, current]);

    const handleNext = () => {
        if (current.isNameInput && onUpdateName) {
            if (!userName.trim()) return;
            onUpdateName(userName);
        }

        if (step < steps.length - 1) {
            soundManager.playClick();
            setStep(step + 1);
        } else {
            soundManager.playSuccess();
            onComplete();
        }
    };

    if (!current) return null;

    // SVG Mask Path
    const w = window.innerWidth;
    const h = window.innerHeight;
    let pathD = `M0,0 H${w} V${h} H0 Z`; // Full screen rect

    if (highlightRect) {
        // Cut hole (Circular)
        const { x, y, w, h } = highlightRect;
        // Center of the hole
        const cx = x + w / 2;
        // Radius (take the smaller dimension to stay safe, though w/h should be similar)
        const rx = w / 2;
        const ry = h / 2;

        // Draw counter-clockwise (anticlockwise) to cut a hole in non-zero/evenodd rule
        pathD += ` M ${cx} ${y} 
                   A ${rx} ${ry} 0 0 0 ${cx} ${y + h} 
                   A ${rx} ${ry} 0 0 0 ${cx} ${y} Z`;
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1250, // Lower than MUI Modals/Popovers (1300) but higher than AppBar (1100)
                pointerEvents: 'none', // Allow clicks to pass through to SVG
                fontFamily: "'Inter', sans-serif",
            }}
        >
            <svg
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none', // Allow clicks to pass through SVG container
                    zIndex: 0
                }}
            >
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                        <path d="M1,1 L7,4 L1,7 Z" fill="#60a5fa" style={{ filter: 'url(#glow)' }} />
                    </marker>
                </defs>

                {/* Mask Layer - Blocks interaction everywhere except the hole */}
                <path
                    d={pathD}
                    fill="rgba(5, 10, 20, 0.7)" // Slightly darker mask for better contrast
                    fillRule="evenodd"
                    style={{ pointerEvents: 'auto',  }} // Added gentle blur to background
                />

                {/* Innovative Arrow (Curved & Animated) */}
                {coords && targetCenter && (
                    <>
                        {/* Actual Path Rendering - Smoother Curve */}
                        <path
                            d={(() => {
                                const startX = coords.left + 140; // Center of card (approx)
                                const startY = coords.placement === 'top' ? coords.top + 200 : coords.top;
                                const endX = current.id === 'lesson' ? targetCenter.x + 10 : targetCenter.x;
                                const endY = coords.placement === 'top'
                                    ? (current.id === 'lesson' ? targetCenter.y + 10 - 60 : targetCenter.y - (highlightRect?.h || 0) / 2 - 10)
                                    : (current.id === 'lesson' ? targetCenter.y + 10 + 60 : targetCenter.y + (highlightRect?.h || 0) / 2 + 10);

                                const dx = endX - startX;
                                const dy = endY - startY;

                                // Dynamic control points for organic feel
                                const controlX = startX + dx * 0.1;
                                const controlY = startY + dy * 0.9;

                                return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
                            })()}
                            fill="none"
                            stroke="#60a5fa"
                            strokeWidth="2" // Thinner Stroke
                            strokeLinecap="round"
                            markerEnd="url(#arrowhead)"
                            filter="url(#glow)" // Reduced glow
                            style={{
                                strokeDasharray: '8, 6', // Smaller dashes
                                animation: 'dash 30s linear infinite',
                                opacity: 0.9
                            }}
                        />
                    </>
                )}
                <style>
                    {`
                        @keyframes dash {
                            to {
                                stroke-dashoffset: -1000;
                            }
                        }
                    `}
                </style>
            </svg>

            <Paper
                elevation={0}
                sx={{
                    position: 'absolute',
                    top: coords ? coords.top : '50%',
                    left: coords ? coords.left : '50%',
                    transform: coords ? 'none' : 'translate(-50%, -50%)',
                    width: 240, // Smaller Width
                    px: 2.5, // Reduced Padding
                    py: 3,   // Reduced Padding
                    borderRadius: '32px', // Very rounded
                    textAlign: 'center',
                    pointerEvents: 'auto',
                    transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)', // Smooth Spring-like easing
                    // Premium Deep Glass Style
                    background: 'rgba(20, 30, 50, 0.75)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: `
                        0 20px 50px -12px rgba(0, 0, 0, 0.5),
                        0 0 0 1px rgba(255, 255, 255, 0.05) inset
                    `,
                    zIndex: 1,
                    animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    '@keyframes popIn': {
                        '0%': { transform: coords ? 'scale(0.8) translateY(20px)' : 'translate(-50%, -50%) scale(0.8) translateY(20px)', opacity: 0 },
                        '100%': { transform: coords ? 'scale(1) translateY(0)' : 'translate(-50%, -50%) scale(1) translateY(0)', opacity: 1 }
                    }
                }}
            >
                <Box display="flex" justifyContent="center" mb={1} sx={{ mt: -7 }}>
                    {/* Pop out mascot - Floating animation */}
                    <Box sx={{
                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
                        animation: 'float 6s ease-in-out infinite'
                    }}>
                        <style>
                            {`
                                @keyframes float {
                                    0% { transform: translateY(0px); }
                                    50% { transform: translateY(-10px); }
                                    100% { transform: translateY(0px); }
                                }
                            `}
                        </style>
                        <BeardMascot size={100} variant={mode === 'success' ? 'celebrating' : 'happy'} />
                    </Box>
                </Box>

                <Typography variant="h5" sx={{
                    color: '#FFF',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    mb: 1,
                    fontSize: '1.25rem',
                    lineHeight: 1.2,
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                    {t(current.titleKey).replace('{name}', userName || t('default_name'))}
                </Typography>

                {!current.isNameInput && (
                    <Typography variant="body1" sx={{
                        color: 'rgba(255,255,255,0.8)',
                        mb: 3,
                        lineHeight: 1.6,
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.9rem'
                    }}>
                        {t(current.descKey).replace('{name}', userName || t('default_name'))}
                    </Typography>
                )}

                {current.isNameInput && (
                    <Box mb={3}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder={t('name_placeholder')}
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                            InputProps={{
                                sx: {
                                    borderRadius: '16px',
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: 700,
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    color: '#FFF',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.15)',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                    },
                                    '&.Mui-focused': {
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        border: '1px solid rgba(33, 203, 243, 0.5)',
                                        boxShadow: '0 0 0 4px rgba(33, 203, 243, 0.1)'
                                    },
                                    input: {
                                        '&::placeholder': {
                                            color: 'rgba(255,255,255,0.5)',
                                            opacity: 1
                                        }
                                    }
                                },
                                endAdornment: userName.length > 0 && (
                                    <InputAdornment position="end">
                                        <Check sx={{ color: '#4ADE80' }} />
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                            }}
                        />
                    </Box>
                )}

                {!current.hideNext && (
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleNext}
                        disabled={current.isNameInput && !userName.trim()}
                        sx={{
                            borderRadius: '24px',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            letterSpacing: '0.5px',
                            background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 8px 20px -4px rgba(0, 114, 255, 0.5)',
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            '&:hover': {
                                transform: 'translateY(-2px) scale(1.02)',
                                boxShadow: '0 12px 30px -8px rgba(0, 114, 255, 0.7)',
                                filter: 'brightness(1.1)'
                            },
                            '&:active': {
                                transform: 'scale(0.98)',
                                boxShadow: '0 4px 10px -4px rgba(0, 114, 255, 0.4)'
                            },
                            '&:disabled': {
                                background: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.3)',
                                boxShadow: 'none',
                                border: 'none'
                            }
                        }}
                    >
                        {t(current.btnKey || 'btn_next')}
                    </Button>
                )}
            </Paper>
        </Box >
    );
}
