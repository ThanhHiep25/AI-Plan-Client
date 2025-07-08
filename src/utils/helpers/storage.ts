// helpers/storage.ts
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    SESSION_ID: 'sessionId',
    REMEMBER_ME: 'rememberMe',
} as const;

// Utility function để handle localStorage errors
const safeLocalStorage = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Error reading from localStorage for key: ${key}`, error);
            return null;
        }
    },
    
    setItem: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error(`Error writing to localStorage for key: ${key}`, error);
        }
    },
    
    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing from localStorage for key: ${key}`, error);
        }
    }
};

// Token management
export const getToken = (): string | null => {
    return safeLocalStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const setToken = (token: string): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

export const removeToken = (): void => {
    safeLocalStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
};

// Refresh token management
export const getRefreshToken = (): string | null => {
    return safeLocalStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const setRefreshToken = (token: string): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

export const removeRefreshToken = (): void => {
    safeLocalStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

// Session ID management
export const getSessionId = (): string | null => {
    return safeLocalStorage.getItem(STORAGE_KEYS.SESSION_ID);
};

export const setSessionId = (sessionId: string): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
};

export const removeSessionId = (): void => {
    safeLocalStorage.removeItem(STORAGE_KEYS.SESSION_ID);
};

// User management
export const getUser = (): any | null => {
    const user = safeLocalStorage.getItem(STORAGE_KEYS.USER);
    try {
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        removeUser(); // Remove corrupted data
        return null;
    }
};

export const setUser = (user: any): void => {
    try {
        safeLocalStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
        console.error('Error stringifying user data:', error);
    }
};

export const removeUser = (): void => {
    safeLocalStorage.removeItem(STORAGE_KEYS.USER);
};

// Remember me functionality
export const getRememberMe = (): boolean => {
    return safeLocalStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
};

export const setRememberMe = (remember: boolean): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.REMEMBER_ME, remember.toString());
};

// Clear all storage
export const clearStorage = (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
        safeLocalStorage.removeItem(key);
    });
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    const token = getToken();
    const user = getUser();
    return !!(token && user);
};

// Token expiry check
export const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch (error) {
        console.error('Error checking token expiry:', error);
        return true; // Consider expired if can't parse
    }
};

// Auto logout when token expires
export const checkTokenExpiry = (): void => {
    const token = getToken();
    if (token && isTokenExpired(token)) {
        console.log('Token expired, clearing storage');
        clearStorage();
        window.location.href = '/login';
    }
};
