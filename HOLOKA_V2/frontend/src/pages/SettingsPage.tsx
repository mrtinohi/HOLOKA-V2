import { useState, useEffect } from 'react';
import {
  User, Bell, Shield, Building2, Globe, Palette, KeyRound,
  Check, AlertCircle, Eye, EyeOff, Save, RefreshCw, Volume2,
  Type, CheckCircle2, Lock, ShieldCheck, Laptop
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { changePassword, updateProfile } from '../services/authService';
import { errorMessage } from '../services/api';
import { cleanMojibake } from '../components/ui/UserProfileDropdown';
import { getRoleLabel } from '../layouts/MainLayout';

interface NotificationPrefs {
  contractExpiry: boolean;
  overdueInvoices: boolean;
  maintenanceNew: boolean;
  overdueTasks: boolean;
  soundEnabled: boolean;
  browserPush: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  contractExpiry: true,
  overdueInvoices: true,
  maintenanceNew: true,
  overdueTasks: false,
  soundEnabled: true,
  browserPush: false,
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="p-3.5 rounded-xl transition-colors"
      style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6 transition-all">
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
        >
          <Icon size={18} />
        </div>
        <div>
          <h2 className="section-title text-base">{title}</h2>
          {description && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const workspace = user?.workspaces?.[0];

  // ─── Profile editing state ───
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // ─── Password change state ───
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ─── Large text mode state ───
  const [largeFont, setLargeFont] = useState(() => localStorage.getItem('holoka_large_font') === 'true');

  // ─── Notification preferences state ───
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => {
    try {
      const saved = localStorage.getItem('holoka_notification_prefs');
      return saved ? JSON.parse(saved) : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });
  const [notifSavedMsg, setNotifSavedMsg] = useState(false);

  // ─── Cache clearing state ───
  const [cacheCleared, setCacheCleared] = useState(false);

  const rawClean = cleanMojibake(user?.fullName);
  const displayName = isVi
    ? (rawClean || (user?.platformAdmin ? 'Quản trị viên Super' : 'Quản trị viên'))
    : (rawClean.replace(/Quản trị viên/g, 'Administrator') || (user?.platformAdmin ? 'Platform Super Admin' : 'Administrator'));
  const roleName = user?.platformAdmin
    ? 'SUPER ADMIN'
    : getRoleLabel(workspace?.role, isVi) || (isVi ? 'Chủ sở hữu' : 'Owner');

  const initials = displayName
    ? displayName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase()
    : 'U';

  useEffect(() => {
    if (user?.fullName) {
      setFullNameInput(cleanMojibake(user.fullName));
    }
  }, [user?.fullName]);

  // Handle font size change
  const handleToggleLargeFont = (val: boolean) => {
    setLargeFont(val);
    document.documentElement.classList.toggle('age-friendly-large', val);
    localStorage.setItem('holoka_large_font', String(val));
  };

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameInput.trim()) {
      setProfileError(isVi ? 'Vui lòng nhập họ và tên' : 'Please enter full name');
      return;
    }
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const updated = await updateProfile(fullNameInput.trim());
      updateUser({ fullName: updated.fullName });
      setProfileSuccess(isVi ? 'Cập nhật thông tin cá nhân thành công!' : 'Profile updated successfully!');
      setEditingProfile(false);
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  // Password Strength Calculation
  const passwordLengthOk = newPassword.length >= 12;
  const passwordHasUpper = /[A-Z]/.test(newPassword);
  const passwordHasLower = /[a-z]/.test(newPassword);
  const passwordHasNumber = /[0-9]/.test(newPassword);
  const passwordHasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [
    passwordLengthOk,
    passwordHasUpper && passwordHasLower,
    passwordHasNumber,
    passwordHasSpecial,
  ].filter(Boolean).length;

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError(isVi ? 'Vui lòng nhập mật khẩu hiện tại.' : 'Please enter current password.');
      return;
    }
    if (newPassword.length < 12) {
      setPasswordError(isVi ? 'Mật khẩu mới phải có tối thiểu 12 ký tự để đảm bảo bảo mật.' : 'New password must be at least 12 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError(isVi ? 'Mật khẩu mới phải khác với mật khẩu hiện tại.' : 'New password must be different from current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(isVi ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(
        isVi
          ? 'Đổi mật khẩu thành công! Toàn bộ phiên đăng nhập đã được hủy. Hệ thống sẽ chuyển về trang đăng nhập sau vài giây...'
          : 'Password changed successfully! All sessions invalidated. Redirecting to login...'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 2500);
    } catch (err) {
      setPasswordError(errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Notification Prefs Change
  const handleTogglePref = (key: keyof NotificationPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem('holoka_notification_prefs', JSON.stringify(updated));
    setNotifSavedMsg(true);
    setTimeout(() => setNotifSavedMsg(false), 2500);

    // If enabling browser push, ask permission
    if (key === 'browserPush' && !notifPrefs.browserPush) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
  };

  // Clear App Cache
  const handleClearCache = () => {
    const font = localStorage.getItem('holoka_large_font');
    const prefs = localStorage.getItem('holoka_notification_prefs');
    localStorage.clear();
    if (font) localStorage.setItem('holoka_large_font', font);
    if (prefs) localStorage.setItem('holoka_notification_prefs', prefs);
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* ─── Page Title Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            {isVi ? 'Cài đặt tài khoản' : 'Account Settings'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isVi
              ? 'Quản lý thông tin cá nhân, bảo mật mật khẩu, tùy chọn hiển thị và thông báo.'
              : 'Manage personal profile, password security, appearance, and alerts.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}
          >
            <ShieldCheck size={14} />
            <span>{isVi ? 'Bảo mật tiêu chuẩn B2B' : 'Enterprise Secure'}</span>
          </span>
        </div>
      </div>

      {/* ─── 1. Account Profile Section ─── */}
      <SettingsSection
        icon={User}
        title={isVi ? 'Thông tin tài khoản' : 'Profile Information'}
        description={isVi ? 'Thông tin cá nhân và vai trò quản trị trên hệ thống.' : 'Personal details and role in the system.'}
      >
        {profileSuccess && (
          <div
            role="status"
            className="mb-4 rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2"
            style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success)' }}
          >
            <CheckCircle2 size={16} />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div
            role="alert"
            className="mb-4 rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2"
            style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
          >
            <AlertCircle size={16} />
            <span>{profileError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl mb-5" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4 min-w-0">
            <span
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-sm"
              style={{ background: 'var(--brand)' }}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {displayName}
                </p>
                <span className="badge badge-brand">{roleName}</span>
                {user?.platformAdmin && (
                  <span className="badge badge-warning flex items-center gap-1">
                    <Shield size={11} /> Admin
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingProfile(!editingProfile);
              setFullNameInput(displayName);
              setProfileError('');
            }}
            className="btn btn-secondary text-xs sm:text-sm font-semibold self-start sm:self-auto shrink-0"
          >
            {editingProfile ? (isVi ? 'Đóng chỉnh sửa' : 'Cancel') : (isVi ? 'Chỉnh sửa họ tên' : 'Edit Full Name')}
          </button>
        </div>

        {/* Edit profile form */}
        {editingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mb-5 p-4 rounded-xl space-y-4"
            style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-strong)' }}
          >
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isVi ? 'Họ và tên mới' : 'New Full Name'}
              </label>
              <input
                type="text"
                value={fullNameInput}
                onChange={e => setFullNameInput(e.target.value)}
                placeholder={isVi ? 'Nhập họ và tên...' : 'Enter your full name...'}
                maxLength={160}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="btn btn-ghost text-xs font-semibold"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="btn btn-primary text-xs font-semibold flex items-center gap-1.5"
              >
                {savingProfile ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{isVi ? 'Đang lưu...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>{isVi ? 'Lưu thay đổi' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label={isVi ? 'Họ và tên' : 'Full Name'} value={displayName} />
          <InfoRow label={isVi ? 'Email đăng nhập' : 'Login Email'} value={user?.email || '—'} />
          <InfoRow label={isVi ? 'Mã định danh' : 'User ID'} value={`#${user?.id}`} />
          <InfoRow
            label={isVi ? 'Trạng thái hoạt động' : 'Account Status'}
            value={
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--success)' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {isVi ? 'Đang hoạt động' : 'Active'}
              </span>
            }
          />
        </div>
      </SettingsSection>

      {/* ─── 2. Security & Password Section ─── */}
      <SettingsSection
        icon={KeyRound}
        title={isVi ? 'Bảo mật & Mật khẩu' : 'Security & Password'}
        description={isVi ? 'Quản lý mật khẩu đăng nhập và tiêu chuẩn bảo vệ phiên làm việc.' : 'Manage password credentials and active sessions.'}
      >
        {passwordSuccess && (
          <div
            role="status"
            className="mb-4 rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2"
            style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success)' }}
          >
            <CheckCircle2 size={16} />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div
            role="alert"
            className="mb-4 rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2"
            style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
          >
            <AlertCircle size={16} />
            <span>{passwordError}</span>
          </div>
        )}

        <div className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {isVi ? 'Đổi mật khẩu tài khoản' : 'Change Account Password'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isVi
                ? 'Mật khẩu được mã hóa BCrypt một chiều. Yêu cầu tối thiểu 12 ký tự.'
                : 'Passwords are encrypted with BCrypt. Requires at least 12 characters.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowPasswordSection(!showPasswordSection);
              setPasswordError('');
            }}
            className="btn btn-secondary text-xs sm:text-sm font-semibold shrink-0"
          >
            {showPasswordSection ? (isVi ? 'Thu gọn' : 'Close') : (isVi ? 'Đổi mật khẩu' : 'Change Password')}
          </button>
        </div>

        {/* Password change form */}
        {showPasswordSection && (
          <form
            onSubmit={handleChangePassword}
            className="p-4 sm:p-5 rounded-2xl space-y-4"
            style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
          >
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isVi ? 'Mật khẩu hiện tại *' : 'Current Password *'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder={isVi ? 'Nhập mật khẩu đang dùng...' : 'Enter current password...'}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isVi ? 'Mật khẩu mới (tối thiểu 12 ký tự) *' : 'New Password (min 12 characters) *'}
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={isVi ? 'Nhập mật khẩu mới...' : 'Enter new password...'}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength checklist */}
              {newPassword && (
                <div className="mt-2.5 space-y-1.5 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>{isVi ? 'Độ mạnh mật khẩu:' : 'Strength:'}</span>
                    <span
                      style={{
                        color:
                          strengthScore <= 1
                            ? 'var(--danger)'
                            : strengthScore <= 3
                            ? 'var(--warning)'
                            : 'var(--success)',
                      }}
                    >
                      {strengthScore <= 1
                        ? isVi ? 'Yếu' : 'Weak'
                        : strengthScore <= 3
                        ? isVi ? 'Trung bình' : 'Medium'
                        : isVi ? 'Mạnh' : 'Strong'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(strengthScore / 4) * 100}%`,
                        background:
                          strengthScore <= 1
                            ? 'var(--danger)'
                            : strengthScore <= 3
                            ? 'var(--warning)'
                            : 'var(--success)',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span className={`flex items-center gap-1 ${passwordLengthOk ? 'text-emerald-500 font-semibold' : ''}`}>
                      <Check size={12} /> {isVi ? 'Từ 12 ký tự trở lên' : '12+ characters'}
                    </span>
                    <span className={`flex items-center gap-1 ${passwordHasUpper && passwordHasLower ? 'text-emerald-500 font-semibold' : ''}`}>
                      <Check size={12} /> {isVi ? 'Chữ hoa & chữ thường' : 'Upper & lowercase'}
                    </span>
                    <span className={`flex items-center gap-1 ${passwordHasNumber ? 'text-emerald-500 font-semibold' : ''}`}>
                      <Check size={12} /> {isVi ? 'Có chứa số' : 'Includes numbers'}
                    </span>
                    <span className={`flex items-center gap-1 ${passwordHasSpecial ? 'text-emerald-500 font-semibold' : ''}`}>
                      <Check size={12} /> {isVi ? 'Ký tự đặc biệt' : 'Special character'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isVi ? 'Xác nhận mật khẩu mới *' : 'Confirm New Password *'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={isVi ? 'Nhập lại mật khẩu mới...' : 'Re-enter new password...'}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--danger)' }}>
                  {isVi ? 'Mật khẩu xác nhận chưa khớp.' : 'Passwords do not match.'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordSection(false)}
                className="btn btn-ghost text-xs font-semibold"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={savingPassword || newPassword.length < 12 || newPassword !== confirmPassword}
                className="btn btn-primary text-xs font-semibold flex items-center gap-1.5"
              >
                {savingPassword ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{isVi ? 'Đang cập nhật...' : 'Updating...'}</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>{isVi ? 'Xác nhận đổi mật khẩu' : 'Update Password'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </SettingsSection>

      {/* ─── 3. Appearance & Accessibility Section ─── */}
      <SettingsSection
        icon={Palette}
        title={isVi ? 'Giao diện & Hiển thị' : 'Appearance & Accessibility'}
        description={isVi ? 'Tùy chỉnh chế độ màu sáng/tối, kích thước văn bản và ngôn ngữ.' : 'Customize theme mode, text sizing, and language.'}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
              {isVi ? 'Chế độ màu' : 'Theme Mode'}
            </p>
            <ThemeToggle variant="selector" />
          </div>

          <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3">
                <Type size={18} style={{ color: 'var(--brand)' }} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {isVi ? 'Cỡ chữ lớn (Thân thiện)' : 'Larger Text Mode'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {isVi ? 'Tăng kích thước chữ hiển thị để dễ đọc hơn cho người lớn tuổi.' : 'Increase font sizing by 20% for improved readability.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleLargeFont(!largeFont)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0`}
                style={{ background: largeFont ? 'var(--brand)' : 'var(--border-strong)' }}
                aria-pressed={largeFont}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    largeFont ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isVi ? 'Ngôn ngữ hệ thống' : 'Language'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {isVi ? 'Hỗ trợ Tiếng Việt và English.' : 'Select display language.'}
                </p>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ─── 4. Notification Preferences Section ─── */}
      <SettingsSection
        icon={Bell}
        title={isVi ? 'Tùy chọn nhận thông báo' : 'Notification Preferences'}
        description={isVi ? 'Cấu hình các loại cảnh báo tự động gửi đến tài khoản của bạn.' : 'Configure automatic alert triggers and notification sounds.'}
      >
        {notifSavedMsg && (
          <div
            role="status"
            className="mb-4 rounded-xl p-3 text-xs font-semibold flex items-center gap-2"
            style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success)' }}
          >
            <Check size={14} />
            <span>{isVi ? 'Đã lưu tùy chọn thông báo!' : 'Notification preferences saved!'}</span>
          </div>
        )}

        <div className="space-y-2.5">
          {[
            {
              key: 'contractExpiry' as const,
              label: isVi ? 'Hợp đồng sắp hết hạn' : 'Expiring Contracts',
              desc: isVi ? 'Nhắc nhở tự động trước 30 ngày để kịp thời liên hệ khách gia hạn.' : 'Remind 30 days before lease expiration.',
            },
            {
              key: 'overdueInvoices' as const,
              label: isVi ? 'Hóa đơn quá hạn chưa đóng' : 'Overdue Invoices',
              desc: isVi ? 'Cảnh báo khi người thuê phòng chậm nộp tiền phòng/dịch vụ.' : 'Alert when tenant misses billing due date.',
            },
            {
              key: 'maintenanceNew' as const,
              label: isVi ? 'Sự cố bảo trì & sửa chữa mới' : 'New Maintenance Issues',
              desc: isVi ? 'Thông báo ngay khi khách báo hỏng hóc hoặc thiết bị cần sửa chữa.' : 'Immediate alert upon tenant maintenance requests.',
            },
            {
              key: 'overdueTasks' as const,
              label: isVi ? 'Công việc nhân viên trễ hạn' : 'Overdue Staff Tasks',
              desc: isVi ? 'Cảnh báo việc dọn phòng, bàn giao hoặc kiểm tra trễ tiến độ.' : 'Alert when staff checklist is overdue.',
            },
            {
              key: 'soundEnabled' as const,
              label: isVi ? 'Âm thanh thông báo' : 'Notification Sound',
              desc: isVi ? 'Phát âm báo nhẹ khi phát hiện có thông báo khẩn cấp mới.' : 'Play subtle sound chime for urgent alerts.',
              icon: Volume2,
            },
            {
              key: 'browserPush' as const,
              label: isVi ? 'Thông báo đẩy trình duyệt' : 'Browser Push Notifications',
              desc: isVi ? 'Nhận thông báo ngay cả khi đang chuyển tab làm việc khác.' : 'Receive desktop push notifications outside active tab.',
              icon: Laptop,
            },
          ].map(item => {
            const checked = notifPrefs[item.key];
            return (
              <div
                key={item.key}
                onClick={() => handleTogglePref(item.key)}
                className="flex items-center justify-between gap-4 p-3.5 rounded-xl cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon size={15} style={{ color: 'var(--brand)' }} />}
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.label}
                    </p>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {item.desc}
                  </p>
                </div>

                <div
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0`}
                  style={{ background: checked ? 'var(--brand)' : 'var(--border-strong)' }}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      checked ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* ─── 5. Workspace Details Section ─── */}
      {workspace && (
        <SettingsSection
          icon={Building2}
          title="Workspace"
          description={isVi ? 'Không gian làm việc và quyền hạn quản lý bất động sản.' : 'Active workspace properties and tenancy scope.'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoRow label={isVi ? 'Tên Workspace' : 'Workspace Name'} value={workspace.name} />
            <InfoRow label={isVi ? 'Vai trò tài khoản' : 'Assigned Role'} value={roleName} />
            <InfoRow label={isVi ? 'Mã Workspace' : 'Workspace ID'} value={`#${workspace.id}`} />
          </div>
        </SettingsSection>
      )}

      {/* ─── 6. System & Cache Section ─── */}
      <SettingsSection
        icon={Globe}
        title={isVi ? 'Thông tin hệ thống & Dữ liệu' : 'System & App Data'}
        description={isVi ? 'Thông số kỹ thuật nền tảng và quản lý bộ nhớ đệm ứng dụng.' : 'Technical runtime parameters and application cache.'}
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
          {[
            { label: isVi ? 'Phiên bản hệ thống' : 'Platform Version', value: 'HOLOKA V2 Enterprise' },
            { label: isVi ? 'Múi giờ vận hành' : 'Timezone', value: 'Asia/Ho_Chi_Minh (UTC+7)' },
            { label: isVi ? 'Đơn vị tiền tệ' : 'Currency', value: 'VND (₫)' },
            { label: isVi ? 'Mã hóa kết nối' : 'Security Token', value: 'Nimbus JWT & CSRF Guard' },
          ].map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
            >
              <dt style={{ color: 'var(--text-muted)' }}>{row.label}</dt>
              <dd className="font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isVi ? 'Xóa bộ nhớ đệm giao diện' : 'Clear Application Cache'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Làm mới dữ liệu tạm thời mà không cần đăng nhập lại.' : 'Reset transient client state without signing out.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="btn btn-secondary text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            {cacheCleared ? <Check size={14} style={{ color: 'var(--success)' }} /> : <RefreshCw size={14} />}
            <span>{cacheCleared ? (isVi ? 'Đã dọn dẹp!' : 'Cleared!') : (isVi ? 'Dọn dẹp bộ nhớ' : 'Clear Cache')}</span>
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
