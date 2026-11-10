import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Shield, UserCheck, UserX,
  Building2, RefreshCw, AlertCircle, CheckCircle2,
  Lock, Unlock, Plus, Edit, Trash2, KeyRound, X,
  Eye, EyeOff, Sparkles, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  listPlatformUsers,
  createPlatformUser,
  updatePlatformUser,
  resetPlatformUserPassword,
  deletePlatformUser,
  toggleUserStatus,
  listPlatformWorkspaces,
  type PlatformUserView,
  type PlatformWorkspaceView,
  type CreateUserRequest,
  type UpdateUserRequest
} from '../services/platformService';
import { errorMessage } from '../services/api';
import { cleanMojibake } from '../components/ui/UserProfileDropdown';

export default function PlatformUsersPage() {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [users, setUsers] = useState<PlatformUserView[]>([]);
  const [workspaces, setWorkspaces] = useState<PlatformWorkspaceView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super' | 'owner' | 'manager' | 'staff'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUserView | null>(null);

  // Form States - Create User
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: 'Password123@',
    role: 'OWNER',
    workspaceMode: 'existing' as 'existing' | 'new' | 'none',
    workspaceId: '' as string | number,
    newWorkspaceName: '',
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Form States - Edit User
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    role: 'OWNER',
    workspaceId: '' as string | number,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Form States - Reset Password
  const [newPassword, setNewPassword] = useState('Abcd1234@');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  // Delete State
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [uData, wsData] = await Promise.all([
        listPlatformUsers(),
        listPlatformWorkspaces().catch(() => []),
      ]);
      setUsers(uData);
      setWorkspaces(wsData);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ─── Actions ───
  const handleToggleStatus = async (user: PlatformUserView) => {
    if (user.id === currentUser?.id) {
      alert('Không thể tự khóa tài khoản Super Admin của chính bạn!');
      return;
    }

    const actionText = user.enabled ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản "${cleanMojibake(user.fullName)}" (${user.email})?`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      const updated = await toggleUserStatus(user.id);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      triggerSuccess(`Đã ${actionText} thành công tài khoản ${cleanMojibake(user.fullName)}!`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateForm({
      fullName: '',
      email: '',
      password: 'Password123@',
      role: 'OWNER',
      workspaceMode: workspaces.length > 0 ? 'existing' : 'new',
      workspaceId: workspaces[0]?.id || '',
      newWorkspaceName: '',
    });
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);
    try {
      const payload: CreateUserRequest = {
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        workspaceId:
          createForm.role !== 'SUPER_ADMIN' && createForm.workspaceMode === 'existing' && createForm.workspaceId
            ? Number(createForm.workspaceId)
            : undefined,
        newWorkspaceName:
          createForm.role !== 'SUPER_ADMIN' && createForm.workspaceMode === 'new' && createForm.newWorkspaceName.trim()
            ? createForm.newWorkspaceName.trim()
            : undefined,
      };

      const newUser = await createPlatformUser(payload);
      setUsers(prev => [newUser, ...prev]);
      setShowCreateModal(false);
      triggerSuccess(`Tạo thành công tài khoản "${newUser.fullName}"!`);
      // Refresh workspaces in case a new one was created
      listPlatformWorkspaces().then(setWorkspaces).catch(() => { });
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: PlatformUserView) => {
    setSelectedUser(user);
    const primaryRole = user.platformAdmin
      ? 'SUPER_ADMIN'
      : user.workspaces[0]?.role || 'STAFF';
    setEditForm({
      fullName: cleanMojibake(user.fullName),
      email: user.email,
      role: primaryRole,
      workspaceId: user.workspaces[0]?.id || (workspaces[0]?.id ?? ''),
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError('');
    setEditSubmitting(true);
    try {
      const payload: UpdateUserRequest = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        workspaceId:
          editForm.role !== 'SUPER_ADMIN' && editForm.workspaceId
            ? Number(editForm.workspaceId)
            : undefined,
      };

      const updated = await updatePlatformUser(selectedUser.id, payload);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      setShowEditModal(false);
      triggerSuccess(`Cập nhật thành công tài khoản "${updated.fullName}"!`);
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenReset = (user: PlatformUserView) => {
    setSelectedUser(user);
    setNewPassword('Abcd1234@');
    setResetError('');
    setShowResetModal(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setResetError('');
    setResetSubmitting(true);
    try {
      await resetPlatformUserPassword(selectedUser.id, { newPassword });
      setShowResetModal(false);
      triggerSuccess(`Đã đặt lại mật khẩu cho "${cleanMojibake(selectedUser.fullName)}" thành công!`);
    } catch (err) {
      setResetError(errorMessage(err));
    } finally {
      setResetSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (user: PlatformUserView) => {
    if (user.id === currentUser?.id) {
      alert('Không thể xóa tài khoản Super Admin của chính bạn!');
      return;
    }
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setDeleteSubmitting(true);
    try {
      await deletePlatformUser(selectedUser.id);
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      triggerSuccess(`Đã xóa tài khoản "${cleanMojibake(selectedUser.fullName)}" khỏi hệ thống!`);
    } catch (err) {
      setError(errorMessage(err));
      setShowDeleteModal(false);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.enabled).length;
    const superAdmins = users.filter(u => u.platformAdmin).length;
    const owners = users.filter(u => !u.platformAdmin && u.workspaces.some(w => w.role === 'OWNER')).length;
    return { total, active, superAdmins, owners };
  }, [users]);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const name = cleanMojibake(u.fullName).toLowerCase();
      const email = u.email.toLowerCase();
      const q = search.trim().toLowerCase();

      if (q && !name.includes(q) && !email.includes(q)) return false;

      if (statusFilter === 'active' && !u.enabled) return false;
      if (statusFilter === 'blocked' && u.enabled) return false;

      if (roleFilter === 'super' && !u.platformAdmin) return false;
      if (roleFilter === 'owner' && (u.platformAdmin || !u.workspaces.some(w => w.role === 'OWNER'))) return false;
      if (roleFilter === 'manager' && (u.platformAdmin || !u.workspaces.some(w => w.role === 'MANAGER'))) return false;
      if (roleFilter === 'staff' && (u.platformAdmin || !u.workspaces.some(w => w.role === 'STAFF'))) return false;

      return true;
    });
  }, [users, search, statusFilter, roleFilter]);

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
              {isVi ? 'Quản lý tài khoản hệ thống (CRUD)' : 'Platform Users & Roles'}
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
              ? 'Thêm, sửa, xóa, đặt lại mật khẩu và cấp quyền cho tất cả tài khoản Chủ căn hộ và Quản trị viên.'
              : 'Create, update, delete, reset passwords, and manage access for all apartment owners and staff.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="btn btn-secondary text-xs sm:text-sm font-semibold flex items-center gap-1.5"
            title="Tải lại danh sách"
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
            <span>{isVi ? 'Thêm tài khoản mới' : 'Add New User'}</span>
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
          >
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Tổng tài khoản' : 'Total Accounts'}
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
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Đang hoạt động' : 'Active Accounts'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {stats.active}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
          >
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Chủ căn hộ (Owner)' : 'Property Owners'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {stats.owners}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}
          >
            <Shield size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Super Admin' : 'Super Admins'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {stats.superAdmins}
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
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isVi ? 'Tìm kiếm theo họ tên, email...' : 'Search by name, email...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm"
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
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
            <option value="active">{isVi ? 'Đang hoạt động' : 'Active'}</option>
            <option value="blocked">{isVi ? 'Đã bị khóa' : 'Blocked'}</option>
          </select>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">{isVi ? 'Tất cả vai trò' : 'All Roles'}</option>
            <option value="super">HOLOKA Super Admin</option>
            <option value="owner">{isVi ? 'Chủ căn hộ (Owner)' : 'Owner'}</option>
            <option value="manager">{isVi ? 'Quản lý (Manager)' : 'Manager'}</option>
            <option value="staff">{isVi ? 'Nhân viên (Staff)' : 'Staff'}</option>
          </select>
        </div>
      </div>

      {/* ─── Users Table ─── */}
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
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Người dùng</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Vai trò & Quyền</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Tổ chức phụ trách</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Trạng thái</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    <span>Đang tải dữ liệu người dùng...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <span>Không tìm thấy người dùng nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const displayName = cleanMojibake(u.fullName);
                  const isCurrent = u.id === currentUser?.id;
                  const initials = displayName
                    ? displayName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase()
                    : 'U';

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{
                              background: u.platformAdmin ? '#8b5cf6' : 'var(--brand)',
                            }}
                          >
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {displayName}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-xs leading-tight block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Privileges */}
                      <td className="py-3 px-4">
                        {u.platformAdmin ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea' }}
                          >
                            <Shield size={12} />
                            <span>SUPER ADMIN</span>
                          </span>
                        ) : u.workspaces.some(w => w.role === 'OWNER') ? (
                          <span className="badge badge-warning font-bold">
                            Chủ căn hộ (Owner)
                          </span>
                        ) : u.workspaces.some(w => w.role === 'MANAGER') ? (
                          <span className="badge badge-brand font-bold">
                            Quản lý (Manager)
                          </span>
                        ) : (
                          <span className="badge badge-neutral">
                            Nhân viên (Staff)
                          </span>
                        )}
                      </td>

                      {/* Workspaces */}
                      <td className="py-3 px-4">
                        {u.workspaces.length === 0 ? (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Chưa gán tổ chức
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {u.workspaces.map(w => (
                              <span
                                key={w.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
                                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
                              >
                                <Building2 size={11} style={{ color: 'var(--brand)' }} />
                                <span className="truncate max-w-[140px]">{w.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {u.enabled ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                          >
                            <UserX size={12} />
                            <span>Đã khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="btn btn-ghost btn-icon h-8 w-8 text-[var(--text-muted)] hover:text-[var(--brand)]"
                            title="Chỉnh sửa tài khoản"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Reset Password button */}
                          <button
                            type="button"
                            onClick={() => handleOpenReset(u)}
                            className="btn btn-ghost btn-icon h-8 w-8 text-[var(--text-muted)] hover:text-amber-600"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound size={14} />
                          </button>

                          {/* Lock / Unlock button */}
                          {!isCurrent && (
                            <button
                              type="button"
                              disabled={actionLoadingId === u.id}
                              onClick={() => handleToggleStatus(u)}
                              className={`btn btn-ghost btn-icon h-8 w-8 ${u.enabled ? 'text-[var(--text-muted)] hover:text-rose-600' : 'text-emerald-600 hover:text-emerald-700'
                                }`}
                              title={u.enabled ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            >
                              {actionLoadingId === u.id ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : u.enabled ? (
                                <Lock size={14} />
                              ) : (
                                <Unlock size={14} />
                              )}
                            </button>
                          )}

                          {/* Delete button */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(u)}
                              className="btn btn-ghost btn-icon h-8 w-8 text-[var(--text-muted)] hover:text-rose-600"
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════ MODAL: CREATE USER ══════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="card p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: 'var(--brand)' }}
                >
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Thêm tài khoản người dùng mới
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Tạo tài khoản và phân quyền vận hành trên hệ thống HOLOKA
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
                <label className="field-label">Họ và tên đầy đủ *</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Ví dụ: Trần Văn Nam"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="field-label">Địa chỉ Email *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="name@domain.com"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="field-label">Mật khẩu khởi tạo *</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className="input w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon h-7 w-7 text-[var(--text-muted)]"
                  >
                    {showCreatePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-[var(--text-muted)]">
                  <span>Tối thiểu 8 ký tự</span>
                  <button
                    type="button"
                    onClick={() => setCreateForm(f => ({ ...f, password: 'Pass@' + Math.floor(100000 + Math.random() * 900000) }))}
                    className="text-[var(--brand)] hover:underline inline-flex items-center gap-1"
                  >
                    <Sparkles size={11} /> Tạo ngẫu nhiên
                  </button>
                </div>
              </div>

              <div>
                <label className="field-label">Vai trò & Quyền hạn *</label>
                <select
                  value={createForm.role}
                  onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className="input w-full cursor-pointer"
                >
                  <option value="OWNER">🏢 Chủ căn hộ (Owner - Quản trị chuỗi tài sản, phòng, nhân viên)</option>
                  <option value="MANAGER">👔 Quản lý (Manager - Vận hành phòng, hợp đồng, tài chính)</option>
                  <option value="STAFF">👷 Nhân viên (Staff - Tiếp nhận việc, hỗ trợ bảo trì)</option>
                  <option value="SUPER_ADMIN">🛡️ HOLOKA Super Admin (Quản trị viên nền tảng toàn quyền)</option>
                </select>
              </div>

              {/* Workspace assignment if not Super Admin */}
              {createForm.role !== 'SUPER_ADMIN' && (
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] space-y-3">
                  <p className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Building2 size={14} style={{ color: 'var(--brand)' }} />
                    <span>Workspace phụ trách</span>
                  </p>

                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="wsMode"
                        checked={createForm.workspaceMode === 'existing'}
                        onChange={() => setCreateForm(f => ({ ...f, workspaceMode: 'existing' }))}
                      />
                      <span>Gán vào Workspace có sẵn</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="wsMode"
                        checked={createForm.workspaceMode === 'new'}
                        onChange={() => setCreateForm(f => ({ ...f, workspaceMode: 'new' }))}
                      />
                      <span>Tạo Workspace mới</span>
                    </label>
                  </div>

                  {createForm.workspaceMode === 'existing' ? (
                    <div>
                      <select
                        value={createForm.workspaceId}
                        onChange={e => setCreateForm(f => ({ ...f, workspaceId: e.target.value }))}
                        className="input w-full text-xs"
                      >
                        {workspaces.map(ws => (
                          <option key={ws.id} value={ws.id}>
                            {ws.name} ({cleanMojibake(ws.ownerName)})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Nhập tên Workspace mới (ví dụ: An Nhiên Living 2)"
                        value={createForm.newWorkspaceName}
                        onChange={e => setCreateForm(f => ({ ...f, newWorkspaceName: e.target.value }))}
                        className="input w-full text-xs"
                        required={createForm.workspaceMode === 'new'}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Hủy bỏ
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
                  <span>{createSubmitting ? 'Đang tạo...' : 'Xác nhận tạo tài khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: EDIT USER ══════════════ */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="card p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: 'var(--brand)' }}
                >
                  <Edit size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Chỉnh sửa thông tin tài khoản
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Cập nhật họ tên, email và quyền hạn của người dùng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="btn btn-ghost btn-icon h-8 w-8 text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="field-label">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="field-label">Email đăng nhập *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="field-label">Vai trò *</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="input w-full cursor-pointer"
                >
                  <option value="OWNER">🏢 Chủ căn hộ (Owner)</option>
                  <option value="MANAGER">👔 Quản lý (Manager)</option>
                  <option value="STAFF">👷 Nhân viên (Staff)</option>
                  <option value="SUPER_ADMIN">🛡️ HOLOKA Super Admin</option>
                </select>
              </div>

              {editForm.role !== 'SUPER_ADMIN' && workspaces.length > 0 && (
                <div>
                  <label className="field-label">Workspace phụ trách</label>
                  <select
                    value={editForm.workspaceId}
                    onChange={e => setEditForm(f => ({ ...f, workspaceId: e.target.value }))}
                    className="input w-full cursor-pointer text-xs"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({cleanMojibake(ws.ownerName)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="btn btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  {editSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>{editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: RESET PASSWORD ══════════════ */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="card p-6 w-full max-w-md shadow-2xl relative"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 font-bold"
                >
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Đặt lại mật khẩu
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Cho tài khoản {cleanMojibake(selectedUser.fullName)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="btn btn-ghost btn-icon h-8 w-8 text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)]">Email tài khoản:</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{selectedUser.email}</p>
              </div>

              <div>
                <label className="field-label">Mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="input w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon h-7 w-7 text-[var(--text-muted)]"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-[var(--text-muted)]">
                  <span>Tối thiểu 8 ký tự</span>
                  <button
                    type="button"
                    onClick={() => setNewPassword('Abcd1234@')}
                    className="text-[var(--brand)] hover:underline"
                  >
                    Đặt mặc định (Abcd1234@)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="btn btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  {resetSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <KeyRound size={14} />
                  )}
                  <span>{resetSubmitting ? 'Đang cập nhật...' : 'Xác nhận đặt lại'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: DELETE CONFIRMATION ══════════════ */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="card p-6 w-full max-w-md shadow-2xl relative"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Xác nhận xóa tài khoản?
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Hành động này sẽ xóa hoặc thu hồi hoàn toàn quyền truy cập.
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-primary)] mb-5">
              Bạn có chắc chắn muốn xóa tài khoản{' '}
              <strong>"{cleanMojibake(selectedUser.fullName)}"</strong> ({selectedUser.email})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteConfirm}
                className="btn text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
              >
                {deleteSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{deleteSubmitting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
