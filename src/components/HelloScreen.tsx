import { Box, Container, Typography, Button, useMediaQuery, useTheme, Fade } from '@mui/material'
import { useState, useEffect } from 'react'
import BeardMascot from './BeardMascot'
import { soundManager } from '../utils/soundEffects'
import { t } from '../utils/translations'

interface HelloScreenProps {
    onStart: () => void
}

// Detect device language
const getDeviceLanguage = (): string => {
    const browserLang = navigator.language || (navigator as any).userLanguage || 'pt-BR';

    // Map browser language codes to our supported languages
    if (browserLang.startsWith('pt-BR')) return 'pt-BR';
    if (browserLang.startsWith('pt-PT') || browserLang.startsWith('pt')) return 'pt-PT';
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('it')) return 'it';

    // Default to Portuguese BR
    return 'pt-BR';
}

export default function HelloScreen({ onStart }: HelloScreenProps) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [show, setShow] = useState(false)
    const [lang] = useState(getDeviceLanguage())

    useEffect(() => {
        setShow(true)
        console.log('🌍 HelloScreen: Detected device language:', lang)
    }, [lang])

    const handleStart = () => {
        soundManager.playClick()
        setTimeout(() => {
            onStart()
        }, 200)
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1CB0F6 0%, #0A8FD8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated background elements */}
            <Box
                sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: 0.1,
                    background: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)',
                    animation: 'pulse 4s ease-in-out infinite',
                    '@keyframes pulse': {
                        '0%, 100%': { opacity: 0.1 },
                        '50%': { opacity: 0.2 },
                    },
                }}
            />

            <Container maxWidth="sm">
                <Fade in={show} timeout={800}>
                    <Box
                        sx={{
                            textAlign: 'center',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        {/* Mascot with speech bubble */}
                        <Box
                            sx={{
                                mb: 4,
                                animation: 'float 3s ease-in-out infinite',
                                '@keyframes float': {
                                    '0%, 100%': { transform: 'translateY(0px)' },
                                    '50%': { transform: 'translateY(-20px)' },
                                },
                            }}
                        >
                            <BeardMascot
                                variant="happy"
                                size={isMobile ? 200 : 250}
                                animated={true}
                            />
                            {/* Custom speech bubble */}
                            <Box
                                sx={{
                                    mt: 2,
                                    background: 'white',
                                    borderRadius: '20px',
                                    padding: '16px 24px',
                                    position: 'relative',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    maxWidth: '300px',
                                    margin: '0 auto',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: '-10px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: 0,
                                        height: 0,
                                        borderLeft: '10px solid transparent',
                                        borderRight: '10px solid transparent',
                                        borderBottom: '10px solid white',
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: '#1CB0F6',
                                        textAlign: 'center',
                                    }}
                                >
                                    {t('hello_greeting', lang)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Title */}
                        <Typography
                            variant={isMobile ? 'h3' : 'h2'}
                            sx={{
                                fontWeight: 600,
                                color: 'white',
                                mb: 2,
                                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                animation: 'slideUp 0.8s ease-out 0.3s backwards',
                                '@keyframes slideUp': {
                                    from: { opacity: 0, transform: 'translateY(30px)' },
                                    to: { opacity: 1, transform: 'translateY(0)' },
                                },
                            }}
                        >
                            Mivvi
                        </Typography>

                        {/* Subtitle */}
                        <Typography
                            variant={isMobile ? 'h6' : 'h5'}
                            sx={{
                                color: 'rgba(255,255,255,0.95)',
                                mb: 6,
                                fontWeight: 400,
                                animation: 'slideUp 0.8s ease-out 0.5s backwards',
                            }}
                        >
                            {t('hello_subtitle', lang)}
                        </Typography>

                        {/* Start Button */}
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleStart}
                            sx={{
                                py: 2,
                                px: 6,
                                fontSize: isMobile ? '1.1rem' : '1.3rem',
                                fontWeight: 700,
                                borderRadius: '50px',
                                background: 'white',
                                color: '#1CB0F6',
                                textTransform: 'none',
                                boxShadow: '0 10px 30px -5px rgba(255, 255, 255, 0.4)',
                                animation: 'slideUp 0.8s ease-out 0.7s backwards',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 15px 35px -5px rgba(255, 255, 255, 0.5)',
                                    background: 'rgba(255,255,255,0.98)',
                                },
                                '&:active': {
                                    transform: 'translateY(0)',
                                },
                            }}
                        >
                            {t('hello_button', lang)}
                        </Button>
                    </Box>
                </Fade>
            </Container>
        </Box>
    )
}
