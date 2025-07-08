import axios from 'axios';

const API_BASE_URL = import.meta.env.BE_URL || 'http://localhost:3000/api/ai/generate-plan';
const SAVE_PLAN_URL = import.meta.env.BE_SAVE_PLAN_URL || 'http://localhost:3000/api/plans';

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
  title: string;
  objective: string;
  steps: Step[];
  risks: Risk[];
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

export const generatePlan = async (input: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post<ApiResponse>(
      API_BASE_URL,
      { input }
    );
    return response.data;
  } catch (error) {
    console.error('Error generating plan:', error);
    throw error;
  }
};

// Hàm lưu kế hoạch
export const savePlan = async (
  planData: PlanData,
  originalInput: string
): Promise<{ success: boolean; message: string; data?: unknown }> => {
  try {
    const response = await axios.post(`${SAVE_PLAN_URL}/save-ai-plan`, {
      planData,
      metadata: {
        originalInput,
        generatedAt: new Date().toISOString()
      }
    });
    return response.data;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: { data?: unknown } }).response === "object" &&
      (error as { response?: { data?: unknown } }).response !== null &&
      "data" in (error as { response: { data?: unknown } }).response
    ) {
      return (error as { response: { data: unknown } }).response.data as { success: boolean; message: string; data?: unknown };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Lỗi không xác định"
    };
  }
};


// Hàm lấy lịch sử kế hoạch
export const fetchPlanHistory = async (): Promise<{ success: boolean; message: string; data?: PlanData[] }> => {
  try {
    const response = await axios.get<{ success: boolean; message: string; data?: PlanData[] }>(
      `${import.meta.env.BE_URL || 'http://localhost:3000/api/plans'}/history`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching plan history:', error);
    throw error;
  }
};