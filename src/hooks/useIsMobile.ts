export const useIsMobile = () => {
    return window.innerWidth <= 768; // Simple check or use useMediaQuery from MUI if preferred, but user requested fix import.
}

import { useMediaQuery, useTheme } from '@mui/material';

const useIsMobileHook = () => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.down('sm'));
};

export default useIsMobileHook;
