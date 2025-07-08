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

export const savePlan = async (
    planData: PlanData,
    originalInput: string
): Promise<{ success: boolean; message: string; data?: unknown }> => {
    try {
        console.log('💾 Saving plan:', planData.title);

        const response = await api.post('/plans/save-ai-plan', {
            planData,
            metadata: {
                originalInput,
                generatedAt: new Date().toISOString(),
            },
        });

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
