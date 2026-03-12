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
 */


import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { RegisterPage } from "@/modules/auth/pages/RegisterPage";
import { DashboardPage } from "@/modules/auth/pages/DashboardPage";
import { ChangePasswordPage } from "@/modules/auth/pages/ChangePasswordPage";
import { ForgotPasswordPage } from "@/modules/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/modules/auth/pages/ResetPasswordPage";

// Sprint 3 - Landing Page
import LandingPage from "@/modules/landing/pages/LandingPage";

// Sprint 3 - Dashboard Jefe
import AdminLayout from "@/modules/dashboard-jefe/components/layout/AdminLayout";
import AdminDashboardPage from "@/modules/dashboard-jefe/pages/DashboardPage";
import UsersManagementPage from "@/modules/dashboard-jefe/pages/UsersManagementPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ════════════════════════════════════════ */}
          {/* 🌐 Landing Page pública */}
          {/* ════════════════════════════════════════ */}
          <Route path="/" element={<LandingPage />} />

          {/* ════════════════════════════════════════ */}
          {/* 🔓 Rutas públicas de autenticación */}
          {/* ════════════════════════════════════════ */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Compatibilidad con rutas antiguas */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/register" element={<Navigate to="/auth/register" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
          <Route path="/reset-password" element={<Navigate to="/auth/reset-password" replace />} />

          {/* ════════════════════════════════════════ */}
          {/* 🔒 Dashboard Jefe (protegido) */}
          {/* ════════════════════════════════════════ */}
          <Route
            path="/dashboard/admin"
            element={
              <RoleProtectedRoute
                allowedRoles={["admin", "employee"]}
                allowedOccupations={["jefe"]}
              >
                <AdminLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="orders" element={<div className="p-4 text-gray-500">Pedidos - Próximamente</div>} />
            <Route path="catalog" element={<div className="p-4 text-gray-500">Catálogo - Próximamente</div>} />
            <Route path="inventory" element={<div className="p-4 text-gray-500">Inventario - Próximamente</div>} />
            <Route path="tasks" element={<div className="p-4 text-gray-500">Tareas - Próximamente</div>} />
            <Route path="employees" element={<div className="p-4 text-gray-500">Empleados - Próximamente</div>} />
            <Route path="clients" element={<div className="p-4 text-gray-500">Clientes - Próximamente</div>} />
            <Route path="usuarios" element={<UsersManagementPage />} />
            <Route path="reactivation" element={<div className="p-4 text-gray-500">Reactivación - Próximamente</div>} />
            <Route path="alerts" element={<div className="p-4 text-gray-500">Alertas - Próximamente</div>} />
            <Route path="reports" element={<div className="p-4 text-gray-500">Reportes - Próximamente</div>} />
            <Route path="settings" element={<div className="p-4 text-gray-500">Configuración - Próximamente</div>} />
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
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
