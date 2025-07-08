import { LogOut, Settings, User, Menu, Home, Search, Inbox, Map, History, SquareStack, UserRoundPlus } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import LoginModal from "../../pages/login/LoginModal";
import RegisterModal from "../../pages/register/RegisterModal";
import { useNavigate } from "react-router-dom";
import SearchModal from "../search/Search";
import { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";

// Danh sách các tab
const TABS = [
    { key: "search", label: "Search", icon: <Search className="w-4 h-4 inline-block mr-2" /> },
    { key: "home", label: "Home", icon: <Home className="w-4 h-4 inline-block mr-2" /> },
    { key: "inbox", label: "Inbox", icon: <Inbox className="w-4 h-4 inline-block mr-2" /> },

];

const TABS_PRIVATE = [
    { key: "product-roadmap", label: "Product Roadmap", icon: <Map className="w-4 h-4 inline-block mr-2" /> },
    { key: "his-ai-plan", label: "History AI Plan", icon: <History className="w-4 h-4 inline-block mr-2" /> },
]

const TABS_TEAMSPACES = [
    { key: "stack", label: "Stack", icon: <SquareStack className="w-4 h-4 inline-block mr-2" /> },
];

interface MenuBarProps {
    onTabChange?: (tab: string) => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ onTabChange }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("ai-plan");
    const navigate = useNavigate();


    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
        if (onTabChange) onTabChange(tab);
        setIsSidebarOpen(false);
        // Điều hướng route
        if (tab === "search") {
            setShowSearchModal(true);
            return;
        }
        if (tab === "home") navigate("/");
        if (tab === "inbox") navigate("/inbox");
        if (tab === "product-roadmap") navigate("/product-roadmap");
        if (tab === "his-ai-plan") navigate("/his-ai-plan");
        if (tab === "stack") navigate("/stack");
    };


    const sidebarRef = useRef<HTMLDivElement>(null);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Mở Login Modal
    const handleLoginClick = () => {
        setShowLoginModal(true);
        setIsSidebarOpen(false);
    };

    // Mở Register Modal
    const handleRegisterClick = () => {
        setShowRegisterModal(true);
        setIsSidebarOpen(false);
    };

    // Đóng Login Modal
    const closeLoginModal = () => {
        setShowLoginModal(false);
    };

    // Đóng Register Modal
    const closeRegisterModal = () => {
        setShowRegisterModal(false);
    };

    // Chuyển từ Login sang Register Modal
    const switchToRegister = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    // Chuyển từ Register sang Login Modal
    const switchToLogin = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    const handleLogoutClick = () => {
        setIsLoggedIn(false);
        setIsSidebarOpen(false);
    };

    // useEffect để lắng nghe các click bên ngoài sidebar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setIsSidebarOpen(false);
            }
        };

        if (isSidebarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSidebarOpen]);

    return (
        <div className="md:fixed sticky left-0 z-50 ">
            {/* Nút Hamburger để mở sidebar, cố định ở góc trên bên trái */}
            <button
                onClick={toggleSidebar}
                className={`fixed ${isSidebarOpen ? 'top-16 left-60 transform transition-transform rounded-full duration-300 ease-in-out' : 'top-16 left-4 rounded-md'}  z-50 p-2 bg-neutral-500 hover:bg-blue-600 text-white md:hidden`}
                aria-label="Mở menu"
            >
                {isSidebarOpen ? <ChevronDoubleLeftIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Sidebar menu */}
            <div
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full border-r-[1px] border-gray-200/20 p-2  w-64 backdrop-blur-2xl shadow-lg z-40 transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 md:static md:w-64 md:min-h-screen md:flex  md:flex-col md:shadow-none
                `}
            >
                {/* Logo và tên ứng dụng */}
                <div className="flex items-center gap-1 p-4 border-b border-gray-200 md:border-none">
                    <img src="/bot.png" alt="Logo" className="w-10 h-10 rounded-full" />
                    <span className="text-2xl font-bold">|</span>
                    <span className="text-2xl font-bold">AI Plan</span>
                </div>

                {/* Tabs */}
                <div className="flex flex-col space-y-2 mt-5">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabClick(tab.key)}
                            className={`px-4 py-2 font-semibold text-left w-full text-sm transition-colors rounded-sm ${activeTab === tab.key
                                    ? "bg-gray-500/30 text-white"
                                    : " text-gray-600 hover:bg-gray-500/30"
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tabs riêng tư */}
                <div className="flex flex-col space-y-2 mt-10">
                    <label htmlFor="toggle" className="flex items-center cursor-pointer px-4 text-sm">Private</label>
                    {TABS_PRIVATE.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabClick(tab.key)}
                            className={`px-4 py-2 font-semibold text-left w-full text-sm transition-colors rounded-sm ${activeTab === tab.key
                                    ? "bg-gray-500/30 text-white"
                                    : " text-gray-600 hover:bg-gray-500/30"
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tabs teamspaces */}
                <div className="flex flex-col space-y-2 mt-10">
                    <label htmlFor="toggle" className="flex items-center cursor-pointer px-4 text-sm">Teamspaces</label>
                    {TABS_TEAMSPACES.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabClick(tab.key)}
                            className={`px-4 py-2 font-semibold text-left w-full text-sm transition-colors rounded-sm ${activeTab === tab.key
                                    ? "bg-gray-500/30 text-white"
                                    : " text-gray-600 hover:bg-gray-500/30"
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col mt-10 space-y-2">
                    <button className="flex items-center gap-2
                     px-4 py-2 font-semibold text-left w-[150px]
                     text-gray-600 bg-gray-500/30
                     rounded-2xl
                     text-[12px]
                     hover:text-white transition-colors"><UserRoundPlus className="w-4 h-4" />Invite members</button>
                </div>


                {/* Nội dung menu chính */}
                <div className="flex-1 flex flex-col p-4 space-y-4">
                    {isLoggedIn ? (
                        <div className="flex flex-col items-start gap-2 w-full">
                            <div className="flex items-center gap-2">
                                <User className="w-8 h-8 rounded-full border" />
                                <span className="text-lg font-semibold">JoeSon</span>
                            </div>
                            <ul className="w-full space-y-2 mt-4">
                                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center text-base">
                                    <User className="w-4 h-4 inline-block mr-2" />Thông tin cá nhân
                                </li>
                                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center text-base">
                                    <Settings className="w-4 h-4 inline-block mr-2" />Cài đặt
                                </li>
                                <li
                                    onClick={handleLogoutClick}
                                    className="hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center text-base"
                                >
                                    <LogOut className="w-4 h-4 inline-block mr-2" /> Đăng xuất
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-2 w-full">
                            <button
                                onClick={handleLoginClick}
                                className="px-4 py-2 rounded-md bg-blue-600/50 text-white font-semibold hover:bg-blue-700 transition-colors w-full text-left flex items-center justify-center"
                            >
                                <User className="w-4 h-4 mr-2" /> Đăng nhập
                            </button>
                            <button
                                onClick={handleRegisterClick}
                                className="px-4 py-2 rounded-md bg-gray-200/50 text-gray-800 font-semibold hover:bg-gray-300 transition-colors w-full text-left flex items-center justify-center"
                            >
                                Đăng ký
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay khi sidebar mở trên mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/10 bg-opacity-50 z-30 md:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Render Login Modal nếu showLoginModal là true */}
            {showLoginModal && (
                <LoginModal onClose={closeLoginModal} onSwitchToRegister={switchToRegister} />
            )}

            {/* Render Register Modal nếu showRegisterModal là true */}
            {showRegisterModal && (
                <RegisterModal onClose={closeRegisterModal} onSwitchToLogin={switchToLogin} />
            )}

            {/* Render Search Modal nếu showSearchModal là true */}
            {showSearchModal && (
                <SearchModal onClose={() => setShowSearchModal(false)} />
            )}
        </div>
    );
};

export default MenuBar;