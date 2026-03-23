import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useVacationStore } from './store/vacationStore';
import { useNotificationStore } from './store/notificationStore';
import { ToasterProvider } from './components/ui/Toast';
import { LoadingScreen } from './components/ui/LoadingSpinner';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MyRequestsPage from './pages/MyRequestsPage';
import NewRequestPage from './pages/NewRequestPage';
import DepartmentRequestsPage from './pages/DepartmentRequestsPage';
import AllRequestsPage from './pages/AllRequestsPage';
import UsersPage from './pages/UsersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import SettingsPage from './pages/SettingsPage';
import CalendarPage from './pages/CalendarPage';
import SchedulePage from './pages/SchedulePage';
import ReplacementsPage from './pages/ReplacementsPage';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  const { initialize, initialized, user } = useAuthStore();
  const { clear: clearVacations } = useVacationStore();
  const { clear: clearNotifications } = useNotificationStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!user) {
      clearVacations();
      clearNotifications();
    }
  }, [user]);

  if (!initialized) {
    return <LoadingScreen message="Загрузка системы..." />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="my-requests" element={<MyRequestsPage />} />
        <Route path="new-request" element={<NewRequestPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="replacements" element={<ReplacementsPage />} />

        <Route
          path="department-requests"
          element={
            <ProtectedRoute allowedRoles={['head', 'admin']}>
              <DepartmentRequestsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="all-requests"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AllRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="departments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToasterProvider />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;