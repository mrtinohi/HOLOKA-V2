import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, UserCheck, Phone, Mail, IdCard, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  listTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from '../services/tenantService';
import type { TenantSummary, TenantView, TenantWrite, RecordStatus } from '../types';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { RecordStatusBadge } from '../components/ui/Badge';

/* ── Form ─────────────────────────────────────────────────────────────────── */
const EMPTY_FORM: TenantWrite = {
  fullName: '', phone: '', email: '', identityNumber: '',
  dateOfBirth: '', address: '', emergencyContact: '', status: 'ACTIVE', version: 0,
};

function TenantForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial: TenantWrite;
  onSubmit: (v: TenantWrite) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<TenantWrite>(initial);
  const set = (k: keyof TenantWrite, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inputCls =
    'w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-shadow';
  const inputStyle = { borderColor: '#e2e8f0', fontSize: '0.875rem' };

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
            Họ và tên *
          </label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
            Số điện thoại *
          </label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="0901234567"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
            Email
          </label>
          <input
            type="email"
            className={inputCls}
            style={inputStyle}
            value={form.email ?? ''}
            onChange={e => set('email', e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
            CMND / CCCD
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.identityNumber ?? ''}
            onChange={e => set('identityNumber', e.target.value)}
            placeholder="012345678901"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
            Ngày sinh
          </label>
          <input
            type="date"
            className={inputCls}
            style={inputStyle}
            value={form.dateOfBirth ?? ''}
            onChange={e => set('dateOfBirth', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
            Địa chỉ
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.address ?? ''}
            onChange={e => set('address', e.target.value)}
            placeholder="123 Đường ABC, Quận 1, TP.HCM"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
            Liên hệ khẩn cấp
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.emergencyContact ?? ''}
            onChange={e => set('emergencyContact', e.target.value)}
            placeholder="Nguyễn Văn B - 0909123456"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
            Trạng thái
          </label>
          <select
            className={inputCls}
            style={inputStyle}
            value={form.status}
            onChange={e => set('status', e.target.value as RecordStatus)}
          >
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Không hoạt động</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          {loading ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </form>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function TenantsPage() {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;

  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecordStatus | ''>('');
  const [page, setPage] = useState(0);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<TenantView | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TenantSummary | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listTenants(wsId, {
      search: search || undefined,
      status: (statusFilter as RecordStatus) || undefined,
      page,
      size: 20,
    })
      .then(res => { setTenants(res.items); setTotal(res.totalElements); })
      .finally(() => setLoading(false));
  }, [wsId, search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form: TenantWrite) => {
    setSaving(true);
    try {
      await createTenant(wsId, form);
      setModalMode(null);
      load();
    } finally { setSaving(false); }
  };

  const handleEdit = async (form: TenantWrite) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateTenant(wsId, editTarget.id, { ...form, version: editTarget.version });
      setModalMode(null);
      setEditTarget(null);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteTenant(wsId, deleteTarget.id, deleteTarget.version);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Khách thuê</h1>
          <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
            Quản lý danh sách người thuê trong workspace.
          </p>
        </div>
        <button
          onClick={() => setModalMode('create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
        >
          <Plus size={17} /> Thêm khách thuê
        </button>
      </div>

      {/* Toolbar */}
      <div className="card fade-in flex flex-col sm:flex-row gap-3 p-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#e2e8f0' }}
            placeholder="Tìm theo tên, SĐT, email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select
          className="px-3 py-2 rounded-xl border text-sm focus:outline-none"
          style={{ borderColor: '#e2e8f0', color: '#374151' }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as RecordStatus | ''); setPage(0); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Không hoạt động</option>
        </select>
      </div>

      {/* Total */}
      {!loading && (
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          Hiển thị <strong style={{ color: '#0f172a' }}>{tenants.length}</strong> / {total} khách thuê
        </p>
      )}

      {/* Table */}
      <div className="card fade-in overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                {['Khách thuê', 'Liên hệ', 'CMND/CCCD', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton h-4 rounded" style={{ width: j === 0 ? 140 : 100 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={UserCheck}
                      title="Chưa có khách thuê"
                      description="Thêm khách thuê đầu tiên vào workspace."
                      action={
                        <button
                          onClick={() => setModalMode('create')}
                          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                        >
                          + Thêm khách thuê
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : tenants.map((t, i) => (
                <tr
                  key={t.id}
                  className="group transition-colors"
                  style={{
                    borderBottom: '1px solid #f8fafc',
                    animationDelay: `${i * 0.03}s`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                      >
                        {t.fullName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: '#0f172a' }}>{t.fullName}</p>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>ID #{t.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#374151' }}>
                        <Phone size={12} style={{ color: '#94a3b8' }} /> {t.phone}
                      </div>
                      {t.email && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
                          <Mail size={12} /> {t.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
                      <IdCard size={13} />
                      <span>—</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <RecordStatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditTarget(t as unknown as TenantView);
                          setModalMode('edit');
                        }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Trang {page + 1} / {Math.ceil(total / 20)}</p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
                style={{ background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0' }}
              >
                ← Trước
              </button>
              <button
                disabled={page >= Math.ceil(total / 20) - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
                style={{ background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0' }}
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={modalMode === 'create'}
        onClose={() => setModalMode(null)}
        title="Thêm khách thuê"
        subtitle="Điền thông tin người thuê mới"
        size="lg"
      >
        <TenantForm
          initial={EMPTY_FORM}
          onSubmit={handleCreate}
          onCancel={() => setModalMode(null)}
          loading={saving}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modalMode === 'edit'}
        onClose={() => { setModalMode(null); setEditTarget(null); }}
        title="Chỉnh sửa khách thuê"
        size="lg"
      >
        {editTarget && (
          <TenantForm
            initial={{
              fullName: editTarget.fullName,
              phone: editTarget.phone,
              email: editTarget.email ?? '',
              identityNumber: editTarget.identityNumber ?? '',
              dateOfBirth: editTarget.dateOfBirth ?? '',
              address: editTarget.address ?? '',
              emergencyContact: editTarget.emergencyContact ?? '',
              status: editTarget.status,
              version: editTarget.version,
            }}
            onSubmit={handleEdit}
            onCancel={() => { setModalMode(null); setEditTarget(null); }}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa"
        size="sm"
      >
        <p className="text-sm" style={{ color: '#475569' }}>
          Bạn có chắc muốn xóa khách thuê{' '}
          <strong style={{ color: '#0f172a' }}>{deleteTarget?.fullName}</strong>?
          Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#dc2626,#f87171)' }}
          >
            Xóa
          </button>
        </div>
      </Modal>
    </div>
  );
}
