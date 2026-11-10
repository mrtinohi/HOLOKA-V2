import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, UserCheck, Phone, Mail, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { listTenants, createTenant, updateTenant, deleteTenant, getTenant } from '../services/tenantService';
import type { TenantSummary, TenantView, TenantWrite, RecordStatus } from '../types';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { RecordStatusBadge } from '../components/ui/Badge';
import { ErrorNotice, Field, Pagination } from '../components/ui/ResourceControls';
import { errorMessage } from '../services/api';

const EMPTY_FORM: TenantWrite = {
  fullName: '', phone: '', email: '', identityNumber: '',
  dateOfBirth: '', address: '', emergencyContact: '', status: 'ACTIVE', version: 0,
};

const PAGE_SIZE = 20;

function TenantForm({
  initial, onSubmit, onCancel, loading,
}: {
  initial: TenantWrite;
  onSubmit: (v: TenantWrite) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [form, setForm] = useState<TenantWrite>(initial);
  const set = (k: keyof TenantWrite, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field label={isVi ? 'Họ và tên *' : 'Full Name *'}>
            <input required className="input" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder={isVi ? 'Nguyễn Văn A' : 'John Doe'} />
          </Field>
        </div>
        <Field label={isVi ? 'Số điện thoại *' : 'Phone Number *'}>
          <input required className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0901234567" />
        </Field>
        <Field label="Email">
          <input type="email" className="input" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
        </Field>
        <Field label={isVi ? 'CMND / CCCD' : 'Citizen ID / Passport'}>
          <input className="input" value={form.identityNumber ?? ''} onChange={e => set('identityNumber', e.target.value)} placeholder="012345678901" />
        </Field>
        <Field label={isVi ? 'Ngày sinh' : 'Date of Birth'}>
          <input type="date" className="input" value={form.dateOfBirth ?? ''} onChange={e => set('dateOfBirth', e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={isVi ? 'Địa chỉ' : 'Address'}>
            <input className="input" value={form.address ?? ''} onChange={e => set('address', e.target.value)} placeholder={isVi ? '123 Đường ABC, Quận 1, TP.HCM' : '123 Street Name, City'} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={isVi ? 'Liên hệ khẩn cấp' : 'Emergency Contact'}>
            <input className="input" value={form.emergencyContact ?? ''} onChange={e => set('emergencyContact', e.target.value)} placeholder={isVi ? 'Nguyễn Văn B — 0909123456' : 'Contact person & phone'} />
          </Field>
        </div>
        <Field label={isVi ? 'Trạng thái' : 'Status'}>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value as RecordStatus)}>
            <option value="ACTIVE">{isVi ? 'Hoạt động' : 'Active'}</option>
            <option value="INACTIVE">{isVi ? 'Ngừng hoạt động' : 'Inactive'}</option>
          </select>
        </Field>
      </div>

      <div className="flex justify-end gap-2.5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          {isVi ? 'Hủy' : 'Cancel'}
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? (isVi ? 'Đang lưu…' : 'Saving…') : (isVi ? 'Lưu' : 'Save')}
        </button>
      </div>
    </form>
  );
}

