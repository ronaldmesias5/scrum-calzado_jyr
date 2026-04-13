/**
 * Archivo: fe/src/modules/dashboard-jefe/components/layout/AdminSidebar.tsx
 * Descripción: Sidebar del dashboard administrativo (jefe) con navegación.
 * 
 * ¿Qué?
 *   Sidebar fijo con:
 *   - Logo: h-16 w-16, clickable (navega a /dashboard/admin)
 *   - 12 items de menú: Inicio, Pedidos, Catálogo, Inventario, Tareas, etc.
 *   - NavLink active: bg-blue-50, border-r-4 blue-800
 *   - Badges: Pedidos (24), Alertas (4), otros (0)
 *   - Scroll vertical automático (overflow-y-auto)
 * 
 * ¿Para qué?
 *   - Navegación principal del dashboard jefe
 *   - Indicar sección activa visualmente
 *   - Mostrar badges de notificaciones (pendientes, alertas)
 *   - Acceso rápido a todas las funcionalidades
 * 
 * ¿Impacto?
 *   CRÍTICO — Sin sidebar, jefe no puede navegar dashboard.
 *   Modificar menuItems rompe: navegación completa del dashboard.
 *   Badges hardcoded (24, 4) deben reemplazarse con datos reales (Sprint 4+).
 *   Dependencias: react-router-dom (NavLink), lucide-react (icons)
 */

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home, ShoppingCart, Layers, Package, CheckSquare,
  Users, UserCheck, RotateCcw, Bell, BarChart, Settings, UserCog, Package2
} from 'lucide-react';
import { useBadgeCounts } from '../../context/BadgeCountsContext';



export default function AdminSidebar() {
  const { counts } = useBadgeCounts();
  const { t } = useTranslation();

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
    { label: t('dashboard.sidebar.reactivation'), icon: RotateCcw,    path: '/dashboard/admin/reactivation', badgeKey: null },
    { label: t('dashboard.sidebar.alerts'),       icon: Bell,         path: '/dashboard/admin/alerts',       badgeKey: null },
    { label: t('dashboard.sidebar.reports'),      icon: BarChart,     path: '/dashboard/admin/reports',      badgeKey: null },
    { label: t('dashboard.sidebar.settings'),     icon: Settings,     path: '/dashboard/admin/settings',     badgeKey: null },
  ] as const;

  const menuItems = BASE_ITEMS.map((item) => ({
    ...item,
    badge: item.badgeKey ? (counts[item.badgeKey as keyof typeof counts] ?? 0) : 0,
  }));

  return (
    <aside className="w-52 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col overflow-y-auto transition-colors duration-500">
      {/* Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map(({ label, icon: Icon, path, badge }) => (
          <NavLink
            key={label}
            to={path}
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
    </aside>
  );
}
