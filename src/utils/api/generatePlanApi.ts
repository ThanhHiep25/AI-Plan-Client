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
        page: number;
        limit: number;
        total: number;
        totalPages: number;
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

export const fetchPlanHistory = async (
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log(`📋 Fetching plan history (page: ${page}, limit: ${limit})`);

        const response = await api.get<PlanHistoryResponse>('/plans/history', {
            params: { page, limit },
        });

        console.log('✅ Plan history fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching plan history:', error);
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

export const searchPlans = async (
    query: string,
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('🔍 Searching plans with query:', query);

        const response = await api.get<PlanHistoryResponse>('/plans/search', {
            params: { query, page, limit },
        });

        console.log('✅ Plans search completed');
        return response.data;
    } catch (error) {
        console.error('❌ Error searching plans:', error);
        throw error;
    }
};

export const getUserPlans = async (
    userId: string,
    page = 1,
    limit = 10
): Promise<PlanHistoryResponse> => {
    try {
        console.log('👤 Fetching user plans for:', userId);

        const response = await api.get<PlanHistoryResponse>(`/plans/user/${userId}`, {
            params: { page, limit },
        });

        console.log('✅ User plans fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching user plans:', error);
        throw error;
    }
};

// ========================
// 🌟 Default Export (Optional)
// ========================
const planApi = {
    generatePlan,
    savePlan,
    fetchPlanHistory,
    getPlanById,
    updatePlan,
    deletePlan,
    searchPlans,
    getUserPlans,
};

export default planApi;
