// api/index.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
    getToken, 
    getSessionId, 
    clearStorage,
    setToken,
    setRefreshToken 
} from '../helpers/storage';

// Base URL configuration
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
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
        } catch (error) {
            console.error('Error adding headers:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// **Response Interceptor với Auto Refresh Token**
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - Auto refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Attempt to refresh token
                const refreshResponse = await refreshTokenRequest();
                
                if (refreshResponse.success && refreshResponse.data) {
                    // Update tokens
                    setToken(refreshResponse.data.accessToken);
                    if (refreshResponse.data.refreshToken) {
                        setRefreshToken(refreshResponse.data.refreshToken);
                    }
                    
                    // Retry original request with new token
                    originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.data.accessToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }
            
            // If refresh fails, clear storage and redirect
            clearStorage();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Handle network errors with retry
        if (!error.response && originalRequest.metadata?.retryCount < MAX_RETRY_COUNT) {
            originalRequest.metadata.retryCount += 1;
            
            // Exponential backoff
            const delay = Math.pow(2, originalRequest.metadata.retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return apiClient(originalRequest);
        }

        return Promise.reject(error);
    }
);

// Refresh token function
const refreshTokenRequest = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    
    return axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken
    });
};

// Generic API methods
export const api = {
    get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.get(url, config),
    
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.post(url, data, config),
    
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.put(url, data, config),
    
    delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.delete(url, config),
    
    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        apiClient.patch(url, data, config),
};

export default apiClient;
