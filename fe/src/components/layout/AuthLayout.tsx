/**
 * Archivo: fe/src/components/layout/AuthLayout.tsx
 * Descripción: Layout para páginas de autenticación (login, register, forgot, reset).
 * 
 * ¿Qué?
 *   Layout con:
 *   - Header: Logo (h-16 w-16) + botón "Iniciar sesión" (#1e40af, btn-pulse)
 *   - Main: Card centrado, max-w-md, border #1e40af, sombra suave
 *   - Props: title (h2), subtitle (opcional), children (form content)
 *   - Footer: Texto CALZADO J&R, sin navegación
 * 
 * ¿Para qué?
 *   - Consistencia visual en TODAS las páginas auth (mismo header/footer)
 *   - Centrar formularios (login, register, forgot, reset)
 *   - Branding claro (logo azul prominente)
 *   - Separar layout auth de layout dashboard (diferentes estéticas)
 * 
 * ¿Impacto?
 *   CRÍTICO — LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
 *   TODAS dependen de este layout.
 *   Modificar estructura rompe: todas las páginas auth visualmente.
 *   Dependencias: react-router-dom (Link), usado en:
 *                modules/auth/pages/*.tsx (todas las páginas auth)
 */

import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f9fafb]">
      {/* ════════════════════════════════════════ */}
      {/* Header con logo y enlace de login */}
      {/* ════════════════════════════════════════ */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="CALZADO J&R - Águila"
              className="h-16 w-16 object-contain"
            />
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-md bg-[#1e40af] text-white font-semibold text-sm btn-pulse"
            style={{ textDecoration: 'none' }}
          >
            <span className="relative z-10">Iniciar sesión</span>
          </Link>
        </div>
      </header>

      {/* ════════════════════════════════════════ */}
      {/* Contenido principal centrado */}
      {/* ════════════════════════════════════════ */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-[#1e40af] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════ */}
      {/* Footer con información de contacto */}
      {/* ════════════════════════════════════════ */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center">
        <p className="text-sm text-gray-500">
          CALZADO J&R - Calidad y Estilo a tu Alcance
        </p>
        <p className="text-xs text-gray-400">
          Bogotá, Colombia | Tel: +57 601 234 5678
        </p>
      </footer>
    </div>
  );
}
