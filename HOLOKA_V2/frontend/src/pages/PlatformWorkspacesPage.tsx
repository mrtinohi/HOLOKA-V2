import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Users, Search, RefreshCw,
  AlertCircle, Shield, Plus, X,
  Lock, Unlock, CheckCircle2, Check,
  CreditCard
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  listPlatformWorkspaces,
  toggleWorkspaceStatus,
  createPlatformWorkspace,
  listPlatformUsers,
  type PlatformWorkspaceView,
  type PlatformUserView,
  type CreateWorkspaceRequest
} from '../services/platformService';
import { errorMessage } from '../services/api';
import { cleanMojibake } from '../components/ui/UserProfileDropdown';

export default function PlatformWorkspacesPage() {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [workspaces, setWorkspaces] = useState<PlatformWorkspaceView[]>([]);
  const [users, setUsers] = useState<PlatformUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Create Workspace Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    tierPlan: 'Gói Tiêu Chuẩn',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    ownerUserId: '' as string | number,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [wsList, uList] = await Promise.all([
        listPlatformWorkspaces(),
        listPlatformUsers().catch(() => []),
      ]);
      setWorkspaces(wsList);
      setUsers(uList);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleToggleStatus = async (ws: PlatformWorkspaceView) => {
    const actionText = ws.enabled ? 'tạm dừng' : 'kích hoạt lại';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tổ chức "${ws.name}"?`)) {
      return;
    }

    setActionLoadingId(ws.id);
    try {
      const updated = await toggleWorkspaceStatus(ws.id);
      setWorkspaces(prev => prev.map(w => (w.id === updated.id ? updated : w)));
      triggerSuccess(`Đã ${actionText} thành công tổ chức "${ws.name}"!`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      tierPlan: 'Gói Tiêu Chuẩn',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      ownerUserId: users.find(u => !u.platformAdmin)?.id || '',
    });
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);
    try {
      const payload: CreateWorkspaceRequest = {
        name: createForm.name.trim(),
        tierPlan: createForm.tierPlan,
        currency: createForm.currency,
        timezone: createForm.timezone,
        ownerUserId: createForm.ownerUserId ? Number(createForm.ownerUserId) : undefined,
      };
      const created = await createPlatformWorkspace(payload);
      setWorkspaces(prev => [created, ...prev]);
      setShowCreateModal(false);
      triggerSuccess(`Tạo thành công tổ chức khách hàng "${created.name}"!`);
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(ws => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        ws.name.toLowerCase().includes(q) ||
        cleanMojibake(ws.ownerName).toLowerCase().includes(q) ||
        ws.ownerEmail.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (statusFilter === 'active' && !ws.enabled) return false;
      if (statusFilter === 'suspended' && ws.enabled) return false;
      return true;
    });
  }, [workspaces, search, statusFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = workspaces.length;
    const active = workspaces.filter(w => w.enabled).length;
    const suspended = total - active;
    const totalMembers = workspaces.reduce((sum, w) => sum + (w.memberCount || 0), 0);
    return { total, active, suspended, totalMembers };
  }, [workspaces]);

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {isVi ? 'Quản lý Khách hàng & Tổ chức (SaaS)' : 'Client Organizations & Subscriptions'}
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)', border: '1px solid var(--brand-200)' }}
            >
              <Shield size={12} />
              <span>SUPER ADMIN</span>
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isVi
              ? 'Quản lý danh sách các khách hàng là chủ nhà, doanh nghiệp thuê nền tảng HOLOKA, gói dịch vụ và trạng thái kích hoạt.'
              : 'Oversee client organizations, landlord accounts, subscription plans, and service status across the platform.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary text-xs sm:text-sm font-semibold flex items-center gap-1.5"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-primary text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            <span>{isVi ? 'Thêm Tổ chức mới' : 'New Organization'}</span>
          </button>
        </div>
      </div>

      {/* ─── Metrics Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
          >
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Tổng số Tổ chức' : 'Total Organizations'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {stats.total}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Đang kích hoạt' : 'Active Subscriptions'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {stats.active}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            <Lock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Đang tạm dừng' : 'Suspended'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {stats.suspended}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}
          >
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Tổng nhân sự trực thuộc' : 'Total Client Members'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {stats.totalMembers}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Feedback alerts ─── */}
      {successMsg && (
        <div
          role="status"
          className="rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2 animate-in fade-in"
          style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success)' }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2"
          style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Search & Filters Bar ─── */}
      <div className="card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isVi ? 'Tìm kiếm tên tổ chức, chủ sở hữu, email...' : 'Search organization, owner, email...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm"
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">{isVi ? 'Tất cả trạng thái' : 'All Status'}</option>
            <option value="active">{isVi ? 'Đang kích hoạt' : 'Active'}</option>
            <option value="suspended">{isVi ? 'Đã tạm dừng' : 'Suspended'}</option>
          </select>
        </div>
      </div>

      {/* ─── Workspaces Table ─── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead
              style={{
                background: 'var(--surface-subtle)',
                borderBottom: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              <tr>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Tổ chức / Khách hàng</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Chủ tài khoản (Owner)</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Gói phần mềm</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-center">Số nhân sự</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Trạng thái</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading && workspaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    <span>Đang tải danh sách tổ chức...</span>
                  </td>
                </tr>
              ) : filteredWorkspaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                    <span>Không tìm thấy tổ chức nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredWorkspaces.map(ws => {
                  const ownerDisplayName = cleanMojibake(ws.ownerName);
                  return (
                    <tr
                      key={ws.id}
                      className="transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm"
                            style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}
                          >
                            {ws.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block leading-tight">
                              {ws.name}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] mt-0.5 block">
                              Mã ID: #{ws.id} • {ws.currency}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[var(--text-primary)] block leading-tight">
                          {ownerDisplayName}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] mt-0.5 block">
                          {ws.ownerEmail}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <CreditCard size={11} />
                          <span>{ws.tierPlan || 'Gói Tiêu Chuẩn'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-[var(--text-primary)]">
                        {ws.memberCount}
                      </td>

                      <td className="py-3.5 px-4">
                        {ws.enabled ? (
                          <span className="badge badge-success flex items-center gap-1 text-[11px] w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Đang kích hoạt</span>
                          </span>
                        ) : (
                          <span className="badge badge-warning flex items-center gap-1 text-[11px] w-fit">
                            <Lock size={11} />
                            <span>Đã tạm dừng</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={actionLoadingId === ws.id}
                          onClick={() => handleToggleStatus(ws)}
                          className={`btn text-xs font-semibold py-1 px-2.5 h-8 inline-flex items-center gap-1.5 cursor-pointer ${
                            ws.enabled ? 'btn-ghost text-rose-600 hover:bg-rose-50' : 'btn-secondary text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={ws.enabled ? 'Tạm dừng dịch vụ tổ chức này' : 'Kích hoạt lại dịch vụ'}
                        >
                          {actionLoadingId === ws.id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : ws.enabled ? (
                            <>
                              <Lock size={13} />
                              <span>Tạm dừng</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={13} />
                              <span>Kích hoạt</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════ MODAL: CREATE WORKSPACE ══════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="card p-6 w-full max-w-md shadow-2xl relative"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: 'var(--brand)' }}
                >
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Thêm Tổ chức Khách hàng mới
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Đăng ký không gian doanh nghiệp / chủ căn hộ trên nền tảng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost btn-icon h-8 w-8 text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="field-label">Tên Doanh nghiệp / Chuỗi căn hộ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Gia Living Group"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="field-label">Gói phần mềm đăng ký</label>
                <select
                  value={createForm.tierPlan}
                  onChange={e => setCreateForm(f => ({ ...f, tierPlan: e.target.value }))}
                  className="input w-full cursor-pointer text-xs"
                >
                  <option value="Gói Doanh Nghiệp (Pro)">💎 Gói Doanh Nghiệp (Pro) - Không giới hạn tài nguyên</option>
                  <option value="Gói Tiêu Chuẩn">⭐ Gói Tiêu Chuẩn - Vận hành cơ bản</option>
                  <option value="Gói Khởi Nghiệp (Starter)">🌱 Gói Khởi Nghiệp (Starter)</option>
                </select>
              </div>

              <div>
                <label className="field-label">Gán Chủ tài khoản phụ trách (Owner)</label>
                <select
                  value={createForm.ownerUserId}
                  onChange={e => setCreateForm(f => ({ ...f, ownerUserId: e.target.value }))}
                  className="input w-full cursor-pointer text-xs"
                >
                  <option value="">-- Chưa gán chủ tài khoản --</option>
                  {users
                    .filter(u => !u.platformAdmin)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {cleanMojibake(u.fullName)} ({u.email})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Chủ tài khoản sẽ có quyền OWNER cao nhất trong tổ chức này.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="btn btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  {createSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>{createSubmitting ? 'Đang tạo...' : 'Tạo Tổ chức'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
