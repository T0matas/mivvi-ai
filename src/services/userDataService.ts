import { ref, set, get, onValue, off } from 'firebase/database';
import { database } from '../firebase';
import { UserProfile, UserProgress } from '../types';

/**
 * Serviço para gerenciar dados do usuário no Firebase Realtime Database
 * Sincroniza dados entre dispositivos automaticamente
 */

// Salvar perfil do usuário
export const saveUserProfile = async (userId: string, profile: UserProfile): Promise<void> => {
    try {
        const userProfileRef = ref(database, `users/${userId}/profile`);
        await set(userProfileRef, profile);
        console.log('✅ Perfil salvo no Firebase');
    } catch (error) {
        console.error('❌ Erro ao salvar perfil:', error);
        throw error;
    }
};

// Salvar progresso do usuário
export const saveUserProgress = async (userId: string, progress: UserProgress): Promise<void> => {
    try {
        const userProgressRef = ref(database, `users/${userId}/progress`);
        await set(userProgressRef, progress);
        console.log('✅ Progresso salvo no Firebase');
    } catch (error) {
        console.error('❌ Erro ao salvar progresso:', error);
        throw error;
    }
};

// Carregar perfil do usuário
export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const userProfileRef = ref(database, `users/${userId}/profile`);
        const snapshot = await get(userProfileRef);

        if (snapshot.exists()) {
            console.log('✅ Perfil carregado do Firebase');
            return snapshot.val() as UserProfile;
        } else {
            console.log('ℹ️ Nenhum perfil encontrado no Firebase');
            return null;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar perfil:', error);
        return null;
    }
};

// Carregar progresso do usuário
export const loadUserProgress = async (userId: string): Promise<UserProgress | null> => {
    try {
        const userProgressRef = ref(database, `users/${userId}/progress`);
        const snapshot = await get(userProgressRef);

        if (snapshot.exists()) {
            console.log('✅ Progresso carregado do Firebase');
            return snapshot.val() as UserProgress;
        } else {
            console.log('ℹ️ Nenhum progresso encontrado no Firebase');
            return null;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar progresso:', error);
        return null;
    }
};

// Escutar mudanças em tempo real no perfil
export const subscribeToUserProfile = (
    userId: string,
    callback: (profile: UserProfile | null) => void
): (() => void) => {
    const userProfileRef = ref(database, `users/${userId}/profile`);

    const unsubscribe = onValue(userProfileRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val() as UserProfile);
        } else {
            callback(null);
        }
    });

    // Retorna função para cancelar a inscrição
    return () => off(userProfileRef, 'value', unsubscribe);
};

// Escutar mudanças em tempo real no progresso
export const subscribeToUserProgress = (
    userId: string,
    callback: (progress: UserProgress | null) => void
): (() => void) => {
    const userProgressRef = ref(database, `users/${userId}/progress`);

    const unsubscribe = onValue(userProgressRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val() as UserProgress);
        } else {
            callback(null);
        }
    });

    // Retorna função para cancelar a inscrição
    return () => off(userProgressRef, 'value', unsubscribe);
};

// Salvar dados completos do usuário (perfil + progresso)
export const saveUserData = async (
    userId: string,
    profile: UserProfile,
    progress: UserProgress
): Promise<void> => {
    try {
        await Promise.all([
            saveUserProfile(userId, profile),
            saveUserProgress(userId, progress)
        ]);
        console.log('✅ Dados do usuário salvos no Firebase');
    } catch (error) {
        console.error('❌ Erro ao salvar dados do usuário:', error);
        throw error;
    }
};

// Carregar dados completos do usuário (perfil + progresso)
export const loadUserData = async (
    userId: string
): Promise<{ profile: UserProfile | null; progress: UserProgress | null }> => {
    try {
        const [profile, progress] = await Promise.all([
            loadUserProfile(userId),
            loadUserProgress(userId)
        ]);

        return { profile, progress };
    } catch (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error);
        return { profile: null, progress: null };
    }
};
