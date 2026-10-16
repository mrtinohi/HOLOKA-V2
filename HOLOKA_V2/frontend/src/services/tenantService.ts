import api from './api';
import type { PageResponse, TenantSummary, TenantView, TenantWrite, RecordStatus } from '../types';

export type { TenantSummary, TenantView, TenantWrite };

export const listTenants = async (
  workspaceId: number,
  opts?: { search?: string; status?: RecordStatus; page?: number; size?: number }
): Promise<PageResponse<TenantSummary>> => {
  const { data } = await api.get('/tenants', {
    params: { workspaceId, ...opts },
  });
  return data.data;
};

export const getTenant = async (workspaceId: number, id: number): Promise<TenantView> => {
  const { data } = await api.get(`/tenants/${id}`, { params: { workspaceId } });
  return data.data;
};

export const createTenant = async (workspaceId: number, body: TenantWrite): Promise<TenantView> => {
  const { data } = await api.post('/tenants', body, { params: { workspaceId } });
  return data.data;
};

export const updateTenant = async (
  workspaceId: number,
  id: number,
  body: TenantWrite
): Promise<TenantView> => {
  const { data } = await api.put(`/tenants/${id}`, body, { params: { workspaceId } });
  return data.data;
};

export const deleteTenant = async (
  workspaceId: number,
  id: number,
  version: number
): Promise<void> => {
  await api.delete(`/tenants/${id}`, { params: { workspaceId, version } });
};
