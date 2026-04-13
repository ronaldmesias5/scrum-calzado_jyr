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
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Header con logo y controles de idioma/tema */}
      <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center group">
            <img
              src="/logo.png"
              alt="CALZADO J&R"
              className="h-16 w-16 object-contain bg-white rounded-lg p-1 shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link
              to="/auth/login"
              className="hidden md:flex px-6 py-2 rounded-xl bg-[#1e40af] dark:bg-blue-600 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200"
            >
              {t('common.login')}
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════ */}
      {/* Contenido principal centrado */}
      {/* ════════════════════════════════════════ */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-2xl transition-shadow duration-300">
            <div className="mb-8 border-b border-gray-100 dark:border-slate-800 pb-4">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h2>
              {subtitle && (
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-center transition-colors duration-500">
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wide">
          {t('landing.hero.title')} - {t('landing.hero.subtitle')}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">
          {t('landing.footer.location')} | {t('landing.footer.phone')} | {t('landing.footer.copyright')}
        </p>
      </footer>
    </div>
  );
}
