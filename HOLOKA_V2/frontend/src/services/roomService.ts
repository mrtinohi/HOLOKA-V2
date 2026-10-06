import api from './api';

export interface Room {
  id: number;
  roomCode: string;
  name: string;
  floor: number;
  area: number;
  monthlyRent: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';
  propertyName: string;
  buildingName: string;
  activeContractId?: number;
  tenantName?: string;
  contractEndDate?: string;
}

export const getRooms = async (workspaceId: number): Promise<Room[]> => {
  try {
    const response = await api.get(`/rooms`, { params: { workspaceId } });
    return response.data.data.items || [];
  } catch (error) {
    console.error('Error fetching rooms', error);
    // Mock data for UI
    return [
      { id: 1, roomCode: 'R-101', name: 'Room 101', floor: 1, area: 45, monthlyRent: 8000000, status: 'OCCUPIED', propertyName: 'Sunrise Tower', buildingName: 'Block A', activeContractId: 101, tenantName: 'Nguyen Van A', contractEndDate: '2027-01-15' },
      { id: 2, roomCode: 'R-102', name: 'Room 102', floor: 1, area: 50, monthlyRent: 9000000, status: 'AVAILABLE', propertyName: 'Sunrise Tower', buildingName: 'Block A' },
      { id: 3, roomCode: 'R-201', name: 'Room 201', floor: 2, area: 45, monthlyRent: 8500000, status: 'MAINTENANCE', propertyName: 'Sunrise Tower', buildingName: 'Block B' },
      { id: 4, roomCode: 'R-305', name: 'Studio 305', floor: 3, area: 30, monthlyRent: 6000000, status: 'OCCUPIED', propertyName: 'Riverside Apartments', buildingName: 'Main', activeContractId: 104, tenantName: 'Tran Thi B', contractEndDate: '2026-10-01' },
    ];
  }
};
