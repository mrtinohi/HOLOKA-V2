import api from './api';

export interface LoginRequest {
  username: string;
  password?: string;
  pin?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  };
}

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post(`/auth/login`, credentials);
  return response.data.data;
};
