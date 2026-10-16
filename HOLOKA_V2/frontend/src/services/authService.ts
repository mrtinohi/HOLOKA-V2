import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface WorkspaceView {
  id: number;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
}

export interface UserView {
  id: number;
  fullName: string;
  email: string;
  platformAdmin: boolean;
  workspaces: WorkspaceView[];
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserView;
}

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  return response.data.data;
};

export const register = async (payload: {
  fullName: string;
  email: string;
  password: string;
  workspaceName: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', payload);
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getMe = async (): Promise<UserView> => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  await api.put('/auth/change-password', { currentPassword, newPassword });
};
