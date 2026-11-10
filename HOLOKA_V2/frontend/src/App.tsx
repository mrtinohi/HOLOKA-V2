import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import PropertiesPage from './pages/PropertiesPage';
import BuildingsPage from './pages/BuildingsPage';
import RoomsPage from './pages/RoomsPage';
import TenantsPage from './pages/TenantsPage';
import ContractsPage from './pages/ContractsPage';
import FinancePage from './pages/FinancePage';
import MaintenancePage from './pages/MaintenancePage';
import TasksPage from './pages/TasksPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import IntelligencePage from './pages/IntelligencePage';
import AiAssistantPage from './pages/AiAssistantPage';
import ReportsPage from './pages/ReportsPage';
import PlatformDashboardPage from './pages/PlatformDashboardPage';
import PlatformUsersPage from './pages/PlatformUsersPage';
import PlatformWorkspacesPage from './pages/PlatformWorkspacesPage';
import PlatformAuditLogsPage from './pages/PlatformAuditLogsPage';
import PlatformSettingsPage from './pages/PlatformSettingsPage';
import { useAuth } from './contexts/AuthContext';

function RootRedirect() {
  const { user } = useAuth();
  if (user?.platformAdmin) {
    return <Navigate to="/platform/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function LandlordRoute({ element }: { element: React.ReactElement }) {
  const { user } = useAuth();
  if (user?.platformAdmin) {
    return <Navigate to="/platform/dashboard" replace />;
  }
  return element;
}

function PlatformAdminRoute({ element }: { element: React.ReactElement }) {
  const { user } = useAuth();
  if (!user?.platformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return element;
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<RootRedirect />} />

          {/* Landlord / Apartment Owner Real Estate Routes */}
          <Route path="dashboard"     element={<LandlordRoute element={<DashboardPage />} />} />
          <Route path="properties"    element={<LandlordRoute element={<PropertiesPage />} />} />
          <Route path="buildings"     element={<LandlordRoute element={<BuildingsPage />} />} />
          <Route path="rooms"         element={<LandlordRoute element={<RoomsPage />} />} />
          <Route path="tenants"       element={<LandlordRoute element={<TenantsPage />} />} />
          <Route path="contracts"     element={<LandlordRoute element={<ContractsPage />} />} />
          <Route path="finance"       element={<LandlordRoute element={<FinancePage />} />} />
          <Route path="maintenance"   element={<LandlordRoute element={<MaintenancePage />} />} />
          <Route path="tasks"         element={<LandlordRoute element={<TasksPage />} />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="intelligence"  element={<LandlordRoute element={<IntelligencePage />} />} />
          <Route path="ai"            element={<LandlordRoute element={<AiAssistantPage />} />} />
          <Route path="reports"       element={<LandlordRoute element={<ReportsPage />} />} />
          <Route path="settings"      element={<SettingsPage />} />

          {/* Super Admin Dedicated Platform Routes */}
          <Route path="platform/dashboard"  element={<PlatformAdminRoute element={<PlatformDashboardPage />} />} />
          <Route path="platform/users"      element={<PlatformAdminRoute element={<PlatformUsersPage />} />} />
          <Route path="platform/workspaces" element={<PlatformAdminRoute element={<PlatformWorkspacesPage />} />} />
          <Route path="platform/audit-logs" element={<PlatformAdminRoute element={<PlatformAuditLogsPage />} />} />
          <Route path="platform/settings"   element={<PlatformAdminRoute element={<PlatformSettingsPage />} />} />
        </Route>
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
