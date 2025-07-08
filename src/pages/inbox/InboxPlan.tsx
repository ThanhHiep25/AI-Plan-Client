import { Ellipsis, Plus, Search, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DataInboxDemo = [
    {
        id: 1,
        name: "Nguyễn Văn A",
        email: "s2lGz@example.com",
        phone: "0123456789",
        company: "ABC Company",
        jobTitle: "Software Engineer",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        date: "2023-10-01",
    },
    {
        id: 2,
        name: "Trần Thị B",
        email: "s2lGz@example.com",
        phone: "0987654321",
        company: "XYZ Company",
        jobTitle: "Product Manager",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
        message: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        date: "2023-10-02",
    },
    {
        id: 3,
        name: "Lê Văn C",
        email: "s2lGz@example.com",
        phone: "0361234567",
        company: "LMN Company",
        jobTitle: "UI/UX Designer",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
        message: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        date: "2023-10-03",
    },
    {
        id: 4,
        name: "Phạm Thị D",
        email: "s2lGz@example.com",
        phone: "0987654321",
        company: "PQR Company",
        jobTitle: "Data Analyst",
        avatar: "https://randomuser.me/api/portraits/women/4.jpg",
        message: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        date: "2023-10-04",
    },
    {
        id: 5,
        name: "Nguyễn Văn E",
        email: "s2lGz@example.com",
        phone: "0123456789",
        company: "STU Company",
        jobTitle: "Software Engineer",
        avatar: "https://randomuser.me/api/portraits/men/5.jpg",
        message: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.",
        date: "2023-10-05",
    },
];

const InboxPlan: React.FC = () => {
    const [isModalAdd, setIsModalAdd] = useState(false);
    const [optionModalId, setOptionModalId] = useState<number | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const optionModalRef = useRef<HTMLDivElement>(null);


    const handleAddContact = () => {
        setIsModalAdd(true);
    };

    // Đóng modal khi click ra ngoài modal-content
    useEffect(() => {
        if (!isModalAdd) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(event.target as Node)
            ) {
                setIsModalAdd(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isModalAdd]);

    // Đóng modal options khi click ra ngoài
    useEffect(() => {
        if (optionModalId === null) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                optionModalRef.current &&
                !optionModalRef.current.contains(event.target as Node)
            ) {
                setOptionModalId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [optionModalId]);

    return (
        <div className="min-h-[95vh] w-full roboto p-8 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mt-20">
                <h1 className="text-2xl text-gray-500 font-bold">Inbox Plan</h1>
                <div className="flex items-center gap-2 text-gray-500">
                    <button
                        onClick={handleAddContact}
                        className="px-2 py-2 flex items-center gap-2 hover:border-b hover:bg-neutral-500/20
                        hover:rounded-t-md border-gray-300 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add contact
                    </button>
                    <button className="px-2 py-2 flex items-center gap-2 hover:border-b hover:bg-neutral-500/20
                        hover:rounded-t-md border-gray-300 transition-colors">
                        <Trash className="w-4 h-4" /> Delete all
                    </button>
                </div>
            </div>

            {/* Modal Add Contact */}
            {isModalAdd && (
                <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex flex-col items-center justify-center z-50">
                    <div
                        ref={modalRef}
                        className="modal-content bg-neutral-800 rounded-2xl p-6 w-full max-w-md flex items-center gap-4"
                    >
                        <Search className="w-6 h-6 text-gray-400" />
                        <input
                            className="w-full text-gray-200 focus:outline-none"
                            placeholder="Search for documents, plans, or tasks..."
                            autoFocus
                        />
                    </div>
                    <div className="bg-neutral-800 rounded-2xl mt-4 w-full max-w-md overflow-y-auto max-h-[60vh]">
                        {DataInboxDemo.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 border-b border-gray-700">
                                <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-100">{item.name}</h2>
                                    <p className="text-sm text-gray-400">{item.email}</p>
                                    <p className="text-sm text-gray-400">{item.jobTitle}</p>
                                </div>
                                <button className="ml-auto px-2 py-2 flex items-center gap-2 hover:border-b hover:bg-neutral-500/20
                                    hover:rounded-t-md border-gray-300 transition-colors text-gray-200">
                                    <Plus className="w-4 h-4" /> Add to plan
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* render map data */}
            <div className="w-full max-w-2xl mt-8">
                {DataInboxDemo.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border-b border-gray-200/20 relative">
                        <div className="w-[90%] flex items-center gap-4">
                            <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full" />
                            <div >
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-semibold">{item.name}</h2>
                                    <span className="text-xs text-gray-500 ml-auto">{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                                <span className="text-xs text-gray-500">({item.jobTitle})</span>
                                <p className="text-xs text-gray-500 line-clamp-1">{item.message}</p>
                            </div>
                        </div>
                        <div className="w-[20%] flex items-center justify-end">
                            <button
                                className="px-1 py-1 flex items-start gap-2 hover:bg-neutral-500/20
                            hover:rounded-md"
                                onClick={() => setOptionModalId(item.id)}
                            >
                                <Ellipsis className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Modal options */}
                        {optionModalId === item.id && (
                            <div
                                ref={optionModalRef}
                                className="absolute right-8 top-10 bg-black/20 backdrop-blur-sm rounded shadow-lg z-50 min-w-[140px] py-2"
                            >
                                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-500/20">Thêm vào kế hoạch</button>
                                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-500/20">Đánh dấu đã đọc</button>
                                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-500/20">Trang cá nhân</button>
                                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-500/20">Chỉnh sửa</button>
                                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-500/20">Chia sẻ</button>
                                <button className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-neutral-500/20">Xóa</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InboxPlan;