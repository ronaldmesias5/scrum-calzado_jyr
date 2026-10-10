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
import { lazy, Suspense, useState } from 'react';
import { AuthProvider } from '@/store/AuthContext';
import { ThemeProvider } from '@/store/ThemeContext';
import '@/app/i18n'; // i18n initialization
import { ProtectedRoute } from '@/app/ProtectedRoute';
import { RoleProtectedRoute } from '@/app/RoleProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { CookieBanner } from '@/components/atoms/CookieBanner';
import { CookiePolicyModal } from '@/components/atoms/CookiePolicyModal';
import { ToastProvider } from '@/store/ToastContext';
import SkeletonLoader from '@/components/atoms/SkeletonLoader';
import AdminLayout from '@/features/admin/components/organisms/AdminLayout';
import EmployeeLayout from '@/features/employee/components/organisms/EmployeeLayout';
import ClientLayout from '@/features/client/components/organisms/ClientLayout';

// ══════════════════════════════════════════════════════
// Code splitting: las páginas se cargan bajo demanda (React.lazy)
// Los layouts/guards quedan estáticos (son el shell de la app).
// ══════════════════════════════════════════════════════

// Auth (legacy) — páginas con named export
const ChangePasswordPage = lazy(() =>
  import('@/pages/auth/ChangePasswordPage').then((m) => ({
    default: m.ChangePasswordPage,
  }))
);
const DashboardPage = lazy(() =>
  import('@/pages/auth/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  }))
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  }))
);
const ReactivationPage = lazy(() =>
  import('@/pages/auth/ReactivationPage').then((m) => ({
    default: m.ReactivationPage,
  }))
);
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));

// Sprint 3 - Landing Page
const LandingPage = lazy(() => import('@/pages/public/LandingPage'));
const PublicCatalogPage = lazy(() => import('@/pages/public/CatalogPage'));

// Sprint 3 - Dashboard Jefe (AdminLayout se mantiene estático)
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const UsersManagementPage = lazy(
  () => import('@/pages/admin/UsersManagementPage')
);

// Sprint 8 - Dashboard Empleado (EmployeeLayout se mantiene estático)
const EmployeeDashboardPage = lazy(
  () => import('@/pages/employee/DashboardPage')
);
const EmployeeTasksPage = lazy(() => import('@/pages/employee/TasksPage'));
const AvailableTasksPage = lazy(
  () => import('@/pages/employee/AvailableTasksPage')
);
const EmployeeIncidencesPage = lazy(
  () => import('@/pages/employee/IncidencesPage')
);
const EmployeeReportsPage = lazy(
  () => import('@/pages/employee/EmployeeReportsPage')
);
const EmployeeSettingsPage = lazy(
  () => import('@/pages/employee/EmployeeSettingsPage')
);

// Sprint 4 - Orders Management
const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));

// Sprint 5 - Catalog Management
const CatalogPage = lazy(() => import('@/pages/admin/CatalogPage'));
const InventoryPage = lazy(() => import('@/pages/admin/InventoryPage'));

// Sprint 6 - Employees and Clients Management
const EmployeesPage = lazy(() => import('@/pages/admin/EmployeesPage'));
const ClientsPage = lazy(() => import('@/pages/admin/ClientsPage'));

// Sprint 7 - Supplies module
const InsumosPage = lazy(() => import('@/pages/admin/InsumosPage'));

// HU-007 - Categories management
const CategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage'));

// Per-Client Pricing
const ClientPricesPage = lazy(() => import('@/pages/admin/ClientPricesPage'));

// Calendario de entregas de pedidos
const CalendarPage = lazy(() => import('@/pages/admin/CalendarPage'));

// RF-019 - Losses module
const LossesPage = lazy(() => import('@/pages/admin/LossesPage'));

// Sprint - Dashboard Cliente (ClientLayout se mantiene estático)
const ClientDashboardPage = lazy(() => import('@/pages/client/DashboardPage'));
const ClientOrdersPage = lazy(() => import('@/pages/client/OrdersPage'));
const WholesaleCatalogPage = lazy(
  () => import('@/pages/client/WholesaleCatalogPage')
);
const MisIncidenciasPage = lazy(
  () => import('@/pages/client/MisIncidenciasPage')
);
const ClientReportsPage = lazy(() => import('@/pages/client/ReportsPage'));
const ClientSettingsPage = lazy(() => import('@/pages/client/SettingsPage'));

// Additional Dashboard sections
const ProductionTaskDashboard = lazy(
  () => import('@/pages/admin/TasksPage')
);
const AlertsPage = lazy(() => import('@/pages/admin/AlertsPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

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
            <Suspense fallback={<SkeletonLoader variant="page" />}>
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
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="tasks" element={<ProductionTaskDashboard />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="usuarios" element={<UsersManagementPage />} />
                <Route path="insumos" element={<InsumosPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="client-prices" element={<ClientPricesPage />} />
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
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
