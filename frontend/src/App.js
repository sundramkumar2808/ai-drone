import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// Authenticated application pages
import DashboardPage from './pages/DashboardPage';
import DronesPage from './pages/DronesPage';
import DroneDetailPage from './pages/DroneDetailPage';
import MissionsPage from './pages/MissionsPage';
import MissionDetailPage from './pages/MissionDetailPage';
import TelemetryPage from './pages/TelemetryPage';
import MaintenancePage from './pages/MaintenancePage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import AdminPage from './pages/AdminPage';

import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/drones"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DronesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/drones/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DroneDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/missions"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MissionsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/missions/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MissionDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/telemetry"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TelemetryPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MaintenancePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AnalyticsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AlertsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Restricted Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <AdminPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
