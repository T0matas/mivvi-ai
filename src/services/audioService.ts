import { speakPiper } from './piperVoice';
// Audio Service for TTS and sound playback
let speechSynthesis: SpeechSynthesis | null = null;

// Initialize speech synthesis
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis = window.speechSynthesis;
}

// Language code mapping for TTS
const languageMap: Record<string, string> = {
    'pt-BR': 'pt-BR',
    'pt-PT': 'pt-PT',
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
};

/**
 * Speak text using Web Speech API
 */
export const speak = (text: string, language: string = 'pt-BR', rate: number = 1.0): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!speechSynthesis) {
            console.warn('Speech synthesis not supported');
            reject(new Error('Speech synthesis not supported'));
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageMap[language] || 'pt-BR';
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
            resolve();
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            reject(event);
        };

        speechSynthesis.speak(utterance);
    });
};

/**
 * Stop current speech
 */
export const stopSpeaking = () => {
    if (speechSynthesis) {
        speechSynthesis.cancel();
    }
};

/**
 * Check if currently speaking
 */
export const isSpeaking = (): boolean => {
    return speechSynthesis?.speaking || false;
};

/**
 * Get available voices for a language
 */
export const getVoicesForLanguage = (language: string): SpeechSynthesisVoice[] => {
    if (!speechSynthesis) return [];

    const voices = speechSynthesis.getVoices();
    const langCode = languageMap[language] || 'pt-BR';

    return voices.filter(voice => voice.lang.startsWith(langCode.split('-')[0]));
};

/**
 * Play audio for listening exercise: Mivvi's open-source voice (Piper), or the
 * browser's voice when Piper can't run. `onProgress` reports the first-time
 * voice download (0–1).
 */
export const playListeningAudio = async (
    text: string,
    language: string = 'pt-PT',
    onStart?: () => void,
    onEnd?: () => void,
    onProgress?: (fraction: number) => void
): Promise<void> => {
    try {
        await speakPiper(text, language, { rate: 0.95, onProgress, onStart });
    } catch (error) {
        console.warn('Piper voice unavailable, using the browser voice:', error);
        try {
            if (onStart) onStart();
            await speak(text, language, 0.9); // Slightly slower for listening exercises
        } catch (e) {
            console.error('Error playing listening audio:', e);
        }
    }
    if (onEnd) onEnd();
};
