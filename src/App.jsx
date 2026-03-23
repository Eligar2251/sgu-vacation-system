import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
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
import CalendarPage from './pages/CalendarPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return <LoadingScreen message="Загрузка системы..." />;
  }

  return (
    <BrowserRouter>
      <ToasterProvider />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
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

          {/* Head only */}
          <Route
            path="department-requests"
            element={
              <ProtectedRoute allowedRoles={['head', 'admin']}>
                <DepartmentRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin only */}
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
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;