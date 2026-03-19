/**
 * Archivo: fe/src/components/layout/AppLayout.tsx
 * Descripción: Layout genérico para páginas protegidas (legacy, poco usado).
 * 
 * ¿Qué?
 *   Layout simple con:
 *   - Header: Logo, nombre usuario, botón Salir
 *   - Línea azul decorativa (#1e40af)
 *   - Main: Contenedor max-w-7xl con <Outlet /> (children de ruta)
 *   - Footer: Texto "Calidad y Estilo a tu Alcance"
 * 
 * ¿Para qué?
 *   - Proveer layout genérico para rutas que no usan AdminLayout/AuthLayout
 *   - Fallback para páginas sin diseño específico
 *   - Mantener consistencia visual (logo, footer, estilos)
 * 
 * ¿Impacto?
 *   BAJO — Raramente usado. Dashboards usan AdminLayout específico.
 *   Modificar header rompe: páginas genéricas no admin.
 *   Dependencias: hooks/useAuth.ts, react-router-dom (Outlet)
 */

import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import { Footer } from "@/components/ui/Footer";

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#f9fafb]">
      {/* Header del dashboard */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="CALZADO J&R" className="h-12 w-12 object-contain" />
            <span className="font-bold" style={{ color: '#000', fontFamily: 'Montserrat, sans-serif', letterSpacing: 1, fontSize: '1.1rem' }}>CALZADO J&R</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user ? `${user.name} ${user.last_name}` : ''}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Línea decorativa azul */}
      <div className="h-1 bg-[#1e40af]" />

      {/* Contenido de la página */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
