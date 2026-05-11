import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home, ShoppingCart, Layers, Package, CheckSquare,
  Users, UserCheck, Bell, BarChart, Settings, UserCog, Package2, X, LogOut
} from 'lucide-react';
import { useBadgeCounts } from '../../context/BadgeCountsContext';
import { useAuth } from '@/hooks/useAuth';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { counts } = useBadgeCounts();
  const { t } = useTranslation();
  const { logout } = useAuth();

  const BASE_ITEMS = [
    { label: t('dashboard.sidebar.home'),         icon: Home,        path: '/dashboard/admin',              badgeKey: null },
    { label: t('dashboard.sidebar.orders'),       icon: ShoppingCart, path: '/dashboard/admin/orders',       badgeKey: 'pedidos' },
    { label: t('dashboard.sidebar.catalog'),      icon: Layers,       path: '/dashboard/admin/catalog',      badgeKey: null },
    { label: t('dashboard.sidebar.inventory'),    icon: Package,      path: '/dashboard/admin/inventory',    badgeKey: null },
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
      {/* Backdrop (Móvil) */}
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
        {/* Header Móvil (Logo + Cerrar) */}
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

        {/* Menu */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map(({ label, icon: Icon, path, badge }) => (
            <NavLink
              key={label}
              to={path}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              end={path === '/dashboard/admin'}
              className={({ isActive }) =>
                `flex items-center justify-between px-5 py-3 text-sm font-semibold transition-all duration-200 rounded-none
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
              {badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center shadow-sm shadow-red-500/50">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Botón Salir — parte inferior */}
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
