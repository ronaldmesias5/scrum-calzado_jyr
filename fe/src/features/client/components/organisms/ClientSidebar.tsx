import { NavLink } from 'react-router-dom';
import {
  Home,
  Store,
  Package,
  BarChart3,
  AlertTriangle,
  Settings,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ClientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  isCollapsed: boolean;
}

const ICON_COLORS: Record<string, string> = {
  '/dashboard/client': 'text-indigo-500 dark:text-indigo-400',
  '/dashboard/client/catalog': 'text-blue-500 dark:text-blue-400',
  '/dashboard/client/orders': 'text-emerald-500 dark:text-emerald-400',
  '/dashboard/client/reports': 'text-violet-500 dark:text-violet-400',
  '/dashboard/client/incidences': 'text-amber-500 dark:text-amber-400',
  '/dashboard/client/settings': 'text-slate-500 dark:text-slate-400'
};

const NAV_ITEMS = [
  { label: 'Inicio', icon: Home, path: '/dashboard/client' },
  {
    label: 'Catálogo Mayorista',
    icon: Store,
    path: '/dashboard/client/catalog'
  },
  { label: 'Mis Pedidos', icon: Package, path: '/dashboard/client/orders' },
  { label: 'Reportes', icon: BarChart3, path: '/dashboard/client/reports' },
  {
    label: 'Mis Incidencias',
    icon: AlertTriangle,
    path: '/dashboard/client/incidences'
  },
  { label: 'Configuración', icon: Settings, path: '/dashboard/client/settings' }
] as const;

export default function ClientSidebar({
  isOpen,
  onClose,
  width,
  isCollapsed
}: ClientSidebarProps) {
  const { logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        style={{ width: `${width}px` }}
        className={`
          fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800
          transform transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto
          lg:sticky lg:top-16 lg:inset-y-auto lg:self-start lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:z-auto min-w-[72px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold text-gray-900 dark:text-white">
              Calzado J&R
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={label}
              to={path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              end={path === '/dashboard/client'}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'} py-3 text-sm font-semibold transition-all duration-200 rounded-none hover:scale-[1.02] hover:translate-x-0.5
                ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 border-r-4 border-blue-800 dark:border-blue-500'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <div
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                >
                  <Icon
                    size={18}
                    className={!isActive ? (ICON_COLORS[path] ?? '') : ''}
                  />
                  {!isCollapsed && <span>{label}</span>}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 dark:border-slate-800 p-3">
          <button
            onClick={logout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group`}
            title={isCollapsed ? 'Cerrar Sesión' : undefined}
          >
            <LogOut
              size={17}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            {!isCollapsed && 'Cerrar Sesión'}
          </button>
        </div>
      </aside>
    </>
  );
}
