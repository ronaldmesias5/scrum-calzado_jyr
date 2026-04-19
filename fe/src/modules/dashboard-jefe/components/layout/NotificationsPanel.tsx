/**
 * Componente: NotificationsPanel.tsx
 * Panel de notificaciones con pedidos reales y usuarios pendientes de validación.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  X, ShoppingBag, CheckCircle, XCircle, Zap, Trash2, Check, UserCheck,
} from 'lucide-react';
import { getOrders, type Order, type OrderStatus } from '../../services/ordersApi';
import { useBadgeCounts, type PendingUser } from '../../context/BadgeCountsContext';

// ─────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────

type NotifTab = 'todas' | 'pedidos' | 'inventario' | 'usuarios';
type NotifType = 'pedido' | 'usuario';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  urgent: boolean;
  state?: OrderStatus;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 2) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
}

function buildNotification(order: Order): Notification {
  const clientName =
    order.customer_name && order.customer_last_name
      ? `${order.customer_name} ${order.customer_last_name}`
      : `Cliente #${order.customer_id.substring(0, 8)}`;

  const stateLabels: Record<OrderStatus, string> = {
    pendiente: 'Nuevo Pedido Mayorista',
    en_progreso: 'Pedido en Producción',
    completado: 'Pedido Completado',
    entregado: 'Pedido Entregado',
    cancelado: 'Pedido Cancelado',
  };

  const desc: Record<OrderStatus, string> = {
    pendiente: `${clientName} ha realizado un pedido de ${order.total_pairs} pares`,
    en_progreso: `El pedido de ${clientName} (${order.total_pairs} pares) está en producción`,
    completado: `El pedido #${order.id.substring(0, 8)} de ${clientName} ha sido completado`,
    entregado: `El pedido #${order.id.substring(0, 8)} de ${clientName} ha sido entregado`,
    cancelado: `El pedido #${order.id.substring(0, 8)} de ${clientName} fue cancelado`,
  };

  return {
    id: `order-${order.id}`,
    type: 'pedido',
    title: stateLabels[order.state],
    description: desc[order.state],
    time: relativeTime(order.created_at),
    urgent: order.state === 'pendiente',
    state: order.state,
  };
}

function buildUserNotification(user: PendingUser): Notification {
  const fullName = user.name && user.last_name
    ? `${user.name} ${user.last_name}`
    : user.email;

  const roleLabel: Record<string, string> = {
    client:   'cliente',
    employee: 'empleado',
    admin:    'administrador',
  };
  const role = roleLabel[user.role_name ?? ''] ?? 'usuario';

  return {
    id: `user-${user.id}`,
    type: 'usuario',
    title: 'Cuenta pendiente de validación',
    description: `${fullName} (${role}) se registró y espera aprobación`,
    time: relativeTime(user.created_at),
    urgent: true,
  };
}

function NotifIcon({ notif }: { notif: Notification }) {
  if (notif.type === 'usuario') {
    return <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
  }
  switch (notif.state) {
    case 'pendiente':   return <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'en_progreso': return <Zap className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
    case 'completado':  return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'cancelado':   return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
    default:            return <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  }
}

function iconBg(notif: Notification): string {
  if (notif.type === 'usuario') return 'bg-purple-100 dark:bg-purple-900/30';
  switch (notif.state) {
    case 'pendiente':   return 'bg-blue-100 dark:bg-blue-900/30';
    case 'en_progreso': return 'bg-blue-50 dark:bg-blue-900/20';
    case 'completado':  return 'bg-green-100 dark:bg-green-900/30';
    case 'cancelado':   return 'bg-red-100 dark:bg-red-900/30';
    default:            return 'bg-gray-100 dark:bg-slate-800';
  }
}

// ─────────────────────────────────────────
// Componente
// ─────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'calzado_notif_read_ids';

function getPersistedReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export default function NotificationsPanel({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<NotifTab>('todas');
  const [rawNotifications, setRawNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(getPersistedReadIds);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { pendingUsers } = useBadgeCounts();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders(1, 10);
      setRawNotifications(data.items.map(buildNotification));
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadOrders();
  }, [isOpen, loadOrders]);

  // Combinar usuarios pendientes + pedidos
  const allNotifications: Notification[] = [
    ...pendingUsers.map(buildUserNotification),
    ...rawNotifications,
  ];

  // Aplicar leídos y descartados
  const visible = allNotifications
    .filter((n) => !dismissedIds.has(n.id))
    .map((n) => ({ ...n, read: readIds.has(n.id) }));

  const unreadCount = visible.filter((n) => !n.read).length;

  const markAllRead = () => {
    const ids = new Set([...readIds, ...visible.map((n) => n.id)]);
    setReadIds(ids);
    persistReadIds(ids);
  };

  const dismiss = (id: string) =>
    setDismissedIds((prev) => new Set([...prev, id]));

  const markRead = (id: string) => {
    const ids = new Set([...readIds, id]);
    setReadIds(ids);
    persistReadIds(ids);
  };

  const tabBadge = (key: NotifTab): number =>
    visible.filter((n) => {
      if (key === 'todas')    return !n.read;
      if (key === 'pedidos')  return n.type === 'pedido'  && !n.read;
      if (key === 'usuarios') return n.type === 'usuario' && !n.read;
      return false;
    }).length;

  const filtered = visible.filter((n) => {
    if (tab === 'pedidos')    return n.type === 'pedido';
    if (tab === 'usuarios')   return n.type === 'usuario';
    if (tab === 'inventario') return false;
    return true;
  });

  const tabs: Array<{ key: NotifTab; label: string }> = [
    { key: 'todas',      label: 'Todas' },
    { key: 'pedidos',    label: 'Pedidos' },
    { key: 'inventario', label: 'Inventario' },
    { key: 'usuarios',   label: 'Usuarios' },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />

      {/* Panel derecho */}
      <div className="fixed top-0 right-0 z-50 h-full w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-gray-100 dark:border-slate-800 transition-all duration-300">

        {/* Header del panel */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100 dark:border-slate-800 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Notificaciones</h2>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                {unreadCount > 0
                    ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
                    : 'Todas las notificaciones leídas'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-[10px] text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 font-black uppercase tracking-widest transition-all"
                >
                  <Check className="w-3 h-3" />
                  Leídas
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs con badge por categoría */}
          <div className="flex gap-1 mt-4 flex-wrap">
            {tabs.map(({ key, label }) => {
              const badge = tabBadge(key);
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    tab === key
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                  {badge > 0 && (
                    <span className={`text-[10px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center leading-none
                      ${tab === key ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 transition-colors">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <ShoppingBag className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`flex items-start gap-4 px-5 py-5 border-b border-gray-50 dark:border-slate-800/40 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-all cursor-default group ${
                  notif.read ? 'opacity-60 grayscale-[0.3]' : 'bg-blue-50/20 dark:bg-blue-900/5'
                }`}
              >
                {/* Indicador de no leído */}
                {!notif.read && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-600 rounded-r-full group-hover:h-16 transition-all" />
                )}
                {/* Icono */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconBg(notif)}`}>
                  <NotifIcon notif={notif} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{notif.title}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{notif.description}</p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{notif.time}</span>
                    {notif.urgent && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-black rounded uppercase tracking-tighter">
                        Urgente
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                    title="Descartar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {visible.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 text-center bg-gray-50/30 dark:bg-slate-900/50 transition-colors">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              {visible.length} notificación{visible.length !== 1 ? 'es' : ''} • {unreadCount} sin leer
            </p>
          </div>
        )}
      </div>
    </>
  );
}
