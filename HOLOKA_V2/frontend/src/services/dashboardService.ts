import api from './api';

export interface OverviewData {
  totalProperties: number;
  totalBuildings: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  monthlyRevenue: number;
  monthlyExpense: number;
  outstandingPayments: number;
  activeContracts: number;
  contractsExpiringSoon: number;
  openMaintenance: number;
  pendingTasks: number;
}

export const getDashboardOverview = async (workspaceId: number): Promise<OverviewData> => {
  const response = await api.get(`/dashboard/overview`, {
    params: { workspaceId }
  });
  return response.data.data; // Assuming ApiResponse structure: { success: true, data: { ... } }
};
