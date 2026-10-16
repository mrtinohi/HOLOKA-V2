import api from './api';
import type { PageResponse, RecordStatus } from '../types';
export interface Building { id: number; workspaceId: number; propertyId: number; name: string; code: string; description: string | null; numberOfFloors: number; status: RecordStatus; version: number }
export type BuildingWrite = Pick<Building, 'propertyId' | 'name' | 'code' | 'numberOfFloors' | 'status'> & { description?: string; version?: number };
export async function listBuildings(workspaceId: number, options: { search?: string; propertyId?: number; status?: string; page?: number; size?: number; sort?: string } = {}): Promise<PageResponse<Building>> {
  return (await api.get('/buildings', { params: { workspaceId, ...options } })).data.data;
}
export async function getBuilding(workspaceId: number, id: number): Promise<Building> { return (await api.get('/buildings/' + id, { params: { workspaceId } })).data.data; }
export async function saveBuilding(workspaceId: number, body: BuildingWrite, id?: number): Promise<Building> { return (await api.request({ method: id ? 'PUT' : 'POST', url: '/buildings' + (id ? '/' + id : ''), params: { workspaceId }, data: body })).data.data; }
export async function deleteBuilding(workspaceId: number, building: Building) { await api.delete('/buildings/' + building.id, { params: { workspaceId, version: building.version } }); }
