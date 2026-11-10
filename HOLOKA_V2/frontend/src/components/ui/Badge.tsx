import React from 'react';
import type { Priority, ContractStatus, InvoiceStatus, MaintenanceStatus, TaskStatus, RecordStatus, AlertCategory } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantClass: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  info:    'badge-info',
  neutral: 'badge-neutral',
  brand:   'badge-brand',
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return <span className={`badge ${variantClass[variant] ?? variantClass.neutral}`}>{children}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const map: Record<Priority, { label: string; variant: BadgeVariant }> = {
    LOW:    { label: isVi ? 'Thấp' : 'Low',            variant: 'neutral' },
    MEDIUM: { label: isVi ? 'Trung bình' : 'Medium',    variant: 'info' },
    HIGH:   { label: isVi ? 'Cao' : 'High',            variant: 'warning' },
    URGENT: { label: isVi ? 'Khẩn cấp' : 'Urgent',     variant: 'danger' },
  };
  const { label, variant } = map[priority] ?? { label: priority, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const map: Record<ContractStatus, { label: string; variant: BadgeVariant }> = {
    DRAFT:      { label: isVi ? 'Nháp' : 'Draft',                     variant: 'neutral' },
    ACTIVE:     { label: isVi ? 'Đang hiệu lực' : 'Active',           variant: 'success' },
    EXPIRED:    { label: isVi ? 'Hết hạn' : 'Expired',                variant: 'warning' },
    TERMINATED: { label: isVi ? 'Đã chấm dứt' : 'Terminated',         variant: 'danger' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    DRAFT:          { label: isVi ? 'Nháp' : 'Draft',                 variant: 'neutral' },
    ISSUED:         { label: isVi ? 'Đã xuất' : 'Issued',             variant: 'info' },
    PARTIALLY_PAID: { label: isVi ? 'Trả một phần' : 'Partial',       variant: 'warning' },
    PAID:           { label: isVi ? 'Đã thanh toán' : 'Paid',         variant: 'success' },
    CANCELLED:      { label: isVi ? 'Đã hủy' : 'Cancelled',           variant: 'neutral' },
    OVERDUE:        { label: isVi ? 'Quá hạn' : 'Overdue',            variant: 'danger' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function MaintenanceBadge({ status }: { status: MaintenanceStatus }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const map: Record<MaintenanceStatus, { label: string; variant: BadgeVariant }> = {
    OPEN:        { label: isVi ? 'Mới' : 'Open',                     variant: 'danger' },
    ASSIGNED:    { label: isVi ? 'Đã phân công' : 'Assigned',        variant: 'info' },
    IN_PROGRESS: { label: isVi ? 'Đang xử lý' : 'In Progress',       variant: 'warning' },
    WAITING:     { label: isVi ? 'Chờ xử lý' : 'Pending',            variant: 'brand' },
    COMPLETED:   { label: isVi ? 'Hoàn thành' : 'Completed',         variant: 'success' },
    CANCELLED:   { label: isVi ? 'Đã hủy' : 'Cancelled',             variant: 'neutral' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const map: Record<TaskStatus, { label: string; variant: BadgeVariant }> = {
    TODO:        { label: isVi ? 'Cần làm' : 'To Do',                variant: 'neutral' },
    IN_PROGRESS: { label: isVi ? 'Đang làm' : 'In Progress',         variant: 'info' },
    COMPLETED:   { label: isVi ? 'Hoàn thành' : 'Completed',         variant: 'success' },
    CANCELLED:   { label: isVi ? 'Đã hủy' : 'Cancelled',             variant: 'neutral' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  return status === 'ACTIVE'
    ? <Badge variant="success">{isVi ? 'Hoạt động' : 'Active'}</Badge>
    : <Badge variant="neutral">{isVi ? 'Ngừng hoạt động' : 'Inactive'}</Badge>;
}

export function AlertCategoryBadge({ category }: { category: AlertCategory }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const map: Record<AlertCategory, { label: string; variant: BadgeVariant }> = {
    URGENT:          { label: isVi ? 'Khẩn cấp' : 'Urgent',           variant: 'danger' },
    NEEDS_ATTENTION: { label: isVi ? 'Cần chú ý' : 'Needs Attention',  variant: 'warning' },
    UPCOMING:        { label: isVi ? 'Sắp tới' : 'Upcoming',          variant: 'success' },
  };
  const { label, variant } = map[category] ?? { label: category, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}
