import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Building2, Users, FileText, LayoutDashboard,
  Wrench, CheckSquare, CreditCard, ChevronRight,
  DoorOpen, Menu, X, BarChart3, HelpCircle, Shield, Server,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUnreadCount } from '../services/notificationService';
import Logo from '../components/ui/Logo';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import ThemeToggle from '../components/ui/ThemeToggle';
import FloatingAiAssistant from '../components/ui/FloatingAiAssistant';
import WelcomeAiGreeting from '../components/ui/WelcomeAiGreeting';
import UserGuideModal from '../components/ui/UserGuideModal';
import NotificationDropdown from '../components/ui/NotificationDropdown';
import UserProfileDropdown, { cleanMojibake } from '../components/ui/UserProfileDropdown';

interface NavItem {
  to: string;
  icon: React.ElementType;
  labelKey: string;
}

const PLATFORM_NAV_GROUPS: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: 'nav.group_platform_core',
    items: [
      { to: '/platform/dashboard',  icon: LayoutDashboard, labelKey: 'nav.platform_dashboard' },
      { to: '/platform/users',      icon: Users,           labelKey: 'nav.platform_users' },
      { to: '/platform/workspaces', icon: Building2,       labelKey: 'nav.platform_workspaces' },
    ],
  },
  {
    titleKey: 'nav.group_platform_security',
    items: [
      { to: '/platform/audit-logs', icon: Shield,          labelKey: 'nav.platform_audit_logs' },
      { to: '/platform/settings',   icon: Server,          labelKey: 'nav.platform_settings' },
    ],
  },
];

const NAV_GROUPS: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: 'nav.group_overview',
    items: [{ to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' }],
  },
  {
    titleKey: 'nav.group_assets',
    items: [
      { to: '/properties', icon: Building2, labelKey: 'nav.properties' },
      { to: '/rooms',      icon: DoorOpen,  labelKey: 'nav.rooms' },
      { to: '/tenants',    icon: Users,     labelKey: 'nav.tenants' },
      { to: '/contracts',  icon: FileText,  labelKey: 'nav.contracts' },
    ],
  },
  {
    titleKey: 'nav.group_finance',
    items: [
      { to: '/finance', icon: CreditCard, labelKey: 'nav.finance' },
      { to: '/reports', icon: BarChart3,  labelKey: 'nav.reports' },
    ],
  },
  {
    titleKey: 'nav.group_operations',
    items: [
      { to: '/maintenance',   icon: Wrench,      labelKey: 'nav.maintenance' },
      { to: '/tasks',         icon: CheckSquare, labelKey: 'nav.tasks' },
    ],
  },
];

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/dashboard':           'nav.dashboard',
  '/platform/dashboard':  'nav.platform_dashboard',
  '/platform/users':      'nav.platform_users',
  '/platform/workspaces': 'nav.platform_workspaces',
  '/platform/audit-logs': 'nav.platform_audit_logs',
  '/platform/settings':   'nav.platform_settings',
  '/properties':          'nav.properties',
  '/buildings':           'nav.buildings',
  '/rooms':               'nav.rooms',
  '/tenants':             'nav.tenants',
  '/contracts':           'nav.contracts',
  '/finance':             'nav.finance',
  '/maintenance':         'nav.maintenance',
  '/tasks':               'nav.tasks',
  '/notifications':       'nav.notifications',
  '/intelligence':        'nav.intelligence',
  '/ai':                  'nav.ai',
  '/reports':             'nav.reports',
  '/settings':            'nav.settings',
};

export const getRoleLabel = (role?: string | null, isVi: boolean = true): string => {
  if (!role) return '';
  const r = role.toUpperCase();
  if (r === 'SUPER_ADMIN') return 'Super Admin';
  if (r === 'OWNER') return isVi ? 'Chủ sở hữu' : 'Owner';
  if (r === 'MANAGER') return isVi ? 'Quản lý' : 'Manager';
  if (r === 'STAFF') return isVi ? 'Nhân viên' : 'Staff';
  return role;
};

