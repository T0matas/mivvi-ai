const API_URL = 'http://192.168.1.9:3000/api';

export const api = {
    // Sync local user to DB
    syncUser: async (uid: string, username: string, language: string) => {
        try {
            const response = await fetch(`${API_URL}/users/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, username, language })
            });
            return await response.json();
        } catch (error) {
            console.error('API Sync Error:', error);
            return null; // Fail silently or handle locally
        }
    },

    // Get Friends List
    getFriends: async (uid: string) => {
        try {
            const response = await fetch(`${API_URL}/friends/${uid}`);
            if (!response.ok) throw new Error('Failed to fetch friends');
            const data = await response.json();
            return data.friends || [];
        } catch (error) {
            console.error('API Get Friends Error:', error);
            return [];
        }
    },

    // Add Friend
    addFriend: async (uid: string, friendName: string) => {
        try {
            const response = await fetch(`${API_URL}/friends/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, friendName })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add friend');
            }
            return data;
        } catch (error) {
            throw error; // Re-throw to handle in UI
        }
    }
};
