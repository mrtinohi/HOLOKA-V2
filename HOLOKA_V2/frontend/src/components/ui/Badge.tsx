import type { Priority, ContractStatus, InvoiceStatus, MaintenanceStatus, TaskStatus, RecordStatus, AlertCategory } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
}

const variantStyles: Record<string, { color: string; bg: string; border: string }> = {
  success: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  warning: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  danger:  { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  info:    { color: '#0284c7', bg: '#f0f9ff', border: '#7dd3fc' },
  neutral: { color: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
  purple:  { color: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd' },
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
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
