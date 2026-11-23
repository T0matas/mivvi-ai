import { ReactNode } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

// A quiet page change: a short fade with a few pixels of rise. It ends on
// "transform: none" so fixed bars and sheets inside the page stay put.
const PageTransition = ({ children }: { children: ReactNode }) => {
    const location = useLocation();
    return (
        <Box
            key={location.pathname}
            sx={{
                width: '100%',
                height: '100%',
                animation: 'pageIn .32s cubic-bezier(.22,1,.36,1) both',
                '@keyframes pageIn': {
                    from: { opacity: 0, transform: 'translateY(6px)' },
                    to: { opacity: 1, transform: 'none' },
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
        >
            {children}
        </Box>
    );
};

export default PageTransition;
