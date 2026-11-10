import { useState, useEffect, useMemo } from 'react';
import {
  Shield, Clock, Search, RefreshCw, AlertCircle,
  Filter
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getPlatformAuditLogs, type PlatformAuditLogView } from '../services/platformService';
import { errorMessage } from '../services/api';

export default function PlatformAuditLogsPage() {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [logs, setLogs] = useState<PlatformAuditLogView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPlatformAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.actorEmail.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (actionFilter !== 'all' && !log.action.includes(actionFilter)) return false;
      return true;
    });
  }, [logs, search, actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE')) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    }
    if (action.includes('LOCK') || action.includes('DELETE') || action.includes('SUSPEND')) {
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
    }
    if (action.includes('PASSWORD') || action.includes('UPDATE')) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    }
    return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
  };

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
              {isVi ? 'Nhật ký Hệ thống & Kiểm toán An ninh' : 'Security & System Audit Logs'}
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
              ? 'Theo dõi toàn bộ lịch sử thao tác quan trọng: Cấp tài khoản, đổi mật khẩu, phân quyền, khóa mở khóa và đăng ký tổ chức.'
              : 'Complete audit trail of all administrative events, user lifecycle, privilege escalation, and security events.'}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="btn btn-secondary text-xs sm:text-sm font-semibold flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{isVi ? 'Làm mới nhật ký' : 'Refresh Logs'}</span>
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

      {/* ─── Search & Filters Bar ─── */}
      <div className="card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isVi ? 'Tìm kiếm theo hành động, email, đối tượng...' : 'Search by action, email, target...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm"
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--text-muted)]" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">{isVi ? 'Tất cả loại hành động' : 'All Actions'}</option>
            <option value="USER">{isVi ? 'Thao tác tài khoản (USER)' : 'User Lifecycle'}</option>
            <option value="PASSWORD">{isVi ? 'Đổi / Reset Mật khẩu' : 'Password Events'}</option>
            <option value="LOCK">{isVi ? 'Khóa / Mở khóa' : 'Account Lock / Unlock'}</option>
            <option value="ORGANIZATION">{isVi ? 'Tổ chức khách hàng (Organization)' : 'Organizations'}</option>
          </select>
        </div>
      </div>

      {/* ─── Audit Table ─── */}
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
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Thời gian</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Mã sự kiện</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Người thực hiện</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Đối tượng tác động</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider">Chi tiết nội dung</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    <span>Đang tải nhật ký kiểm toán...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={32} className="mx-auto mb-2 opacity-50" />
                    <span>Không tìm thấy bản ghi nhật ký nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <td className="py-3.5 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-[var(--text-primary)]">
                      {log.actorEmail}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-bold text-[var(--brand)]">
                      {log.target}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[var(--text-muted)] max-w-sm">
                      {log.details}
                    </td>

                    <td className="py-3.5 px-4 text-right">
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
