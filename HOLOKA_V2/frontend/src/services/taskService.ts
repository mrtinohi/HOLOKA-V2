import api from './api';
import type { PageResponse, TaskView, TaskCreate, TaskStatus, Priority } from '../types';

export type { TaskView, TaskCreate, TaskStatus };

export const listTasks = async (
  workspaceId: number,
  opts?: {
    search?: string;
    propertyId?: number;
    status?: TaskStatus;
    priority?: Priority;
    overdue?: boolean;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<TaskView>> => {
  const { data } = await api.get('/tasks', { params: { workspaceId, ...opts } });
  return data.data;
};

export const getTask = async (workspaceId: number, id: number): Promise<TaskView> => {
  const { data } = await api.get(`/tasks/${id}`, { params: { workspaceId } });
  return data.data;
};

export const createTask = async (workspaceId: number, body: TaskCreate): Promise<TaskView> => {
  const { data } = await api.post('/tasks', body, { params: { workspaceId } });
  return data.data;
};

export const updateTaskStatus = async (
  workspaceId: number,
  id: number,
  status: TaskStatus,
  version: number,
  note?: string
): Promise<TaskView> => {
  const { data } = await api.patch(
    `/tasks/${id}/status`,
    { status, version, note },
    { params: { workspaceId } }
  );
  return data.data;
};

export const deleteTask = async (
  workspaceId: number,
  id: number,
  version: number
): Promise<void> => {
  await api.delete(`/tasks/${id}`, { params: { workspaceId, version } });
};
