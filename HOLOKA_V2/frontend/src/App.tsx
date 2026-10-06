import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import PropertiesPage from './pages/PropertiesPage';
import RoomsPage from './pages/RoomsPage';

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="buildings" element={<div className="p-8">Buildings Placeholder</div>} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="tenants" element={<div className="p-8">Tenants Placeholder</div>} />
          <Route path="contracts" element={<div className="p-8">Contracts Placeholder</div>} />
          <Route path="invoices" element={<div className="p-8">Finance/Invoices Placeholder</div>} />
          <Route path="maintenance" element={<div className="p-8">Maintenance Placeholder</div>} />
          <Route path="tasks" element={<div className="p-8">Tasks Placeholder</div>} />
          <Route path="notifications" element={<div className="p-8">Notifications Placeholder</div>} />
          <Route path="settings" element={<div className="p-8">Settings Placeholder</div>} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
