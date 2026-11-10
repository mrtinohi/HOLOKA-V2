import api from './api';

export interface WorkspaceSummary {
  id: number;
  name: string;
  role: string;
}

export interface PlatformUserView {
  id: number;
  fullName: string;
  email: string;
  enabled: boolean;
  platformAdmin: boolean;
  createdAt: string;
  workspaces: WorkspaceSummary[];
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role?: string; // 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF'
  workspaceId?: number | null;
  newWorkspaceName?: string | null;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  role?: string;
  workspaceId?: number | null;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface PlatformWorkspaceView {
  id: number;
  name: string;
  currency: string;
  timezone: string;
  enabled: boolean;
  tierPlan: string;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
}

export interface CreateWorkspaceRequest {
  name: string;
  currency?: string;
  timezone?: string;
  tierPlan?: string;
  ownerUserId?: number | null;
}

export interface PlatformAuditLogView {
  id: string;
  timestamp: string;
  action: string;
  actorEmail: string;
  target: string;
  details: string;
  status: string;
}

export interface RoleCountSummary {
  superAdmins: number;
  owners: number;
  managers: number;
  staff: number;
}

export interface PlatformSystemMetrics {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  totalWorkspaces: number;
  activeWorkspaces: number;
  roles: RoleCountSummary;
  systemStatus: string;
  jvmMemoryUsedMb: number;
  jvmMemoryMaxMb: number;
  serverTime: string;
}

export const listPlatformUsers = async (): Promise<PlatformUserView[]> => {
  const response = await api.get('/platform/users');
  return response.data.data;
};

export const createPlatformUser = async (data: CreateUserRequest): Promise<PlatformUserView> => {
  const response = await api.post('/platform/users', data);
  return response.data.data;
};

export const updatePlatformUser = async (id: number, data: UpdateUserRequest): Promise<PlatformUserView> => {
  const response = await api.put(`/platform/users/${id}`, data);
  return response.data.data;
};

export const resetPlatformUserPassword = async (id: number, data: ResetPasswordRequest): Promise<void> => {
  await api.put(`/platform/users/${id}/reset-password`, data);
};

export const deletePlatformUser = async (id: number): Promise<void> => {
  await api.delete(`/platform/users/${id}`);
};

export const toggleUserStatus = async (userId: number): Promise<PlatformUserView> => {
  const response = await api.patch(`/platform/users/${userId}/toggle-status`);
  return response.data.data;
};

export const listPlatformWorkspaces = async (): Promise<PlatformWorkspaceView[]> => {
  const response = await api.get('/platform/workspaces');
  return response.data.data;
};

export const createPlatformWorkspace = async (data: CreateWorkspaceRequest): Promise<PlatformWorkspaceView> => {
  const response = await api.post('/platform/workspaces', data);
  return response.data.data;
};

export const toggleWorkspaceStatus = async (workspaceId: number): Promise<PlatformWorkspaceView> => {
  const response = await api.patch(`/platform/workspaces/${workspaceId}/toggle-status`);
  return response.data.data;
};

export const getPlatformMetrics = async (): Promise<PlatformSystemMetrics> => {
  const response = await api.get('/platform/metrics');
  return response.data.data;
};

export const getPlatformAuditLogs = async (): Promise<PlatformAuditLogView[]> => {
  const response = await api.get('/platform/audit-logs');
  return response.data.data;
};
