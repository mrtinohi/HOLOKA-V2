import { useState, useEffect, useCallback } from 'react';
import { Search, Wrench, Plus, LayoutGrid, Table2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { listMaintenance, createMaintenance, updateMaintenanceStatus } from '../services/maintenanceService';
import type { MaintenanceView, MaintenanceCreate, MaintenanceStatus, Priority } from '../types';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { MaintenanceBadge, PriorityBadge } from '../components/ui/Badge';
import { ErrorNotice, Field } from '../components/ui/ResourceControls';
import { errorMessage } from '../services/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

function CreateForm({
  onSubmit, onCancel, loading, propertyId,
}: {
  onSubmit: (v: MaintenanceCreate) => void;
  onCancel: () => void;
  loading: boolean;
  propertyId?: number;
}) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

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

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={isVi ? 'Mã yêu cầu *' : 'Request Code *'}>
          <input required className="input" value={form.requestCode} onChange={e => set('requestCode', e.target.value)} />
        </Field>
        <Field label={isVi ? 'Bất động sản (ID) *' : 'Property (ID) *'}>
          <input required type="number" min={1} className="input" value={form.propertyId || ''} onChange={e => set('propertyId', Number(e.target.value))} placeholder="1" />
        </Field>
        <div className="sm:col-span-2">
          <Field label={isVi ? 'Tiêu đề *' : 'Title *'}>
            <input required className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder={isVi ? 'Rò rỉ ống nước tầng 3…' : 'Pipe leakage floor 3…'} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={isVi ? 'Mô tả' : 'Description'}>
            <textarea className="textarea" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder={isVi ? 'Chi tiết vấn đề…' : 'Issue details…'} />
          </Field>
        </div>
        <Field label={isVi ? 'Mức độ ưu tiên' : 'Priority'}>
          <select className="input" value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
            <option value="LOW">{isVi ? 'Thấp' : 'Low'}</option>
            <option value="MEDIUM">{isVi ? 'Trung bình' : 'Medium'}</option>
            <option value="HIGH">{isVi ? 'Cao' : 'High'}</option>
            <option value="URGENT">{isVi ? 'Khẩn cấp' : 'Urgent'}</option>
          </select>
        </Field>
        <Field label={isVi ? 'Chi phí dự kiến (VND)' : 'Estimated Cost (VND)'}>
          <input type="number" min="0" className="input" value={form.estimatedCost} onChange={e => set('estimatedCost', Number(e.target.value))} />
        </Field>
      </div>

      <div className="flex justify-end gap-2.5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          {isVi ? 'Hủy' : 'Cancel'}
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? (isVi ? 'Đang tạo…' : 'Creating…') : (isVi ? 'Tạo yêu cầu' : 'Create Request')}
        </button>
      </div>
    </form>
  );
}

