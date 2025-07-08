// api/authApi.ts
import { api } from './index';
import { 
    setToken, 
    setRefreshToken, 
    setUser, 
    setSessionId,
    clearStorage 
} from '../helpers/storage';

export interface LoginResponse {
    success: boolean;
    message: string;
    data?: {
        accessToken: string;
        refreshToken: string;
        sessionId?: string;
        user: {
            id: string;
            email: string;
            name: string;
            avatar?: string;
            role?: string;
        };
    };
    retryAfter?: number;
}

export const authApi = {
    // Login
    login: async (username: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await api.post<LoginResponse>('/auth/login', {
                email: username,
                password,
            });

            // Auto save tokens and user if login successful
            if (response.data.success && response.data.data) {
                const { accessToken, refreshToken, user, sessionId } = response.data.data;
                
                setToken(accessToken);
                setRefreshToken(refreshToken);
                setUser(user);
                
                if (sessionId) {
                    setSessionId(sessionId);
                }
            }

            return response.data;
        } catch (err: any) {
            if (err.response?.data) return err.response.data;
            return { 
                success: false, 
                message: err.message || 'Lỗi không xác định' 
            };
        }
    },

    // Register
    register: async (email: string, password: string, name?: string): Promise<LoginResponse> => {
        try {
            const response = await api.post<LoginResponse>('/auth/register', {
                email,
                password,
                name,
            });
            return response.data;
        } catch (err: any) {
            if (err.response?.data) return err.response.data;
            return { 
                success: false, 
                message: err.message || 'Lỗi không xác định' 
            };
        }
    },

    // Google Login
    googleLogin: (): void => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        window.location.href = `${baseUrl}/auth/google`;
    },

    // Logout
    logout: async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage
            clearStorage();
        }
    },

    // Refresh token
    refreshToken: async (): Promise<LoginResponse> => {
        try {
            const response = await api.post<LoginResponse>('/auth/refresh');

            if (response.data.success && response.data.data) {
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                
                setToken(accessToken);
                if (newRefreshToken) {
                    setRefreshToken(newRefreshToken);
                }
            }

            return response.data;
        } catch (err: any) {
            if (err.response?.data) return err.response.data;
            return { 
                success: false, 
                message: err.message || 'Lỗi không xác định' 
            };
        }
    },

    // Verify token
    verifyToken: async (): Promise<{ valid: boolean; user?: any }> => {
        try {
            const response = await api.get('/auth/verify');
            return response.data;
        } catch (error) {
            return { valid: false };
        }
    },
};
