import api from './api';
import type { PageResponse, RecordStatus } from '../types';
export interface Property {
  id: number; workspaceId: number; name: string; code: string; address: string; description: string | null;
  propertyType: 'APARTMENT' | 'ROOM_RENTAL' | 'SERVICED_APARTMENT' | 'HOUSE' | 'BUILDING' | 'OTHER';
  status: RecordStatus; ownerUserId: number; version: number; createdAt: string; updatedAt: string;
  totalRooms?: number;
  occupiedRooms?: number;
}
export type PropertyWrite = Pick<Property, 'name' | 'code' | 'address' | 'propertyType' | 'status' | 'ownerUserId'> & { description?: string; version?: number };
export interface PropertyFilter { search?: string; status?: string; propertyType?: string; page?: number; size?: number; sort?: string }
export async function listProperties(workspaceId: number, options: PropertyFilter = {}): Promise<PageResponse<Property>> {
  return (await api.get('/properties', { params: { workspaceId, ...options } })).data.data;
}
export async function getProperties(workspaceId: number): Promise<Property[]> { return (await listProperties(workspaceId)).items; }
export async function getProperty(workspaceId: number, id: number): Promise<Property> { return (await api.get('/properties/' + id, { params: { workspaceId } })).data.data; }
export async function saveProperty(workspaceId: number, body: PropertyWrite, id?: number): Promise<Property> {
  return (await api.request({ method: id ? 'PUT' : 'POST', url: '/properties' + (id ? '/' + id : ''), params: { workspaceId }, data: body })).data.data;
}
export async function deleteProperty(workspaceId: number, property: Property) {
  await api.delete('/properties/' + property.id, { params: { workspaceId, version: property.version } });
}