export default function TenantsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;

  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecordStatus | ''>('');
  const [page, setPage] = useState(0);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<TenantView | null>(null);
  const [editInitial, setEditInitial] = useState<TenantWrite | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TenantSummary | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    listTenants(wsId, {
      search: search.trim() || undefined,
      status: (statusFilter as RecordStatus) || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then(res => { if (active) { setTenants(res.items); setTotal(res.totalElements); } })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wsId, search, statusFilter, page]);

  useEffect(() => load(), [load]);

  const openEdit = async (row: TenantSummary) => {
    setError('');
    try {
      const full = await getTenant(wsId, row.id);
      setEditTarget(full);
      setEditInitial({
        fullName: full.fullName,
        phone: full.phone,
        email: full.email ?? '',
        identityNumber: full.identityNumber ?? '',
        dateOfBirth: full.dateOfBirth ?? '',
        address: full.address ?? '',
        emergencyContact: full.emergencyContact ?? '',
        status: full.status,
        version: full.version,
      });
      setModalMode('edit');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const handleCreate = async (form: TenantWrite) => {
    setSaving(true);
    setError('');
    try {
      await createTenant(wsId, form);
      setModalMode(null);
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally { setSaving(false); }
  };

  const handleEdit = async (form: TenantWrite) => {
    if (!editTarget) return;
    setSaving(true);
    setError('');
    try {
      await updateTenant(wsId, editTarget.id, { ...form, version: editTarget.version });
      setModalMode(null);
      setEditTarget(null);
      setEditInitial(null);
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    try {
      await deleteTenant(wsId, deleteTarget.id, deleteTarget.version);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isVi ? 'Khách thuê' : 'Tenants'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isVi ? 'Quản lý hồ sơ người thuê trong workspace.' : 'Manage tenant profiles and occupancy history.'}
          </p>
        </div>
        <button type="button" onClick={() => { setError(''); setModalMode('create'); }} className="btn btn-primary">
          <Plus size={16} />
          {isVi ? 'Thêm khách thuê' : 'Add Tenant'}
        </button>
      </div>

      <ErrorNotice message={error} />

      {/* Toolbar */}
      <div className="card p-3 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-9"
            type="search"
            placeholder={isVi ? 'Tìm theo tên, SĐT, email…' : 'Search by name, phone, email…'}
            aria-label={isVi ? 'Tìm khách thuê' : 'Search tenants'}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select
          className="input sm:w-52"
          aria-label={isVi ? 'Lọc theo trạng thái' : 'Filter by status'}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as RecordStatus | ''); setPage(0); }}
        >
          <option value="">{isVi ? 'Tất cả trạng thái' : 'All Statuses'}</option>
          <option value="ACTIVE">{isVi ? 'Hoạt động' : 'Active'}</option>
          <option value="INACTIVE">{isVi ? 'Ngừng hoạt động' : 'Inactive'}</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {[isVi ? 'Khách thuê' : 'Tenant', isVi ? 'Liên hệ' : 'Contact', isVi ? 'Trạng thái' : 'Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
                <th className="text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4" style={{ width: j === 0 ? 150 : 100 }} /></td>
                    ))}
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={UserCheck}
                      title={isVi ? 'Chưa có khách thuê' : 'No tenants found'}
                      description={isVi ? 'Thêm khách thuê đầu tiên vào workspace.' : 'Add your first tenant to this workspace.'}
                      action={
                        <button type="button" onClick={() => setModalMode('create')} className="btn btn-primary">
                          <Plus size={16} /> {isVi ? 'Thêm khách thuê' : 'Add Tenant'}
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                tenants.map(t => (
                  <tr key={t.id}>
                    <td>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.fullName}</p>
                    </td>
                    <td>
                      <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <Phone size={12} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        <span>{t.phone}</span>
                      </p>
                      {t.email && (
                        <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                          <Mail size={11} className="flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{t.email}</span>
                        </p>
                      )}
                    </td>
                    <td><RecordStatusBadge status={t.status} /></td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          title={isVi ? 'Chỉnh sửa' : 'Edit'}
                          onClick={() => openEdit(t)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          title={isVi ? 'Xóa' : 'Delete'}
                          onClick={() => setDeleteTarget(t)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination page={page} total={total} size={PAGE_SIZE} onChange={setPage} />
        )}
      </div>

      <Modal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'edit' ? (isVi ? 'Cập nhật hồ sơ khách thuê' : 'Update Tenant Profile') : (isVi ? 'Thêm khách thuê mới' : 'Add New Tenant')}
        size="lg"
      >
        <TenantForm
          initial={modalMode === 'edit' && editInitial ? editInitial : EMPTY_FORM}
          onSubmit={modalMode === 'edit' ? handleEdit : handleCreate}
          onCancel={() => setModalMode(null)}
          loading={saving}
        />
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={isVi ? 'Xác nhận xóa khách thuê' : 'Confirm Tenant Deletion'}
        size="sm"
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isVi
            ? `Bạn có chắc muốn xóa khách thuê "${deleteTarget?.fullName}"? Bản ghi có hợp đồng hoặc hóa đơn liên quan sẽ không thể xóa.`
            : `Are you sure you want to delete tenant "${deleteTarget?.fullName}"? Records associated with contracts or invoices cannot be deleted.`}
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={() => setDeleteTarget(null)} className="btn btn-secondary">
            {isVi ? 'Hủy' : 'Cancel'}
          </button>
          <button type="button" onClick={handleDelete} className="btn btn-danger">
            {isVi ? 'Xác nhận xóa' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
