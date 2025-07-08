// src/pages/auth/GoogleError.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorIcon from "../../components/ui/ErrorIcon";

const GoogleError: React.FC = () => {
    const [error, setError] = useState<string>("");
    const [errorCode, setErrorCode] = useState<string>("");
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorMsg = params.get("message") || "Có lỗi xảy ra khi đăng nhập với Google";
        const code = params.get("error") || "unknown";

        setError(errorMsg);
        setErrorCode(code);
    }, []);

    const getErrorMessage = (code: string) => {
        switch (code) {
            case 'access_denied':
                return 'Bạn đã từ chối quyền truy cập. Vui lòng thử lại và cho phép ứng dụng truy cập.';
            case 'google-auth-failed':
                return 'Xác thực Google thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.';
            default:
                return error;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                <ErrorIcon className="w-16 h-16 mx-auto text-red-500 mb-6" />

                <div className="space-y-4 mb-6">
                    <h2 className="text-2xl font-bold text-red-600">Đăng nhập thất bại!</h2>
                    <p className="text-gray-700 leading-relaxed">
                        {getErrorMessage(errorCode)}
                    </p>

                    {errorCode && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">
                                Mã lỗi: <code className="font-mono bg-red-100 px-1 rounded">{errorCode}</code>
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => navigate("/login")}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Thử lại
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleError;
