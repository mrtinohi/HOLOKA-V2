import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Calendar, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listContracts, activateContract, terminateContract } from '../services/contractService';
import type { ContractView, ContractStatus } from '../types';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { ContractStatusBadge } from '../components/ui/Badge';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

/* ── Row menu ────────────────────────────────────────────────────────────── */
function ContractActions({
  contract,
  onAction,
}: {
  contract: ContractView;
  onAction: () => void;
}) {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;
  const [open, setOpen] = useState(false);

  const doActivate = async () => {
    await activateContract(wsId, contract.id, contract.version);
    setOpen(false);
    onAction();
  };
  const doTerminate = async () => {
    await terminateContract(wsId, contract.id, contract.version);
    setOpen(false);
    onAction();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0' }}
      >
        Thao tác <ChevronDown size={12} />
      </button>
      {open && (
        <div
          className="absolute right-0 z-10 w-44 rounded-xl shadow-xl py-1 fade-in"
          style={{ background: '#fff', border: '1px solid #e2e8f0', top: '110%' }}
        >
          {contract.status === 'DRAFT' && (
            <button
              onClick={doActivate}
              className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-green-700"
            >
              ✓ Kích hoạt hợp đồng
            </button>
          )}
          {contract.status === 'ACTIVE' && (
            <button
              onClick={doTerminate}
              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
            >
              ✕ Chấm dứt hợp đồng
            </button>
          )}
          {!['DRAFT', 'ACTIVE'].includes(contract.status) && (
            <p className="px-4 py-2 text-xs text-slate-400">Không có hành động</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function ContractsPage() {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;

  const [contracts, setContracts] = useState<ContractView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
  const [page, setPage] = useState(0);
  const [detailContract, setDetailContract] = useState<ContractView | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listContracts(wsId, {
      search: search || undefined,
      status: (statusFilter as ContractStatus) || undefined,
      page,
      size: 20,
    })
      .then(res => { setContracts(res.items); setTotal(res.totalElements); })
      .finally(() => setLoading(false));
  }, [wsId, search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Hợp đồng</h1>
          <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
            Quản lý tất cả hợp đồng thuê phòng.
          </p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 fade-in">
        {[
          { label: 'Tổng hợp đồng', value: total, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
          { label: 'Đang hiệu lực', value: contracts.filter(c => c.status === 'ACTIVE').length, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Sắp hết hạn', value: contracts.filter(c => c.status === 'ACTIVE' && daysUntil(c.endDate) <= 30 && daysUntil(c.endDate) > 0).length, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Đã hết hạn', value: contracts.filter(c => c.status === 'EXPIRED').length, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>{s.label}</p>
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
            placeholder="Tìm theo mã hợp đồng…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select
          className="px-3 py-2 rounded-xl border text-sm"
          style={{ borderColor: '#e2e8f0', color: '#374151' }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as ContractStatus | ''); setPage(0); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="ACTIVE">Đang hiệu lực</option>
          <option value="EXPIRED">Hết hạn</option>
          <option value="TERMINATED">Đã chấm dứt</option>
        </select>
      </div>

      {/* Table */}
      <div className="card fade-in overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                {['Mã HĐ', 'Tenant', 'Thời hạn', 'Tiền thuê', 'Cọc', 'Còn lại', 'Trạng thái', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748b' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton h-4 rounded" style={{ width: j === 0 ? 80 : 100 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : contracts.length === 0 ? (
                <tr><td colSpan={8}>
                  <EmptyState icon={FileText} title="Chưa có hợp đồng" description="Hợp đồng sẽ hiển thị sau khi được tạo." />
                </td></tr>
              ) : contracts.map((c, i) => {
                const days = daysUntil(c.endDate);
                const expiringSoon = c.status === 'ACTIVE' && days > 0 && days <= 30;
                return (
                  <tr
                    key={c.id}
                    className="group transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid #f8fafc', animationDelay: `${i * 0.03}s` }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setDetailContract(c)}
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {c.contractCode}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: '#0f172a' }}>Tenant #{c.tenantId}</p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>Phòng #{c.roomId}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                        <Calendar size={12} />
                        <span>{fmtDate(c.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: expiringSoon ? '#f59e0b' : '#94a3b8' }}>
                        <span>→ {fmtDate(c.endDate)}</span>
                        {expiringSoon && <span className="font-semibold">({days}d)</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold" style={{ color: '#0f172a' }}>
                      {fmt(c.monthlyRent)}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#64748b' }}>
                      {fmt(c.deposit)}
                    </td>
                    <td className="px-5 py-4">
                      {c.status === 'ACTIVE' ? (
                        <span className={`text-sm font-semibold ${days <= 0 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-slate-600'}`}>
                          {days <= 0 ? 'Đã hết hạn' : `${days} ngày`}
                        </span>
                      ) : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <ContractStatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <ContractActions contract={c} onAction={load} />
                    </td>
                  </tr>
                );
              })}
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

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailContract}
        onClose={() => setDetailContract(null)}
        title={`Hợp đồng ${detailContract?.contractCode ?? ''}`}
        subtitle="Chi tiết hợp đồng thuê phòng"
        size="md"
      >
        {detailContract && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Mã HĐ', value: detailContract.contractCode },
                { label: 'Trạng thái', value: <ContractStatusBadge status={detailContract.status} /> },
                { label: 'Ngày bắt đầu', value: fmtDate(detailContract.startDate) },
                { label: 'Ngày kết thúc', value: fmtDate(detailContract.endDate) },
                { label: 'Tiền thuê / tháng', value: fmt(detailContract.monthlyRent) },
                { label: 'Tiền cọc', value: fmt(detailContract.deposit) },
                { label: 'Tenant ID', value: `#${detailContract.tenantId}` },
                { label: 'Phòng ID', value: `#${detailContract.roomId}` },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>{row.label}</p>
                  <p className="font-medium" style={{ color: '#0f172a' }}>{row.value as React.ReactNode}</p>
                </div>
              ))}
            </div>
            {detailContract.terms && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Điều khoản</p>
                <p className="text-sm p-3 rounded-xl" style={{ background: '#f8fafc', color: '#475569' }}>{detailContract.terms}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
