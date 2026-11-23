// Use current hostname (works for localhost and LAN IP)
const API_BASE = `http://${window.location.hostname}:3001/api`;
const API_URL = API_BASE;

export const checkBackendStatus = async () => {
    try {
        const response = await fetch(`${API_URL}/status`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error connecting to backend:', error);
        throw error;
    }
};

export const getTables = async () => {
    try {
        const response = await fetch(`${API_URL}/test`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching tables:', error);
        throw error;
    }
}
