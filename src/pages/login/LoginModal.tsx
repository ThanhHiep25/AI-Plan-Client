import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../../services/authApi';
import { useUser } from '../../context/useUser';

interface LoginModalProps {
    onClose: () => void;
    onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSwitchToRegister }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
     const { setUserAndToken } = useUser();

    const numberOfLeds = 80;
    const leds = Array.from({ length: numberOfLeds });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);
        const res = await login(username, password);
        setLoading(false);
        if (res.success) {
            setUserAndToken(res.data?.user || null, res.data?.accessToken || "");
            setErrorMsg(null);
            onClose();
        } else {
            setErrorMsg(res.message || "Đăng nhập thất bại");
        }
    };

    // Google login giữ nguyên (giả sử đã cấu hình backend)
    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.BE_AUTH_URL || "http://localhost:3000/api/auth"}/google`;
    };

    return (
        <div
            className="fixed h-screen inset-0 bg-black/70 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            {/* Modal content */}
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <img src="/bot.png" alt=""
                    className="w-12 h-12 mb-10 mx-auto rounded-full" />

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
                            Tên đăng nhập hoặc Email
                        </label>
                        <input
                            type="email"
                            id="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="appearance-none border-b-2 border-gray-300 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
                            placeholder="Nhập tên đăng nhập hoặc email"
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                            Mật khẩu
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="appearance-none border-b-2 border-gray-300 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none pr-10"
                            placeholder="Nhập mật khẩu"
                            disabled={loading}
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
                    {errorMsg && (
                        <div className="text-red-600 text-sm text-center">{errorMsg}</div>
                    )}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center text-gray-700 text-sm">
                            <input type="checkbox" className="mr-2 leading-tight" />
                            Nhớ mật khẩu
                        </label>
                        <a href="#" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                            Quên mật khẩu?
                        </a>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-60"
                    >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>

                <div className="">
                    <div className="my-4 mx-10 relative h-2 overflow-hidden rounded-full bg-gray-800">
                        {leds.map((_, index) => (
                            <div
                                key={index}
                                className="absolute top-0 bottom-0 w-1 h-full bg-blue-500 rounded-full led-animation"
                                style={{
                                    animationDelay: `${index * 0.05}s`,
                                    left: `${(index / (numberOfLeds - 1)) * 100}%`,
                                }}
                            ></div>
                        ))}
                    </div>
                    <p className="text-center text-gray-600 text-sm">
                        Hoặc đăng nhập bằng
                    </p>

                    <div className="flex justify-center space-x-4 mt-2">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="flex items-center hover:bg-neutral-500/20 text-gray-500 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            <img src="/google.png" alt="Google" className="w-6 h-6 mr-2" /> Google
                        </button>
                    </div>
                </div>

                <div className="flex justify-center space-x-4"></div>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Chưa có tài khoản?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="font-bold text-blue-500 hover:text-blue-800"
                    >
                        Đăng ký ngay
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginModal;