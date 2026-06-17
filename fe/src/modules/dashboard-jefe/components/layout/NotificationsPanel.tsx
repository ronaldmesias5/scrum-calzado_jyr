/**
 * Componente: NotificationsPanel.tsx
 * Panel de notificaciones con datos reales del backend + WebSocket.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  X, ShoppingBag, CheckCircle, XCircle, Zap, Trash2, Check, UserCheck,
} from 'lucide-react';
import {
  getNotifications, markAsRead, markAllAsRead, dismissNotification,
  type BackendNotification,
} from '../../services/notificationApi';
import { useBadgeCounts, type PendingUser } from '../../context/BadgeCountsContext';

type NotifTab = 'todas' | 'pedidos' | 'usuarios';

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

function NotifIcon({ type }: { type: string }) {
  switch (type) {
    case 'exito':   return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'error':   return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
    case 'advertencia': return <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
    default:        return <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  }
}

function iconBg(type: string): string {
  switch (type) {
    case 'exito':   return 'bg-green-100 dark:bg-green-900/30';
    case 'error':   return 'bg-red-100 dark:bg-red-900/30';
    case 'advertencia': return 'bg-amber-100 dark:bg-amber-900/30';
    default:        return 'bg-blue-100 dark:bg-blue-900/30';
  }
}

// ─────── Notificación de usuario pendiente (local, no del backend) ───────
function PendingUserItem({ user }: { user: PendingUser }) {
  const fullName = user.name && user.last_name ? `${user.name} ${user.last_name}` : user.email;
  return (
    <div className="relative flex items-start gap-4 px-5 py-5 border-b border-gray-50 dark:border-slate-800/40 bg-purple-50/20 dark:bg-purple-900/5">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-purple-600 rounded-r-full" />
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
        <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white">Cuenta pendiente de validación</p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{fullName} espera aprobación</p>
        <div className="flex items-center gap-3 mt-2.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase">{relativeTime(user.created_at)}</span>
          <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-black rounded uppercase">Urgente</span>
        </div>
      </div>
    </div>
  );
}

// ─────── Componente principal ───────
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<NotifTab>('todas');
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { pendingUsers, refresh } = useBadgeCounts();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(50);
      setNotifications(data.items);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [isOpen, loadNotifications]);

  const unreadNotifs = notifications.filter((n) => !n.is_read && !dismissedIds.has(n.id));

  // Aplicar filtro de tabs + dismissed
  const visible = (() => {
    if (tab === 'usuarios') return []; // usuarios se muestran aparte
    let filtered = notifications.filter((n) => !dismissedIds.has(n.id));
    if (tab === 'pedidos')  filtered = filtered.filter((n) => n.order_id !== null);
    return filtered;
  })();

  const unreadCount = unreadNotifs.length;

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      refresh();
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      refresh();
    } catch { /* ignore */ }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissNotification(id);
      setDismissedIds((prev) => new Set([...prev, id]));
      refresh();
    } catch { /* ignore */ }
  };

  const tabBadge = (key: NotifTab): number => {
    if (key === 'todas')    return unreadNotifs.length;
    if (key === 'pedidos')  return unreadNotifs.filter((n) => n.order_id !== null).length;
    if (key === 'usuarios') return pendingUsers.length;
    return 0;
  };

  const tabs: Array<{ key: NotifTab; label: string }> = [
    { key: 'todas',    label: 'Todas' },
    { key: 'pedidos',  label: 'Pedidos' },
    { key: 'usuarios', label: 'Usuarios' },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 z-50 h-full w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-gray-100 dark:border-slate-800 transition-all duration-300">
        {/* Header */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notificaciones</h2>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                {unreadCount > 0
                  ? `Tienes ${unreadCount} sin leer`
                  : 'Todas las notificaciones leídas'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
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

          {/* Tabs */}
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
                    <span className={`text-[10px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center leading-none ${
                      tab === key ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                    }`}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === 'usuarios' ? (
            pendingUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <UserCheck className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Sin usuarios pendientes</p>
              </div>
            ) : (
              pendingUsers.map((user) => <PendingUserItem key={user.id} user={user} />)
            )
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <ShoppingBag className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : (
            visible.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) handleMarkRead(notif.id);
                  if (notif.link_url) window.location.href = notif.link_url;
                }}
                className={`relative flex items-start gap-4 px-5 py-5 border-b border-gray-50 dark:border-slate-800/40 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer group ${
                  notif.is_read ? 'opacity-60 grayscale-[0.3]' : 'bg-blue-50/20 dark:bg-blue-900/5'
                }`}
              >
                {!notif.is_read && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-600 rounded-r-full group-hover:h-16 transition-all" />
                )}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconBg(notif.type_notification)}`}>
                  <NotifIcon type={notif.type_notification} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{notif.title_notification}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notif.message_notification}</p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{relativeTime(notif.created_at)}</span>
                    {!notif.is_read && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-black rounded uppercase">Nuevo</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(notif.id); }}
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
        {(visible.length > 0 || pendingUsers.length > 0) && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 text-center bg-gray-50/30 dark:bg-slate-900/50">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              {visible.length + (tab === 'usuarios' ? pendingUsers.length : 0)} elementos • {unreadCount} sin leer
            </p>
          </div>
        )}
      </div>
    </>
  );
}
