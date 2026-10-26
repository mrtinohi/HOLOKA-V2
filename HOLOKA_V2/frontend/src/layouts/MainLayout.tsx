import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Users, FileText, Settings, LayoutDashboard,
  Wrench, CheckSquare, Bell, CreditCard, LogOut, ChevronRight,
  DoorOpen, Menu, X, Brain, BarChart3, Building, Plus, Sparkles, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUnreadCount } from '../services/notificationService';
import { logout as logoutSession } from '../services/authService';
import { errorMessage } from '../services/api';
import Logo from '../components/ui/Logo';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import FloatingAiAssistant from '../components/ui/FloatingAiAssistant';

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
      { to: '/buildings',  icon: Building,   labelKey: 'nav.buildings' },
      { to: '/rooms',      icon: DoorOpen,   labelKey: 'nav.rooms' },
    ],
  },
  {
    titleKey: 'nav.group_leases',
    items: [
      { to: '/tenants',   icon: Users,    labelKey: 'nav.tenants' },
      { to: '/contracts', icon: FileText, labelKey: 'nav.contracts' },
    ],
  },
  {
    titleKey: 'nav.group_finance',
    items: [
      { to: '/finance', icon: CreditCard, labelKey: 'nav.finance' },
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
  {
    titleKey: 'nav.group_intelligence',
    items: [
      { to: '/intelligence', icon: Brain, labelKey: 'nav.intelligence' },
    ],
  },
  {
    titleKey: 'nav.group_reports',
    items: [
      { to: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
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
        <item.icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
      </div>
      <span className="flex-1 font-medium">{t(item.labelKey)}</span>
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

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
    <aside
      className="flex flex-col h-full relative z-20 select-none"
      style={{
        background: 'linear-gradient(180deg, #090d16 0%, #0d121f 50%, #080c14 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* ─── Top Brand Header ─── */}
      <div className="px-5 pt-6 pb-4">
        <NavLink to="/dashboard" className="block focus:outline-none">
          <Logo size="md" variant="horizontal" animate={true} />
        </NavLink>

        {/* Workspace Chip */}
        {workspace && (
          <div
            className="mt-4 flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
              borderColor: 'rgba(99, 102, 241, 0.25)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </span>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-slate-200 truncate leading-tight tracking-wide">
                  {workspace.name}
                </p>
                <p className="text-[10px] text-slate-400 tracking-wider">{t('layout.workspace')}</p>
              </div>
            </div>

            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0 tracking-wider uppercase"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.35))',
                color: '#a5b4fc',
                border: '1px solid rgba(165,180,252,0.25)',
              }}
            >
              {workspace.role}
            </span>
          </div>
        )}
      </div>

      {/* Decorative Gradient Line */}
      <div
        className="mx-4 mb-3 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), rgba(6, 182, 212, 0.4), transparent)',
        }}
      />

      {/* ─── Scrollable Nav Categories ─── */}
      <nav className="flex-1 overflow-y-auto px-3.5 space-y-4 pb-4">
        {navGroups.map(group => (
          <div key={group.titleKey}>
            <p
              className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400"
              style={{ letterSpacing: '0.12em' }}
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

      {/* ─── AI Engine Pulse Status Badge ─── */}
      <div className="mx-3.5 mb-2 p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-950/30 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-cyan-300">
          <Activity size={15} className="animate-pulse" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-indigo-200">{t('layout.ai_core')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <p className="text-[10px] text-slate-400 truncate">{t('layout.ai_status')}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 my-1 h-[1px] bg-slate-800/60" />

      {/* ─── Bottom Profile & Settings ─── */}
      <div className="p-3 space-y-1.5">
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
        >
          <Settings size={18} />
          <span className="flex-1">{t('nav.settings')}</span>
        </NavLink>

        {/* User Card */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 group"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-slate-200 truncate leading-snug">
              {user?.fullName || t('layout.admin_role')}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.email || 'admin@holoka.vn'}
            </p>
          </div>

          <button
            disabled={loggingOut}
            onClick={handleLogout}
            title={t('layout.logout')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 flex-shrink-0">
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
          className="flex-shrink-0 flex items-center justify-between h-16 px-6 relative z-10"
          style={{
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 1px 12px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <button
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Breadcrumb Navigation with Modern Badge */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100">
                <Sparkles size={12} className="text-indigo-500" />
                HOLOKA V2
              </span>
              <ChevronRight size={14} className="text-slate-300 hidden sm:inline" />
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* ─── Language Switcher Component ─── */}
            <LanguageSwitcher variant="pill" theme="light" />

            {/* Quick Action Button */}
            <NavLink
              to="/properties"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 cursor-pointer shadow-[0_2px_10px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.5)] hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>{t('layout.add_new')}</span>
            </NavLink>

            {/* Notification Bell with Ping */}
            <NavLink
              to="/notifications"
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 transition-all duration-200 cursor-pointer"
              title={t('layout.notifications')}
            >
              <Bell size={19} />
              {unread > 0 ? (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white" />
                </span>
              ) : null}
            </NavLink>

            {/* Vertical Divider */}
            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm ring-2 ring-indigo-500/20"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.fullName || t('layout.admin_role')}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    {workspace?.role || 'OWNER'}
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
    </div>
  );
}
