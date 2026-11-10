import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Calendar, ChevronDown, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { listContracts, activateContract, terminateContract } from '../services/contractService';
import type { ContractView, ContractStatus } from '../types';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { ContractStatusBadge } from '../components/ui/Badge';
import { ErrorNotice, Pagination } from '../components/ui/ResourceControls';
import { errorMessage } from '../services/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const daysUntil = (dateStr: string) =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

const PAGE_SIZE = 20;

function ContractActions({ contract, onAction }: { contract: ContractView; onAction: () => void }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      setOpen(false);
      onAction();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="btn btn-secondary text-xs sm:text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
      >
        <span>{isVi ? 'Thao tác' : 'Actions'}</span>
        <ChevronDown size={13} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 z-20 w-52 py-1 rounded-xl overflow-hidden fade-in"
            style={{
              top: 'calc(100% + 4px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {contract.status === 'DRAFT' && (
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={() => run(() => activateContract(wsId, contract.id, contract.version))}
                className="w-full text-left px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer"
                style={{ color: 'var(--success)' }}
              >
                {isVi ? 'Kích hoạt hợp đồng' : 'Activate Contract'}
              </button>
            )}
            {contract.status === 'ACTIVE' && (
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={() => run(() => terminateContract(wsId, contract.id, contract.version))}
                className="w-full text-left px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer"
                style={{ color: 'var(--danger)' }}
              >
                {isVi ? 'Chấm dứt hợp đồng' : 'Terminate Contract'}
              </button>
            )}
            {!['DRAFT', 'ACTIVE'].includes(contract.status) && (
              <p className="px-3.5 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {isVi ? 'Không có hành động khả dụng' : 'No actions available'}
              </p>
            )}
            {error && (
              <p className="px-3.5 py-2 text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ContractsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;

  const [contracts, setContracts] = useState<ContractView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
  const [page, setPage] = useState(0);
  const [detailContract, setDetailContract] = useState<ContractView | null>(null);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    listContracts(wsId, {
      search: search.trim() || undefined,
      status: (statusFilter as ContractStatus) || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then(res => { if (active) { setContracts(res.items); setTotal(res.totalElements); setError(''); } })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wsId, search, statusFilter, page]);

  useEffect(() => load(), [load]);

  const stats = [
    { label: isVi ? 'Tổng hợp đồng' : 'Total Leases',   value: total,                                                                                              tone: 'var(--brand)' },
    { label: isVi ? 'Đang hiệu lực' : 'Active',         value: contracts.filter(c => c.status === 'ACTIVE').length,                                                tone: 'var(--success)' },
    { label: isVi ? 'Sắp hết hạn' : 'Expiring Soon',     value: contracts.filter(c => c.status === 'ACTIVE' && daysUntil(c.endDate) > 0 && daysUntil(c.endDate) <= 30).length, tone: 'var(--warning)' },
    { label: isVi ? 'Đã hết hạn' : 'Expired',           value: contracts.filter(c => c.status === 'EXPIRED').length,                                               tone: 'var(--danger)' },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isVi ? 'Hợp đồng' : 'Contracts & Leases'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isVi ? 'Quản lý toàn bộ hợp đồng thuê phòng và gia hạn.' : 'Manage all room rental agreements and renewals.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-hub', { detail: { tab: 'priority' } }))}
            className="btn btn-outline inline-flex items-center gap-1.5 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.08))',
              borderColor: 'rgba(245, 158, 11, 0.35)',
            }}
          >
            <Sparkles size={15} className="text-amber-500 animate-pulse" />
            <span className="font-semibold text-xs sm:text-sm">
              {isVi ? 'Cảnh báo hết hạn (AI)' : 'AI Lease Risk'}
            </span>
          </button>
          <button type="button" className="btn btn-primary">
            <Plus size={16} />
            {isVi ? 'Tạo hợp đồng' : 'Create Lease'}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xl font-bold tabular-nums" style={{ color: s.tone }}>{s.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <ErrorNotice message={error} retry={load} />

      {/* Toolbar */}
      <div className="card p-3 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-9"
            type="search"
            placeholder={isVi ? 'Tìm theo mã hợp đồng…' : 'Search by contract code…'}
            aria-label={isVi ? 'Tìm hợp đồng' : 'Search contracts'}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select
          className="input sm:w-52"
          aria-label={isVi ? 'Lọc theo trạng thái' : 'Filter by status'}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as ContractStatus | ''); setPage(0); }}
        >
          <option value="">{isVi ? 'Tất cả trạng thái' : 'All Statuses'}</option>
          <option value="DRAFT">{isVi ? 'Nháp' : 'Draft'}</option>
          <option value="ACTIVE">{isVi ? 'Đang hiệu lực' : 'Active'}</option>
          <option value="EXPIRED">{isVi ? 'Hết hạn' : 'Expired'}</option>
          <option value="TERMINATED">{isVi ? 'Đã chấm dứt' : 'Terminated'}</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {[
                  isVi ? 'Mã HĐ' : 'Contract #',
                  isVi ? 'Khách thuê' : 'Tenant',
                  isVi ? 'Thời hạn' : 'Duration',
                  isVi ? 'Tiền thuê' : 'Rent',
                  isVi ? 'Tiền cọc' : 'Deposit',
                  isVi ? 'Còn lại' : 'Remaining',
                  isVi ? 'Trạng thái' : 'Status',
                ].map(h => <th key={h}>{h}</th>)}
                <th className="text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4" style={{ width: j === 0 ? 84 : 96 }} /></td>
                    ))}
                  </tr>
                ))
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={FileText}
                      title={isVi ? 'Chưa có hợp đồng' : 'No contracts found'}
                      description={isVi ? 'Hợp đồng sẽ hiển thị sau khi được tạo.' : 'Contracts will appear here once created.'}
                    />
                  </td>
                </tr>
              ) : contracts.map(c => {
                const days = daysUntil(c.endDate);
                const expiringSoon = c.status === 'ACTIVE' && days > 0 && days <= 30;
                return (
                  <tr
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setDetailContract(c)}
                  >
                    <td>
                      <span
                        className="font-mono text-xs font-semibold px-2 py-1 rounded-md"
                        style={{ background: 'var(--surface-subtle)', color: 'var(--text-secondary)' }}
                      >
                        {c.contractCode}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium">Tenant #{c.tenantId}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{isVi ? 'Phòng #' : 'Unit #'}{c.roomId}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Calendar size={11} />
                        <span>{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</span>
                      </div>
                    </td>
                    <td className="font-semibold tabular-nums">{fmt(c.monthlyRent)}</td>
                    <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>{fmt(c.deposit)}</td>
                    <td>
                      {c.status === 'ACTIVE' && days > 0 ? (
                        <span
                          className={`text-xs font-semibold ${expiringSoon ? 'font-bold' : ''}`}
                          style={{ color: expiringSoon ? 'var(--warning)' : 'var(--text-muted)' }}
                        >
                          {days} {isVi ? 'ngày' : 'days'}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td><ContractStatusBadge status={c.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <ContractActions contract={c} onAction={load} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination page={page} total={total} size={PAGE_SIZE} onChange={setPage} />
        )}
      </div>

      {detailContract && (
        <Modal
          isOpen={true}
          onClose={() => setDetailContract(null)}
          title={`${isVi ? 'Chi tiết hợp đồng #' : 'Contract Details #'}${detailContract.contractCode}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl" style={{ background: 'var(--surface-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isVi ? 'Tiền thuê/tháng' : 'Monthly Rent'}</p>
                <p className="text-base font-bold mt-1">{fmt(detailContract.monthlyRent)}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--surface-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isVi ? 'Tiền cọc' : 'Deposit'}</p>
                <p className="text-base font-bold mt-1">{fmt(detailContract.deposit)}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl space-y-1 text-xs" style={{ background: 'var(--surface-subtle)', color: 'var(--text-secondary)' }}>
              <p><strong>{isVi ? 'Bắt đầu:' : 'Start Date:'}</strong> {fmtDate(detailContract.startDate)}</p>
              <p><strong>{isVi ? 'Kết thúc:' : 'End Date:'}</strong> {fmtDate(detailContract.endDate)}</p>
              <p><strong>{isVi ? 'Ngày lập hóa đơn:' : 'Billing Day:'}</strong> {isVi ? `Ngày ${new Date(detailContract.startDate).getDate() || 1} hàng tháng` : `Day ${new Date(detailContract.startDate).getDate() || 1} of month`}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setDetailContract(null)} className="btn btn-secondary">
                {isVi ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
