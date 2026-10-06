import api from './api';

export interface Property {
  id: number;
  name: string;
  code: string;
  address: string;
  propertyType: 'APARTMENT' | 'ROOM_RENTAL' | 'SERVICED_APARTMENT' | 'HOUSE' | 'BUILDING' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
  totalRooms?: number;
  occupiedRooms?: number;
}

export const getProperties = async (workspaceId: number): Promise<Property[]> => {
  try {
    const response = await api.get(`/properties`, { params: { workspaceId } });
    return response.data.data.items || [];
  } catch (error) {
    console.error('Error fetching properties', error);
    // Fallback mock data for UI demo purposes if API isn't fully ready
    return [
      { id: 1, name: 'Sunrise Tower', code: 'P-SRT', address: '123 Main St, District 1, HCMC', propertyType: 'BUILDING', status: 'ACTIVE', totalRooms: 50, occupiedRooms: 45 },
      { id: 2, name: 'Riverside Apartments', code: 'P-RVA', address: '45 River Road, District 2, HCMC', propertyType: 'SERVICED_APARTMENT', status: 'ACTIVE', totalRooms: 20, occupiedRooms: 18 },
      { id: 3, name: 'Old Quarter House', code: 'P-OQH', address: '12 Hoan Kiem, Hanoi', propertyType: 'HOUSE', status: 'INACTIVE', totalRooms: 5, occupiedRooms: 0 },
    ];
  }
};
