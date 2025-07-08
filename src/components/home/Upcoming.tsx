import { FileText } from "lucide-react";

const UpComing: React.FC = () => {
    return (

        <div className="mt-10">
            <div className="text-base font-semibold mb-3 text-gray-200 text-left flex items-center gap-2">
                <span className="text-xs">
                    <FileText className="inline w-4 h-4" />
                </span>
                Upcoming events
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px] shadow">
                <div className="mb-4">
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mx-auto text-gray-400">
                        <rect x="3" y="5" width="18" height="16" rx="2" fill="currentColor" fillOpacity="0.08" />
                        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="7" y="2" width="2" height="4" rx="1" fill="currentColor" className="text-gray-500" />
                        <rect x="15" y="2" width="2" height="4" rx="1" fill="currentColor" className="text-gray-500" />
                        <rect x="8" y="13" width="8" height="2" rx="1" fill="currentColor" className="text-gray-600" />
                    </svg>
                </div>
                <div className="text-gray-400 mb-2 text-center">
                    No upcoming events in the next 3 days
                </div>
                <button className="text-blue-400 hover:underline text-sm font-medium mt-2">
                    + New event
                </button>
            </div>
        </div>
    )
};
export default UpComing;