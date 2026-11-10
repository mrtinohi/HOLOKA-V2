import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, DollarSign, CheckCircle2, Receipt } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { listInvoices } from '../services/financeService';
import type { InvoiceView, InvoiceStatus } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { InvoiceStatusBadge } from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import { Pagination } from '../components/ui/ResourceControls';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const PAGE_SIZE = 20;

export default function FinancePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;

  const [invoices, setInvoices] = useState<InvoiceView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    listInvoices(wsId, {
      status: (statusFilter as InvoiceStatus) || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then(res => { if (active) { setInvoices(res.items); setTotal(res.totalElements); } })
      .catch(() => { if (active) setError(isVi ? 'Không tải được danh sách hóa đơn.' : 'Failed to load invoices.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wsId, statusFilter, page, isVi]);

  useEffect(() => load(), [load]);

  const paidAmount = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
  const outstanding = invoices.reduce((s, i) => s + Number(i.remainingAmount), 0);
  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
  const paidCount = invoices.filter(i => i.status === 'PAID').length;

  const filtered = search
    ? invoices.filter(i => i.invoiceCode.toLowerCase().includes(search.trim().toLowerCase()))
    : invoices;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {isVi ? 'Hóa đơn & dòng tiền' : 'Invoices & Payments'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {isVi ? 'Theo dõi hóa đơn, công nợ và tình hình thu tiền.' : 'Track invoices, receivables, and cashflow.'}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={isVi ? 'Đã thu' : 'Collected'}
          value={fmt(paidAmount)}
          icon={TrendingUp}
          tone="success"
          hint={isVi ? 'Trong kỳ đang xem' : 'Current period'}
        />
        <StatCard
          title={isVi ? 'Còn nợ' : 'Outstanding'}
          value={fmt(outstanding)}
          icon={TrendingDown}
          tone={outstanding > 0 ? 'danger' : 'success'}
          hint={outstanding > 0 ? (isVi ? 'Cần nhắc khách thanh toán' : 'Payment reminder needed') : (isVi ? 'Đã thu đủ' : 'Fully paid')}
        />
        <StatCard
          title={isVi ? 'Quá hạn' : 'Overdue'}
          value={overdueCount}
          icon={DollarSign}
          tone={overdueCount > 0 ? 'warning' : 'neutral'}
          hint={isVi ? 'Hóa đơn quá hạn' : 'Overdue invoices'}
        />
        <StatCard
          title={isVi ? 'Đã thanh toán' : 'Paid Invoices'}
          value={paidCount}
          icon={CheckCircle2}
          tone="brand"
          hint={isVi ? 'Hóa đơn hoàn tất' : 'Completed invoices'}
        />
      </div>

      {/* Toolbar */}
      <div className="card p-3 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-9"
            type="search"
            placeholder={isVi ? 'Tìm theo mã hóa đơn…' : 'Search by invoice code…'}
            aria-label={isVi ? 'Tìm hóa đơn' : 'Search invoices'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-52"
          aria-label={isVi ? 'Lọc theo trạng thái' : 'Filter by status'}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as InvoiceStatus | ''); setPage(0); }}
        >
          <option value="">{isVi ? 'Tất cả trạng thái' : 'All Statuses'}</option>
          <option value="DRAFT">{isVi ? 'Nháp' : 'Draft'}</option>
          <option value="ISSUED">{isVi ? 'Đã xuất' : 'Issued'}</option>
          <option value="PARTIALLY_PAID">{isVi ? 'Trả một phần' : 'Partial'}</option>
          <option value="PAID">{isVi ? 'Đã thanh toán' : 'Paid'}</option>
          <option value="OVERDUE">{isVi ? 'Quá hạn' : 'Overdue'}</option>
          <option value="CANCELLED">{isVi ? 'Đã hủy' : 'Cancelled'}</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {[
                  isVi ? 'Mã HĐ' : 'Invoice #',
                  isVi ? 'Tháng' : 'Month',
                  isVi ? 'Hạn TT' : 'Due Date',
                  isVi ? 'Tiền thuê' : 'Rent',
                  isVi ? 'Điện / Nước' : 'Utilities',
                  isVi ? 'Tổng' : 'Total',
                  isVi ? 'Đã thu' : 'Collected',
                  isVi ? 'Còn nợ' : 'Remaining',
                  isVi ? 'Trạng thái' : 'Status',
                ].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4" style={{ width: 72 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={Receipt}
                      title={isVi ? 'Chưa có hóa đơn' : 'No invoices found'}
                      description={isVi ? 'Hóa đơn sẽ hiển thị khi được tạo từ hợp đồng.' : 'Invoices will appear here once generated from contracts.'}
                    />
                  </td>
                </tr>
              ) : filtered.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <span
                      className="font-mono text-xs font-semibold px-2 py-1 rounded-md"
                      style={{ background: 'var(--surface-subtle)', color: 'var(--text-secondary)' }}
                    >
                      {inv.invoiceCode}
                    </span>
                  </td>
                  <td className="font-medium">{inv.billingMonth}</td>
                  <td style={{ color: inv.status === 'OVERDUE' ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {fmtDate(inv.dueDate)}
                  </td>
                  <td className="tabular-nums">{fmt(inv.rentAmount)}</td>
                  <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {fmt(Number(inv.electricityAmount) + Number(inv.waterAmount))}
                  </td>
                  <td className="font-semibold tabular-nums">{fmt(inv.totalAmount)}</td>
                  <td className="font-semibold tabular-nums" style={{ color: 'var(--success)' }}>{fmt(inv.paidAmount)}</td>
                  <td className="tabular-nums" style={{ color: Number(inv.remainingAmount) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {Number(inv.remainingAmount) > 0 ? fmt(inv.remainingAmount) : '—'}
                  </td>
                  <td><InvoiceStatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination page={page} total={total} size={PAGE_SIZE} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