function MaintenanceCard({ item, onMove, wsId }: { item: MaintenanceView; onMove: () => void; wsId: number }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const nextStatus: Partial<Record<MaintenanceStatus, MaintenanceStatus>> = {
    OPEN: 'IN_PROGRESS',
    ASSIGNED: 'IN_PROGRESS',
    IN_PROGRESS: 'COMPLETED',
  };
  const next = nextStatus[item.status];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const nextLabelMap: Record<MaintenanceStatus, string> = {
    OPEN: isVi ? 'Mới' : 'Open',
    ASSIGNED: isVi ? 'Đã phân công' : 'Assigned',
    IN_PROGRESS: isVi ? 'Đang xử lý' : 'In Progress',
    WAITING: isVi ? 'Chờ xử lý' : 'Pending',
    COMPLETED: isVi ? 'Hoàn thành' : 'Completed',
    CANCELLED: isVi ? 'Đã hủy' : 'Cancelled',
  };

  const doMove = async () => {
    if (!next) return;
    setBusy(true);
    setError('');
    try {
      await updateMaintenanceStatus(wsId, item.id, next, item.version);
      onMove();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--surface-subtle)', color: 'var(--text-secondary)' }}>
          {item.requestCode}
        </span>
        <PriorityBadge priority={item.priority} />
      </div>

      <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
      {item.description && (
        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
      )}

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{isVi ? 'BĐS #' : 'Property #'}{item.propertyId}</span>
        {item.estimatedCost ? <span>{fmt(item.estimatedCost)}</span> : null}
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

      {next && (
        <button type="button" onClick={doMove} disabled={busy} className="btn btn-secondary w-full">
          {busy ? (isVi ? 'Đang cập nhật…' : 'Updating…') : `${isVi ? 'Chuyển: ' : 'Advance: '}${nextLabelMap[next]}`}
        </button>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;

  const [items, setItems] = useState<MaintenanceView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'board' | 'table'>('board');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    listMaintenance(wsId, { size: 100 })
      .then(res => { if (active) { setItems(res.items); setError(''); } })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wsId]);

  useEffect(() => load(), [load]);

  const handleCreate = async (form: MaintenanceCreate) => {
    setSaving(true);
    try {
      await createMaintenance(wsId, form);
      setCreateOpen(false);
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally { setSaving(false); }
  };

  const filtered = search
    ? items.filter(i =>
        i.title.toLowerCase().includes(search.trim().toLowerCase()) ||
        i.requestCode.toLowerCase().includes(search.trim().toLowerCase()))
    : items;

  const byStatus = (status: MaintenanceStatus) => filtered.filter(i => i.status === status);

  const columns: { status: MaintenanceStatus; label: string; tone: string }[] = [
    { status: 'OPEN',        label: isVi ? 'Mới' : 'Open',                     tone: 'var(--danger)' },
    { status: 'ASSIGNED',    label: isVi ? 'Đã phân công' : 'Assigned',        tone: 'var(--info)' },
    { status: 'IN_PROGRESS', label: isVi ? 'Đang xử lý' : 'In Progress',       tone: 'var(--warning)' },
    { status: 'COMPLETED',   label: isVi ? 'Hoàn thành' : 'Completed',         tone: 'var(--success)' },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isVi ? 'Bảo trì & sự cố' : 'Maintenance & Issues'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {items.length} {isVi ? 'yêu cầu' : 'requests'} · {byStatus('OPEN').length} {isVi ? 'đang chờ' : 'open'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isVi ? 'Tìm kiếm sự cố...' : 'Search issues...'}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="inline-flex rounded-xl p-1" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setView('board')}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={view === 'board' ? { background: 'var(--surface)', color: 'var(--brand-text)' } : { color: 'var(--text-muted)' }}
              title={isVi ? 'Xem dạng bảng Kanban' : 'Kanban board view'}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={view === 'table' ? { background: 'var(--surface)', color: 'var(--brand-text)' } : { color: 'var(--text-muted)' }}
              title={isVi ? 'Xem dạng bảng' : 'Table view'}
            >
              <Table2 size={16} />
            </button>
          </div>

          <button type="button" onClick={() => setCreateOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            {isVi ? 'Tạo yêu cầu' : 'New Request'}
          </button>
        </div>
      </div>

      <ErrorNotice message={error} retry={load} />

      {/* Kanban */}
      {view === 'board' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => {
            const colItems = byStatus(col.status);
            return (
              <section
                key={col.status}
                className="rounded-2xl p-3 space-y-2.5"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
                aria-label={col.label}
              >
                <header className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: col.tone }} />
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{col.label}</h2>
                  </div>
                  <span
                    className="min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums"
                    style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    {colItems.length}
                  </span>
                </header>

                <div className="space-y-2.5">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)
                  ) : colItems.length === 0 ? (
                    <EmptyState icon={Wrench} title={isVi ? 'Trống' : 'Empty'} />
                  ) : colItems.map(item => (
                    <MaintenanceCard key={item.id} item={item} onMove={load} wsId={wsId} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Table view */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {[
                    isVi ? 'Mã' : 'Code',
                    isVi ? 'Tiêu đề' : 'Title',
                    isVi ? 'BĐS' : 'Property',
                    isVi ? 'Ưu tiên' : 'Priority',
                    isVi ? 'Trạng thái' : 'Status',
                    isVi ? 'Chi phí' : 'Cost',
                    isVi ? 'Ngày tạo' : 'Created Date',
                  ].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id}>
                    <td><span className="font-mono text-xs">{i.requestCode}</span></td>
                    <td className="font-medium">{i.title}</td>
                    <td>#{i.propertyId}</td>
                    <td><PriorityBadge priority={i.priority} /></td>
                    <td><MaintenanceBadge status={i.status} /></td>
                    <td className="tabular-nums">{i.estimatedCost ? fmt(i.estimatedCost) : '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(i.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title={isVi ? 'Tạo yêu cầu bảo trì mới' : 'New Maintenance Request'}
        size="md"
      >
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={saving} />
      </Modal>
    </div>
  );
}
