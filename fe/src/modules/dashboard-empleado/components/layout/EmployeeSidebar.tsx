import { NavLink } from 'react-router-dom';
import { Home, CheckSquare, Package, AlertTriangle, BarChart, X, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface EmployeeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Inicio',             icon: Home,         path: '/dashboard/employee' },
  { label: 'Mis Tareas',         icon: CheckSquare,  path: '/dashboard/employee/tasks' },
  { label: 'Tareas Disponibles', icon: Package,      path: '/dashboard/employee/available-tasks' },
  { label: 'Incidencias',        icon: AlertTriangle, path: '/dashboard/employee/incidences' },
  { label: 'Reportes',           icon: BarChart,      path: '/dashboard/employee/reports' },
] as const;

export default function EmployeeSidebar({ isOpen, onClose }: EmployeeSidebarProps) {
  const { logout } = useAuth();

  return (
    <>
      {/* Backdrop móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto
        lg:relative lg:translate-x-0 lg:w-60 lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header móvil */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            <span className="font-bold text-gray-900 dark:text-white">Calzado J&R</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={label}
              to={path}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              end={path === '/dashboard/employee'}
              className={({ isActive }) =>
                `flex items-center justify-between px-5 py-3 text-sm font-semibold transition-all duration-200 rounded-none hover:scale-[1.02] hover:translate-x-0.5
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 border-r-4 border-blue-800 dark:border-blue-500'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                <span>{label}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Botón Salir */}
        <div className="border-t border-gray-100 dark:border-slate-800 p-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
          >
            <LogOut size={17} className="group-hover:-translate-x-0.5 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
