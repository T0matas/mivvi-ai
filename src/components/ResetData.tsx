import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../utils/soundEffects';
import { t } from '../utils/translations';
import { useState, useEffect } from 'react';

const ResetData = () => {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('pt-BR');

    useEffect(() => {
        const savedLanguage = localStorage.getItem('mivvi_language') || 'pt-BR';
        setLanguage(savedLanguage);
    }, []);

    const handleReset = () => {
        soundManager.playClick();
        // Clear all data
        localStorage.clear();
        sessionStorage.clear();

        // Reload to root
        window.location.href = '/';
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                padding: 3,
            }}
        >
            <Box
                sx={{
                    backgroundColor: 'white',
                    borderRadius: 4,
                    padding: 4,
                    maxWidth: '400px',
                    textAlign: 'center',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    '@keyframes popIn': {
                        '0%': { opacity: 0, transform: 'scale(0.8) translateY(20px)' },
                        '100%': { opacity: 1, transform: 'scale(1) translateY(0)' }
                    }
                }}
            >
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#333' }}>
                    🔧 {t('reset_data_title', language)}
                </Typography>

                <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                    {t('reset_data_description', language)}
                </Typography>

                <Typography variant="body2" sx={{ mb: 4, color: '#999', fontStyle: 'italic' }}>
                    ⚠️ {t('reset_data_warning', language)}
                </Typography>

                <Button
                    variant="contained"
                    color="error"
                    size="large"
                    onClick={handleReset}
                    sx={{
                        mb: 2,
                        width: '100%',
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: '16px',
                    }}
                >
                    {t('reset_data_button', language)}
                </Button>

                <Button
                    variant="outlined"
                    size="medium"
                    onClick={() => {
                        soundManager.playClick();
                        navigate('/');
                    }}
                    sx={{
                        width: '100%',
                    }}
                >
                    {t('cancel', language)}
                </Button>
            </Box>
        </Box>
    );
};

export default ResetData;
