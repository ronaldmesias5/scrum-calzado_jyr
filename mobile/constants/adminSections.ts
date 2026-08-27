import { Ionicons } from '@expo/vector-icons';

export interface AdminSection {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  color: string;
  phase: string;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: 'inicio',
    label: 'Inicio',
    icon: 'home',
    href: '/(admin)/(tabs)',
    color: '#6366f1',
    phase: 'F3',
  },
  {
    key: 'orders',
    label: 'Pedidos',
    icon: 'receipt',
    href: '/(admin)/(tabs)/orders',
    color: '#3b82f6',
    phase: 'F4',
  },
  {
    key: 'catalog',
    label: 'Catálogo',
    icon: 'albums',
    href: '/(admin)/catalog',
    color: '#a855f7',
    phase: 'F5',
  },
  {
    key: 'inventory',
    label: 'Inventario',
    icon: 'cube',
    href: '/(admin)/inventory',
    color: '#10b981',
    phase: 'F5',
  },
  {
    key: 'losses',
    label: 'Incidencias',
    icon: 'warning',
    href: '/(admin)/(tabs)/losses',
    color: '#ef4444',
    phase: 'F8',
  },
  {
    key: 'insumos',
    label: 'Insumos',
    icon: 'layers',
    href: '/(admin)/insumos',
    color: '#14b8a6',
    phase: 'F9',
  },
  {
    key: 'tasks',
    label: 'Tareas',
    icon: 'checkbox',
    href: '/(admin)/tasks',
    color: '#0ea5e9',
    phase: 'F9',
  },
  {
    key: 'employees',
    label: 'Empleados',
    icon: 'people',
    href: '/(admin)/employees',
    color: '#06b6d4',
    phase: 'F6',
  },
  {
    key: 'clients',
    label: 'Clientes',
    icon: 'person',
    href: '/(admin)/clients',
    color: '#f59e0b',
    phase: 'F6',
  },
  {
    key: 'users',
    label: 'Usuarios',
    icon: 'person-add',
    href: '/(admin)/users',
    color: '#8b5cf6',
    phase: 'F6',
  },
  {
    key: 'alerts',
    label: 'Alertas',
    icon: 'notifications',
    href: '/(admin)/alerts',
    color: '#f43f5e',
    phase: 'F8',
  },
  {
    key: 'reports',
    label: 'Reportes',
    icon: 'bar-chart',
    href: '/(admin)/(tabs)/reports',
    color: '#f97316',
    phase: 'F7',
  },
  {
    key: 'settings',
    label: 'Configuración',
    icon: 'settings',
    href: '/(admin)/settings',
    color: '#64748b',
    phase: 'F3',
  },
];