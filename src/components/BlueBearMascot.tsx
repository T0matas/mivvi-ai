import { Box, keyframes } from '@mui/material';

interface BlueBearMascotProps {
    size?: number;
    animated?: boolean;
    variant?: 'happy' | 'sad' | 'thinking' | 'celebrating';
    isSpeaking?: boolean;
}

// Animações
const blink = keyframes`
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
`;

const think = keyframes`
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
`;

const celebrate = keyframes`
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-10deg) scale(1.05); }
  75% { transform: rotate(10deg) scale(1.05); }
`;

const mouthAnimation = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`;

export default function BlueBearMascot({
    size = 120,
    animated = false,
    variant = 'happy',
    isSpeaking = false
}: BlueBearMascotProps) {

    const getAnimation = () => {
        if (!animated) return 'none';
        switch (variant) {
            case 'thinking':
                return `${think} 2s ease-in-out infinite`;
            case 'celebrating':
                return `${celebrate} 1s ease-in-out infinite`;
            default:
                return `${bounce} 2s ease-in-out infinite`;
        }
    };

    const getMouth = () => {
        if (isSpeaking) {
            return (
                <Box
                    sx={{
                        position: 'absolute',
                        width: '30%',
                        height: '20%',
                        borderRadius: '0 0 50% 50%',
                        background: '#2C3E50',
                        bottom: '22%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        transformOrigin: 'top center',
                        animation: `${mouthAnimation} 0.3s ease-in-out infinite`,
                    }}
                />
            );
        }

        switch (variant) {
            case 'sad':
                return (
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '35%',
                            height: '18%',
                            borderRadius: '50% 50% 0 0',
                            border: '2px solid #2C3E50',
                            borderBottom: 'none',
                            bottom: '20%',
                            left: '50%',
                            transform: 'translateX(-50%) rotate(180deg)',
                        }}
                    />
                );
            case 'happy':
            case 'celebrating':
            default:
                return (
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '40%',
                            height: '20%',
                            borderRadius: '0 0 50% 50%',
                            border: '2px solid #2C3E50',
                            borderTop: 'none',
                            bottom: '18%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    />
                );
        }
    };

    const headHeight = size * 0.92;
    const bodyHeight = size * 0.95;

    return (
        <Box
            sx={{
                position: 'relative',
                width: size,
                height: headHeight + bodyHeight * 0.85,
                display: 'inline-block',
                animation: getAnimation(),
            }}
        >
            {/* Bear Head */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: size * 0.67,
                    height: headHeight,
                    borderRadius: '45% 45% 50% 50%',
                    background: 'linear-gradient(180deg, #B8E6F5 0%, #A0D8E8 100%)',
                    boxShadow: '0 4px 12px rgba(160,216,232,0.3)',
                }}
            >
                {/* Left Ear */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '32%',
                        height: '32%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #B8E6F5 0%, #A0D8E8 100%)',
                        top: '-8%',
                        left: '5%',
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '60%',
                            height: '60%',
                            borderRadius: '50%',
                            background: 'rgba(135,206,235,0.5)',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                </Box>

                {/* Right Ear */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '32%',
                        height: '32%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #B8E6F5 0%, #A0D8E8 100%)',
                        top: '-8%',
                        right: '5%',
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '60%',
                            height: '60%',
                            borderRadius: '50%',
                            background: 'rgba(135,206,235,0.5)',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                </Box>

                {/* Left Eye */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '26%',
                        height: '30%',
                        borderRadius: '50%',
                        background: '#fff',
                        top: '32%',
                        left: '20%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        animation: `${blink} 4s ease-in-out infinite`,
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '55%',
                            height: '65%',
                            borderRadius: '50%',
                            background: '#2C3E50',
                            top: '50%',
                            left: '45%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                width: '30%',
                                height: '30%',
                                borderRadius: '50%',
                                background: '#fff',
                                top: '20%',
                                left: '25%',
                            }}
                        />
                    </Box>
                </Box>

                {/* Right Eye */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '26%',
                        height: '30%',
                        borderRadius: '50%',
                        background: '#fff',
                        top: '32%',
                        right: '20%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        animation: `${blink} 4s ease-in-out infinite`,
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '55%',
                            height: '65%',
                            borderRadius: '50%',
                            background: '#2C3E50',
                            top: '50%',
                            left: '55%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                width: '30%',
                                height: '30%',
                                borderRadius: '50%',
                                background: '#fff',
                                top: '20%',
                                left: '25%',
                            }}
                        />
                    </Box>
                </Box>

                {/* Nose */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '18%',
                        height: '14%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #5A7C8F 0%, #4A6C7F 100%)',
                        bottom: '35%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '35%',
                            height: '35%',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.4)',
                            top: '20%',
                            left: '30%',
                        }}
                    />
                </Box>

                {/* Mouth */}
                {getMouth()}
            </Box>

            {/* Bear Body */}
            <Box
                sx={{
                    position: 'absolute',
                    top: headHeight * 0.8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: size * 0.58,
                    height: bodyHeight,
                    borderRadius: '40% 40% 50% 50%',
                    background: 'linear-gradient(180deg, #B8E6F5 0%, #A0D8E8 100%)',
                    boxShadow: '0 4px 12px rgba(160,216,232,0.3)',
                }}
            >
                {/* Belly */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '70%',
                        height: '60%',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.3)',
                        top: '25%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                    }}
                />

                {/* Left Arm */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '25%',
                        height: '50%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #B8E6F5 0%, #A0D8E8 100%)',
                        top: '15%',
                        left: '-15%',
                        transform: 'rotate(-20deg)',
                    }}
                />

                {/* Right Arm */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '25%',
                        height: '50%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #B8E6F5 0%, #A0D8E8 100%)',
                        top: '15%',
                        right: '-15%',
                        transform: 'rotate(20deg)',
                    }}
                />

                {/* Left Leg */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '30%',
                        height: '35%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #B8E6F5 0%, #A0D8E8 100%)',
                        bottom: '-15%',
                        left: '10%',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '80%',
                            height: '50%',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.3)',
                            bottom: '5%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    />
                </Box>

                {/* Right Leg */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '30%',
                        height: '35%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #B8E6F5 0%, #A0D8E8 100%)',
                        bottom: '-15%',
                        right: '10%',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '80%',
                            height: '50%',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.3)',
                            bottom: '5%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}
