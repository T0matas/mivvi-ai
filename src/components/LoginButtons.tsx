import { Box, Typography, CircularProgress } from '@mui/material';
import { cv } from '../theme';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useState, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';

interface LoginButtonsProps {
  onSuccess: (credentialResponse: any) => void;
  onError: () => void;
  language?: string;
}

export default function LoginButtons({ onSuccess, onError }: LoginButtonsProps) {
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  // Handle Redirect Result (for Mobile)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          onSuccess({ user });
        }
      } catch (error) {
        console.error("Redirect Login Error:", error);
        onError();
      }
    };
    checkRedirect();
  }, [onSuccess, onError]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      // Force account selection prompt
      googleProvider.setCustomParameters({ prompt: 'select_account' });

      if (isMobile) {
        // Use Redirect for Mobile (avoids popup blockers)
        await signInWithRedirect(auth, googleProvider);
        // Page will reload, execution stops here
      } else {
        // Use Popup for Desktop
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        onSuccess({ user });
      }
    } catch (error: any) {
      // Ignore popup closed by user error
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('User closed the popup');
        setLoading(false);
        return;
      }
      console.error("Google Sign-in Error:", error);
      onError();
      setLoading(false);
    }
  };

  const pill = { width: '100%', height: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1.25, border: 0, borderRadius: 999, font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background-color .15s, transform .15s', '&:active:not(:disabled)': { transform: 'scale(.98)' } }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
      <Box component="button" onClick={signInWithGoogle} disabled={loading} sx={{ ...pill, bgcolor: '#fff', color: '#1f1f1f', '&:hover:not(:disabled)': { bgcolor: '#ececec' }, '&:disabled': { opacity: 0.7, cursor: 'default' } }}>
        {loading ? <CircularProgress size={18} sx={{ color: '#1f1f1f' }} /> : (
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4C12.9 4 4 12.9 4 24s8.9 20 20 20s20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4C16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
        )}
        {loading ? 'A entrar…' : 'Continuar com Google'}
      </Box>
      <Typography sx={{ mt: 1.5, fontSize: 12, color: cv.faint, textAlign: 'center', lineHeight: 1.5 }}>
        Ao continuar, aceitas os Termos de Serviço e a Política de Privacidade do Mivvi.
      </Typography>
    </Box>
  );
}
