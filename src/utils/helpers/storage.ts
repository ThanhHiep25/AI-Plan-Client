// helpers/storage.ts

// ✅ Cập nhật User interface theo BE schema
export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    isVerified: boolean;
    lastLogin?: string;
    createdAt?: string;
    // Removed avatar field vì BE không có
}

export interface CookieOptions {
    days?: number;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface StorageError {
    message: string;
    key?: string;
    operation?: 'read' | 'write' | 'remove';
}

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    SESSION_ID: 'sessionId',
    REMEMBER_ME: 'rememberMe',
} as const;

// Cookie utility functions
const safeCookies = {
    getCookie: (name: string): string | null => {
        try {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                const cookieValue = parts.pop()?.split(';').shift();
                return cookieValue ? decodeURIComponent(cookieValue) : null;
            }
            return null;
        } catch (error) {
            const storageError = error as StorageError;
            console.error(`Error reading cookie ${name}:`, storageError);
            return null;
        }
    },

    setCookie: (name: string, value: string, options: CookieOptions = {}): void => {
        try {
            const { days = 7, secure = true, sameSite = 'Lax' } = options;
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
            
            let cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
            
            if (secure && window.location.protocol === 'https:') {
                cookieString += '; Secure';
            }
            
            cookieString += `; SameSite=${sameSite}`;
            
            document.cookie = cookieString;
        } catch (error) {
            const storageError = error as StorageError;
            console.error(`Error setting cookie ${name}:`, storageError);
        }
    },

    removeCookie: (name: string): void => {
        try {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Lax`;
        } catch (error) {
            const storageError = error as StorageError;
            console.error(`Error removing cookie ${name}:`, storageError);
        }
    }
};

// Utility function để handle localStorage errors
const safeLocalStorage = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            const storageError = error as StorageError;
            console.error(`Error reading from localStorage for key: ${key}`, storageError);
            return null;
        }
    },
    
    setItem: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            const storageError = error as StorageError;
            console.error(`Error writing to localStorage for key: ${key}`, storageError);
        }
    },
    
    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            const storageError = error as StorageError;
            console.error(`Error removing from localStorage for key: ${key}`, storageError);
        }
    }
};

// ✅ Access Token - lưu trong localStorage (short-lived)
export const getToken = (): string | null => {
    return safeLocalStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const setToken = (token: string): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

export const removeToken = (): void => {
    safeLocalStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
};

// ✅ Refresh Token - lưu trong HTTP-only cookies (được backend set)
export const getRefreshToken = (): string | null => {
    // Refresh token được lưu trong HTTP-only cookie, không thể access từ JS
    // Backend sẽ tự động gửi cookie này trong request
    return safeCookies.getCookie(STORAGE_KEYS.REFRESH_TOKEN);
};

export const setRefreshToken = (token: string): void => {
    // ⚠️ Chú ý: Thông thường refresh token sẽ được backend set qua HTTP-only cookie
    // Function này chỉ dùng trong trường hợp đặc biệt
    console.warn('Setting refresh token from client-side. Consider using HTTP-only cookies for better security.');
    safeCookies.setCookie(STORAGE_KEYS.REFRESH_TOKEN, token, { days: 30, secure: true, sameSite: 'Lax' });
};

export const removeRefreshToken = (): void => {
    safeCookies.removeCookie(STORAGE_KEYS.REFRESH_TOKEN);
};

// ✅ Session ID - lưu trong cookies
export const getSessionId = (): string | null => {
    return safeCookies.getCookie(STORAGE_KEYS.SESSION_ID);
};

export const setSessionId = (sessionId: string): void => {
    safeCookies.setCookie(STORAGE_KEYS.SESSION_ID, sessionId, { days: 1, secure: true, sameSite: 'Lax' });
};

export const removeSessionId = (): void => {
    safeCookies.removeCookie(STORAGE_KEYS.SESSION_ID);
};

// ✅ User management - cập nhật User interface
export const getUser = (): User | null => {
    const user = safeLocalStorage.getItem(STORAGE_KEYS.USER);
    try {
        return user ? JSON.parse(user) as User : null;
    } catch (error) {
        const parseError = error as Error;
        console.error('Error parsing user data:', parseError);
        removeUser(); // Remove corrupted data
        return null;
    }
};

export const setUser = (user: User): void => {
    try {
        safeLocalStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
        const stringifyError = error as Error;
        console.error('Error stringifying user data:', stringifyError);
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

// ✅ Clear all storage (localStorage + cookies)
export const clearStorage = (): void => {
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
        safeLocalStorage.removeItem(key);
    });
    
    // Clear cookies
    removeRefreshToken();
    removeSessionId();
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
        const payload = JSON.parse(atob(token.split('.')[1])) as { exp: number };
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch (error) {
        const tokenError = error as Error;
        console.error('Error checking token expiry:', tokenError);
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
