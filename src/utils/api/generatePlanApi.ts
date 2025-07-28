import { api } from './index';

// Các interface dùng chung
export interface Step {
    description: string;
    timeline: string;
    resources: string;
}

export interface Risk {
    risk: string;
    mitigation: string;
}

export interface PlanData {
    id?: string;
    title: string;
    objective: string;
    steps: Step[];
    risks: Risk[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiResponse {
    success: boolean;
    message: string;
    data: PlanData;
    metadata: {
        generatedAt: string;
        originalInput: string;
    };
}

export interface PlanHistoryResponse {
    success: boolean;
    message: string;
    data?: PlanData[];
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// ========================
// 🧠 Named Export Functions
// ========================

export const generatePlan = async (input: string): Promise<ApiResponse> => {
    try {
        console.log('🤖 Generating plan for input:', input.substring(0, 50) + '...');

        const response = await api.post<ApiResponse>('/ai/generate-plan', { input });

        console.log('✅ Plan generated successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error generating plan:', error);
        throw error;
    }
};

// Helper function để parse timeline thành số ngày
const parseTimelineToDays = (timeline: string): number => {
    const lowerTimeline = timeline.toLowerCase();
    const match = lowerTimeline.match(/(\d+)\s*(ngày|tuần|tháng|day|week|month)s?/);
    if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 'ngày':
            case 'day': 
                return value;
            case 'tuần':
            case 'week': 
                return value * 7;
            case 'tháng':
            case 'month': 
                return value * 30;
            default: 
                return 7;
        }
    }
    return 7;
};

// Helper function để detect category từ nội dung
const detectCategory = (title: string, objective: string, prompt: string): 'personal' | 'work' | 'education' | 'health' | 'finance' | 'travel' | 'other' => {
    const content = `${title} ${objective} ${prompt}`.toLowerCase();
    
    if (content.includes('marketing') || content.includes('business') || content.includes('work') || content.includes('project') || content.includes('công việc') || content.includes('dự án')) {
        return 'work';
    } else if (content.includes('study') || content.includes('education') || content.includes('learn') || content.includes('học') || content.includes('giáo dục')) {
        return 'education';
    } else if (content.includes('health') || content.includes('fitness') || content.includes('exercise') || content.includes('sức khỏe') || content.includes('thể dục')) {
        return 'health';
    } else if (content.includes('finance') || content.includes('money') || content.includes('budget') || content.includes('tài chính') || content.includes('tiền')) {
        return 'finance';
    } else if (content.includes('travel') || content.includes('trip') || content.includes('vacation') || content.includes('du lịch') || content.includes('nghỉ')) {
        return 'travel';
    } else if (content.includes('cá nhân') || content.includes('personal') || content.includes('bản thân')) {
        return 'personal';
    }
    
    return 'other';
};

export const savePlan = async (
    planData: PlanData,
    originalInput: string
): Promise<{ success: boolean; message: string; data?: unknown }> => {
    try {
        console.log('💾 Saving plan:', planData.title);

        // Tính toán tổng thời gian thực hiện và tạo tasks
        let totalDays = 0;
        const tasks = planData.steps?.map((step: Step, index: number) => {
            const stepDays = parseTimelineToDays(step.timeline);
            const startDay = totalDays;
            totalDays += stepDays;
            
            return {
                id: `step-${index + 1}`,
                title: step.description,
                description: `Thời gian: ${step.timeline} | Tài nguyên: ${step.resources}`,
                status: 'todo' as const,
                priority: 'medium' as const,
                dueDate: new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000).toISOString(),
                estimatedTime: stepDays * 8, // 8 giờ/ngày
                tags: ['ai-generated', 'step']
            };
        }) || [];

        // Tạo payload theo đúng schema API
        const planPayload = {
            // ✅ Required fields
            title: planData.title || 'Kế hoạch không có tiêu đề',
            
            // ✅ Optional basic fields
            description: planData.objective || '',
            
            // ✅ Source identification
            source: 'ai-generated' as const,
            
            // ✅ Basic plan info
            category: detectCategory(planData.title || '', planData.objective || '', originalInput),
            priority: 'medium' as const,
            status: 'draft' as const,
            
            // ✅ Dates
            startDate: new Date().toISOString(),
            endDate: totalDays > 0 
                ? new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            
            // ✅ Tasks array (converted from steps)
            tasks: tasks,
            
            // ✅ Collaborators (empty for AI-generated plans)
            collaborators: [],
            
            // ✅ Additional fields
            tags: ['ai-generated', 'plan'],
            isPublic: false,
            allowComments: true,
            allowCollaboration: true,
            
            // ✅ AI-specific fields
            aiPrompt: originalInput,
            aiModel: 'claude-sonnet-4',
            aiGeneratedAt: new Date().toISOString()
        };

        console.log('📤 Sending plan payload:', {
            title: planPayload.title,
            source: planPayload.source,
            category: planPayload.category,
            tasksCount: planPayload.tasks.length
        });

        const response = await api.post('/plans/', planPayload);

        console.log('✅ Plan saved successfully');
        return response.data;
        
    } catch (error: any) {
        console.error('❌ Error saving plan:', error);

        if (error.response?.data) {
            return error.response.data;
        }

        return {
            success: false,
            message: error.message || 'Lỗi không xác định',
        };
    }
};

