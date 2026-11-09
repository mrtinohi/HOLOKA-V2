import React from 'react';
import type { Priority, ContractStatus, InvoiceStatus, MaintenanceStatus, TaskStatus, RecordStatus, AlertCategory } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
}

const variantClasses: Record<string, string> = {
  success: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60',
  warning: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800/60',
  danger:  'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800/60',
  info:    'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/60 dark:border-sky-800/60',
  neutral: 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700',
  purple:  'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/60 dark:border-purple-800/60',
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const cls = variantClasses[variant] || variantClasses.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 ${cls}`}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, { label: string; variant: BadgeProps['variant'] }> = {
    LOW:    { label: 'Thấp',    variant: 'neutral' },
    MEDIUM: { label: 'Trung bình', variant: 'info' },
    HIGH:   { label: 'Cao',     variant: 'warning' },
    URGENT: { label: 'Khẩn cấp', variant: 'danger' },
  };
  const { label, variant } = map[priority] ?? { label: priority, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const map: Record<ContractStatus, { label: string; variant: BadgeProps['variant'] }> = {
    DRAFT:      { label: 'Nháp',       variant: 'neutral' },
    ACTIVE:     { label: 'Đang hiệu lực', variant: 'success' },
    EXPIRED:    { label: 'Hết hạn',    variant: 'warning' },
    TERMINATED: { label: 'Đã chấm dứt', variant: 'danger' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    DRAFT:          { label: 'Nháp',         variant: 'neutral' },
    ISSUED:         { label: 'Đã xuất',      variant: 'info' },
    PARTIALLY_PAID: { label: 'Trả một phần', variant: 'warning' },
    PAID:           { label: 'Đã thanh toán', variant: 'success' },
    CANCELLED:      { label: 'Đã hủy',       variant: 'neutral' },
    OVERDUE:        { label: 'Quá hạn',      variant: 'danger' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function MaintenanceBadge({ status }: { status: MaintenanceStatus }) {
  const map: Record<MaintenanceStatus, { label: string; variant: BadgeProps['variant'] }> = {
    OPEN:        { label: 'Mở',           variant: 'danger' },
    ASSIGNED:    { label: 'Đã phân công', variant: 'info' },
    IN_PROGRESS: { label: 'Đang xử lý',  variant: 'warning' },
    WAITING:     { label: 'Chờ xử lý',   variant: 'purple' },
    COMPLETED:   { label: 'Hoàn thành',  variant: 'success' },
    CANCELLED:   { label: 'Đã hủy',      variant: 'neutral' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; variant: BadgeProps['variant'] }> = {
    TODO:        { label: 'Cần làm',     variant: 'neutral' },
    IN_PROGRESS: { label: 'Đang làm',   variant: 'info' },
    COMPLETED:   { label: 'Hoàn thành', variant: 'success' },
    CANCELLED:   { label: 'Đã hủy',     variant: 'neutral' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  return status === 'ACTIVE'
    ? <Badge variant="success">Hoạt động</Badge>
    : <Badge variant="neutral">Không hoạt động</Badge>;
}

export function AlertCategoryBadge({ category }: { category: AlertCategory }) {
  const map: Record<AlertCategory, { label: string; variant: BadgeProps['variant'] }> = {
    URGENT:           { label: '🔴 Khẩn cấp',   variant: 'danger' },
    NEEDS_ATTENTION:  { label: '🟡 Cần chú ý',  variant: 'warning' },
    UPCOMING:         { label: '🟢 Sắp tới',    variant: 'success' },
  };
  const { label, variant } = map[category] ?? { label: category, variant: 'neutral' };
  return <Badge variant={variant}>{label}</Badge>;
}

