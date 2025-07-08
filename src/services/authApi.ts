import axios from "axios";

const AUTH_BASE_URL = import.meta.env.BE_AUTH_URL || "http://localhost:3000/api/auth";

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
  retryAfter?: number;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/login`, {
      email: username, // hoặc username tuỳ backend
      password,
    });
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.data) return err.response.data;
    return { success: false, message: err.message || "Lỗi không xác định" };
  }
};

export const googleLogin = async (): Promise<void> => {
  window.location.href = `${AUTH_BASE_URL}/google`;
}



export const register = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/register`, { email, password });
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.data) return err.response.data;
    return { success: false, message: err.message || "Lỗi không xác định" };
  }
};