// Sound and Haptic Feedback Service
// Provides Duolingo-style audio feedback and vibration

import { soundManager } from '../utils/soundEffects';

class SoundService {
    // Delegate to soundManager
    playClick() {
        soundManager.playClick();
    }

    playSuccess() {
        soundManager.playSuccess();
    }

    playError() {
        soundManager.playError();
    }

    toggleSound() {
        return soundManager.toggleSound();
    }

    isEnabled() {
        return soundManager.isEnabled();
    }
}

// Haptic Feedback Service
class HapticService {
    private enabled: boolean = true;

    constructor() {
        if (typeof window !== 'undefined') {
            this.enabled = localStorage.getItem('mivvi_hapticEnabled') !== 'false';
        }
    }

    // Light vibration for clicks (10ms)
    vibrateClick() {
        if (!this.enabled) return;

        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }

    // Medium vibration for success (50ms)
    vibrateSuccess() {
        if (!this.enabled) return;

        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }

    // Pattern vibration for error (two short pulses)
    vibrateError() {
        if (!this.enabled) return;

        if ('vibrate' in navigator) {
            navigator.vibrate([30, 50, 30]);
        }
    }

    // Toggle haptic on/off
    toggleHaptic() {
        this.enabled = !this.enabled;
        localStorage.setItem('mivvi_hapticEnabled', this.enabled.toString());
        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }
}

// Export singleton instances
export const soundService = new SoundService();
export const hapticService = new HapticService();

// Convenience function for button clicks
export const handleButtonClick = () => {
    soundService.playClick();
    hapticService.vibrateClick();
};

// Convenience function for success actions
export const handleSuccess = () => {
    soundService.playSuccess();
    hapticService.vibrateSuccess();
};

// Convenience function for error actions
export const handleError = () => {
    soundService.playError();
    hapticService.vibrateError();
};
