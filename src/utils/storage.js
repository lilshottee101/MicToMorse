// Local Storage helpers
export const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Cookie helpers
// TODO: Remove cookie storage and move all data to local storage
//       Potentially store hash of content>?
export const cookies = {
    set(name, value, days = 365) {
        try {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${JSON.stringify(value)}; expires=${expires.toUTCString()}; path=/`;
            return true;
        } catch (error) {
            console.error('Error setting cookie:', error);
            return false;
        }
    },

    get(name, defaultValue = null) {
        try {
            const cookies = document.cookie.split(';');
            const cookie = cookies.find(cookie => cookie.trim().startsWith(`${name}=`));
            
            if (cookie) {
                const value = cookie.split('=')[1];
                return JSON.parse(value);
            }
            return defaultValue;
        } catch (error) {
            console.error('Error reading cookie:', error);
            return defaultValue;
        }
    },

    remove(name) {
        try {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            return true;
        } catch (error) {
            console.error('Error removing cookie:', error);
            return false;
        }
    }
};

export const STORAGE_KEYS = {
    APP_STATE: 'morseDecoderState',
    PROFILES: 'morseProfiles',
    TEXT_SHORTCUTS: 'morseTextShortcuts',
    MORSE_SHORTCUTS: 'morseMorseShortcuts',
    USER_PREFERENCES: 'morseUserPreferences'
};