import api from './api';
import type {
  PageResponse,
  MaintenanceView,
  MaintenanceCreate,
  MaintenanceStatus,
  Priority,
} from '../types';

export type { MaintenanceView, MaintenanceCreate, MaintenanceStatus };

export const listMaintenance = async (
  workspaceId: number,
  opts?: {
    search?: string;
    propertyId?: number;
    status?: MaintenanceStatus;
    priority?: Priority;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<MaintenanceView>> => {
  const { data } = await api.get('/maintenance', { params: { workspaceId, ...opts } });
  return data.data;
};

export const getMaintenance = async (workspaceId: number, id: number): Promise<MaintenanceView> => {
  const { data } = await api.get(`/maintenance/${id}`, { params: { workspaceId } });
  return data.data;
};

export const createMaintenance = async (
  workspaceId: number,
  body: MaintenanceCreate
): Promise<MaintenanceView> => {
  const { data } = await api.post('/maintenance', body, { params: { workspaceId } });
  return data.data;
};

export const updateMaintenanceStatus = async (
  workspaceId: number,
  id: number,
  status: MaintenanceStatus,
  version: number,
  note?: string
): Promise<MaintenanceView> => {
  const { data } = await api.patch(
    `/maintenance/${id}/status`,
    { status, version, note },
    { params: { workspaceId } }
  );
  return data.data;
};
