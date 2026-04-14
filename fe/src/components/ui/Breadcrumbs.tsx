import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_NAMES: Record<string, string> = {
  admin: 'Escritorio',
  orders: 'Pedidos',
  catalog: 'Catálogo',
  inventory: 'Inventario',
  tasks: 'Tareas',
  employees: 'Empleados',
  clients: 'Clientes',
  usuarios: 'Usuarios',
  reports: 'Reportes',
  settings: 'Configuración',
  auth: 'Autenticación',
  login: 'Iniciar Sesión',
  register: 'Crear Cuenta',
  'register-client': 'Registro de Cliente',
  'forgot-password': 'Recuperar Contraseña',
  'reset-password': 'Nueva Contraseña',
  'change-password': 'Cambiar Contraseña',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // No mostrar en la landing exacta (raíz)
  if (pathnames.length === 0) return null;

  const isDashboard = pathnames.includes('dashboard');
  const homeLink = isDashboard ? '/dashboard/admin' : '/';
  const homeLabel = isDashboard ? 'Escritorio' : 'Inicio';

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <Link
        to={homeLink}
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        <Home size={14} className="mr-1" />
        <span className="hidden sm:inline">{homeLabel}</span>
      </Link>

      {pathnames.map((value, index) => {
        // Ignorar "dashboard" ya que "admin" o el home son nuestras raíces contextuales
        if (value === 'dashboard') return null;
        
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const name = ROUTE_NAMES[value] || value;

        return (
          <div key={to} className="flex items-center space-x-2">
            <ChevronRight size={14} className="text-gray-400" />
            {last ? (
              <span className="font-semibold text-blue-800 dark:text-blue-400 capitalize">
                {name}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors capitalize"
              >
                {name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
