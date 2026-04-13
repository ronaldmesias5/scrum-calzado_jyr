import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function LandingHeader() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: t('landing.nav.home'), href: '/' },
    { label: t('landing.nav.catalog'), href: '#' },
    { label: t('landing.nav.about'), href: '/#nosotros' },
    { label: t('landing.nav.contact'), href: '/#contacto' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="CALZADO J&R" className="h-16 w-16 object-contain" />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-gray-700 dark:text-gray-200 hover:text-blue-800 dark:hover:text-blue-400 font-semibold transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Botones desktop */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <Link
            to="/auth/register"
            className="px-5 py-2.5 border border-blue-800 dark:border-blue-500 text-blue-800 dark:text-blue-400 rounded-xl font-bold transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 btn-pulse"
          >
            {t('landing.nav.register')}
          </Link>
          <Link
            to="/auth/login"
            className="px-4 py-2 bg-blue-800 text-white rounded-lg font-medium btn-pulse hover:bg-blue-900 transition-colors duration-200"
          >
            {t('common.login')}
          </Link>
        </div>

        {/* Burger mobile */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-6 py-6 flex flex-col gap-5 animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-gray-700 dark:text-gray-200 font-bold text-lg"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <>
            <div className="mt-2 pt-2 border-t border-gray-100" />
            <div className="flex items-center justify-between px-2 mb-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link
              to="/auth/register"
              className="flex items-center justify-center px-4 py-3 border border-blue-800 dark:border-blue-500 text-blue-800 dark:text-blue-400 rounded-xl font-bold transition-colors duration-200 btn-pulse"
              onClick={() => setMenuOpen(false)}
            >
              {t('landing.nav.register')}
            </Link>
            <Link
              to="/auth/login"
              className="flex items-center justify-center px-4 py-2 bg-blue-800 text-white rounded-lg font-medium btn-pulse hover:bg-blue-900 transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              {t('common.login')}
            </Link>
          </>
        </div>
      )}
    </header>
  );
}
