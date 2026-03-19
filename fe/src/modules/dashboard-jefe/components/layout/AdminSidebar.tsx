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
import {
  Home, ShoppingCart, Layers, Package, CheckSquare,
  Users, UserCheck, RotateCcw, Bell, BarChart, Settings, UserCog
} from 'lucide-react';
import { useBadgeCounts } from '../../context/BadgeCountsContext';

const BASE_ITEMS = [
  { label: 'Inicio',        icon: Home,        path: '/dashboard/admin',              badgeKey: null },
  { label: 'Pedidos',       icon: ShoppingCart, path: '/dashboard/admin/orders',       badgeKey: 'pedidos' },
  { label: 'Catálogo',      icon: Layers,       path: '/dashboard/admin/catalog',      badgeKey: null },
  { label: 'Inventario',    icon: Package,      path: '/dashboard/admin/inventory',    badgeKey: null },
  { label: 'Tareas',        icon: CheckSquare,  path: '/dashboard/admin/tasks',        badgeKey: null },
  { label: 'Empleados',     icon: Users,        path: '/dashboard/admin/employees',    badgeKey: null },
  { label: 'Clientes',      icon: UserCheck,    path: '/dashboard/admin/clients',      badgeKey: null },
  { label: 'Usuarios',      icon: UserCog,      path: '/dashboard/admin/usuarios',     badgeKey: 'usuarios' },
  { label: 'Reactivación',  icon: RotateCcw,    path: '/dashboard/admin/reactivation', badgeKey: null },
  { label: 'Alertas',       icon: Bell,         path: '/dashboard/admin/alerts',       badgeKey: null },
  { label: 'Reportes',      icon: BarChart,     path: '/dashboard/admin/reports',      badgeKey: null },
  { label: 'Configuración', icon: Settings,     path: '/dashboard/admin/settings',     badgeKey: null },
] as const;

export default function AdminSidebar() {
  const { counts } = useBadgeCounts();

  const menuItems = BASE_ITEMS.map((item) => ({
    ...item,
    badge: item.badgeKey ? (counts[item.badgeKey as keyof typeof counts] ?? 0) : 0,
  }));

  return (
    <aside className="w-44 h-full bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* Menu */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {menuItems.map(({ label, icon: Icon, path, badge }) => (
          <NavLink
            key={label}
            to={path}
            end={path === '/dashboard/admin'}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors duration-150 rounded-none
              ${isActive
                ? 'bg-blue-50 text-blue-800 border-r-4 border-blue-800'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Icon size={16} />
              <span>{label}</span>
            </div>
            {badge > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
