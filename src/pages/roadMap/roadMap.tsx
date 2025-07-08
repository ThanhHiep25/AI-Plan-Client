import React, { useState, useRef, useEffect } from "react";

// Thành viên
interface Member {
    id: string;
    name: string;
    avatar: string;
}

// Task/công việc
interface Task {
    id: string;
    name: string;
    description: string;
    assignee: Member;
    phaseId: string;
    startDate: string; // ISO date
    endDate: string;   // ISO date
    status: "todo" | "in-progress" | "done";
    progress: number; // 0-100 (%)
    color: string;
}

// Giai đoạn (Quý)
interface Phase {
    id: string;
    name: string;
    daysInPhase: number;
    startDate: string; // ISO date
    endDate: string;   // ISO date
}

const members: Member[] = [
    { id: "m1", name: "Nguyễn Văn A", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
    { id: "m2", name: "Trần Thị B", avatar: "https://randomuser.me/api/portraits/women/2.jpg" },
    { id: "m3", name: "Lê Văn C", avatar: "https://randomuser.me/api/portraits/men/3.jpg" },
];

const phases: Phase[] = [
    { id: 'q1-2025', name: 'Q1 2025', daysInPhase: 90, startDate: "2025-01-01", endDate: "2025-03-31" },
    { id: 'q2-2025', name: 'Q2 2025', daysInPhase: 91, startDate: "2025-04-01", endDate: "2025-06-30" },
    { id: 'q3-2025', name: 'Q3 2025', daysInPhase: 92, startDate: "2025-07-01", endDate: "2025-09-30" },
    { id: 'q4-2025', name: 'Q4 2025', daysInPhase: 92, startDate: "2025-10-01", endDate: "2025-12-31" },
];

const colorList = [
    "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500", "bg-pink-500"
];

// Helper: Tính số ngày giữa 2 ngày
function daysBetween(start: string, end: string) {
    return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
}

const pixelsPerDay = 2; // Điều chỉnh zoom

const initialTasks: Task[] = [
    {
        id: "t1",
        name: "Thiết kế UI",
        description: "Thiết kế giao diện trang chủ",
        assignee: members[0],
        phaseId: "q1-2025",
        startDate: "2025-01-10",
        endDate: "2025-01-25",
        status: "done",
        progress: 100,
        color: "bg-blue-500",
    },
    {
        id: "t2",
        name: "API Backend",
        description: "Xây dựng API cho module user",
        assignee: members[1],
        phaseId: "q1-2025",
        startDate: "2025-01-15",
        endDate: "2025-02-10",
        status: "in-progress",
        progress: 60,
        color: "bg-green-500",
    },
];

const ProductRoadmap: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: "",
        description: "",
        assigneeId: members[0].id,
        phaseId: phases[0].id,
        startDate: phases[0].startDate,
        endDate: phases[0].endDate,
        status: "todo" as "todo" | "in-progress" | "done",
        progress: 0,
        color: colorList[0],
    });

    // Đóng modal khi click ngoài
    const modalRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!showAddModal) return;
        const handle = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setShowAddModal(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [showAddModal]);

    // Tổng số ngày của roadmap
    const totalDays = phases.reduce((sum, phase) => sum + phase.daysInPhase, 0);

    // Tính tổng tiến độ
    const totalProgress = tasks.length
        ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
        : 0;

    // Thêm task mới
    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        const assignee = members.find(m => m.id === form.assigneeId)!;
        setTasks([
            ...tasks,
            {
                id: "t" + (tasks.length + 1),
                name: form.name,
                description: form.description,
                assignee,
                phaseId: form.phaseId,
                startDate: form.startDate,
                endDate: form.endDate,
                status: form.status,
                progress: form.progress,
                color: form.color,
            }
        ]);
        setShowAddModal(false);
        setForm({
            name: "",
            description: "",
            assigneeId: members[0].id,
            phaseId: phases[0].id,
            startDate: phases[0].startDate,
            endDate: phases[0].endDate,
            status: "todo",
            progress: 0,
            color: colorList[0],
        });
    };

    return (
        <div className=" p-6 rounded-lg shadow-md mb-8 overflow-x-auto pt-28">
            <div className="mb-4 flex items-center gap-4">
                <span className="font-semibold text-gray-700 dark:text-gray-200">Tổng tiến độ:</span>
                <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                        className="h-4 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${totalProgress}%` }}
                    ></div>
                </div>
                <span className="ml-2 text-blue-600 dark:text-blue-300 font-bold">{totalProgress}%</span>
                <button
                    className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => setShowAddModal(true)}
                >
                    + Thêm công việc
                </button>
            </div>

            {/* Modal thêm task */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
                    <div ref={modalRef} className="bg-white/30 backdrop-blur-md rounded-lg p-6 w-full max-w-lg shadow-lg relative">
                        <form className="space-y-3" onSubmit={handleAddTask}>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Tên công việc</label>
                                <input
                                    className="p-2 border-b w-full focus:outline-none"
                                    placeholder="Plan A or Plan B"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="mt-10">
                                <label className="block text-sm font-semibold mb-1">Mô tả</label>
                                <textarea
                                    className="p-2 border-b w-full focus:outline-none"
                                    placeholder="Mô tả chi tiết công việc"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-2 mt-10">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold mb-1">Người thực hiện</label>
                                    <select
                                        className="w-full border-b rounded px-2 py-1 bg-black/20 backdrop-blur-md focus:outline-none"
                                        value={form.assigneeId}
                                        onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                                    >
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold mb-1">Giai đoạn</label>
                                    <select
                                        className="border-b  px-2 py-1 w-full bg-black/20 backdrop-blur-md focus:outline-none"
                                        value={form.phaseId}
                                        onChange={e => {
                                            const phase = phases.find(p => p.id === e.target.value)!;
                                            setForm(f => ({
                                                ...f,
                                                phaseId: phase.id,
                                                startDate: phase.startDate,
                                                endDate: phase.endDate
                                            }));
                                        }}
                                    >
                                        {phases.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-10">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold mb-1">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        className="border-b focus:outline-none px-2 py-1 w-full"
                                        value={form.startDate}
                                        min={phases.find(p => p.id === form.phaseId)?.startDate}
                                        max={phases.find(p => p.id === form.phaseId)?.endDate}
                                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold mb-1">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        className="border-b focus:outline-none rounded px-2 py-1 w-full"
                                        value={form.endDate}
                                        min={form.startDate}
                                        max={phases.find(p => p.id === form.phaseId)?.endDate}
                                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-10">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold mb-1">Trạng thái</label>
                                    <select
                                        className="border-b focus:outline-none px-2 py-1 w-full bg-black/20 backdrop-blur-md"
                                        value={form.status}
                                        onChange={e => setForm(f => ({ ...f, status: e.target.value as "todo" | "in-progress" | "done" }))}
                                    >
                                        <option value="todo">Chưa làm</option>
                                        <option value="in-progress">Đang làm</option>
                                        <option value="done">Hoàn thành</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold mb-1">Tiến độ (%)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        className="border-b focus:outline-none px-2 py-1 w-full"
                                        value={form.progress}
                                        onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold mb-1">Màu</label>
                                    <select
                                        className="border-b focus:outline-none px-2 py-1 w-full bg-black/20 backdrop-blur-md"
                                        value={form.color}
                                        onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                                    >
                                        {colorList.map(c => (
                                            <option key={c} value={c}>{c.replace("bg-", "")}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" className="px-4 py-2 rounded bg-gray-500" onClick={() => setShowAddModal(false)}>Hủy</button>
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Thêm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bảng phân chia công việc */}
            <div className="overflow-x-auto mb-8">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            <th className="p-2">Công việc</th>
                            <th className="p-2">Người thực hiện</th>
                            <th className="p-2">Bắt đầu</th>
                            <th className="p-2">Kết thúc</th>
                            <th className="p-2">Trạng thái</th>
                            <th className="p-2">Tiến độ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.id} className="border-b border-gray-200 dark:border-gray-700">
                                <td className="p-2">{task.name}</td>
                                <td className="p-2 flex items-center gap-2">
                                    <img src={task.assignee.avatar} alt={task.assignee.name} className="w-6 h-6 rounded-full" />
                                    {task.assignee.name}
                                </td>
                                <td className="p-2">{task.startDate}</td>
                                <td className="p-2">{task.endDate}</td>
                                <td className="p-2">
                                    <span className={
                                        task.status === "done" ? "text-green-600" :
                                            task.status === "in-progress" ? "text-yellow-600" : "text-gray-500"
                                    }>
                                        {task.status === "done" ? "Hoàn thành" : task.status === "in-progress" ? "Đang làm" : "Chưa làm"}
                                    </span>
                                </td>
                                <td className="p-2 w-40">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full ${task.progress === 100 ? "bg-green-500" : "bg-blue-500"}`}
                                            style={{ width: `${task.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs ml-2">{task.progress}%</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Roadmap dạng Gantt chart */}
            <div className="min-w-full inline-flex border border-gray-300 dark:border-gray-600 mb-2 mt-6 ">
                <div className="flex-none w-64 bg-gray-100 dark:bg-gray-700 font-semibold border-r border-gray-300 dark:border-gray-600 text-sm p-2 sticky left-0 z-10 text-gray-900 dark:text-gray-200">
                    Công việc
                </div>
                {phases.map(phase => (
                    <div
                        key={phase.id}
                        className="flex-none border-r border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 font-semibold text-center text-sm p-2 text-gray-900 dark:text-gray-200"
                        style={{ width: `${phase.daysInPhase * pixelsPerDay}px` }}
                    >
                        {phase.name}
                    </div>
                ))}
            </div>
            <div className="relative border-x border-b border-gray-300 dark:border-gray-600">
                {tasks.map(task => {
                    // Tìm phase
                    const phase = phases.find(p => p.id === task.phaseId);
                    if (!phase) return null;
                    // Tính offset ngày bắt đầu so với roadmap
                    const phaseOffsetDays = phases.slice(0, phases.indexOf(phase)).reduce((sum, p) => sum + p.daysInPhase, 0);
                    const startDayInPhase = daysBetween(phase.startDate, task.startDate) + 1;
                    const leftPosition = (phaseOffsetDays + startDayInPhase - 1) * pixelsPerDay;
                    //const barWidth = (daysBetween(task.startDate, task.endDate) + 1) * pixelsPerDay;

                    return (
                        <div key={task.id} className="min-h-[48px] flex items-center border-t border-gray-200 dark:border-gray-700"
                            style={{ width: `${totalDays * pixelsPerDay}px` }}>
                            <div className="flex-none w-64 p-2 text-sm border-r border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 sticky left-0 bg-white dark:bg-gray-800 z-10">
                                <div className="flex items-center gap-2">
                                    <img src={task.assignee.avatar} alt={task.assignee.name} className="w-6 h-6 rounded-full" />
                                    <span>{task.name}</span>
                                </div>
                                <div className="text-xs text-gray-500">{task.assignee.name}</div>
                            </div>
                            <div
                                className="relative flex-1"
                                style={{ width: `${totalDays * pixelsPerDay}px` }}
                            >
                                <div
                                    className={`absolute h-8 rounded-md flex items-center justify-center text-white text-xs px-2 whitespace-nowrap overflow-hidden text-ellipsis ${task.color}`}
                                    style={{
                                        left: `${leftPosition}px`,
                                        width: ` `,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        opacity: task.status === "done" ? 0.7 : 1,
                                    }}
                                    title={task.description}
                                >
                                    {task.name} ({task.progress}%)
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lịch đơn giản: hiển thị task theo ngày (dạng list) */}
            <div className="mt-10">
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Lịch công việc</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    {tasks.map(task => (
                        <div key={task.id} className="mb-2 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full mr-2"
                                style={{ background: task.status === "done" ? "#22c55e" : task.status === "in-progress" ? "#facc15" : "#64748b" }}></span>
                            <span className="font-semibold">{task.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                                {task.startDate} → {task.endDate}
                            </span>
                            <span className="ml-auto text-xs text-gray-400">{task.assignee.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductRoadmap;