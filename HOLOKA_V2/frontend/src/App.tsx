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

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardPage />} />
          <Route path="properties"    element={<PropertiesPage />} />
          <Route path="buildings"     element={<BuildingsPage />} />
          <Route path="rooms"         element={<RoomsPage />} />
          <Route path="tenants"       element={<TenantsPage />} />
          <Route path="contracts"     element={<ContractsPage />} />
          <Route path="finance"       element={<FinancePage />} />
          <Route path="maintenance"   element={<MaintenancePage />} />
          <Route path="tasks"         element={<TasksPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="intelligence"  element={<IntelligencePage />} />
          <Route path="ai"            element={<AiAssistantPage />} />
          <Route path="reports"       element={<ReportsPage />} />
          <Route path="settings"      element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