// ✅ Cập nhật fetchPlanHistory thành getPlans
export const getPlans = async (
    page = 1,
    limit = 10,
    filters?: {
        search?: string;
        category?: string;
        status?: string;
        priority?: string;
        source?: string;
        sortBy?: string;
        sortOrder?: string;
    }
): Promise<PlanHistoryResponse> => {
    try {
        console.log(`📋 Fetching plans (page: ${page}, limit: ${limit})`);

        const params = {
            page,
            limit,
            ...filters
        };

        const response = await api.get<PlanHistoryResponse>('/plans/', {
            params,
        });

        console.log('✅ Plans fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching plans:', error);
        throw error;
    }
};

export const getPlanById = async (
    planId: string
): Promise<{ success: boolean; message: string; data?: PlanData }> => {
    try {
        console.log('📄 Fetching plan by ID:', planId);

        const response = await api.get(`/plans/${planId}`);
        console.log('✅ Plan fetched successfully');

        return response.data;
    } catch (error) {
        console.error('❌ Error fetching plan:', error);
        throw error;
    }
};

export const updatePlan = async (
    planId: string,
    planData: Partial<PlanData>
): Promise<{ success: boolean; message: string; data?: PlanData }> => {
    try {
        console.log('📝 Updating plan:', planId);

        const response = await api.put(`/plans/${planId}`, planData);

        console.log('✅ Plan updated successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error updating plan:', error);
        throw error;
    }
};

export const deletePlan = async (
    planId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        console.log('🗑️ Deleting plan:', planId);

        const response = await api.delete(`/plans/${planId}`);

        console.log('✅ Plan deleted successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error deleting plan:', error);
        throw error;
    }
};

// ✅ Cập nhật searchPlans
export const searchPlans = async (
    query: string,
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('🔍 Searching plans with query:', query);

        const response = await api.get<PlanHistoryResponse>(`/plans/search/${encodeURIComponent(query)}`, {
            params: { page, limit },
        });

        console.log('✅ Plans search completed');
        return response.data;
    } catch (error) {
        console.error('❌ Error searching plans:', error);
        throw error;
    }
};

// ✅ Thêm các API mới theo backend routes

// Lấy thống kê kế hoạch
export const getPlanStats = async (): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
        console.log('📊 Fetching plan statistics');

        const response = await api.get('/plans/stats/overview');

        console.log('✅ Plan stats fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching plan stats:', error);
        throw error;
    }
};

// Sao chép kế hoạch
export const duplicatePlan = async (
    planId: string,
    newTitle?: string
): Promise<{ success: boolean; message: string; data?: PlanData }> => {
    try {
        console.log('📋 Duplicating plan:', planId);

        const payload = newTitle ? { title: newTitle } : {};
        const response = await api.post(`/plans/${planId}/duplicate`, payload);

        console.log('✅ Plan duplicated successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error duplicating plan:', error);
        throw error;
    }
};

// Chia sẻ kế hoạch
export const sharePlan = async (
    planId: string,
    shareType: 'view' | 'edit' = 'view',
    expiresIn?: number
): Promise<{ success: boolean; message: string; data?: { shareLink: string } }> => {
    try {
        console.log('🔗 Sharing plan:', planId);

        const payload = {
            shareType,
            ...(expiresIn && { expiresIn })
        };

        const response = await api.post(`/plans/${planId}/share`, payload);

        console.log('✅ Plan shared successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error sharing plan:', error);
        throw error;
    }
};

// Xuất kế hoạch
export const exportPlan = async (
    planId: string,
    format: 'json' | 'csv' | 'pdf' | 'xlsx' = 'json'
): Promise<any> => {
    try {
        console.log('📤 Exporting plan:', planId, 'format:', format);

        const response = await api.get(`/plans/${planId}/export`, {
            params: { format },
            responseType: format === 'json' ? 'json' : 'blob'
        });

        console.log('✅ Plan exported successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error exporting plan:', error);
        throw error;
    }
};

// Lấy kế hoạch theo danh mục
export const getPlansByCategory = async (
    category: string,
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('📂 Fetching plans by category:', category);

        const response = await api.get<PlanHistoryResponse>(`/plans/category/${category}`, {
            params: { page, limit },
        });

        console.log('✅ Plans by category fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching plans by category:', error);
        throw error;
    }
};

// Lấy kế hoạch theo trạng thái
export const getPlansByStatus = async (
    status: string,
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('📊 Fetching plans by status:', status);

        const response = await api.get<PlanHistoryResponse>(`/plans/status/${status}`, {
            params: { page, limit },
        });

        console.log('✅ Plans by status fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching plans by status:', error);
        throw error;
    }
};

