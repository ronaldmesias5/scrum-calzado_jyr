/**
 * Archivo: components/RoleProtectedRoute.tsx
 * Descripción: Componente que protege rutas que requieren un rol específico y/u ocupación.
 * ¿Para qué? Permitir acceso solo a usuarios con ciertos roles/ocupaciones (ej: admin, jefe).
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedOccupations?: string[];
}

/**
 * Protege rutas por rol y/o ocupación.
 * 
 * Lógica:
 * - Si allowedRoles incluye "admin" y el usuario es admin → acceso permitido
 * - Si allowedRoles incluye "employee" y allowedOccupations incluye la ocupación del usuario → acceso permitido
 * - Si allowedRoles incluye el rol del usuario y no hay restricción de ocupación → acceso permitido
 * 
 * Ejemplos:
 * - Solo admin: <RoleProtectedRoute allowedRoles={["admin"]}>...</RoleProtectedRoute>
 * - Admin o Jefe: <RoleProtectedRoute allowedRoles={["admin", "employee"]} allowedOccupations={["jefe"]}>...</RoleProtectedRoute>
 * - Todos los employees: <RoleProtectedRoute allowedRoles={["employee"]}>...</RoleProtectedRoute>
 */
export function RoleProtectedRoute({
  children,
  allowedRoles,
  allowedOccupations,
}: RoleProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#1e40af] border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Si no hay restricciones de rol/ocupación, permitir acceso
  if (!allowedRoles && !allowedOccupations) {
    return <>{children}</>;
  }

  const userRole = user?.role_name || "";
  const userOccupation = user?.occupation || "";

  // Verificar acceso
  let hasAccess = false;

  // 1. Admin siempre puede acceder si está en allowedRoles
  if (allowedRoles?.includes("admin") && userRole === "admin") {
    hasAccess = true;
  }

  // 2. Si es employee, verificar ocupación si está especificada
  if (allowedRoles?.includes("employee") && userRole === "employee") {
    if (allowedOccupations && allowedOccupations.length > 0) {
      // Si hay restricción de ocupación, verificar que coincida
      hasAccess = allowedOccupations.includes(userOccupation);
    } else {
      // Si no hay restricción de ocupación, permitir acceso
      hasAccess = true;
    }
  }

  // 3. Otros roles (client, etc)
  if (allowedRoles?.includes(userRole) && userRole !== "employee" && userRole !== "admin") {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
