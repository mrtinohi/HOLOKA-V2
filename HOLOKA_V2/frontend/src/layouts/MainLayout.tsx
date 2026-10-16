import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Users, FileText, Settings, LayoutDashboard,
  Wrench, CheckSquare, Bell, CreditCard, LogOut, ChevronRight,
  DoorOpen, Zap, Menu, X, Brain, Bot, BarChart3, Building,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../services/notificationService';
import { logout as logoutSession } from '../services/authService';
import { errorMessage } from '../services/api';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

const buildNavGroups = (unread: number): { title: string; items: NavItem[] }[] => [
  {
    title: 'Tổng quan',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    title: 'Quản lý tài sản',
    items: [
      { to: '/properties', icon: Building2,  label: 'Bất động sản' },
      { to: '/buildings',  icon: Building,   label: 'Tòa nhà' },
      { to: '/rooms',      icon: DoorOpen,   label: 'Phòng' },
    ],
  },
  {
    title: 'Khách thuê & Hợp đồng',
    items: [
      { to: '/tenants',   icon: Users,    label: 'Khách thuê' },
      { to: '/contracts', icon: FileText, label: 'Hợp đồng' },
    ],
  },
  {
    title: 'Tài chính',
    items: [
      { to: '/finance', icon: CreditCard, label: 'Hóa đơn' },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { to: '/maintenance',   icon: Wrench,      label: 'Bảo trì' },
      { to: '/tasks',         icon: CheckSquare, label: 'Công việc' },
      { to: '/notifications', icon: Bell,        label: 'Thông báo', badge: unread > 0 ? unread : undefined },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { to: '/intelligence', icon: Brain, label: 'Property Intelligence' },
      { to: '/ai',           icon: Bot,   label: 'AI Assistant' },
    ],
  },
  {
    title: 'Báo cáo',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Báo cáo' },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/properties':   'Bất động sản',
  '/buildings':    'Tòa nhà',
  '/rooms':        'Phòng',
  '/tenants':      'Khách thuê',
  '/contracts':    'Hợp đồng',
  '/finance':      'Tài chính & Hóa đơn',
  '/maintenance':  'Bảo trì',
  '/tasks':        'Công việc',
  '/notifications':'Thông báo',
  '/intelligence': 'Property Intelligence',
  '/ai':           'AI Assistant',
  '/reports':      'Báo cáo',
  '/settings':     'Cài đặt',
};

const SidebarLink = ({ item }: { item: NavItem }) => (
  <NavLink
    to={item.to}
    className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
  >
    <item.icon size={17} />
    <span className="flex-1">{item.label}</span>
    {item.badge ? (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold"
        style={{ background: '#f43f5e', fontSize: '10px' }}
      >
        {item.badge > 99 ? '99+' : item.badge}
      </span>
    ) : null}
  </NavLink>
);

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const wsId = user!.workspaces[0].id;

  // Poll unread count every 60s
  useEffect(() => {
    const load = () => getUnreadCount(wsId).then(setUnread).catch(() => {});
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [wsId]);

  const navGroups = buildNavGroups(unread).map(group => ({ ...group, items: group.items.filter(item => user!.workspaces[0].role !== 'STAFF' || ['/tasks', '/maintenance', '/notifications'].includes(item.to)) })).filter(group => group.items.length);

  const handleLogout = async () => {
    setLoggingOut(true); setLogoutError('');
    try { await logoutSession(); logout(); navigate('/login'); }
    catch (error) { setLogoutError(errorMessage(error)); }
    finally { setLoggingOut(false); }
  };

  const pageTitle = (() => {
    for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
      if (location.pathname.startsWith(prefix)) return title;
    }
    return 'HOLOKA';
  })();

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase()
    : 'U';

  const workspace = user?.workspaces?.[0];

  const sidebar = (
    <aside
      className="flex flex-col h-full"
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
        borderRight: '1px solid rgba(51,65,85,0.5)',
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Zap size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-widest leading-none">HOLOKA</h1>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Property Intelligence</p>
          </div>
        </div>

        {/* Workspace Chip */}
        {workspace && (
          <div
            className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" style={{ boxShadow: '0 0 6px #34d399' }} />
            <span className="text-xs font-medium truncate" style={{ color: '#a5b4fc' }}>{workspace.name}</span>
            <span
              className="ml-auto text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}
            >
              {workspace.role}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 mb-3" style={{ height: '1px', background: 'rgba(51,65,85,0.6)' }} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 pb-4">
        {navGroups.map(group => (
          <div key={group.title}>
            <p
              className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#374151', letterSpacing: '0.08em' }}
            >
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => <SidebarLink key={item.to} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 mt-2" style={{ height: '1px', background: 'rgba(51,65,85,0.6)' }} />

      {/* Bottom */}
      <div className="p-3 space-y-1">
        <NavLink to="/settings" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
          <Settings size={17} />
          <span className="flex-1">Cài đặt</span>
        </NavLink>

        {/* User row */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 cursor-pointer group"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#e2e8f0' }}>{user?.fullName || 'Người dùng'}</p>
            <p className="text-xs truncate" style={{ color: '#4b5563' }}>{workspace?.role || 'OWNER'}</p>
          </div>
          <button
            disabled={loggingOut}
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8fafc' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-60 flex-shrink-0">
        {sidebar}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 flex flex-col">
            {sidebar}
          </div>
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex-shrink-0 flex items-center justify-between h-14 px-6"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(226,232,240,0.8)',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span style={{ color: '#94a3b8' }}>HOLOKA</span>
              <ChevronRight size={14} style={{ color: '#cbd5e1' }} />
              <span className="font-semibold" style={{ color: '#0f172a' }}>{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <NavLink
              to="/notifications"
              className="relative p-2 rounded-xl transition-all"
              style={{ color: '#64748b' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLElement).style.color = '#0f172a'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
            >
              <Bell size={19} />
              {unread > 0 && (
                <span
                  className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{ background: '#f43f5e' }}
                />
              )}
            </NavLink>

            {/* Divider */}
            <div className="w-px h-6 mx-1" style={{ background: '#e2e8f0' }} />

            {/* User Avatar */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight" style={{ color: '#0f172a' }}>
                  {user?.fullName || 'Người dùng'}
                </p>
                <p className="text-xs leading-tight" style={{ color: '#94a3b8' }}>
                  {workspace?.role || 'OWNER'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {logoutError && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{logoutError}</div>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
