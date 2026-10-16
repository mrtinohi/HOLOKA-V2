import { useState, useEffect, useCallback } from 'react';
import { Search, Wrench, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  listMaintenance,
  createMaintenance,
  updateMaintenanceStatus,
} from '../services/maintenanceService';
import type { MaintenanceView, MaintenanceCreate, MaintenanceStatus, Priority } from '../types';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { MaintenanceBadge, PriorityBadge } from '../components/ui/Badge';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

/* ── Status columns for kanban ───────────────────────────────────────────── */
const COLUMNS: { status: MaintenanceStatus; label: string; color: string; bg: string }[] = [
  { status: 'OPEN',        label: '🔴 Mới',         color: '#dc2626', bg: '#fef2f2' },
  { status: 'ASSIGNED',    label: '🔵 Đã phân công', color: '#0284c7', bg: '#f0f9ff' },
  { status: 'IN_PROGRESS', label: '🟡 Đang xử lý',  color: '#d97706', bg: '#fffbeb' },
  { status: 'COMPLETED',   label: '🟢 Hoàn thành',  color: '#059669', bg: '#ecfdf5' },
];

/* ── Create Form ─────────────────────────────────────────────────────────── */
function CreateForm({ onSubmit, onCancel, loading, propertyId }: {
  onSubmit: (v: MaintenanceCreate) => void;
  onCancel: () => void;
  loading: boolean;
  propertyId?: number;
}) {
  const [form, setForm] = useState<MaintenanceCreate>({
    requestCode: `MNT-${Date.now()}`,
    propertyId: propertyId ?? 0,
    title: '',
    description: '',
    priority: 'MEDIUM',
    estimatedCost: 0,
  });
  const set = <K extends keyof MaintenanceCreate>(k: K, v: MaintenanceCreate[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const inputCls = 'w-full px-3 py-2 rounded-xl border text-sm focus:outline-none';
  const inputStyle = { borderColor: '#e2e8f0' };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Mã yêu cầu *</label>
          <input required className={inputCls} style={inputStyle} value={form.requestCode} onChange={e => set('requestCode', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Property ID *</label>
          <input required type="number" className={inputCls} style={inputStyle} value={form.propertyId || ''} onChange={e => set('propertyId', Number(e.target.value))} placeholder="1" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Tiêu đề *</label>
          <input required className={inputCls} style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Rò rỉ ống nước tầng 3..." />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Mô tả</label>
          <textarea className={inputCls} style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Chi tiết vấn đề..." />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Mức độ ưu tiên</label>
          <select className={inputCls} style={inputStyle} value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
            <option value="LOW">Thấp</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HIGH">Cao</option>
            <option value="URGENT">Khẩn cấp</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Chi phí dự kiến (VND)</label>
          <input type="number" min="0" className={inputCls} style={inputStyle} value={form.estimatedCost} onChange={e => set('estimatedCost', Number(e.target.value))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>Hủy</button>
        <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          {loading ? 'Đang tạo…' : 'Tạo yêu cầu'}
        </button>
      </div>
    </form>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────────── */
function MaintenanceCard({ item, onMove, wsId }: { item: MaintenanceView; onMove: () => void; wsId: number }) {
  const nextStatus: Partial<Record<MaintenanceStatus, MaintenanceStatus>> = {
    OPEN: 'IN_PROGRESS',
    ASSIGNED: 'IN_PROGRESS',
    IN_PROGRESS: 'COMPLETED',
  };
  const next = nextStatus[item.status];

  const doMove = async () => {
    if (!next) return;
    await updateMaintenanceStatus(wsId, item.id, next, item.version);
    onMove();
  };

  return (
    <div
      className="fade-in rounded-2xl p-4 space-y-3"
      style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold" style={{ color: '#0f172a', lineHeight: 1.4 }}>{item.title}</p>
        <PriorityBadge priority={item.priority} />
      </div>

      {item.description && (
        <p className="text-xs line-clamp-2" style={{ color: '#94a3b8' }}>{item.description}</p>
      )}

      <div className="flex items-center justify-between text-xs" style={{ color: '#64748b' }}>
        <span>Property #{item.propertyId}</span>
        <span>{fmtDate(item.reportedAt)}</span>
      </div>

      {item.estimatedCost > 0 && (
        <p className="text-xs font-medium" style={{ color: '#475569' }}>
          Dự kiến: {fmt(item.estimatedCost)}
        </p>
      )}

      {next && (
        <button
          onClick={doMove}
          className="w-full py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
        >
          → {next === 'COMPLETED' ? 'Đánh dấu hoàn thành' : 'Bắt đầu xử lý'}
        </button>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function MaintenancePage() {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;

  const [items, setItems] = useState<MaintenanceView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const load = useCallback(() => {
    setLoading(true);
    listMaintenance(wsId, {
      search: search || undefined,
      priority: (priorityFilter as Priority) || undefined,
      size: 100,
    })
      .then(res => setItems(res.items))
      .finally(() => setLoading(false));
  }, [wsId, search, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form: MaintenanceCreate) => {
    setSaving(true);
    try {
      await createMaintenance(wsId, form);
      setCreateOpen(false);
      load();
    } finally { setSaving(false); }
  };

  const byStatus = (status: MaintenanceStatus) => items.filter(i => i.status === status);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Bảo trì</h1>
          <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>Theo dõi và xử lý yêu cầu bảo trì.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
            {(['kanban', 'table'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={viewMode === m
                  ? { background: '#fff', color: '#0f172a', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                  : { color: '#64748b' }
                }
              >
                {m === 'kanban' ? 'Kanban' : 'Bảng'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            <Plus size={17} /> Tạo yêu cầu
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card fade-in flex flex-col sm:flex-row gap-3 p-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: '#e2e8f0' }}
            placeholder="Tìm theo tiêu đề, mã yêu cầu…"
            value={search}
            onChange={e => { setSearch(e.target.value); }}
          />
        </div>
        <select
          className="px-3 py-2 rounded-xl border text-sm"
          style={{ borderColor: '#e2e8f0', color: '#374151' }}
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value as Priority | '')}
        >
          <option value="">Tất cả ưu tiên</option>
          <option value="URGENT">Khẩn cấp</option>
          <option value="HIGH">Cao</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="LOW">Thấp</option>
        </select>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 fade-in">
          {COLUMNS.map(col => {
            const colItems = byStatus(col.status);
            return (
              <div key={col.status} className="rounded-2xl p-4 space-y-3" style={{ background: col.bg, border: `1px solid ${col.color}20` }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: col.color }}>{col.label}</h3>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: col.color, color: '#fff' }}
                  >
                    {colItems.length}
                  </span>
                </div>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
                ) : colItems.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs" style={{ color: '#94a3b8' }}>Trống</p>
                  </div>
                ) : colItems.map(item => (
                  <MaintenanceCard key={item.id} item={item} onMove={load} wsId={wsId} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card fade-in overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <tr>
                  {['Mã YC', 'Tiêu đề', 'Property', 'Ưu tiên', 'Trạng thái', 'Chi phí', 'Ngày tạo'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" style={{ width: 80 + j * 10 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={Wrench} title="Chưa có yêu cầu bảo trì" /></td></tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} className="transition-colors" style={{ borderBottom: '1px solid #f8fafc', animationDelay: `${i * 0.02}s` }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-5 py-4 font-mono text-xs font-semibold" style={{ color: '#475569' }}>{item.requestCode}</td>
                    <td className="px-5 py-4 font-medium max-w-xs truncate" style={{ color: '#0f172a' }}>{item.title}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#64748b' }}>#{item.propertyId}</td>
                    <td className="px-5 py-4"><PriorityBadge priority={item.priority} /></td>
                    <td className="px-5 py-4"><MaintenanceBadge status={item.status} /></td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#64748b' }}>{item.estimatedCost > 0 ? fmt(item.estimatedCost) : '—'}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#94a3b8' }}>{fmtDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Tạo yêu cầu bảo trì" size="lg">
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={saving} />
      </Modal>
    </div>
  );
}
