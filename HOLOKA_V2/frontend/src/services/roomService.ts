import api from './api';
import type { PageResponse } from '../types';
export interface Room {
  id: number; workspaceId: number; propertyId: number; buildingId: number; roomCode: string; name: string;
  floor: number; area: number; monthlyRent: number; status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';
  description: string | null; availableSince: string | null; version: number;
  propertyName?: string;
  tenantName?: string;
  contractEndDate?: string;
}
export type RoomWrite = Pick<Room, 'buildingId' | 'roomCode' | 'name' | 'floor' | 'area' | 'monthlyRent' | 'status'> & { description?: string; version?: number };
export async function listRooms(workspaceId: number, options: { search?: string; propertyId?: number; buildingId?: number; status?: string; page?: number; size?: number; sort?: string } = {}): Promise<PageResponse<Room>> {
  return (await api.get('/rooms', { params: { workspaceId, ...options } })).data.data;
}
export async function getRooms(workspaceId: number): Promise<Room[]> { return (await listRooms(workspaceId)).items; }
export async function getRoom(workspaceId: number, id: number): Promise<Room> { return (await api.get('/rooms/' + id, { params: { workspaceId } })).data.data; }
export async function saveRoom(workspaceId: number, body: RoomWrite, id?: number): Promise<Room> { return (await api.request({ method: id ? 'PUT' : 'POST', url: '/rooms' + (id ? '/' + id : ''), params: { workspaceId }, data: body })).data.data; }
export async function deleteRoom(workspaceId: number, room: Room) { await api.delete('/rooms/' + room.id, { params: { workspaceId, version: room.version } }); }
