import type { LucideIcon } from 'lucide-react';
import {
  Home,
  ShoppingCart,
  Calendar,
  Layers,
  Tag,
  Package,
  AlertTriangle,
  Package2,
  CheckSquare,
  Users,
  UserCheck,
  DollarSign,
  UserCog,
  Bell,
  BarChart,
  Settings
} from 'lucide-react';

/**
 * Fuente única de verdad de los iconos del dashboard admin.
 * El AdminSidebar y las cabeceras de cada página consumen este módulo
 * para garantizar forma + color 100% coherentes entre menú y página.
 */
export interface AdminSection {
  icon: LucideIcon;
  /** Clases Tailwind del color corporativo de la sección (light + dark). */
  color: string;
}

export const ADMIN_SECTIONS = {
  home: { icon: Home, color: 'text-indigo-500 dark:text-indigo-400' },
  orders: { icon: ShoppingCart, color: 'text-blue-500 dark:text-blue-400' },
  calendar: { icon: Calendar, color: 'text-lime-500 dark:text-lime-400' },
  catalog: { icon: Layers, color: 'text-purple-500 dark:text-purple-400' },
  categories: { icon: Tag, color: 'text-fuchsia-500 dark:text-fuchsia-400' },
  inventory: { icon: Package, color: 'text-emerald-500 dark:text-emerald-400' },
  losses: { icon: AlertTriangle, color: 'text-red-500 dark:text-red-400' },
  insumos: { icon: Package2, color: 'text-teal-500 dark:text-teal-400' },
  tasks: { icon: CheckSquare, color: 'text-sky-500 dark:text-sky-400' },
  employees: { icon: Users, color: 'text-cyan-500 dark:text-cyan-400' },
  clients: { icon: UserCheck, color: 'text-amber-500 dark:text-amber-400' },
  clientPrices: { icon: DollarSign, color: 'text-emerald-500 dark:text-emerald-400' },
  users: { icon: UserCog, color: 'text-violet-500 dark:text-violet-400' },
  alerts: { icon: Bell, color: 'text-rose-500 dark:text-rose-400' },
  reports: { icon: BarChart, color: 'text-orange-500 dark:text-orange-400' },
  settings: { icon: Settings, color: 'text-slate-500 dark:text-slate-400' }
} satisfies Record<string, AdminSection>;

export type AdminSectionKey = keyof typeof ADMIN_SECTIONS;

/** Colores por ruta del sidebar (derivados de ADMIN_SECTIONS). */
export const ADMIN_SECTION_COLORS: Record<string, string> = {
  '/dashboard/admin': ADMIN_SECTIONS.home.color,
  '/dashboard/admin/orders': ADMIN_SECTIONS.orders.color,
  '/dashboard/admin/calendar': ADMIN_SECTIONS.calendar.color,
  '/dashboard/admin/catalog': ADMIN_SECTIONS.catalog.color,
  '/dashboard/admin/categories': ADMIN_SECTIONS.categories.color,
  '/dashboard/admin/inventory': ADMIN_SECTIONS.inventory.color,
  '/dashboard/admin/losses': ADMIN_SECTIONS.losses.color,
  '/dashboard/admin/insumos': ADMIN_SECTIONS.insumos.color,
  '/dashboard/admin/tasks': ADMIN_SECTIONS.tasks.color,
  '/dashboard/admin/employees': ADMIN_SECTIONS.employees.color,
  '/dashboard/admin/clients': ADMIN_SECTIONS.clients.color,
  '/dashboard/admin/client-prices': ADMIN_SECTIONS.clientPrices.color,
  '/dashboard/admin/usuarios': ADMIN_SECTIONS.users.color,
  '/dashboard/admin/alerts': ADMIN_SECTIONS.alerts.color,
  '/dashboard/admin/reports': ADMIN_SECTIONS.reports.color,
  '/dashboard/admin/settings': ADMIN_SECTIONS.settings.color
};
