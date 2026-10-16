import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listInvoices } from '../services/financeService';
import type { InvoiceView, InvoiceStatus } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { InvoiceStatusBadge } from '../components/ui/Badge';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function FinancePage() {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;

  const [invoices, setInvoices] = useState<InvoiceView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    listInvoices(wsId, {
      status: (statusFilter as InvoiceStatus) || undefined,
      page,
      size: 20,
    })
      .then(res => { setInvoices(res.items); setTotal(res.totalElements); })
      .finally(() => setLoading(false));
  }, [wsId, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Computed stats
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + Number(i.remainingAmount), 0);
  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
  const paidCount = invoices.filter(i => i.status === 'PAID').length;

  const filtered = search
    ? invoices.filter(i => i.invoiceCode.toLowerCase().includes(search.toLowerCase()))
    : invoices;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in">
        <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Tài chính</h1>
        <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
          Quản lý hóa đơn, doanh thu và chi phí.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
        {[
          {
            label: 'Đã thu',
            value: fmt(totalRevenue),
            icon: TrendingUp,
            gradient: 'linear-gradient(135deg,#10b981,#34d399)',
          },
          {
            label: 'Còn nợ',
            value: fmt(totalOutstanding),
            icon: TrendingDown,
            gradient: totalOutstanding > 0
              ? 'linear-gradient(135deg,#f43f5e,#fb7185)'
              : 'linear-gradient(135deg,#10b981,#34d399)',
          },
          {
            label: 'Quá hạn',
            value: overdueCount,
            icon: DollarSign,
            gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
          },
          {
            label: 'Đã thanh toán',
            value: paidCount,
            icon: DollarSign,
            gradient: 'linear-gradient(135deg,#6366f1,#818cf8)',
          },
        ].map((s, i) => (
          <div key={s.label} className="card p-5 fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: s.gradient }}
              >
                <s.icon size={18} color="white" />
              </div>
            </div>
            <p className="text-xl font-bold mt-3" style={{ color: '#0f172a' }}>{s.value}</p>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card fade-in flex flex-col sm:flex-row gap-3 p-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: '#e2e8f0' }}
            placeholder="Tìm theo mã hóa đơn…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-xl border text-sm"
          style={{ borderColor: '#e2e8f0', color: '#374151' }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as InvoiceStatus | ''); setPage(0); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ISSUED">Đã xuất</option>
          <option value="PARTIALLY_PAID">Trả một phần</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="OVERDUE">Quá hạn</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Table */}
      <div className="card fade-in overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                {['Mã HĐ', 'Tháng', 'Hạn TT', 'Tiền thuê', 'Điện/Nước', 'Tổng', 'Đã thu', 'Còn nợ', 'Trạng thái'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="skeleton h-4 rounded" style={{ width: 80 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState icon={DollarSign} title="Chưa có hóa đơn" description="Hóa đơn sẽ hiển thị khi được tạo từ hợp đồng." />
                  </td>
                </tr>
              ) : filtered.map((inv, i) => (
                <tr
                  key={inv.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid #f8fafc', animationDelay: `${i * 0.02}s` }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: '#f1f5f9', color: '#475569' }}>
                      {inv.invoiceCode}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium" style={{ color: '#0f172a' }}>{inv.billingMonth}</td>
                  <td className="px-4 py-4 text-sm" style={{ color: inv.status === 'OVERDUE' ? '#f43f5e' : '#64748b' }}>
                    {fmtDate(inv.dueDate)}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: '#374151' }}>{fmt(inv.rentAmount)}</td>
                  <td className="px-4 py-4 text-sm" style={{ color: '#64748b' }}>
                    {fmt(Number(inv.electricityAmount) + Number(inv.waterAmount))}
                  </td>
                  <td className="px-4 py-4 font-semibold" style={{ color: '#0f172a' }}>{fmt(inv.totalAmount)}</td>
                  <td className="px-4 py-4 font-semibold" style={{ color: '#10b981' }}>{fmt(inv.paidAmount)}</td>
                  <td className="px-4 py-4" style={{ color: Number(inv.remainingAmount) > 0 ? '#f43f5e' : '#94a3b8' }}>
                    {Number(inv.remainingAmount) > 0 ? fmt(inv.remainingAmount) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Trang {page + 1} / {Math.ceil(total / 20)}</p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>← Trước</button>
              <button disabled={page >= Math.ceil(total / 20) - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>Sau →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
