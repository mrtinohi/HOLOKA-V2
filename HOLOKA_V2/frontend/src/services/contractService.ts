import api from './api';
import type { PageResponse, ContractView, ContractWrite, ContractStatus } from '../types';

export type { ContractView, ContractWrite, ContractStatus };

export const listContracts = async (
  workspaceId: number,
  opts?: {
    search?: string;
    tenantId?: number;
    roomId?: number;
    propertyId?: number;
    status?: ContractStatus;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<ContractView>> => {
  const { data } = await api.get('/contracts', { params: { workspaceId, ...opts } });
  return data.data;
};

export const getContract = async (workspaceId: number, id: number): Promise<ContractView> => {
  const { data } = await api.get(`/contracts/${id}`, { params: { workspaceId } });
  return data.data;
};

export const createContract = async (
  workspaceId: number,
  body: ContractWrite
): Promise<ContractView> => {
  const { data } = await api.post('/contracts', body, { params: { workspaceId } });
  return data.data;
};

export const updateContract = async (
  workspaceId: number,
  id: number,
  body: ContractWrite
): Promise<ContractView> => {
  const { data } = await api.put(`/contracts/${id}`, body, { params: { workspaceId } });
  return data.data;
};

export const activateContract = async (
  workspaceId: number,
  id: number,
  version: number
): Promise<ContractView> => {
  const { data } = await api.post(`/contracts/${id}/activate`, { version }, { params: { workspaceId } });
  return data.data;
};

export const terminateContract = async (
  workspaceId: number,
  id: number,
  version: number
): Promise<ContractView> => {
  const { data } = await api.post(`/contracts/${id}/terminate`, { version }, { params: { workspaceId } });
  return data.data;
};

export const deleteContract = async (
  workspaceId: number,
  id: number,
  version: number
): Promise<void> => {
  await api.delete(`/contracts/${id}`, { params: { workspaceId, version } });
};
