import { Search } from "lucide-react";
import React from "react";

interface SearchModalProps {
    onClose: () => void;
}

const DataSearchDemo = [
    { id: 1, title: "Báo cáo tài chính Q2", date : "2023-06-30", description: "Báo cáo tài chính quý 2 năm 2023" },
    { id: 2, title: "Lịch họp dự án", date: "2023-07-15", description: "Lịch họp dự án với khách hàng" },
    { id: 3, title: "Kế hoạch đào tạo nhân sự", date: "2023-08-01", description: "Kế hoạch đào tạo nhân sự cho quý 3" },
    { id: 4, title: "Dự báo doanh thu năm nay", date: "2023-09-10", description: "Dự báo doanh thu cho năm 2023" },
    { id: 5, title: "Chiến lược marketing tháng tới", date: "2023-10-05", description: "Chiến lược marketing cho tháng 11" },
];

const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => (
    <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50"
        onClick={onClose}
    >
        <div
            className=" bg-neutral-800 rounded-2xl p-6 w-full max-w-md flex items-center gap-4"
            onClick={e => e.stopPropagation()}
        >
            <Search className="w-6 h-6 text-gray-400" />
            <input
                className="w-full  text-gray-200  focus:outline-none"
                placeholder="Search for documents, plans, or tasks..."
                autoFocus
            />
        </div>

         <div className="flex justify-center">
            <div className="mt-4 md:w-[600px] w-[400px] max-h-[400px] overflow-y-auto 
                            scrollbar scrollbar-thumb-gray-700 scrollbar-track-transparent 
                            hover:scrollbar-thumb-gray-600 scrollbar-w-2"> {/* Đã thay đổi ở đây */}
                {DataSearchDemo.map(item => (
                    <div
                        key={item.id}
                        className="p-4 border-b text-sm border-neutral-800 hover:bg-neutral-900 cursor-pointer"
                    >
                        <h3 className=" font-semibold text-gray-200">{item.title}</h3>
                        <p className="text-xs text-gray-400">{item.description}</p>
                        <span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default SearchModal;