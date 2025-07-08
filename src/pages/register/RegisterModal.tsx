import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterModalProps {
    onClose: () => void;
    onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSwitchToLogin }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <div
            className="fixed h-screen inset-0 bg-black/70 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <img src="/bot.png" alt=""
                    className="w-12 h-12 mb-10 mx-auto rounded-full" />
                <form className="space-y-4">
                    <div>
                        <label htmlFor="reg-email" className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="reg-email"
                            className="appearance-none border-b-2 border-gray-300 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
                            placeholder="Nhập email của bạn"
                        />
                    </div>
                    <div>
                        <label htmlFor="reg-username" className="block text-gray-700 text-sm font-bold mb-2">
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            id="reg-username"
                            className="appearance-none border-b-2 border-gray-300 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
                            placeholder="Tạo tên đăng nhập"
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="reg-password" className="block text-gray-700 text-sm font-bold mb-2">
                            Mật khẩu
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="reg-password"
                            className="appearance-none border-b-2 border-gray-300 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none pr-10"
                            placeholder="Tạo mật khẩu"
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-9 text-gray-400"
                            tabIndex={-1}
                            onClick={() => setShowPassword((v) => !v)}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="relative">
                        <label htmlFor="confirm-password" className="block text-gray-700 text-sm font-bold mb-2">
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type={showConfirm ? "text" : "password"}
                            id="confirm-password"
                            className="appearance-none border-b-2 border-gray-300 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none pr-10"
                            placeholder="Xác nhận mật khẩu"
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-9 text-gray-400"
                            tabIndex={-1}
                            onClick={() => setShowConfirm((v) => !v)}
                        >
                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    >
                        Đăng ký
                    </button>
                </form>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Đã có tài khoản?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="font-bold text-blue-500 hover:text-blue-800"
                    >
                        Đăng nhập
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterModal;