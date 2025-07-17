import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock } from 'lucide-react';
import { authApi } from '../../utils/api/authApi';
import type { LoginResponse } from '../../utils/api/authApi';
import { useUser } from '../../context/useUser';

interface LoginModalProps {
    onClose: () => void;
    onSwitchToRegister: () => void;
    onLoginSuccess?: () => void;
}

interface FormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ 
    onClose, 
    onSwitchToRegister, 
    onLoginSuccess 
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { setUserAndToken } = useUser();

    // Form state
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        rememberMe: false
    });

    const [errors, setErrors] = useState<FormErrors>({});

    // ✅ Validation functions
    const validateEmail = (email: string): string | undefined => {
        if (!email.trim()) return 'Email là bắt buộc';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Email không hợp lệ';
        return undefined;
    };

    const validatePassword = (password: string): string | undefined => {
        if (!password) return 'Mật khẩu là bắt buộc';
        if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
        return undefined;
    };

    // ✅ Handle input changes
    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear error when user starts typing
        if (typeof value === 'string' && errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
        
        // Clear general error
        if (errors.general) {
            setErrors(prev => ({ ...prev, general: undefined }));
        }
    };

    // ✅ Validate form
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        newErrors.email = validateEmail(formData.email);
        newErrors.password = validatePassword(formData.password);

        setErrors(newErrors);

        // Return true if no errors
        return !Object.values(newErrors).some(error => error !== undefined);
    };

    // ✅ Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setErrors({});
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            console.log('🚀 Attempting to login user...');
            
            const result: LoginResponse = await authApi.login(
                formData.email.trim(),
                formData.password
            );

            if (result.success && result.accessToken) {
                console.log('✅ Login successful!');
                
                // Set user and token in context
                // Note: Backend không trả user trong login response
                // User info sẽ được fetch sau hoặc decode từ token
                setUserAndToken(null, result.accessToken);
                
                // Call success callback
                onLoginSuccess?.();
                
                // Close modal
                onClose();
                
            } else {
                console.error('❌ Login failed:', result.message);
                setErrors({ general: result.message || 'Đăng nhập thất bại' });
            }
        } catch (error: any) {
            console.error('❌ Login error:', error);
            
            // Handle specific error cases
            if (error.response?.status === 401) {
                setErrors({ general: 'Email hoặc mật khẩu không đúng' });
            } else if (error.response?.status === 403) {
                setErrors({ general: 'Tài khoản đã bị khóa' });
            } else if (error.response?.status === 429) {
                setErrors({ general: 'Quá nhiều yêu cầu. Vui lòng thử lại sau' });
            } else if (error.response?.status === 400) {
                const errorMessage = error.response?.data?.message || 'Thông tin không hợp lệ';
                setErrors({ general: errorMessage });
            } else {
                setErrors({ general: 'Lỗi kết nối. Vui lòng thử lại' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ Handle Google login
    const handleGoogleLogin = () => {
        try {
            const authUrl = `${import.meta.env.VITE_BE_AUTH_URL || "http://localhost:3000/api/auth"}/google`;
            console.log('🔗 Redirecting to Google OAuth:', authUrl);
            window.location.href = authUrl;
        } catch (error) {
            console.error('❌ Google login error:', error);
            setErrors({ general: 'Không thể kết nối với Google. Vui lòng thử lại' });
        }
    };

    return (
        <div
            className="fixed h-screen inset-0 bg-black/70 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative animate-fade-in-up max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <img 
                        src="/bot.png" 
                        alt="Logo"
                        className="w-12 h-12 mb-4 mx-auto rounded-full" 
                    />
                    <h2 className="text-2xl font-bold text-gray-800">Đăng nhập</h2>
                    <p className="text-gray-600 text-sm mt-2">Chào mừng bạn trở lại!</p>
                </div>

                {/* General Error */}
                {errors.general && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="text-red-700 text-sm">{errors.general}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div className="relative">
                        <label htmlFor="login-email" className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                id="login-email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={`appearance-none border-b-2 w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none transition-colors ${
                                    errors.email 
                                        ? 'border-red-500 focus:border-red-500' 
                                        : 'border-gray-300 focus:border-blue-500'
                                }`}
                                placeholder="Nhập email của bạn"
                                disabled={isLoading}
                                autoComplete="email"
                                autoFocus
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <label htmlFor="login-password" className="block text-gray-700 text-sm font-bold mb-2">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type={showPassword ? "text" : "password"}
                                id="login-password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={`appearance-none border-b-2 w-full py-2 pl-10 pr-12 text-gray-700 leading-tight focus:outline-none transition-colors ${
                                    errors.password 
                                        ? 'border-red-500 focus:border-red-500' 
                                        : 'border-gray-300 focus:border-blue-500'
                                }`}
                                placeholder="Nhập mật khẩu"
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                tabIndex={-1}
                                onClick={() => setShowPassword((v) => !v)}
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center text-gray-700 text-sm">
                            <input
                                type="checkbox"
                                checked={formData.rememberMe}
                                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            Ghi nhớ đăng nhập
                        </label>
                        <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700 text-sm font-semibold transition-colors"
                            onClick={() => {
                                // TODO: Implement forgot password
                                console.log('Forgot password clicked');
                            }}
                            disabled={isLoading}
                        >
                            Quên mật khẩu?
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang đăng nhập...
                            </>
                        ) : (
                            'Đăng nhập'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-gray-500 text-sm">hoặc</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Google Login */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Đăng nhập với Google
                </button>

                {/* Switch to Register */}
                <div className="text-center mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">
                        Chưa có tài khoản?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                            disabled={isLoading}
                        >
                            Đăng ký ngay
                        </button>
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default LoginModal;
