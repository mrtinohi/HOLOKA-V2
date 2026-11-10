import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, Users, Building2, Activity,
  UserCheck, AlertCircle,
  RefreshCw, ArrowRight, UserPlus, FolderPlus,
  Clock, ShieldAlert, Cpu
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getPlatformMetrics,
  getPlatformAuditLogs,
  type PlatformSystemMetrics,
  type PlatformAuditLogView
} from '../services/platformService';
import { errorMessage } from '../services/api';

export default function PlatformDashboardPage() {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<PlatformSystemMetrics | null>(null);
  const [logs, setLogs] = useState<PlatformAuditLogView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [met, audit] = await Promise.all([
        getPlatformMetrics(),
        getPlatformAuditLogs().catch(() => []),
      ]);
      setMetrics(met);
      setLogs(audit.slice(0, 8));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRoleUsers = metrics
    ? (metrics.roles.superAdmins + metrics.roles.owners + metrics.roles.managers + metrics.roles.staff) || 1
    : 1;

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
              {isVi ? 'Tổng quan Nền tảng (Platform Dashboard)' : 'Platform Control Dashboard'}
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
              ? 'Giám sát toàn bộ tài khoản, tổ chức khách hàng, an ninh và trạng thái máy chủ hệ thống HOLOKA.'
              : 'Global monitoring of accounts, client organizations, security audit trail, and server health.'}
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="btn btn-secondary text-xs sm:text-sm font-semibold flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
        </button>
      </div>

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

      {/* ─── 4 Key Metrics Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
          >
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Tổng tài khoản người dùng' : 'Total Accounts'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {metrics?.totalUsers ?? '...'}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{metrics?.activeUsers ?? 0} đang hoạt động</span>
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
          >
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Tổ chức / Chuỗi căn hộ' : 'Client Organizations'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {metrics?.totalWorkspaces ?? '...'}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{metrics?.activeWorkspaces ?? 0} đã kích hoạt</span>
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
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Super Admin quản trị' : 'Super Administrators'}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {metrics?.roles?.superAdmins ?? '...'}
            </p>
            <p className="text-[11px] text-purple-600 dark:text-purple-300 mt-0.5 font-medium">
              Toàn quyền hệ thống
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
          >
            <Activity size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Trạng thái máy chủ & API' : 'System Health'}
            </p>
            <p className="text-xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
              {metrics?.systemStatus ?? 'HEALTHY'}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              RAM: {metrics?.jvmMemoryUsedMb ?? 0} / {metrics?.jvmMemoryMaxMb ?? 0} MB
            </p>
          </div>
        </div>
      </div>

      {/* ─── Role Distribution & Quick Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Role distribution */}
        <div className="lg:col-span-7 card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Phân bổ tài khoản theo vai trò
              </h2>
              <NavLink to="/platform/users" className="text-xs font-semibold text-[var(--brand)] hover:underline flex items-center gap-1">
                <span>Chi tiết</span>
                <ArrowRight size={12} />
              </NavLink>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Shield size={13} />
                    <span>HOLOKA Super Admin</span>
                  </span>
                  <span className="font-bold">{metrics?.roles?.superAdmins ?? 0} tài khoản</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${((metrics?.roles?.superAdmins ?? 0) / totalRoleUsers) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Building2 size={13} />
                    <span>Chủ căn hộ (Owner)</span>
                  </span>
                  <span className="font-bold">{metrics?.roles?.owners ?? 0} tài khoản</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${((metrics?.roles?.owners ?? 0) / totalRoleUsers) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Users size={13} />
                    <span>Quản lý cơ sở (Manager)</span>
                  </span>
                  <span className="font-bold">{metrics?.roles?.managers ?? 0} tài khoản</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${((metrics?.roles?.managers ?? 0) / totalRoleUsers) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <UserCheck size={13} />
                    <span>Nhân viên vận hành (Staff)</span>
                  </span>
                  <span className="font-bold">{metrics?.roles?.staff ?? 0} tài khoản</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full"
                    style={{ width: `${((metrics?.roles?.staff ?? 0) / totalRoleUsers) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[var(--border)] text-xs text-[var(--text-muted)] flex items-center justify-between">
            <span>Chính sách phân quyền: Độc lập và bảo mật đa tầng</span>
            <span className="font-bold text-[var(--text-primary)]">Tổng: {metrics?.totalUsers ?? 0} người dùng</span>
          </div>
        </div>

        {/* Right: Quick Management Actions */}
        <div className="lg:col-span-5 card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">
              Tác vụ Quản trị nhanh
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/platform/users')}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] transition-all text-left flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
                  <UserPlus size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)]">
                    Thêm người dùng
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                    Cấp tài khoản & quyền hạn
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/platform/workspaces')}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] transition-all text-left flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
                  <FolderPlus size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)]">
                    Thêm tổ chức SaaS
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                    Đăng ký khách hàng mới
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/platform/audit-logs')}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] transition-all text-left flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)]">
                    Nhật ký kiểm toán
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                    Lịch sử thao tác an ninh
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/platform/settings')}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] transition-all text-left flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)]">
                    Cài đặt nền tảng
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                    Bảo mật & Máy chủ
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <Cpu size={14} className="text-emerald-500" />
              <span>Dịch vụ API: Hoạt động bình thường</span>
            </span>
            <span className="badge badge-success text-[10px]">100% Sẵn sàng</span>
          </div>
        </div>
      </div>

      {/* ─── Recent Audit Trail ─── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Nhật ký thao tác quản trị gần đây
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Ghi nhận theo thời gian thực các thao tác nhạy cảm trên hệ thống
            </p>
          </div>

          <NavLink
            to="/platform/audit-logs"
            className="text-xs font-semibold text-[var(--brand)] hover:underline flex items-center gap-1"
          >
            <span>Xem toàn bộ nhật ký</span>
            <ArrowRight size={13} />
          </NavLink>
        </div>

        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--text-muted)] border-b border-[var(--border)]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Thời gian</th>
                <th className="py-2.5 px-3 font-bold">Hành động</th>
                <th className="py-2.5 px-3 font-bold">Người thực hiện</th>
                <th className="py-2.5 px-3 font-bold">Đối tượng tác động</th>
                <th className="py-2.5 px-3 font-bold">Chi tiết</th>
                <th className="py-2.5 px-3 font-bold text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    Chưa có nhật ký ghi nhận nào.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--surface-hover)]">
                    <td className="py-2.5 px-3 text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN')} {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 font-bold">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-primary)] font-medium">
                      {log.actorEmail}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[var(--brand)]">
                      {log.target}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)] max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="badge badge-success text-[10px]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
