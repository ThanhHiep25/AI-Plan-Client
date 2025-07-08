import React, { useState, useEffect, useRef } from 'react';
import { ArrowRightIcon, CalendarDaysIcon, ListBulletIcon, DocumentTextIcon, ChartBarIcon, ExclamationTriangleIcon, ClockIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'; // Import PaperAirplaneIcon
import { generatePlan, savePlan } from '../../utils/api/generatePlanApi'; // Import API functions
import { AtSign, Link2Off, Paperclip } from 'lucide-react';
import RecentlyVisited from '../../components/home/RecentlyVisited';
import UpComing from '../../components/home/Upcoming';

// Định nghĩa kiểu dữ liệu cho từng phần của kế hoạch
interface Step {
  description: string;
  timeline: string;
  resources: string;
}

interface Risk {
  risk: string;
  mitigation: string;
}

interface PlanData {
  title: string;
  objective: string;
  steps: Step[];
  risks: Risk[];
}

// Helper function to parse timeline (improved to handle more cases)
const parseTimelineToDays = (timeline: string): number => {
  const lowerTimeline = timeline.toLowerCase();
  const match = lowerTimeline.match(/(\d+)\s*(day|week|month)s?/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'day': return value;
      case 'week': return value * 7;
      case 'month': return value * 30; // Approximation for month
      default: return 7; // Default to 1 week
    }
  }
  return 7; // Default if no clear unit found
};


