import type { AxiosInstance, AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios';
import { 
    getToken, 
    getSessionId, 
    clearStorage,
    setToken, 
} from '../helpers/storage';
import axios from 'axios';

// ✅ Định nghĩa RefreshTokenResponse theo BE schema
interface RefreshTokenResponse {
    success: boolean;
    accessToken?: string;
    expiresIn?: string;
}

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
    export interface AxiosRequestConfig {
        metadata?: { retryCount: number };
        _retry?: boolean;
    }
}

// Base URL configuration
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    // ✅ Quan trọng: Đảm bảo cookies được gửi kèm request
    withCredentials: true,
});

const MAX_RETRY_COUNT = 5;

// **Request Interceptor**
apiClient.interceptors.request.use(
    async (config) => {
        try {
            // Retrieve access token and session ID
            const accessToken = getToken();
            const sessionId = getSessionId();

            // Add Authorization header if token exists
            if (accessToken) {
                config.headers['Authorization'] = `Bearer ${accessToken}`;
            }

            // Add session ID header if session ID exists
            if (sessionId) {
                config.headers['x-session-id'] = sessionId;
            }

            // Add retry count to track retries
            if (!config.metadata) {
                config.metadata = { retryCount: 0 };
            }

            // ✅ Đảm bảo cookies được gửi
            config.withCredentials = true;
        } catch (error) {
            console.error('Error adding headers:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Cập nhật refresh token function theo BE schema
const refreshTokenRequest = async (): Promise<AxiosResponse<RefreshTokenResponse>> => {
    try {
        console.log('🔄 Refreshing access token...');
        
        // ✅ Gửi request refresh token (refreshToken được lưu trong HTTP-only cookie)
        const response = await axios.post<RefreshTokenResponse>(
            `${BASE_URL}/auth/refresh-token`, 
            {}, 
            {
                withCredentials: true, // Quan trọng: để gửi cookies
            }
        );

        // ✅ QUAN TRỌNG: Lưu lại accessToken mới theo structure mới
        if (response.data.success && response.data.accessToken) {
            const newAccessToken = response.data.accessToken;
            
            // Lưu access token mới vào localStorage
            setToken(newAccessToken);
            
            console.log('✅ Access token refreshed successfully');
            console.log('📅 Token expires in:', response.data.expiresIn);
        } else {
            console.error('❌ Refresh token response invalid:', response.data);
            throw new Error('Invalid refresh token response');
        }

        return response;
    } catch (error) {
        const refreshError = error as AxiosError;
        console.error('❌ Refresh token failed:', refreshError);
        throw refreshError;
    }
};

// **Response Interceptor với Auto Refresh Token**
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - Auto refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // ✅ Refresh token và TỰ ĐỘNG lưu accessToken mới
                const refreshResponse = await refreshTokenRequest();
                
                if (refreshResponse.data.success && refreshResponse.data.accessToken) {
                    const newAccessToken = refreshResponse.data.accessToken;
                    
                    // ✅ Token đã được lưu trong refreshTokenRequest()
                    // Chỉ cần update header cho request hiện tại
                    if (!originalRequest.headers) {
                        originalRequest.headers = {};
                    }
                    
                    // Retry original request with new token
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    
                    console.log('🔄 Retrying original request with new token');
                    return apiClient(originalRequest);
                } else {
                    throw new Error('Refresh token response invalid');
                }
            } catch (refreshError) {
                console.error('❌ Token refresh failed completely:', refreshError);
                
                // If refresh fails, clear storage and redirect
                clearStorage();
                
                // ✅ Thêm delay nhỏ để đảm bảo storage được clear
                setTimeout(() => {
                    window.location.href = '/login';
                }, 100);
                
                return Promise.reject(error);
            }
        }

        // Handle network errors with retry
        if (!error.response && originalRequest.metadata && originalRequest.metadata.retryCount < MAX_RETRY_COUNT) {
            originalRequest.metadata.retryCount += 1;
            
            // Exponential backoff
            const delay = Math.pow(2, originalRequest.metadata.retryCount) * 1000;
            console.log(`🔄 Retrying request (${originalRequest.metadata.retryCount}/${MAX_RETRY_COUNT}) after ${delay}ms`);
            
            await new Promise<void>(resolve => setTimeout(resolve, delay));
            
            return apiClient(originalRequest);
        }

        return Promise.reject(error);
    }
);

// ✅ Generic API methods
export const api = {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.get<T>(url, config),
    
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.post<T>(url, data, config),
    
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.put<T>(url, data, config),
    
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.delete<T>(url, config),
    
    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.patch<T>(url, data, config),
};

export default apiClient;
