import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/catalog' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Contacto', href: '/#contacto' },
];

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
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
              className="text-black-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Botones desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/auth/register"
            className="px-4 py-2 border border-blue-800 text-blue-800 rounded-lg font-medium btn-pulse transition-colors duration-200"
          >
            Regístrate
          </Link>
          <Link
            to="/auth/login"
            className="px-4 py-2 bg-blue-800 text-white rounded-lg font-medium btn-pulse hover:bg-blue-900 transition-colors duration-200"
          >
            Ingresar
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
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-gray-600 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <>
            <div className="mt-2 pt-2 border-t border-gray-100" />
            <Link
              to="/auth/register"
              className="flex items-center justify-center px-4 py-2 border border-blue-800 text-blue-800 rounded-lg font-medium btn-pulse transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              Regístrate
            </Link>
            <Link
              to="/auth/login"
              className="flex items-center justify-center px-4 py-2 bg-blue-800 text-white rounded-lg font-medium btn-pulse hover:bg-blue-900 transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              Ingresar
            </Link>
          </>
        </div>
      )}
    </header>
  );
}
