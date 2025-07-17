// api/authApi.ts
import { api } from './index';
import { 
    setToken, 
    setUser, 
    clearStorage 
} from '../helpers/storage';

// ✅ Cập nhật interfaces theo BE schema chính xác
export interface LoginResponse {
    success: boolean;
    message: string;
    accessToken?: string;    // ✅ Trực tiếp trong response, không wrap trong data
    expiresIn?: string;      // ✅ Thêm field này từ BE
    // user field bị comment trong BE schema - không có trong login response
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    accessToken?: string;    // ✅ Trực tiếp trong response
    expiresIn?: string;      // ✅ Thêm field này từ BE
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        isVerified: boolean;
        createdAt: string;   // ✅ BE trả về createdAt thay vì avatar
    };
}

export interface RefreshTokenResponse {
    success: boolean;
    accessToken?: string;    // ✅ Trực tiếp trong response, không có message
    expiresIn?: string;      // ✅ Thêm field này từ BE
}

export interface LogoutResponse {
    success: boolean;
    message: string;
}

// ✅ Interface cho User (để lưu vào localStorage) - theo BE schema
export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    isVerified: boolean;
    lastLogin?: string;
    createdAt?: string;
}

export const authApi = {
    // ✅ Login - cập nhật theo BE response structure
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await api.post<LoginResponse>('/auth/login', {
                email,
                password,
            });

            // ✅ Cập nhật logic lưu token theo structure mới
            if (response.data.success && response.data.accessToken) {
                const { accessToken } = response.data;
                
                // Lưu access token
                setToken(accessToken);
                
                // ✅ Backend không trả user trong login response (bị comment)
                // Refresh token và session ID được set qua HTTP-only cookies tự động
                
                console.log('✅ Login successful, token saved');
                console.log('📅 Token expires in:', response.data.expiresIn);
            }

            return response.data;
        } catch (err: any) {
            console.error('❌ Login error:', err);
            if (err.response?.data) return err.response.data;
            return { 
                success: false, 
                message: err.message || 'Lỗi đăng nhập không xác định' 
            };
        }
    },

    // ✅ Register - cập nhật theo BE response structure
    register: async (email: string, password: string, name: string): Promise<RegisterResponse> => {
        try {
            const response = await api.post<RegisterResponse>('/auth/register', {
                email,
                password,
                name,
            });

            // ✅ Auto save tokens and user if register successful
            if (response.data.success && response.data.accessToken) {
                const { accessToken, user } = response.data;
                
                // Lưu access token
                setToken(accessToken);
                
                // Lưu user info nếu có
                if (user) {
                    // ✅ Convert user data to match our User interface
                    const userData: User = {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        isVerified: user.isVerified,
                        createdAt: user.createdAt
                    };
                    setUser(userData);
                }
                
                console.log('✅ Registration successful, token and user saved');
                console.log('📅 Token expires in:', response.data.expiresIn);
            }

            return response.data;
        } catch (err: any) {
            console.error('❌ Register error:', err);
            if (err.response?.data) return err.response.data;
            return { 
                success: false, 
                message: err.message || 'Lỗi đăng ký không xác định' 
            };
        }
    },

    // ✅ Refresh token - cập nhật theo BE response structure
    refreshToken: async (): Promise<RefreshTokenResponse> => {
        try {
            const response = await api.post<RefreshTokenResponse>('/auth/refresh-token', {});

            // ✅ Auto save new access token
            if (response.data.success && response.data.accessToken) {
                setToken(response.data.accessToken);
                console.log('✅ Token refreshed successfully');
                console.log('📅 New token expires in:', response.data.expiresIn);
            }

            return response.data;
        } catch (err: any) {
            console.error('❌ Refresh token error:', err);
            if (err.response?.data) return err.response.data;
            return { 
                success: false,
                // ✅ RefreshTokenResponse không có message field theo schema
            };
        }
    },

    // ✅ Logout
    logout: async (): Promise<LogoutResponse> => {
        try {
            const response = await api.post<LogoutResponse>('/auth/logout', {});
            
            // ✅ Clear storage regardless of response
            clearStorage();
            console.log('✅ Logged out successfully');
            
            return response.data;
        } catch (err: any) {
            console.error('❌ Logout error:', err);
            // ✅ Clear storage even if logout API fails
            clearStorage();
            
            if (err.response?.data) return err.response.data;
            return { 
                success: false, 
                message: err.message || 'Lỗi logout' 
            };
        }
    },

    // ✅ Logout all devices
    logoutAll: async (): Promise<LogoutResponse> => {
        try {
            const response = await api.post<LogoutResponse>('/auth/logout-all', {});
            
            // ✅ Clear storage
            clearStorage();
            console.log('✅ Logged out from all devices successfully');
            
            return response.data;
        } catch (err: any) {
            console.error('❌ Logout all error:', err);
            // ✅ Clear storage even if logout API fails
            clearStorage();
            
            if (err.response?.data) return err.response.data;
            return { 
                success: false, 
                message: err.message || 'Lỗi logout all devices' 
            };
        }
    },

    // ✅ Thêm method để lấy user profile (vì login không trả user)
    getProfile: async (): Promise<{ success: boolean; message?: string; user?: User }> => {
        try {
            const response = await api.get<{ success: boolean; user: User; message?: string }>('/auth/profile');
            
            // ✅ Auto save user info
            if (response.data.success && response.data.user) {
                setUser(response.data.user);
                console.log('✅ User profile loaded successfully');
            }
            
            return response.data;
        } catch (err: any) {
            console.error('❌ Get profile error:', err);
            if (err.response?.data) return err.response.data;
            return { 
                success: false, 
                message: err.message || 'Lỗi lấy thông tin người dùng' 
            };
        }
    }
};
