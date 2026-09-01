/**
 * Archivo: src/App.tsx
 * Descripción: Componente raíz de la aplicación CALZADO J&R.
 *
 * ¿Qué?
 *   Define TODAS las rutas de la aplicación:
 *   - Rutas públicas (Landing, Login, Register)
 *   - Rutas protegidas (Dashboards)
 *   - Rutas por rol (solo admin, solo cliente, etc.)
 *
 *   Proporciona CONTEXTOS GLOBALES:
 *   - AuthProvider → Estado de autenticación para toda la app
 *   - BrowserRouter → Sistema de navegación React Router v6
 *
 * ¿Para qué?
 *   Centralizar la ESTRUCTURA de la aplicación en un único lugar.
 *   Evitar que las rutas estén esparcidas en múltiples archivos.
 *
 * ¿Impacto?
 *   Muy crítico. Cambios aquí afectan:
 *   - La navegación completa de la app
 *   - Quién puede acceder a dónde
 *   - Flujos de autenticación
 *
 *   COMPOSICIÓN (orden de capas):
 *   1. BrowserRouter (permite navegación)
 *   2. AuthProvider (proporciona usuario/tokens globales)
 *   3. Routes (define rutas específicas)
 *
 *   DEPENDENCIAS CRÍTICAS:
 *   - AuthContext.tsx (contexto de autenticación)
 *   - react-router-dom (librería de enrutamiento)
 *
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from '@/store/AuthContext';
import { ThemeProvider } from '@/store/ThemeContext';
import '@/app/i18n'; // i18n initialization
import { ProtectedRoute } from '@/app/ProtectedRoute';
import { RoleProtectedRoute } from '@/app/RoleProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { CookieBanner } from '@/components/atoms/CookieBanner';
import { CookiePolicyModal } from '@/components/atoms/CookiePolicyModal';
import { ToastProvider } from '@/store/ToastContext';

import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage';
import { DashboardPage } from '@/pages/auth/DashboardPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ReactivationPage } from '@/pages/auth/ReactivationPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';

// Sprint 3 - Landing Page
import LandingPage from '@/pages/public/LandingPage';
import PublicCatalogPage from '@/pages/public/CatalogPage';

// Sprint 3 - Dashboard Jefe
import AdminLayout from '@/features/admin/components/organisms/AdminLayout';
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import UsersManagementPage from '@/pages/admin/UsersManagementPage';

// Sprint 8 - Dashboard Empleado
import EmployeeLayout from '@/features/employee/components/organisms/EmployeeLayout';
import EmployeeDashboardPage from '@/pages/employee/DashboardPage';
import EmployeeTasksPage from '@/pages/employee/TasksPage';
import AvailableTasksPage from '@/pages/employee/AvailableTasksPage';
import EmployeeIncidencesPage from '@/pages/employee/IncidencesPage';
import EmployeeReportsPage from '@/pages/employee/EmployeeReportsPage';
import EmployeeSettingsPage from '@/pages/employee/EmployeeSettingsPage';

// Sprint 4 - Orders Management
import OrdersPage from '@/pages/admin/OrdersPage';

// Sprint 5 - Catalog Management
import CatalogPage from '@/pages/admin/CatalogPage';
import InventoryPage from '@/pages/admin/InventoryPage';

// Sprint 6 - Employees and Clients Management
import EmployeesPage from '@/pages/admin/EmployeesPage';
import ClientsPage from '@/pages/admin/ClientsPage';

// Sprint 7 - Supplies module
import InsumosPage from '@/pages/admin/InsumosPage';

// RF-019 - Losses module
import LossesPage from '@/pages/admin/LossesPage';

// Sprint - Dashboard Cliente
import ClientLayout from '@/features/client/components/organisms/ClientLayout';
import ClientDashboardPage from '@/pages/client/DashboardPage';
import ClientOrdersPage from '@/pages/client/OrdersPage';
import WholesaleCatalogPage from '@/pages/client/WholesaleCatalogPage';
import MisIncidenciasPage from '@/pages/client/MisIncidenciasPage';
import ClientReportsPage from '@/pages/client/ReportsPage';
import ClientSettingsPage from '@/pages/client/SettingsPage';

// Additional Dashboard sections
import ProductionTaskDashboard from '@/pages/admin/TasksPage';
import AlertsPage from '@/pages/admin/AlertsPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import SettingsPage from '@/pages/admin/SettingsPage';

function App() {
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {showCookiePolicy && (
            <CookiePolicyModal onClose={() => setShowCookiePolicy(false)} />
          )}
          <CookieBanner
            onAcceptAll={() => {}}
            onAcceptNecessary={() => {}}
            onShowPolicy={() => setShowCookiePolicy(true)}
          />
          <a href="#main-content" className="skip-link">
            Saltar al contenido principal
          </a>
          <ToastProvider>
            <Routes>
              {/* ════════════════════════════════════════ */}
              {/* 🌐 Landing Page pública */}
              {/* ════════════════════════════════════════ */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/catalog" element={<PublicCatalogPage />} />

              {/* ════════════════════════════════════════ */}
              {/* 🔓 Rutas públicas de autenticación */}
              {/* ════════════════════════════════════════ */}
              {/* Login, Register, Forgot Password are now modals on the landing page */}
              <Route path="/auth/login" element={<Navigate to="/" replace />} />
              <Route
                path="/auth/register"
                element={<Navigate to="/" replace />}
              />
              <Route
                path="/auth/forgot-password"
                element={<Navigate to="/" replace />}
              />
              <Route
                path="/auth/reset-password"
                element={<ResetPasswordPage />}
              />
              <Route path="/auth/reactivation" element={<ReactivationPage />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

              {/* Compatibilidad con rutas antiguas */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
              <Route
                path="/forgot-password"
                element={<Navigate to="/" replace />}
              />
              <Route
                path="/reset-password"
                element={<Navigate to="/auth/reset-password" replace />}
              />
              <Route
                path="/auth/change-password"
                element={<Navigate to="/change-password" replace />}
              />

              {/* ════════════════════════════════════════ */}
              {/* 🔒 Dashboard Cliente (protegido) */}
              {/* ════════════════════════════════════════ */}
              <Route
                path="/dashboard/client"
                element={
                  <RoleProtectedRoute allowedRoles={['client']}>
                    <ClientLayout />
                  </RoleProtectedRoute>
                }
              >
                <Route index element={<ClientDashboardPage />} />
                <Route path="catalog" element={<WholesaleCatalogPage />} />
                <Route path="orders" element={<ClientOrdersPage />} />
                <Route path="incidences" element={<MisIncidenciasPage />} />
                <Route path="reports" element={<ClientReportsPage />} />
                <Route path="settings" element={<ClientSettingsPage />} />
              </Route>

              {/* ════════════════════════════════════════ */}
              {/* 🔒 Dashboard Jefe (protegido) */}
              {/* ════════════════════════════════════════ */}
              <Route
                path="/dashboard/admin"
                element={
                  <RoleProtectedRoute
                    allowedRoles={['admin', 'employee']}
                    allowedOccupations={['jefe']}
                  >
                    <AdminLayout />
                  </RoleProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="tasks" element={<ProductionTaskDashboard />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="usuarios" element={<UsersManagementPage />} />
                <Route path="insumos" element={<InsumosPage />} />
                <Route path="losses" element={<LossesPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* ════════════════════════════════════════ */}
              {/* 🔒 Dashboard Empleado (protegido) */}
              {/* ════════════════════════════════════════ */}
              <Route
                path="/dashboard/employee"
                element={
                  <RoleProtectedRoute
                    allowedRoles={['admin', 'employee']}
                    allowedOccupations={[
                      'cortador',
                      'guarnecedor',
                      'solador',
                      'emplantillador'
                    ]}
                  >
                    <EmployeeLayout />
                  </RoleProtectedRoute>
                }
              >
                <Route index element={<EmployeeDashboardPage />} />
                <Route path="tasks" element={<EmployeeTasksPage />} />
                <Route
                  path="available-tasks"
                  element={<AvailableTasksPage />}
                />
                <Route path="incidences" element={<EmployeeIncidencesPage />} />
                <Route path="reports" element={<EmployeeReportsPage />} />
                <Route path="settings" element={<EmployeeSettingsPage />} />
              </Route>

              {/* ════════════════════════════════════════ */}
              {/* 🔒 Rutas legacy protegidas */}
              {/* ════════════════════════════════════════ */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/change-password"
                  element={<ChangePasswordPage />}
                />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
