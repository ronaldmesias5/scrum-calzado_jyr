import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_NAMES: Record<string, string> = {
  admin: 'Inicio',
  orders: 'Pedidos',
  catalog: 'Catálogo',
  inventory: 'Inventario',
  tasks: 'Tareas',
  employees: 'Empleados',
  clients: 'Clientes',
  usuarios: 'Usuarios',
  reports: 'Reportes',
  settings: 'Configuración',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // No mostrar en la landing
  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      <Link
        to="/dashboard/admin"
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        <Home size={14} className="mr-1" />
        <span className="hidden sm:inline">Escritorio</span>
      </Link>

      {pathnames.map((value, index) => {
        // Ignorar "dashboard" ya que "admin" es nuestra raíz real para el jefe
        if (value === 'dashboard') return null;
        
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const name = ROUTE_NAMES[value] || value;

        return (
          <div key={to} className="flex items-center space-x-2">
            <ChevronRight size={14} className="text-gray-400" />
            {last ? (
              <span className="font-semibold text-blue-800 capitalize">
                {name}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-blue-600 transition-colors capitalize"
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
