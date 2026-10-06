import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Building, Home, Users, FileText, Settings, LayoutDashboard, Wrench, CheckSquare, Bell, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive ? 'bg-primary-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-white flex flex-col shadow-xl z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider text-white">HOLOKA</h1>
          <p className="text-slate-400 text-xs mt-1">Property Intelligence</p>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/properties" icon={Building} label="Properties" />
          <SidebarItem to="/buildings" icon={Home} label="Buildings" />
          <SidebarItem to="/rooms" icon={Home} label="Rooms" />
          <SidebarItem to="/tenants" icon={Users} label="Tenants" />
          <SidebarItem to="/contracts" icon={FileText} label="Contracts" />
          <SidebarItem to="/invoices" icon={CreditCard} label="Finance" />
          <SidebarItem to="/maintenance" icon={Wrench} label="Maintenance" />
          <SidebarItem to="/tasks" icon={CheckSquare} label="Tasks" />
          <SidebarItem to="/notifications" icon={Bell} label="Notifications" />
          
          <div className="pt-8 mt-8 border-t border-slate-700">
             <SidebarItem to="/settings" icon={Settings} label="Settings" />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
           <div className="text-lg font-semibold text-slate-700">Workspace Overview</div>
           <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                 <Bell size={20} />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-4 border-l pl-4">
                 <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                      {user?.fullName?.substring(0, 2).toUpperCase() || 'U'}
                   </div>
                   <div className="text-sm">
                      <p className="font-semibold text-slate-700">{user?.fullName || 'User'}</p>
                      <p className="text-xs text-slate-500">{user?.role || 'Role'}</p>
                   </div>
                 </div>
                 <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors ml-2" title="Logout">
                   <LogOut size={20} />
                 </button>
              </div>
           </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
