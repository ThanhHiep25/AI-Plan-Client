import { useState } from "react";
import { ChevronLeft, ChevronRight, Handshake, FileText } from "lucide-react";

const DataDemo = [
    { id: 1, icon: <FileText className="w-6 h-6 mb-2" />, title: "Báo cáo tài chính Q2" },
    { id: 2, icon: <Handshake className="w-6 h-6 mb-2 text-yellow-400" />, title: "Schedule kick-off meeting" },
    { id: 3, icon: <FileText className="w-6 h-6 mb-2" />, title: "—— Dịch vụ - Service Spa" },
    { id: 4, icon: <FileText className="w-6 h-6 mb-2" />, title: "New page" },
    { id: 5, icon: <FileText className="w-6 h-6 mb-2" />, title: "Kế hoạch đào tạo nhân sự" },
];

const VISIBLE_COUNT = 3;

const RecentlyVisited: React.FC = () => {
    const [startIdx, setStartIdx] = useState(0);

    const handlePrev = () => {
        setStartIdx((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setStartIdx((prev) => Math.min(prev + 1, DataDemo.length - VISIBLE_COUNT));
    };

    const canPrev = startIdx > 0;
    const canNext = startIdx < DataDemo.length - VISIBLE_COUNT;


    return (
        <div className="max-w-4xl w-full mx-auto mt-10 group relative">
            {/* Recently visited */}
            <div className="text-base font-semibold mb-3 text-gray-200 text-left flex items-center gap-2">
                <span className="text-xs"><FileText className="inline w-4 h-4" /></span>
                Recently visited
            </div>
            <div className="flex items-center relative">
                {/* Mờ bên trái */}
                <div className="pointer-events-none absolute left-0 top-0 h-full w-10 z-20
                bg-gradient-to-r from-neutral-900/80 to-transparent"
                  
                />
                {/* Nút trái */}
                <button
                    onClick={handlePrev}
                    disabled={!canPrev}
                    className={`absolute left-0 top-[60%] -translate-y-1/2 z-30 bg-neutral-900 shadow rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100 ${!canPrev ? "pointer-events-none opacity-0" : ""}`}
                    aria-label="Trước"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-200" />
                </button>

                {/* Danh sách task */}
                <div className="flex overflow-hidden md:w-full w-[500px] px-10">
                    <div
                        className="flex transition-transform duration-300"
                        style={{
                            transform: `translateX(-${startIdx * (100 / VISIBLE_COUNT)}%)`,
                            width: `${(DataDemo.length / VISIBLE_COUNT) * 100}%`,
                        }}
                    >
                        {DataDemo.map((item) => (
                            <div
                                key={item.id}
                                className="w-full flex justify-center items-center px-2"
                            >
                                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 w-44 h-32 flex flex-col items-center justify-center text-gray-100 font-semibold shadow hover:shadow-lg transition-all duration-200 cursor-pointer group/card relative overflow-hidden">
                                    {item.icon}
                                    <span className="truncate w-full text-center">{item.title}</span>
                                    {/* Hiệu ứng overlay khi hover */}
                                    <span className="absolute inset-0 bg-white/5 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-xl pointer-events-none"></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nút phải */}
                <button
                    onClick={handleNext}
                    disabled={!canNext}
                    className={`absolute right-0 top-[60%] -translate-y-1/2 z-30 bg-neutral-900 shadow rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100 ${!canNext ? "pointer-events-none opacity-30" : ""}`}
                    aria-label="Sau"
                >
                    <ChevronRight className="w-6 h-6 text-gray-200" />
                </button>
                {/* Mờ bên phải */}
                <div className="pointer-events-none absolute right-0 top-0 h-full w-10 z-20
                bg-gradient-to-l from-neutral-900/80 to-transparent"
                
                   
                />
            </div>
        </div>
    );

};

export default RecentlyVisited;
