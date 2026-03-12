/**
 * Archivo: fe/src/components/ProtectedRoute.tsx
 * Descripción: Componente HOC (Higher-Order Component) para proteger rutas autenticadas.
 * 
 * ¿Qué?
 *   Wrapper que verifica autenticación antes de renderizar children:
 *   - Si isLoading: muestra spinner (verificando sesión)
 *   - Si !isAuthenticated: redirige a /auth/login (Navigate)
 *   - Si isAuthenticated: renderiza children (ruta protegida)
 * 
 * ¿Para qué?
 *   - Proteger rutas que requieren login (dashboard, perfil, admin)
 *   - Evitar acceso directo a URLs protegidas (copiar/pegar URL)
 *   - Centralizar lógica de redirección (DRY, no repetir en cada página)
 *   - UX coherente (spinner mientras valida, redirect inmediato si no auth)
 * 
 * ¿Impacto?
 *   CRÍTICO — Sin este componente, rutas protegidas son accesibles sin login.
 *   Modificar lógica rompe: toda la seguridad frontend (aunque backend sigue protegido).
 *   Usado en: App.tsx (wrap rutas /dashboard/*), todas las rutas privadas.
 *   Dependencias: hooks/useAuth.ts, context/AuthContext.tsx, react-router-dom
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

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

  return <>{children}</>;
}
