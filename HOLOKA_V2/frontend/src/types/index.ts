// ─── Shared enums & types ────────────────────────────────────────────────────

export type RecordStatus = 'ACTIVE' | 'INACTIVE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ─── Tenant ───────────────────────────────────────────────────────────────────
export interface TenantSummary {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  status: RecordStatus;
  version: number;
}

export interface TenantView {
  id: number;
  workspaceId: number;
  fullName: string;
  phone: string;
  email: string | null;
  identityNumber: string | null;
  dateOfBirth: string | null;
  address: string | null;
  emergencyContact: string | null;
  status: RecordStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantWrite {
  fullName: string;
  phone: string;
  email?: string;
  identityNumber?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  status: RecordStatus;
  version?: number;
}

// ─── Contract ─────────────────────────────────────────────────────────────────
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface ContractView {
  id: number;
  workspaceId: number;
  propertyId: number;
  contractCode: string;
  tenantId: number;
  roomId: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: ContractStatus;
  terms: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContractWrite {
  contractCode: string;
  tenantId: number;
  roomId: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: ContractStatus;
  terms?: string;
  version?: number;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────
export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED'
  | 'OVERDUE';

export interface InvoiceView {
  id: number;
  workspaceId: number;
  propertyId: number;
  tenantId: number;
  roomId: number;
  contractId: number;
  invoiceCode: string;
  billingMonth: string;
  dueDate: string;
  rentAmount: number;
  electricityAmount: number;
  waterAmount: number;
  serviceAmount: number;
  otherAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Maintenance ─────────────────────────────────────────────────────────────
export type MaintenanceStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MaintenanceView {
  id: number;
  workspaceId: number;
  propertyId: number;
  buildingId: number | null;
  roomId: number | null;
  tenantId: number | null;
  requestCode: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: MaintenanceStatus;
  assignedUserId: number | null;
  estimatedCost: number;
  actualCost: number;
  reportedAt: string;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceCreate {
  requestCode: string;
  propertyId: number;
  buildingId?: number;
  roomId?: number;
  tenantId?: number;
  title: string;
  description?: string;
  priority: Priority;
  estimatedCost: number;
}

// ─── Task ─────────────────────────────────────────────────────────────────────
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TaskView {
  id: number;
  workspaceId: number;
  propertyId: number;
  roomId: number | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  assignedUserId: number | null;
  dueDate: string;
  overdue: boolean;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreate {
  propertyId: number;
  roomId?: number;
  title: string;
  description?: string;
  priority: Priority;
  dueDate: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType = 'CONTRACT' | 'PAYMENT' | 'MAINTENANCE' | 'TASK' | 'SYSTEM';
export type AlertCategory = 'URGENT' | 'NEEDS_ATTENTION' | 'UPCOMING';

export interface NotificationView {
  id: number;
  workspaceId: number;
  propertyId: number;
  rule: string;
  type: NotificationType;
  sourceId: number;
  sourcePath: string;
  title: string;
  message: string;
  category: AlertCategory;
  read: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
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

// ─── Re-exports from Inventory Services ───────────────────────────────────────
export type { Property, PropertyWrite } from '../services/propertyService';
export type { Building, BuildingWrite } from '../services/buildingService';
export type { Room, RoomWrite } from '../services/roomService';
