import { Box } from '@mui/material';
import BeardMascot from './BeardMascot';

interface SpeakingMascotProps {
    isSpeaking: boolean;
    size?: number;
    outfit?: string;
}

export default function SpeakingMascot({ isSpeaking, size = 120, outfit = 'default' }: SpeakingMascotProps) {
    return (
        <Box
            sx={{
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <BeardMascot
                size={size}
                isSpeaking={isSpeaking}
                outfit={outfit}
                variant="default" // Default variant, but mouth will be overridden by isSpeaking
            />
        </Box>
    );
}
