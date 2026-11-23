import { createTheme } from '@mui/material'

// The Codevantum look (Documents/codevantum, src/pages/school/School.css and
// ChatPanel.css): quiet, neutral, ChatGPT-like. Charcoal canvas, hairlines
// instead of fills, Inter, pill buttons. Only the colours change: Codevantum's
// lavender becomes the blue of the BearDo bear.
export const cv = {
  bg: '#141414',
  chatBg: '#101010',
  surface: '#2f2f2f',
  surfaceHover: '#383838',
  paper: '#1c1c1c',
  composer: '#212121',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  soft: 'rgba(255, 255, 255, 0.06)',
  text: '#ececec',
  muted: '#9b9b9b',
  faint: '#6b6b6b',
  // Accents (Codevantum's pastel set, with blue in place of lavender)
  accent: '#60a5fa',
  accentStrong: '#3b82f6',
  accentSoft: 'rgba(96, 165, 250, 0.16)',
  send: 'linear-gradient(160deg, #7cb6ff 0%, #3b82f6 52%, #2563eb 100%)',
  sendHover: 'linear-gradient(160deg, #93c5fd 0%, #4b8ef8 52%, #2f6cf0 100%)',
  coral: '#ff9f88',
  butter: '#ffdb7c',
  mint: '#c0eadb',
  green: '#7ddba8',
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display: "'Plus Jakarta Sans', 'Inter', sans-serif",
} as const

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: cv.accent, light: '#93c5fd', dark: cv.accentStrong, contrastText: '#0d0d0d' },
    secondary: { main: cv.mint, contrastText: '#171725' },
    success: { main: cv.green, contrastText: '#0d0d0d' },
    warning: { main: cv.butter, contrastText: '#171725' },
    error: { main: cv.coral, contrastText: '#171725' },
    info: { main: cv.accent },
    background: { default: cv.bg, paper: cv.paper },
    text: { primary: cv.text, secondary: cv.muted, disabled: cv.faint },
    divider: cv.border,
  },
  typography: {
    fontFamily: cv.font,
    fontSize: 15,
    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: { fontFamily: cv.display, fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.15, letterSpacing: '-0.025em' },
    h2: { fontFamily: cv.display, fontWeight: 700, fontSize: '1.875rem', lineHeight: 1.15, letterSpacing: '-0.025em' },
    h3: { fontFamily: cv.display, fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
    h4: { fontFamily: cv.display, fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.25, letterSpacing: '-0.02em' },
    h5: { fontFamily: cv.display, fontWeight: 600, fontSize: '1.2rem', lineHeight: 1.3, letterSpacing: '-0.015em' },
    h6: { fontFamily: cv.display, fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.35, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.5 },
    subtitle2: { fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.5, color: cv.muted },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', color: cv.muted },
    button: { fontWeight: 500, fontSize: '0.875rem', textTransform: 'none', letterSpacing: 0 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { background: cv.bg, color: cv.text, fontFamily: cv.font, WebkitFontSmoothing: 'antialiased' },
        '::selection': { background: cv.accentSoft },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 40,
          padding: '0 18px',
          boxShadow: 'none',
          fontFamily: cv.font,
          transition: 'background-color .15s, opacity .15s, border-color .15s',
          '&:hover': { boxShadow: 'none' },
        },
        sizeLarge: { minHeight: 46, padding: '0 22px', fontSize: '0.9375rem' },
        sizeSmall: { minHeight: 32, padding: '0 12px', fontSize: '0.8125rem' },
        containedPrimary: { background: '#fff', color: '#0d0d0d', '&:hover': { background: '#e6e6e6' } },
        contained: { '&.Mui-disabled': { background: cv.surface, color: cv.faint } },
        outlined: { border: `1px solid ${cv.borderStrong}`, color: cv.text, '&:hover': { border: `1px solid ${cv.borderStrong}`, background: cv.surface } },
        text: { color: cv.muted, '&:hover': { color: cv.text, background: cv.surface } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { color: cv.muted, transition: 'background-color .15s, color .15s', '&:hover': { color: cv.text, background: cv.soft } },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: cv.paper, border: `1px solid ${cv.border}`, boxShadow: 'none' },
        rounded: { borderRadius: 16 },
      },
    },
    MuiCard: { styleOverrides: { root: { borderRadius: 16, overflow: 'hidden', backgroundColor: 'transparent' } } },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundColor: cv.paper, borderRadius: 20, border: `1px solid ${cv.border}`, boxShadow: '0 24px 48px rgba(0,0,0,.45)' },
      },
    },
    MuiBackdrop: { styleOverrides: { root: { backgroundColor: 'rgba(0,0,0,.6)' } } },
    MuiMenu: {
      styleOverrides: {
        paper: { backgroundColor: '#262626', border: `1px solid ${cv.border}`, boxShadow: '0 8px 20px rgba(0,0,0,.35)' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#262626', border: `1px solid ${cv.border}`, color: cv.text, fontSize: 13, fontWeight: 500, borderRadius: 8, padding: '6px 10px' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.borderStrong },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,.3)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,.45)', borderWidth: 1 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 500 },
        outlined: { borderColor: cv.border },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 6, borderRadius: 999, backgroundColor: cv.surface },
        bar: { borderRadius: 999 },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: { boxShadow: 'none', textTransform: 'none', fontWeight: 500, '&:active': { boxShadow: 'none' } },
      },
    },
    MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none', boxShadow: 'none' } } },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, border: `1px solid ${cv.border}`, backgroundColor: '#262626', color: cv.text },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: cv.border } } },
    MuiSwitch: {
      styleOverrides: {
        track: { backgroundColor: cv.surfaceHover, opacity: 1 },
      },
    },
  },
})
