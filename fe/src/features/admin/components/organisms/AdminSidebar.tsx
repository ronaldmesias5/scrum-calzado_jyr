import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, LogOut } from 'lucide-react';
import { useBadgeCounts } from '@/store/BadgeCountsContext';
import { useAuth } from '@/hooks/useAuth';
import {
  ADMIN_SECTIONS,
  ADMIN_SECTION_COLORS
} from '@/features/admin/constants/adminSections';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  isCollapsed: boolean;
}

export default function AdminSidebar({
  isOpen,
  onClose,
  width,
  isCollapsed
}: AdminSidebarProps) {
  const { counts } = useBadgeCounts();
  const { t } = useTranslation();
  const { logout } = useAuth();

  const BASE_ITEMS = [
    {
      label: t('dashboard.sidebar.home'),
      icon: ADMIN_SECTIONS.home.icon,
      path: '/dashboard/admin',
      badgeKey: null
    },
    {
      label: t('dashboard.sidebar.orders'),
      icon: ADMIN_SECTIONS.orders.icon,
      path: '/dashboard/admin/orders',
      badgeKey: 'pedidos'
    },
    {
      label: 'Calendario',
      icon: ADMIN_SECTIONS.calendar.icon,
      path: '/dashboard/admin/calendar',
      badgeKey: null
    },
    {
      label: t('dashboard.sidebar.catalog'),
      icon: ADMIN_SECTIONS.catalog.icon,
      path: '/dashboard/admin/catalog',
      badgeKey: null
    },
    {
      label: 'Categorías',
      icon: ADMIN_SECTIONS.categories.icon,
      path: '/dashboard/admin/categories',
      badgeKey: null
    },
    {
      label: t('dashboard.sidebar.inventory'),
      icon: ADMIN_SECTIONS.inventory.icon,
      path: '/dashboard/admin/inventory',
      badgeKey: null
    },
    {
      label: 'Incidencias',
      icon: ADMIN_SECTIONS.losses.icon,
      path: '/dashboard/admin/losses',
      badgeKey: 'incidencias'
    },
    {
      label: 'Insumos',
      icon: ADMIN_SECTIONS.insumos.icon,
      path: '/dashboard/admin/insumos',
      badgeKey: null
    },
    {
      label: t('dashboard.sidebar.tasks'),
      icon: ADMIN_SECTIONS.tasks.icon,
      path: '/dashboard/admin/tasks',
      badgeKey: null
    },
    {
      label: t('dashboard.sidebar.employees'),
      icon: ADMIN_SECTIONS.employees.icon,
      path: '/dashboard/admin/employees',
      badgeKey: null
    },
    {
      label: t('dashboard.sidebar.clients'),
      icon: ADMIN_SECTIONS.clients.icon,
      path: '/dashboard/admin/clients',
      badgeKey: null
    },
    {
      label: 'Precios por Cliente',
      icon: ADMIN_SECTIONS.clientPrices.icon,
      path: '/dashboard/admin/client-prices',
      badgeKey: null
    },
    {
      label: t('dashboard.sidebar.users'),
      icon: ADMIN_SECTIONS.users.icon,
      path: '/dashboard/admin/usuarios',
      badgeKey: 'usuarios'
    },
    {
      label: t('dashboard.sidebar.alerts'),
      icon: ADMIN_SECTIONS.alerts.icon,
      path: '/dashboard/admin/alerts',
      badgeKey: null
    },
    {
      label: t('dashboard.sidebar.reports'),
      icon: ADMIN_SECTIONS.reports.icon,
      path: '/dashboard/admin/reports',
      badgeKey: null
    },
    {
      label: t('dashboard.sidebar.settings'),
      icon: ADMIN_SECTIONS.settings.icon,
      path: '/dashboard/admin/settings',
      badgeKey: null
    }
  ] as const;

  const menuItems = BASE_ITEMS.map((item) => ({
    ...item,
    badge: item.badgeKey
      ? (counts[item.badgeKey as keyof typeof counts] ?? 0)
      : 0
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
          {menuItems.map(({ label, icon: Icon, path, badge }) => (
            <NavLink
              key={label}
              to={path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              end={path === '/dashboard/admin'}
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
                <>
                  <div
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                  >
                    <Icon
                      size={18}
                      className={!isActive ? (ADMIN_SECTION_COLORS[path] ?? '') : ''}
                    />
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
