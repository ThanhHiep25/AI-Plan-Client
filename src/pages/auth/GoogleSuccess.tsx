// src/pages/auth/GoogleSuccess.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/useUser";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import SuccessIcon from "../../components/ui/SuccessIcon";
import ErrorIcon from "../../components/ui/ErrorIcon";

interface GoogleSuccessProps {}

const GoogleSuccess: React.FC<GoogleSuccessProps> = () => {
    const [showModal, setShowModal] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(3);
    const [userData, setUserData] = useState<any>(null);

    const navigate = useNavigate();
    const { setUserAndToken } = useUser();

    useEffect(() => {
        const processGoogleAuth = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const accessToken = params.get("accessToken");
                const expiresIn = params.get("expiresIn");

                console.log("Processing Google auth...", {
                    hasAccessToken: !!accessToken,
                    expiresIn,
                    fullURL: window.location.href
                });

                // ✅ Chỉ cần kiểm tra accessToken
                if (!accessToken) {
                    throw new Error("Thiếu access token từ Google. Vui lòng thử lại.");
                }

                // ✅ Decode JWT token để lấy thông tin user
                let parsedUser;
                try {
                    // JWT có format: header.payload.signature
                    const tokenParts = accessToken.split('.');
                    if (tokenParts.length !== 3) {
                        throw new Error("Invalid JWT token format");
                    }
                    
                    // Decode payload (base64)
                    const payload = JSON.parse(atob(tokenParts[1]));
                    console.log("JWT payload:", payload);
                    
                    // ✅ Tạo user object từ JWT payload
                    parsedUser = {
                        id: payload.userId,
                        email: payload.email,
                        name: payload.email.split('@')[0], // Lấy tên từ email làm fallback
                        role: payload.role || 'user',
                        authProvider: 'google',
                        // Thêm các field khác nếu có trong JWT
                        iss: payload.iss,
                        aud: payload.aud,
                        exp: payload.exp,
                        iat: payload.iat
                    };
                    
                } catch (jwtError) {
                    console.error("JWT decode error:", jwtError);
                    throw new Error("Không thể xử lý thông tin người dùng từ token.");
                }

                setUserData(parsedUser);

                // ✅ Validate user data từ JWT
                if (!parsedUser.id || !parsedUser.email) {
                    throw new Error("Thông tin người dùng trong token không hợp lệ.");
                }

                // ✅ Set user và token vào context
                setUserAndToken(parsedUser, accessToken);

                // ✅ Verify localStorage
                setTimeout(() => {
                    const savedToken = localStorage.getItem('accessToken');
                    const savedUser = localStorage.getItem('user');
                    console.log('LocalStorage verification:', {
                        tokenSaved: !!savedToken,
                        userSaved: !!savedUser,
                        tokenMatch: savedToken === accessToken
                    });
                }, 100);

                console.log('Google login successful:', {
                    userId: parsedUser.id,
                    email: parsedUser.email,
                    name: parsedUser.name,
                    role: parsedUser.role,
                    expiresIn,
                });

                setIsLoading(false);
                startCountdown();

            } catch (err) {
                console.error('Google auth processing error:', err);
                setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xử lý đăng nhập');
                setIsLoading(false);
            }
        };

        processGoogleAuth();
    }, [setUserAndToken]);

    const startCountdown = () => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleRedirect();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleRedirect = () => {
        setShowModal(false);
        navigate("/", { replace: true }); // ✅ Redirect về home
    };

    const handleRetry = () => {
        setShowModal(false);
        navigate("/", { replace: true });
    };

    const handleClose = () => {
        setShowModal(false);
        navigate("/", { replace: true });
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all duration-300 scale-100">

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-4">
                        <LoadingSpinner size="large" />
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-800">Đang xử lý...</h2>
                            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
                            <p className="text-xs text-gray-400 mt-2">
                                Đang giải mã thông tin từ Google...
                            </p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="space-y-6">
                        <ErrorIcon className="w-16 h-16 mx-auto text-red-500" />
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-red-600">Đăng nhập thất bại!</h2>
                            <p className="text-gray-700 leading-relaxed">{error}</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleRetry}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Thử lại
                            </button>
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {!error && !isLoading && userData && (
                    <div className="space-y-6">
                        <SuccessIcon className="w-16 h-16 mx-auto text-green-500" />

                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-green-600">Đăng nhập thành công!</h2>
                            <p className="text-gray-700">Chào mừng bạn trở lại</p>
                        </div>

                        {/* User Info */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-center space-x-3">
                                <div className="text-center">
                                    <p className="font-semibold text-gray-800">{userData.name}</p>
                                    <p className="text-sm text-gray-600">{userData.email}</p>
                                    <p className="text-xs text-gray-500">Role: {userData.role}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Đăng nhập bằng Google</span>
                            </div>
                        </div>

                        {/* Countdown */}
                        <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm text-blue-700">
                                Tự động chuyển hướng sau <span className="font-bold text-blue-800">{countdown}</span> giây
                            </p>
                        </div>

                        <button
                            onClick={handleRedirect}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Vào ngay
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleSuccess;
