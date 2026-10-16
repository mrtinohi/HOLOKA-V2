import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ operatorOnly = false }: { operatorOnly?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="p-12 text-center text-slate-500" role="status">Đang khôi phục phiên đăng nhập…</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!user?.workspaces.length) return <div className="p-12">Tài khoản chưa được cấp workspace vận hành.</div>;
  if (operatorOnly && user.workspaces[0].role === 'STAFF') return <Navigate to="/tasks" replace />;
  return <Outlet />;
}
