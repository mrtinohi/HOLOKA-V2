import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Users, FileText, Settings, LayoutDashboard,
  Wrench, CheckSquare, Bell, CreditCard, LogOut, ChevronRight,
  DoorOpen, Menu, X, Brain, BarChart3, Building,
  HelpCircle, Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUnreadCount } from '../services/notificationService';
import { logout as logoutSession } from '../services/authService';
import { errorMessage } from '../services/api';
import Logo from '../components/ui/Logo';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import ThemeToggle from '../components/ui/ThemeToggle';
import FloatingAiAssistant from '../components/ui/FloatingAiAssistant';
import WelcomeAiGreeting from '../components/ui/WelcomeAiGreeting';
import UserGuideModal from '../components/ui/UserGuideModal';

interface NavItem {
  to: string;
  icon: React.ElementType;
  labelKey: string;
  badge?: number;
}

const NAV_GROUPS: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: 'nav.group_overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    ],
  },
  {
    titleKey: 'nav.group_assets',
    items: [
      { to: '/properties', icon: Building2,  labelKey: 'nav.properties' },
      { to: '/rooms',      icon: DoorOpen,   labelKey: 'nav.rooms' },
      { to: '/tenants',   icon: Users,      labelKey: 'nav.tenants' },
      { to: '/contracts', icon: FileText,   labelKey: 'nav.contracts' },
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
      { to: '/notifications', icon: Bell,        labelKey: 'nav.notifications' },
    ],
  },
];

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/dashboard':    'nav.dashboard',
  '/properties':   'nav.properties',
  '/buildings':    'nav.buildings',
  '/rooms':        'nav.rooms',
  '/tenants':      'nav.tenants',
  '/contracts':    'nav.contracts',
  '/finance':      'nav.finance',
  '/maintenance':  'nav.maintenance',
  '/tasks':        'nav.tasks',
  '/notifications':'nav.notifications',
  '/intelligence': 'nav.intelligence',
  '/ai':           'nav.ai',
  '/reports':      'nav.reports',
  '/settings':     'nav.settings',
};

