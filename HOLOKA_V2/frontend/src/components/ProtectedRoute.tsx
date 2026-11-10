import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';
import { logout as logoutSession } from '../services/authService';

export default function ProtectedRoute({ operatorOnly = false }: { operatorOnly?: boolean }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--bg)' }}
        role="status"
        aria-live="polite"
      >
        <span
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {isVi ? 'Đang khôi phục phiên đăng nhập…' : 'Restoring login session…'}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!user?.workspaces?.length && !user?.platformAdmin) {
    const handleLogout = async () => {
      try {
        await logoutSession();
      } catch {
        // ignore
      } finally {
        logout();
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="card p-8 max-w-md text-center space-y-4 shadow-xl">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'var(--warning-soft)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {isVi ? 'Chưa có không gian làm việc' : 'No Workspace Assigned'}
            </h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {isVi
                ? 'Tài khoản này chưa được cấp quyền vận hành tại bất kỳ bất động sản nào. Vui lòng liên hệ quản trị viên để được mời vào workspace.'
                : 'This account has not been assigned operational permissions in any workspace. Please contact your system administrator to be invited.'}
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary flex items-center gap-2 text-sm"
            >
              <LogOut size={16} />
              <span>{isVi ? 'Đăng xuất tài khoản' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (operatorOnly && !user?.platformAdmin && user?.workspaces?.[0]?.role === 'STAFF') {
    return <Navigate to="/tasks" replace />;
  }

  return <Outlet />;
}