// Lấy kế hoạch theo độ ưu tiên
export const getPlansByPriority = async (
    priority: string,
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('⚡ Fetching plans by priority:', priority);

        const response = await api.get<PlanHistoryResponse>(`/plans/priority/${priority}`, {
            params: { page, limit },
        });

        console.log('✅ Plans by priority fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching plans by priority:', error);
        throw error;
    }
};

// Lấy kế hoạch AI-generated
export const getAIGeneratedPlans = async (
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('🤖 Fetching AI-generated plans');

        const response = await api.get<PlanHistoryResponse>('/plans/source/ai-generated', {
            params: { page, limit },
        });

        console.log('✅ AI-generated plans fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching AI-generated plans:', error);
        throw error;
    }
};

// Lấy kế hoạch manual
export const getManualPlans = async (
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('✋ Fetching manual plans');

        const response = await api.get<PlanHistoryResponse>('/plans/source/manual', {
            params: { page, limit },
        });

        console.log('✅ Manual plans fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching manual plans:', error);
        throw error;
    }
};

// Lấy kế hoạch gần đây
export const getRecentPlans = async (
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('🕒 Fetching recent plans');

        const response = await api.get<PlanHistoryResponse>('/plans/recent/all', {
            params: { limit },
        });

        console.log('✅ Recent plans fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching recent plans:', error);
        throw error;
    }
};

// Lấy kế hoạch đã lưu trữ
export const getArchivedPlans = async (
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('📦 Fetching archived plans');

        const response = await api.get<PlanHistoryResponse>('/plans/archived/all', {
            params: { page, limit },
        });

        console.log('✅ Archived plans fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching archived plans:', error);
        throw error;
    }
};

// Lưu trữ kế hoạch
export const archivePlan = async (
    planId: string
): Promise<{ success: boolean; message: string; data?: PlanData }> => {
    try {
        console.log('📦 Archiving plan:', planId);

        const response = await api.patch(`/plans/${planId}/archive`);

        console.log('✅ Plan archived successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error archiving plan:', error);
        throw error;
    }
};

// Khôi phục kế hoạch từ lưu trữ
export const restorePlan = async (
    planId: string
): Promise<{ success: boolean; message: string; data?: PlanData }> => {
    try {
        console.log('🔄 Restoring plan:', planId);

        const response = await api.patch(`/plans/${planId}/restore`);

        console.log('✅ Plan restored successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error restoring plan:', error);
        throw error;
    }
};

// Đánh dấu kế hoạch hoàn thành
export const completePlan = async (
    planId: string
): Promise<{ success: boolean; message: string; data?: PlanData }> => {
    try {
        console.log('✅ Completing plan:', planId);

        const response = await api.patch(`/plans/${planId}/complete`);

        console.log('✅ Plan completed successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error completing plan:', error);
        throw error;
    }
};

// Kích hoạt kế hoạch
export const activatePlan = async (
    planId: string
): Promise<{ success: boolean; message: string; data?: PlanData }> => {
    try {
        console.log('🚀 Activating plan:', planId);

        const response = await api.patch(`/plans/${planId}/activate`);

        console.log('✅ Plan activated successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error activating plan:', error);
        throw error;
    }
};

// Lấy tiến độ kế hoạch
export const getPlanProgress = async (
    planId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
        console.log('📈 Fetching plan progress:', planId);

        const response = await api.get(`/plans/${planId}/progress`);

        console.log('✅ Plan progress fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching plan progress:', error);
        throw error;
    }
};

// Lấy dashboard người dùng
export const getUserDashboard = async (): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
        console.log('📊 Fetching user dashboard');

        const response = await api.get('/plans/dashboard/overview');

        console.log('✅ User dashboard fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching user dashboard:', error);
        throw error;
    }
};

// Lấy tasks được phân công
export const getMyTasks = async (
    page = 1,
    limit = 20,
    filters?: {
        status?: string;
        priority?: string;
        sortBy?: string;
        sortOrder?: string;
    }
): Promise<{ success: boolean; message: string; data?: any[]; pagination?: any }> => {
    try {
        console.log('📋 Fetching my assigned tasks');

        const params = {
            page,
            limit,
            ...filters
        };

        const response = await api.get('/plans/tasks/assigned', {
            params,
        });

        console.log('✅ My tasks fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching my tasks:', error);
        throw error;
    }
};

// ========================
// 🌟 Default Export (Optional)
// ========================
const planApi = {
    generatePlan,
    savePlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    searchPlans,
    getPlanStats,
    duplicatePlan,
    sharePlan,
    exportPlan,
    getPlansByCategory,
    getPlansByStatus,
    getPlansByPriority,
    getAIGeneratedPlans,
    getManualPlans,
    getRecentPlans,
    getArchivedPlans,
    archivePlan,
    restorePlan,
    completePlan,
    activatePlan,
    getPlanProgress,
    getUserDashboard,
    getMyTasks,
};

export default planApi;

// ========================
// 🔧 Legacy Support (Deprecated)
// ========================
export const fetchPlanHistory = getPlans; // Deprecated: Use getPlans instead
export const getUserPlans = getPlans; // Deprecated: Use getPlans with filters instead
