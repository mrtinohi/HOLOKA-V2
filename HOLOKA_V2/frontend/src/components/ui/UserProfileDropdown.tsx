import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, LogOut, HelpCircle, ChevronDown,
  Shield, Building2, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { logout as logoutSession } from '../../services/authService';

interface UserProfileDropdownProps {
  onOpenGuide?: () => void;
}

import { getRoleLabel } from '../../layouts/MainLayout';

export function cleanMojibake(text?: string | null): string {
  if (!text) return '';
  return text
    // "Quản trị viên" and variants (handles ° and º, and trailing/truncated n)
    .replace(/Qu[aá][º°\u00ba\u00b0][£\u00a3]n/gi, 'Quản')
    .replace(/tr[aá]»[‹<\u2039\u008b]/gi, 'trị')
    .replace(/vi[ĂÃ\u0102\u00c3][ª\u00aa]?n?/gi, 'viên')
    .replace(/Quản\s*trị\s*viên?/gi, 'Quản trị viên')
    // "Chủ sở hữu" and variants
    .replace(/Ch[aá]»[§\u00a7]/gi, 'Chủ')
    .replace(/s[aá]»[Ÿ\u0178\u009f\u00bf]u?/gi, 'sở')
    .replace(/h[aá]»[¯\u00af]u?/gi, 'hữu')
    // "Căn Hộ" and variants
    .replace(/C[ÄÃ\u00c4\u00c3][ƒ\u0192\u0083]n/gi, 'Căn')
    .replace(/H[aá]»[™\u2122\u0099]/gi, 'Hộ')
    // "Nhiên" and variants
    .replace(/Nhi[ĂÃ\u0102\u00c3][ª\u00aa]?n/gi, 'Nhiên')
    // "Bình Thạnh" and variants
    .replace(/B[iì]nh/gi, 'Bình')
    .replace(/Th[aạ]nh/gi, 'Thạnh')
    // "Thảo Điền", "Cầu Giấy"
    .replace(/Th[aá]»[£\u00a3]o/gi, 'Thảo')
    .replace(/Đi[aá]»[n\u0081]/gi, 'Điền')
    .replace(/C[aá]º§u/gi, 'Cầu')
    .replace(/Gi[aá]º¥y/gi, 'Giấy');
}

export default function UserProfileDropdown({ onOpenGuide }: UserProfileDropdownProps) {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const workspace = user?.workspaces?.[0];
  const roleName = user?.platformAdmin
    ? 'SUPER ADMIN'
    : getRoleLabel(workspace?.role, isVi) || (isVi ? 'Chủ sở hữu' : 'Owner');

  const rawClean = cleanMojibake(user?.fullName);
  const displayName = isVi
    ? (rawClean || t('layout.admin_role'))
    : (rawClean.replace(/Quản trị viên/g, 'Administrator') || t('layout.admin_role'));

  const initials = displayName
    ? displayName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase()
    : 'U';

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      sessionStorage.removeItem('holoka_welcome_seen');
      sessionStorage.removeItem('holoka_just_logged_in');
      await logoutSession();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/login');
    } finally {
      setLoggingOut(false);
      setIsOpen(false);
    }
  };

  const handleGoSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  const handleOpenGuide = () => {
    setIsOpen(false);
    onOpenGuide?.();
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* ─── Profile Trigger Button ─── */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-2.5 p-1 rounded-xl transition-all cursor-pointer hover:bg-[var(--surface-hover)] focus-visible:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={displayName}
      >
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm transition-transform duration-150 hover:scale-105"
          style={{ background: user?.platformAdmin ? '#8b5cf6' : 'var(--brand)' }}
        >
          {initials}
        </span>

        <div className="hidden sm:block text-left">
          <p
            className="text-[13px] font-semibold leading-tight truncate max-w-[140px]"
            style={{ color: 'var(--text-primary)' }}
          >
            {displayName}
          </p>
          <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {roleName}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={`hidden sm:inline-block transition-transform duration-200 text-[var(--text-muted)] ${
            isOpen ? 'rotate-180 text-[var(--brand)]' : ''
          }`}
        />
      </button>

      {/* ─── Profile Dropdown Menu ─── */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[290px] sm:w-[320px] rounded-2xl flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg), 0 20px 45px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* ─── User Profile Card Header ─── */}
          <div
            className="p-4 flex items-start gap-3.5"
            style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border)' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm"
              style={{ background: user?.platformAdmin ? '#8b5cf6' : 'var(--brand)' }}
            >
              {initials}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p
                  className="text-sm font-bold truncate leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {displayName}
                </p>
                {user?.platformAdmin && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold"
                    style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
                  >
                    <Shield size={10} /> Admin
                  </span>
                )}
              </div>

              <p
                className="text-xs truncate leading-tight mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {user?.email}
              </p>

              {workspace && (
                <div
                  className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <Building2 size={11} style={{ color: 'var(--brand)' }} />
                  <span className="truncate max-w-[130px]" style={{ color: 'var(--text-secondary)' }}>
                    {cleanMojibake(workspace.name)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span className="font-semibold" style={{ color: 'var(--brand-text)' }}>
                    {roleName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Navigation Menu Items ─── */}
          <div className="p-2 space-y-1">
            {user?.platformAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/platform/dashboard');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer hover:bg-[var(--surface-hover)] group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:scale-105"
                    style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea' }}
                  >
                    <Shield size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Tổng quan Nền tảng' : 'Platform Dashboard'}
                    </p>
                    <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {isVi ? 'Dashboard điều hành hệ thống' : 'System operations overview'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/platform/users');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer hover:bg-[var(--surface-hover)] group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:scale-105"
                    style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
                  >
                    <Users size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Quản lý tài khoản (CRUD)' : 'Users & Permissions (CRUD)'}
                    </p>
                    <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {isVi ? 'Phân quyền & bảo mật tài khoản' : 'Access control & account security'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/platform/workspaces');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer hover:bg-[var(--surface-hover)] group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:scale-105"
                    style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
                  >
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Khách hàng & Tổ chức SaaS' : 'Client Organizations'}
                    </p>
                    <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {isVi ? 'Chủ căn hộ & Doanh nghiệp' : 'Subscribers & businesses'}
                    </p>
                  </div>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleGoSettings}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer hover:bg-[var(--surface-hover)] group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:scale-105"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
              >
                <Settings size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {t('nav.settings')}
                </p>
                <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {isVi ? 'Hồ sơ, bảo mật & giao diện' : 'Profile, security & theme'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenGuide}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer hover:bg-[var(--surface-hover)] group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:scale-105"
                style={{ background: 'var(--surface-subtle)', color: 'var(--text-secondary)' }}
              >
                <HelpCircle size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {t('layout.guide')}
                </p>
                <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {isVi ? 'Tài liệu & mẹo sử dụng HOLOKA' : 'Documentation & tips'}
                </p>
              </div>
            </button>
          </div>

          {/* ─── Logout Section ─── */}
          <div
            className="p-2"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-subtle)' }}
          >
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer group"
              style={{ color: 'var(--danger)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-soft)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
              >
                <LogOut size={16} className={loggingOut ? 'animate-spin' : ''} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">
                  {loggingOut ? (isVi ? 'Đang đăng xuất...' : 'Signing out...') : t('layout.logout')}
                </p>
                <p className="text-[11px] leading-tight mt-0.5 opacity-80">
                  {isVi ? 'Kết thúc phiên làm việc an toàn' : 'End session securely'}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