const Home: React.FC = () => {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [promptInput, setPromptInput] = useState<string>('');
  const [submittedPrompt, setSubmittedPrompt] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'overview'>('list'); // Thêm 'overview'
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Thêm ref cho textarea
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // useEffect để điều chỉnh chiều cao của textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Đặt lại chiều cao về auto
      // Đặt chiều cao bằng scrollHeight để khớp với nội dung
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [promptInput]); // Chạy lại mỗi khi promptInput thay đổi


  const fetchPlan = async (prompt: string) => {
    setLoading(true);
    setError(null);
    setPlanData(null); // Xóa dữ liệu cũ khi gửi yêu cầu mới

    try {
      const response = await generatePlan(prompt);
      setPlanData(response.data);
      setViewMode('overview'); // Chuyển sang chế độ tổng quan sau khi tải xong
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Đã xảy ra lỗi khi tạo kế hoạch.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Tùy chọn: Tải kế hoạch mặc định khi tải trang
    // const defaultPrompt = "Develop a comprehensive marketing strategy for a B2B SaaS product launch targeting enterprises in North America.";
    // setPromptInput(defaultPrompt);
    // setSubmittedPrompt(defaultPrompt);
    // fetchPlan(defaultPrompt);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (promptInput.trim()) {
      setSubmittedPrompt(promptInput.trim());
      fetchPlan(promptInput.trim());
    } else {
      setError("Vui lòng nhập một yêu cầu.");
    }
  };

  // Tính toán dữ liệu cho lịch (biểu đồ Gantt)
  const getGanttData = () => {
    if (!planData || !planData.steps) return { tasks: [], totalDays: 0 };

    let currentDayOffset = 0; // Days from the start of the entire plan
    const tasks = planData.steps.map((step, index) => {
      const duration = parseTimelineToDays(step.timeline);
      const startDay = currentDayOffset;
      const endDay = currentDayOffset + duration; // End is exclusive, so it's startDay + duration
      currentDayOffset += duration;

      return {
        id: `step-${index}`,
        description: step.description,
        timeline: step.timeline,
        startDay: startDay,
        endDay: endDay,
        duration: duration,
      };
    });

    const totalDays = currentDayOffset; // Total duration of all tasks combined
    return { tasks, totalDays };
  };

  const { tasks: ganttTasks, totalDays: ganttTotalDays } = getGanttData();

  // Helper to determine grid column width for days
  const getGridTemplateColumns = () => {
    return `250px repeat(${ganttTotalDays}, 40px)`;
  };

  // Calculate the total width of the grid for min-width
  const getGridMinWidth = () => {
    return 250 + (ganttTotalDays * 40);
  };


  const handleSavePlan = async () => {
    if (!planData) return;
    setSaving(true);
    setSaveMessage(null);
    const res = await savePlan(planData, submittedPrompt);
    if (res.success) {
      setSaveMessage("Lưu kế hoạch thành công!");
    } else {
      setSaveMessage("Lưu thất bại: " + (res.message || "Lỗi không xác định"));
    }
    setSaving(false);
  };

  return (
    <div className="min-h-[95vh] roboto p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full p-6 rounded-lg  mb-8">
        <img src="/bot.png" alt="Logo" className="w-10 h-10 rounded-full mb-4 mx-auto" />
        <p className="text-lg text-gray-600 mb-6 text-center">
          Khám phá các kế hoạch dành cho bạn với AI ✨
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-6 relative">
          {/* Container cho textarea và button */}
          <div className="relative flex-grow bg-neutral-800 rounded-2xl overflow-hidden">
            <textarea
              ref={textareaRef}
              value={promptInput}
              onChange={handleInputChange}
              placeholder="'Phát triển chiến lược marketing cho ra mắt sản phẩm mới.'"
              className="w-full p-5 pr-12 focus:outline-none resize-none min-h-[150px] overflow-hidden"
              disabled={loading}
            />

            <div className="absolute bottom-2 right-2 flex items-center gap-2">

              <button
                type="button"
                className="p-1 rounded-md hover:bg-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title='Đính kèm tệp tin'
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="p-1 rounded-md hover:bg-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                <AtSign className="h-4 w-4" />
              </button>

              <button
                type="submit"
                className=" p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={loading}
                title={loading ? 'Đang tạo...' : 'Tạo Kế hoạch'}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </div>

          </div>
        </form>

        {/* Hiển thị trạng thái tải hoặc lỗi */}
        {loading && (
          <div className="flex flex-col items-center justify-center mt-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="text-xl text-blue-700 mt-4">AI đang tạo kế hoạch cho bạn...</p>
            <p className="text-gray-500 text-sm mt-2">Quá trình này có thể mất một chút thời gian.</p>
          </div>
        )}
        {error && (
          <p className="text-center text-[16px] roboto text-red-600 mt-4 flex items-center justify-center gap-2"><Link2Off />{error}</p>
        )}
      </div>

      {/* Hiển thị dữ liệu kế hoạch chỉ khi có dữ liệu và không tải/lỗi */}
      {!loading && !error && planData && (
        <div className="max-w-4xl w-full  p-6 rounded-lg shadow-md">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">{planData.title}</h1>
          <p className="text-xl text-gray-700 mb-8">
            <span className="font-semibold">Mục tiêu:</span> {planData.objective}
          </p>

          {submittedPrompt && (
            <p className="text-gray-500 text-sm italic mb-8">
              Kế hoạch được tạo từ yêu cầu: "{submittedPrompt}"
            </p>
          )}

          {/* --- Nút lưu và tạo lại kế hoạch --- */}
          <div className="flex gap-4 justify-end mb-6">
            <button
              onClick={handleSavePlan}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu kế hoạch"}
            </button>
            <button
              onClick={() => fetchPlan(submittedPrompt)}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700 disabled:opacity-60"
            >
              Tạo lại kế hoạch
            </button>
          </div>
          {saveMessage && (
            <div className={`mb-4 text-center ${saveMessage.includes("thành công") ? "text-green-600" : "text-red-600"}`}>
              {saveMessage}
            </div>
          )}

          {/* --- Nút chuyển đổi chế độ xem --- */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-l-md font-semibold flex items-center ${viewMode === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              <DocumentTextIcon className="h-5 w-5 mr-1" /> Tổng quan
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 font-semibold flex items-center ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              <ListBulletIcon className="h-5 w-5 mr-1" /> Danh sách
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-r-md font-semibold flex items-center ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              <CalendarDaysIcon className="h-5 w-5 mr-1" /> Lịch
            </button>
          </div>

          {/* --- Hiển thị theo chế độ đã chọn --- */}

          {viewMode === 'overview' && (
            <>
              <h2 className="text-3xl font-semibold text-gray-400 mb-6 border-b-2 pb-2 flex items-center">
                Tóm tắt Kế hoạch <ArrowRightIcon className="ml-3 h-6 w-6 text-gray-500" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* Card: Tổng quan về Bước */}
                <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200 flex flex-col items-center justify-center text-center">
                  <DocumentTextIcon className="h-12 w-12 text-blue-600 mb-3" />
                  <h3 className="text-2xl font-bold text-blue-800">{planData.steps.length} Bước</h3>
                  <p className="text-gray-700">trong kế hoạch</p>
                </div>
                {/* Card: Tổng thời gian ước tính */}
                <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200 flex flex-col items-center justify-center text-center">
                  <ClockIcon className="h-12 w-12 text-green-600 mb-3" />
                  <h3 className="text-2xl font-bold text-green-800">{ganttTotalDays} Ngày</h3>
                  <p className="text-gray-700">thời gian thực hiện ước tính</p>
                </div>
                {/* Card: Số lượng rủi ro */}
                <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200 flex flex-col items-center justify-center text-center">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mb-3" />
                  <h3 className="text-2xl font-bold text-red-800">{planData.risks.length} Rủi ro</h3>
                  <p className="text-gray-700">đã được xác định</p>
                </div>
                {/* Placeholder Card: Tiến độ */}
                <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200 flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 lg:col-span-1">
                  <ChartBarIcon className="h-12 w-12 text-gray-500 mb-3" />
                  <h3 className="text-2xl font-bold text-gray-800">Tiến độ</h3>
                  <p className="text-gray-700 text-sm mt-1">Tính năng này cần thêm dữ liệu để hiển thị.</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-3">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Ước tính: 30% hoàn thành</p>
                </div>
              </div>

              {/* Phần Rủi ro nổi bật trong Overview */}
              {planData.risks.length > 0 && (
                <>
                  <h3 className="text-2xl font-semibold text-gray-400 mb-4 flex items-center">
                    Rủi ro quan trọng <ExclamationTriangleIcon className="ml-2 h-5 w-5 text-red-500" />
                  </h3>
                  <div className="space-y-4 mb-10">
                    {planData.risks.map((item, index) => (
                      <div key={index} className="bg-red-100 p-4 rounded-lg border border-red-300 flex items-start">
                        <span className="font-bold text-red-700 mr-2 flex-shrink-0">{index + 1}.</span>
                        <div>
                          <p className="text-red-800 font-semibold">{item.risk}</p>
                          <p className="text-gray-700 text-sm">Giải pháp: {item.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {viewMode === 'list' && (
            <>
              {/* --- Sơ đồ giả định (placeholder) --- */}
              <h2 className="text-3xl font-semibold text-gray-400 mb-6 border-b-2 pb-2 flex items-center">
                Tổng quan chiến lược <ArrowRightIcon className="ml-3 h-6 w-6 text-gray-500" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Phân tích thị trường (Giả định)</h3>
                  <div className="h-40 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                    Biểu đồ Phân tích Đối thủ / Xu hướng thị trường
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Dự báo Doanh số (Giả định)</h3>
                  <div className="h-40 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                    Biểu đồ đường Doanh số Mục tiêu (10,000 SP)
                  </div>
                </div>
              </div>

              {/* --- Các bước thực hiện (Chế độ Danh sách) --- */}
              <h2 className="text-3xl font-semibold text-gray-400 mb-6 border-b-2 pb-2 flex items-center">
                Các bước thực hiện <ArrowRightIcon className="ml-3 h-6 w-6 text-gray-500" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {planData.steps.map((step, index) => (
                  <div key={index}
                    className="bg-white p-5 rounded-lg shadow-md border border-blue-100 
                                  hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col">
                    <div className="flex items-start mb-2">
                      <div className="w-8 h-8 flex-shrink-0 bg-blue-600 text-white rounded-full 
                                      flex items-center justify-center font-bold text-lg mr-3">
                        {index + 1}
                      </div>
                      <h3 className="text-xl font-bold text-blue-800 flex-grow">{step.description}</h3>
                    </div>
                    <p className="text-gray-700 mb-1 flex items-center pl-11">
                      <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span className="font-semibold">Thời gian:</span> {step.timeline}
                    </p>
                    <p className="text-gray-700 flex items-center pl-11">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10l2 2h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2zM9 14l2 2 4-4"></path></svg>
                      <span className="font-semibold">Tài nguyên:</span> {step.resources}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {viewMode === 'calendar' && (
            <>
              <h2 className="text-3xl font-semibold text-gray-400 mb-6 border-b-2 pb-2 flex items-center">
                Lịch trình thực hiện (Gantt Chart) <ArrowRightIcon className="ml-3 h-6 w-6 text-gray-500" />
              </h2>
              <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
                <div
                  className="bg-white text-sm"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: getGridTemplateColumns(),
                    minWidth: `${getGridMinWidth()}px` // Ensure enough width for horizontal scroll
                  }}
                >
                  {/* Header Row for Day Numbers */}
                  <div className="p-2 border-b border-r border-gray-200 text-left font-semibold text-gray-700 bg-gray-100 sticky left-0 z-20"> {/* Sticky for task column header */}
                    Bước
                  </div>
                  {ganttTotalDays > 0 ? (
                    Array.from({ length: ganttTotalDays }).map((_, dayIdx) => (
                      <div key={`day-header-${dayIdx}`} className="p-2 border-b border-r last:border-r-0 border-gray-200 text-center font-semibold text-gray-700 bg-gray-100">
                        {dayIdx + 1}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-2 text-center text-gray-500"></div>
                  )}

                  {/* Task Rows */}
                  {ganttTasks.length > 0 ? (
                    ganttTasks.map((task) => (
                      <React.Fragment key={task.id}> {/* Use React.Fragment for multiple children in grid row */}
                        <div className="p-2 border-b border-r border-gray-200 text-gray-800 font-medium whitespace-nowrap overflow-hidden text-ellipsis sticky left-0 bg-white z-10"
                          title={task.description}> {/* Sticky for task descriptions */}
                          {task.description}
                        </div>
                        <div className="relative h-full flex items-center border-b border-r last:border-r-0 border-gray-200"
                          style={{
                            gridColumnStart: task.startDay + 2, // +2 because first column is task description
                            gridColumnEnd: task.endDay + 2,
                            gridRow: 'auto', // Ensure it takes up one row
                          }}>
                          {/* Inner div for the task bar itself with padding and adjusted text handling */}
                          <div className="absolute inset-y-1 left-0 right-0 bg-blue-500 rounded flex items-center px-2 text-white text-xs"
                            title={`${task.description} (${task.timeline})`}
                            style={{
                              marginRight: '2px',
                              marginLeft: '2px'
                            }}>
                            <span className="truncate">{task.description}</span>
                          </div>
                        </div>
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center text-gray-500"
                      style={{ gridColumn: `1 / span ${ganttTotalDays + 1}` }}>
                      Không có bước nào để hiển thị trên lịch.
                    </div>
                  )}

                  {ganttTotalDays === 0 && ganttTasks.length === 0 && (
                    <div className="col-span-full p-8 text-center text-gray-500"
                      style={{ gridColumn: `1 / span ${ganttTotalDays + 1}` }}>
                      Không có dữ liệu lịch trình để hiển thị.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* --- Rủi ro và Biện pháp giảm thiểu --- */}
          <h2 className="text-3xl font-semibold text-gray-400 mt-10 mb-6 border-b-2 pb-2 flex items-center">
            Rủi ro và Biện pháp giảm thiểu <ArrowRightIcon className="ml-3 h-6 w-6 text-gray-500" />
          </h2>
          <div className="space-y-6">
            {planData.risks.map((item, index) => (
              <div key={index} className="bg-red-50 p-5 rounded-lg shadow-md border border-red-200">
                <div className="flex items-start mb-2">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <h3 className="text-xl font-bold text-red-700 flex-grow">{item.risk}</h3>
                </div>
                <p className="text-gray-700 pl-9">
                  <span className="font-semibold">Giải pháp:</span> {item.mitigation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hiển thị thông báo nếu không có dữ liệu và không tải/lỗi */}
      {!loading && !error && !planData && (
        <div className="max-w-4xl w-full text-center text-gray-600 mt-1">
          <RecentlyVisited />
          <UpComing />
        </div>
      )}
    </div>
  );
}

export default Home;