const SidebarLink = ({ item, unread }: { item: NavItem; unread: number }) => {
  const { t } = useLanguage();
  const badgeCount = item.to === '/notifications' && unread > 0 ? unread : 0;

  return (
    <NavLink to={item.to} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
      {({ isActive }) => (
        <>
          <item.icon size={18} strokeWidth={isActive ? 2.3 : 1.9} className="flex-shrink-0" />
          <span className="flex-1 truncate">{t(item.labelKey)}</span>
          {badgeCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: 'var(--danger)' }}
            >
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

export default function MainLayout() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [largeFont, setLargeFont] = useState(() => localStorage.getItem('holoka_large_font') === 'true');

  const [showWelcome, setShowWelcome] = useState(() => {
    const justLoggedIn = sessionStorage.getItem('holoka_just_logged_in') === 'true';
    const seen = sessionStorage.getItem('holoka_welcome_seen');
    return justLoggedIn || !seen;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('age-friendly-large', largeFont);
    localStorage.setItem('holoka_large_font', String(largeFont));
  }, [largeFont]);

  useEffect(() => {
    const handleOpen = () => setShowWelcome(true);
    window.addEventListener('open-welcome-greeting', handleOpen);
    return () => window.removeEventListener('open-welcome-greeting', handleOpen);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const wsId = user?.workspaces?.[0]?.id ?? 1;

  useEffect(() => {
    if (!wsId) return;
    const load = () => getUnreadCount(wsId).then(setUnread).catch(() => {});
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [wsId]);

  const navGroups = user?.platformAdmin
    ? PLATFORM_NAV_GROUPS
    : NAV_GROUPS
        .map(group => ({
          ...group,
          items: group.items.filter(
            item => user?.workspaces?.[0]?.role !== 'STAFF'
              || ['/tasks', '/maintenance'].includes(item.to)
          ),
        }))
        .filter(group => group.items.length);

  const pageTitle = (() => {
    for (const [prefix, key] of Object.entries(PAGE_TITLE_KEYS)) {
      if (location.pathname.startsWith(prefix)) return t(key);
    }
    return 'HOLOKA';
  })();

  const workspace = user?.platformAdmin
    ? { id: 0, name: isVi ? 'Hệ Thống HOLOKA Super' : 'HOLOKA Platform Admin', role: 'SUPER_ADMIN' }
    : user?.workspaces?.[0];

  const sidebar = (
    <aside
      className="flex flex-col h-full relative z-20 select-none"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* ─── Brand ─── */}
      <div className="px-4 py-5 flex-shrink-0">
        <NavLink
          to={user?.platformAdmin ? '/platform/dashboard' : '/dashboard'}
          className="block rounded-xl focus-visible:outline-none"
        >
          <Logo size="md" variant="horizontal" animate={false} />
        </NavLink>

        {workspace && (
          <div
            className="mt-4 flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                {cleanMojibake(workspace.name)}
              </p>
              <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {getRoleLabel(workspace.role, isVi)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-5">
        {navGroups.map(group => (
          <div key={group.titleKey}>
            <p className="sidebar-group-title">{t(group.titleKey)}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <SidebarLink key={item.to} item={item} unread={unread} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-[264px] flex-shrink-0">{sidebar}</div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[276px] flex flex-col animate-fade-in">{sidebar}</div>
          <div
            className="flex-1"
            style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)' }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex-shrink-0 flex items-center justify-between gap-3 h-16 px-4 sm:px-6 relative z-10"
          style={{
            background: 'var(--navbar-bg)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: '1px solid var(--navbar-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-xs font-semibold hidden sm:inline flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                HOLOKA
              </span>
              <ChevronRight size={13} className="hidden sm:inline flex-shrink-0" style={{ color: 'var(--border-strong)' }} />
              <h1
                className="text-[17px] font-bold tracking-tight truncate"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <ThemeToggle variant="icon" />
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => setLargeFont(v => !v)}
              className="btn btn-ghost btn-icon hidden sm:inline-flex"
              aria-pressed={largeFont}
              title={isVi ? 'Bật/tắt cỡ chữ lớn' : 'Toggle larger text'}
            >
              <span className="text-[13px] font-bold">A<span className="text-[10px] align-super">+</span></span>
            </button>

            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="btn btn-ghost hidden md:inline-flex"
              title={t('layout.guide')}
            >
              <HelpCircle size={17} />
              <span className="hidden xl:inline">{t('layout.guide_short')}</span>
            </button>

            <NotificationDropdown
              unread={unread}
              onUnreadChange={setUnread}
              workspaceId={wsId}
            />

            <div className="w-px h-6 mx-0.5 hidden sm:block" style={{ background: 'var(--border)' }} />

            <UserProfileDropdown onOpenGuide={() => setShowGuideModal(true)} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1400px] mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <FloatingAiAssistant />

      <UserGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />

      {showWelcome && (
        <WelcomeAiGreeting
          onDone={() => {
            sessionStorage.setItem('holoka_welcome_seen', '1');
            sessionStorage.removeItem('holoka_just_logged_in');
            setShowWelcome(false);
          }}
        />
      )}
    </div>
  );
}
