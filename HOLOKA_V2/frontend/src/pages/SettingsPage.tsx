import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Shield, Building2, Globe, Palette } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function SettingsPage() {
  const { user } = useAuth();
  const workspace = user?.workspaces?.[0];
  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase()
    : 'U';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="fade-in">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cài đặt</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quản lý tài khoản, giao diện và workspace.</p>
      </div>

      {/* Profile Card */}
      <div className="card fade-in p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Thông tin tài khoản</h2>
        </div>
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            {initials}
          </div>
          <div>
            <p className="font-bold text-lg text-slate-900 dark:text-white">{user?.fullName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            {user?.platformAdmin && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-1"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid #fcd34d' }}
              >
                <Shield size={10} /> Platform Admin
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Họ và tên', value: user?.fullName || '—' },
            { label: 'Email', value: user?.email || '—' },
            { label: 'User ID', value: `#${user?.id}` },
            { label: 'Trạng thái', value: 'Đang hoạt động' },
          ].map(row => (
            <div key={row.label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">{row.label}</p>
              <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance & Theme Card */}
      <div className="card fade-in p-6">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Giao diện & Hiển thị</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Tùy chọn chế độ màu sắc hiển thị phù hợp với điều kiện làm việc của bạn.
        </p>
        <ThemeToggle variant="selector" />
      </div>

      {/* Workspace Card */}
      {workspace && (
        <div className="card fade-in p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Workspace</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Tên workspace', value: workspace.name },
              { label: 'Vai trò', value: workspace.role },
              { label: 'Workspace ID', value: `#${workspace.id}` },
            ].map(row => (
              <div key={row.label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">{row.label}</p>
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Settings */}
      <div className="card fade-in p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Thông báo</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Hợp đồng sắp hết hạn', desc: 'Nhận thông báo 30 ngày trước khi hợp đồng hết hạn', checked: true },
            { label: 'Hóa đơn quá hạn', desc: 'Nhận thông báo khi hóa đơn chưa được thanh toán đúng hạn', checked: true },
            { label: 'Yêu cầu bảo trì mới', desc: 'Nhận thông báo khi có yêu cầu bảo trì mới', checked: true },
            { label: 'Task quá hạn', desc: 'Nhận thông báo khi task chưa hoàn thành đúng hạn', checked: false },
          ].map(item => (
            <div key={item.label} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                <p className="text-xs mt-0.5 text-slate-400">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.checked}
                className="w-4 h-4 mt-0.5 rounded flex-shrink-0"
                style={{ accentColor: '#6366f1' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="card fade-in p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Thông tin hệ thống</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Phiên bản', value: 'HOLOKA v0.1.0' },
            { label: 'Múi giờ', value: 'Asia/Ho_Chi_Minh' },
            { label: 'Tiền tệ', value: 'VND' },
            { label: 'Backend', value: 'Spring Boot 3.5 · Java 21' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
