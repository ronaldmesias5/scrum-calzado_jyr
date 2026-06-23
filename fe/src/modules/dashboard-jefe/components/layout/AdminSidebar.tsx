import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home, ShoppingCart, Layers, Package, CheckSquare,
  Users, UserCheck, Bell, BarChart, Settings, UserCog, Package2, X, LogOut,
  AlertTriangle,
} from 'lucide-react';
import { useBadgeCounts } from '../../context/BadgeCountsContext';
import { useAuth } from '@/hooks/useAuth';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  isCollapsed: boolean;
}

const ICON_COLORS: Record<string, string> = {
  '/dashboard/admin': 'text-indigo-500 dark:text-indigo-400',
  '/dashboard/admin/orders': 'text-blue-500 dark:text-blue-400',
  '/dashboard/admin/catalog': 'text-purple-500 dark:text-purple-400',
  '/dashboard/admin/inventory': 'text-emerald-500 dark:text-emerald-400',
  '/dashboard/admin/losses': 'text-red-500 dark:text-red-400',
  '/dashboard/admin/insumos': 'text-teal-500 dark:text-teal-400',
  '/dashboard/admin/tasks': 'text-sky-500 dark:text-sky-400',
  '/dashboard/admin/employees': 'text-cyan-500 dark:text-cyan-400',
  '/dashboard/admin/clients': 'text-amber-500 dark:text-amber-400',
  '/dashboard/admin/usuarios': 'text-violet-500 dark:text-violet-400',
  '/dashboard/admin/alerts': 'text-rose-500 dark:text-rose-400',
  '/dashboard/admin/reports': 'text-orange-500 dark:text-orange-400',
  '/dashboard/admin/settings': 'text-slate-500 dark:text-slate-400',
};

export default function AdminSidebar({ isOpen, onClose, width, isCollapsed }: AdminSidebarProps) {
  const { counts } = useBadgeCounts();
  const { t } = useTranslation();
  const { logout } = useAuth();

  const BASE_ITEMS = [
    { label: t('dashboard.sidebar.home'),         icon: Home,        path: '/dashboard/admin',              badgeKey: null },
    { label: t('dashboard.sidebar.orders'),       icon: ShoppingCart, path: '/dashboard/admin/orders',       badgeKey: 'pedidos' },
    { label: t('dashboard.sidebar.catalog'),      icon: Layers,       path: '/dashboard/admin/catalog',      badgeKey: null },
    { label: t('dashboard.sidebar.inventory'),    icon: Package,      path: '/dashboard/admin/inventory',    badgeKey: null },
    { label: 'Incidencias',                       icon: AlertTriangle, path: '/dashboard/admin/losses',      badgeKey: 'incidencias' },
    { label: 'Insumos',                           icon: Package2,     path: '/dashboard/admin/insumos',      badgeKey: null },
    { label: t('dashboard.sidebar.tasks'),        icon: CheckSquare,  path: '/dashboard/admin/tasks',        badgeKey: null },
    { label: t('dashboard.sidebar.employees'),     icon: Users,        path: '/dashboard/admin/employees',    badgeKey: null },
    { label: t('dashboard.sidebar.clients'),      icon: UserCheck,    path: '/dashboard/admin/clients',      badgeKey: null },
    { label: t('dashboard.sidebar.users'),        icon: UserCog,      path: '/dashboard/admin/usuarios',     badgeKey: 'usuarios' },
    { label: t('dashboard.sidebar.alerts'),       icon: Bell,         path: '/dashboard/admin/alerts',       badgeKey: null },
    { label: t('dashboard.sidebar.reports'),      icon: BarChart,     path: '/dashboard/admin/reports',      badgeKey: null },
    { label: t('dashboard.sidebar.settings'),     icon: Settings,     path: '/dashboard/admin/settings',     badgeKey: null },
  ] as const;

  const menuItems = BASE_ITEMS.map((item) => ({
    ...item,
    badge: item.badgeKey ? (counts[item.badgeKey as keyof typeof counts] ?? 0) : 0,
  }));

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
          lg:relative lg:translate-x-0 lg:z-0 min-w-[72px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
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

        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map(({ label, icon: Icon, path, badge }) => (
            <NavLink
              key={label}
              to={path}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              end={path === '/dashboard/admin'}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'} py-3 text-sm font-semibold transition-all duration-200 rounded-none hover:scale-[1.02] hover:translate-x-0.5
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 border-r-4 border-blue-800 dark:border-blue-500'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Icon size={18} className={!isActive ? (ICON_COLORS[path] ?? '') : ''} />
                    {!isCollapsed && <span>{label}</span>}
                  </div>
                  {!isCollapsed && badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center shadow-sm shadow-red-500/50">
                      {badge}
                    </span>
                  )}
                </>
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
            <LogOut size={17} className="group-hover:-translate-x-0.5 transition-transform" />
            {!isCollapsed && 'Cerrar Sesión'}
          </button>
        </div>
      </aside>
    </>
  );
}