const SidebarLink = ({ item, unread }: { item: NavItem; unread: number }) => {
  const { t } = useLanguage();
  const badgeCount = item.to === '/notifications' && unread > 0 ? unread : item.badge;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
    >
      <div className="relative">
        <item.icon size={22} className="transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
      </div>
      <span className="flex-1 sidebar-label">{t(item.labelKey)}</span>
      {badgeCount ? (
        <span
          className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-white text-[10px] font-extrabold shadow-[0_0_8px_rgba(244,63,94,0.5)]"
          style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
    </NavLink>
  );
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [largeFont, setLargeFont] = useState(() => localStorage.getItem('holoka_large_font') === 'true');

  useEffect(() => {
    if (largeFont) {
      document.documentElement.classList.add('age-friendly-large');
      localStorage.setItem('holoka_large_font', 'true');
    } else {
      document.documentElement.classList.remove('age-friendly-large');
      localStorage.setItem('holoka_large_font', 'false');
    }
  }, [largeFont]);

  // Show AI welcome greeting once per session or right after login
  const [showWelcome, setShowWelcome] = useState(() => {
    const justLoggedIn = sessionStorage.getItem('holoka_just_logged_in') === 'true';
    const seen = sessionStorage.getItem('holoka_welcome_seen');
    return justLoggedIn || !seen;
  });

  useEffect(() => {
    const handleOpen = () => setShowWelcome(true);
    window.addEventListener('open-welcome-greeting', handleOpen);
    return () => window.removeEventListener('open-welcome-greeting', handleOpen);
  }, []);

  const wsId = user?.workspaces?.[0]?.id ?? 1;

  // Poll unread count every 60s
  useEffect(() => {
    if (!wsId) return;
    const load = () => getUnreadCount(wsId).then(setUnread).catch(() => {});
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [wsId]);

  const navGroups = NAV_GROUPS
    .map(group => ({
      ...group,
      items: group.items.filter(
        item => user?.workspaces?.[0]?.role !== 'STAFF' || ['/tasks', '/maintenance', '/notifications'].includes(item.to)
      ),
    }))
    .filter(group => group.items.length);

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError('');
    try {
      sessionStorage.removeItem('holoka_welcome_seen');
      sessionStorage.removeItem('holoka_just_logged_in');
      await logoutSession();
      logout();
      navigate('/login');
    } catch (error) {
      setLogoutError(errorMessage(error));
    } finally {
      setLoggingOut(false);
    }
  };

  const pageTitle = (() => {
    for (const [prefix, key] of Object.entries(PAGE_TITLE_KEYS)) {
      if (location.pathname.startsWith(prefix)) return t(key);
    }
    return 'HOLOKA';
  })();

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase()
    : 'AD';

  const workspace = user?.workspaces?.[0];

  const sidebar = (
    <aside className="flex flex-col h-full relative z-20 select-none bg-white dark:bg-[#090d16] border-r border-slate-200 dark:border-white/10 shadow-xs dark:shadow-[4px_0_24px_rgba(0,0,0,0.25)] transition-colors duration-200">
      {/* ─── Top Brand Header ─── */}
      <div className="px-5 pt-6 pb-4">
        <NavLink to="/dashboard" className="block focus:outline-none mascot-logo" title="Về trang chủ HOLOKA">
          <Logo size="lg" variant="horizontal" animate={true} />
        </NavLink>

        {/* Workspace Chip */}
        {workspace && (
          <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 transition-all">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <div className="truncate text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-tight tracking-wide">
                  {workspace.name}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">{t('layout.workspace')}</p>
              </div>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 tracking-wider uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
              {workspace.role}
            </span>
          </div>
        )}
      </div>

      {/* Subtle Divider Line */}
      <div className="mx-4 mb-3 h-[1px] bg-slate-200 dark:bg-slate-800/80" />

      {/* ─── Scrollable Nav Categories ─── */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 pb-4">
        {navGroups.map(group => (
          <div key={group.titleKey}>
            <p
              className="sidebar-group-title text-slate-500 dark:text-slate-400"
            >
              {t(group.titleKey)}
            </p>
            <div className="space-y-1">
              {group.items.map(item => (
                <SidebarLink key={item.to} item={item} unread={unread} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Bản tin hôm nay ─── */}
      <div
        onClick={() => setShowWelcome(true)}
        className="mx-3.5 mb-2 p-2.5 rounded-xl border border-blue-100 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-slate-800/80 transition-all flex items-center gap-2.5 cursor-pointer group"
        title="Bấm để xem Bản tin vận hành hàng ngày"
      >
        <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Calendar size={14} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
              {isVi ? 'Bản tin hôm nay' : 'Daily Briefing'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {isVi ? 'Xem số liệu & việc cần làm' : 'View daily metrics & tasks'}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 my-1 h-[1px] bg-slate-200 dark:bg-slate-800/60" />

      {/* ─── Bottom Profile & Settings ─── */}
      <div className="p-3 space-y-1.5">
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
        >
          <Settings size={20} />
          <span className="flex-1 font-semibold">{t('nav.settings')}</span>
        </NavLink>

        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 transition-all duration-200 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">
              {user?.fullName || t('layout.admin_role')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user?.email || 'admin@holoka.vn'}
            </p>
          </div>

          <button
            disabled={loggingOut}
            onClick={handleLogout}
            title={t('layout.logout')}
            className="p-2.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)] font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-72 flex-shrink-0">
        {sidebar}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex flex-col">
            {sidebar}
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Modern Glassmorphic Top Navbar */}
        <header
          className="flex-shrink-0 flex items-center justify-between h-[72px] px-6 relative z-10 transition-colors duration-200"
          style={{
            background: 'var(--color-navbar-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--color-navbar-border)',
            boxShadow: '0 1px 12px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <button
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Clean Breadcrumb Navigation */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                HOLOKA
              </span>
              <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 hidden sm:inline" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* ─── Theme Toggle Switcher ─── */}
            <ThemeToggle variant="icon" />

            {/* ─── Language Switcher Component ─── */}
            <LanguageSwitcher variant="pill" theme="auto" />

            {/* ─── Nút Đổi Cỡ Chữ Dễ Đọc (Đặc Biệt Cho Người Trung Tuổi) ─── */}
            <button
              type="button"
              onClick={() => setLargeFont(!largeFont)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer ${
                largeFont
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-blue-400'
              }`}
              title="Bật/Tắt cỡ chữ to dễ nhìn"
            >
              <span className="font-black text-sm">A+</span>
              <span className="hidden md:inline">{largeFont ? 'Chữ To' : 'Cỡ Chữ'}</span>
            </button>

            {/* User Guide Button - Clean & Professional */}
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer min-h-[44px]"
              title={t('layout.guide')}
            >
              <HelpCircle size={18} />
              <span className="hidden sm:inline">{t('layout.guide_short')}</span>
            </button>

            {/* Notification Bell with Ping */}
            <NavLink
              to="/notifications"
              className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
              title={t('layout.notifications')}
            >
              <Bell size={19} />
              {unread > 0 ? (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white dark:border-slate-900" />
                </span>
              ) : null}
            </NavLink>

            {/* Vertical Divider */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm ring-2 ring-blue-500/20"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
              >
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.fullName || t('layout.admin_role')}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {workspace?.role === 'OWNER' ? 'Chủ nhà' : workspace?.role || 'Chủ nhà'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content Container with smooth fade */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {logoutError && (
            <div role="alert" className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm font-semibold">
              {logoutError}
            </div>
          )}
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Interactive AI Assistant */}
      <FloatingAiAssistant />

      {/* User Guide Modal */}
      <UserGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      {/* AI Welcome Greeting (once per session or on login) */}
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





