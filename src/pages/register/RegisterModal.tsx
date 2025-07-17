import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { authApi } from '../../utils/api/authApi';
import type { RegisterResponse } from '../../utils/api/authApi';

interface RegisterModalProps {
    onClose: () => void;
    onSwitchToLogin: () => void;
    onRegisterSuccess?: () => void;
}

interface FormData {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    email?: string;
    name?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

interface PasswordStrength {
    score: number; // 0-4
    feedback: string[];
    isValid: boolean;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ 
    onClose, 
    onSwitchToLogin, 
    onRegisterSuccess 
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
        score: 0,
        feedback: [],
        isValid: false
    });

    // Form state
    const [formData, setFormData] = useState<FormData>({
        email: '',
        name: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<FormErrors>({});

    // ✅ Enhanced validation functions theo mẫu BE
    const validateEmail = (email: string): string | undefined => {
        if (!email.trim()) return 'Email là bắt buộc';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Email không hợp lệ';
        return undefined;
    };

    const validateName = (name: string): string | undefined => {
        if (!name.trim()) return 'Tên là bắt buộc';
        if (name.trim().length < 2) return 'Tên phải có ít nhất 2 ký tự';
        if (name.trim().length > 50) return 'Tên không được quá 50 ký tự';
        return undefined;
    };

    // ✅ Enhanced password validation theo mẫu BE
    const validatePassword = (password: string): string | undefined => {
        try {
            if (!password) return 'Mật khẩu là bắt buộc';
            
            if (password.length < 8) {
                return 'Mật khẩu phải có ít nhất 8 ký tự';
            }
            
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
            
            if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
                return 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt';
            }
            
            // Check common passwords
            const commonPasswords = [
                'password', '12345678', 'qwerty123', 'admin123', 
                'password123', '123456789', 'welcome123', 'abcd1234',
                'password1', 'qwerty12', '1234abcd', 'admin1234'
            ];
            
            if (commonPasswords.includes(password.toLowerCase())) {
                return 'Mật khẩu quá phổ biến, vui lòng chọn mật khẩu khác';
            }

            return undefined;
        } catch (error) {
            return 'Mật khẩu không hợp lệ';
        }
    };

    // ✅ Calculate password strength
    const calculatePasswordStrength = (password: string): PasswordStrength => {
        if (!password) {
            return { score: 0, feedback: [], isValid: false };
        }

        let score = 0;
        const feedback: string[] = [];

        // Length check
        if (password.length >= 8) {
            score += 1;
        } else {
            feedback.push('Cần ít nhất 8 ký tự');
        }

        // Character type checks
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);

        if (hasUpperCase) score += 1;
        else feedback.push('Cần chữ hoa (A-Z)');

        if (hasLowerCase) score += 1;
        else feedback.push('Cần chữ thường (a-z)');

        if (hasNumbers) score += 1;
        else feedback.push('Cần số (0-9)');

        if (hasSpecialChar) score += 1;
        else feedback.push('Cần ký tự đặc biệt (!@#$%^&*...)');

        // Bonus points for length
        if (password.length >= 12) score += 1;

        // Check common passwords
        const commonPasswords = [
            'password', '12345678', 'qwerty123', 'admin123', 
            'password123', '123456789', 'welcome123', 'abcd1234',
            'password1', 'qwerty12', '1234abcd', 'admin1234'
        ];
        
        if (commonPasswords.includes(password.toLowerCase())) {
            score = Math.max(0, score - 2);
            feedback.push('Mật khẩu quá phổ biến');
        }

        const isValid = score >= 4 && !commonPasswords.includes(password.toLowerCase());

        return { score: Math.min(score, 5), feedback, isValid };
    };

    const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
        if (!confirmPassword) return 'Xác nhận mật khẩu là bắt buộc';
        if (confirmPassword !== password) return 'Mật khẩu xác nhận không khớp';
        return undefined;
    };

    // ✅ Handle input changes with password strength calculation
    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Calculate password strength for password field
        if (field === 'password') {
            const strength = calculatePasswordStrength(value);
            setPasswordStrength(strength);
        }
        
        // Clear error when user starts typing
        if (errors[field]) {
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
        newErrors.name = validateName(formData.name);
        newErrors.password = validatePassword(formData.password);
        newErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword, formData.password);

        setErrors(newErrors);

        // Return true if no errors
        return !Object.values(newErrors).some(error => error !== undefined);
    };

    // ✅ Get password strength color and text
    const getPasswordStrengthInfo = (score: number) => {
        switch (score) {
            case 0:
            case 1:
                return { color: 'bg-red-500', text: 'Rất yếu', textColor: 'text-red-600' };
            case 2:
                return { color: 'bg-orange-500', text: 'Yếu', textColor: 'text-orange-600' };
            case 3:
                return { color: 'bg-yellow-500', text: 'Trung bình', textColor: 'text-yellow-600' };
            case 4:
                return { color: 'bg-blue-500', text: 'Mạnh', textColor: 'text-blue-600' };
            case 5:
                return { color: 'bg-green-500', text: 'Rất mạnh', textColor: 'text-green-600' };
            default:
                return { color: 'bg-gray-300', text: '', textColor: 'text-gray-500' };
        }
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

        // Additional check for password strength
        if (!passwordStrength.isValid) {
            setErrors({ password: 'Mật khẩu chưa đủ mạnh' });
            return;
        }

        setIsLoading(true);

        try {
            console.log('🚀 Attempting to register user...');
            
            const result: RegisterResponse = await authApi.register(
                formData.email.trim(),
                formData.password,
                formData.name.trim()
            );

            if (result.success) {
                console.log('✅ Registration successful!');
                setSuccess(true);
                
                // Show success message for 2 seconds then close
                setTimeout(() => {
                    onRegisterSuccess?.();
                    onClose();
                }, 2000);
                
            } else {
                console.error('❌ Registration failed:', result.message);
                setErrors({ general: result.message || 'Đăng ký thất bại' });
            }
        } catch (error: any) {
            console.error('❌ Registration error:', error);
            
            // Handle specific error cases
            if (error.response?.status === 409) {
                setErrors({ email: 'Email này đã được sử dụng' });
            } else if (error.response?.status === 400) {
                const errorMessage = error.response?.data?.message || 'Thông tin không hợp lệ';
                setErrors({ general: errorMessage });
            } else if (error.response?.status === 429) {
                setErrors({ general: 'Quá nhiều yêu cầu. Vui lòng thử lại sau' });
            } else {
                setErrors({ general: 'Lỗi kết nối. Vui lòng thử lại' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ Success screen
    if (success) {
        return (
            <div
                className="fixed h-screen inset-0 bg-black/70 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative animate-fade-in-up text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h2>
                    <p className="text-gray-600 mb-4">
                        Tài khoản của bạn đã được tạo thành công. Đang chuyển hướng...
                    </p>
                    <div className="flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                </div>
            </div>
        );
    }

    const strengthInfo = getPasswordStrengthInfo(passwordStrength.score);

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
                    <h2 className="text-2xl font-bold text-gray-800">Đăng ký tài khoản</h2>
                    <p className="text-gray-600 text-sm mt-2">Tạo tài khoản mới để bắt đầu</p>
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
                    <div>
                        <label htmlFor="reg-email" className="block text-gray-700 text-sm font-bold mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            id="reg-email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`appearance-none border-b-2 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none transition-colors ${
                                errors.email 
                                    ? 'border-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="Nhập email của bạn"
                            disabled={isLoading}
                            autoComplete="email"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label htmlFor="reg-name" className="block text-gray-700 text-sm font-bold mb-2">
                            Họ và tên *
                        </label>
                        <input
                            type="text"
                            id="reg-name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`appearance-none border-b-2 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none transition-colors ${
                                errors.name 
                                    ? 'border-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="Nhập họ và tên"
                            disabled={isLoading}
                            autoComplete="name"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Password with Strength Indicator */}
                    <div className="relative">
                        <label htmlFor="reg-password" className="block text-gray-700 text-sm font-bold mb-2">
                            Mật khẩu *
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="reg-password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={`appearance-none border-b-2 w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none transition-colors ${
                                errors.password 
                                    ? 'border-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="Tạo mật khẩu mạnh"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                            onClick={() => setShowPassword((v) => !v)}
                            disabled={isLoading}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    <span className={`text-xs font-medium ${strengthInfo.textColor}`}>
                                        Độ mạnh: {strengthInfo.text}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${strengthInfo.color}`}
                                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                    ></div>
                                </div>
                                {passwordStrength.feedback.length > 0 && (
                                    <div className="mt-1">
                                        {passwordStrength.feedback.map((feedback, index) => (
                                            <p key={index} className="text-xs text-gray-500 flex items-center gap-1">
                                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                                {feedback}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                        <label htmlFor="confirm-password" className="block text-gray-700 text-sm font-bold mb-2">
                            Xác nhận mật khẩu *
                        </label>
                        <input
                            type={showConfirm ? "text" : "password"}
                            id="confirm-password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={`appearance-none border-b-2 w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none transition-colors ${
                                errors.confirmPassword 
                                    ? 'border-red-500 focus:border-red-500' 
                                    : formData.confirmPassword && formData.confirmPassword === formData.password
                                    ? 'border-green-500 focus:border-green-500'
                                    : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="Nhập lại mật khẩu"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                            onClick={() => setShowConfirm((v) => !v)}
                            disabled={isLoading}
                        >
                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        
                        {/* Password Match Indicator */}
                        {formData.confirmPassword && formData.password && (
                            <div className="mt-1">
                                {formData.confirmPassword === formData.password ? (
                                    <p className="text-green-600 text-xs flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Mật khẩu khớp
                                    </p>
                                ) : (
                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Mật khẩu không khớp
                                    </p>
                                )}
                            </div>
                        )}

                        {errors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Yêu cầu mật khẩu:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li className="flex items-center gap-2">
                                <span className={formData.password.length >= 8 ? 'text-green-500' : 'text-gray-400'}>
                                    {formData.password.length >= 8 ? '✓' : '○'}
                                </span>
                                Ít nhất 8 ký tự
                            </li>
                            <li className="flex items-center gap-2">
                                <span className={/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                                    {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                                </span>
                                Chữ hoa (A-Z)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className={/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                                    {/[a-z]/.test(formData.password) ? '✓' : '○'}
                                </span>
                                Chữ thường (a-z)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className={/\d/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                                    {/\d/.test(formData.password) ? '✓' : '○'}
                                </span>
                                Số (0-9)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className={/[!@#$%^&*(),.?\":{}|<>]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                                    {/[!@#$%^&*(),.?\":{}|<>]/.test(formData.password) ? '✓' : '○'}
                                </span>
                                Ký tự đặc biệt (!@#$%^&*...)
                            </li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !passwordStrength.isValid}
                        className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang đăng ký...
                            </>
                        ) : (
                            'Đăng ký'
                        )}
                    </button>
                </form>

                {/* Switch to Login */}
                <div className="text-center mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">
                        Đã có tài khoản?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                            disabled={isLoading}
                        >
                            Đăng nhập ngay
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

export default RegisterModal;
