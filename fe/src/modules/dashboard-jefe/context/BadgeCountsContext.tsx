/**
 * BadgeCountsContext — conteos para badges del sidebar.
 * Notificaciones vía REST API + WebSocket (no más polling de pedidos).
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '@/api/axios';
import { getUnreadCount } from '../services/notificationApi';
import { useNotificationWebSocket } from '../hooks/useNotificationWebSocket';
import { getPendingIncidences } from '../services/lossApi';
import { useAuth } from '@/hooks/useAuth';

export interface PendingUser {
  id: string;
  email: string;
  name: string;
  last_name: string;
  phone?: string | null;
  role_name?: string | null;
  created_at: string;
}

export interface BadgeCounts {
  pedidos: number;
  usuarios: number;
  incidencias: number;
}

interface ContextValue {
  counts: BadgeCounts;
  pendingUsers: PendingUser[];
  refresh: () => void;
  resetNotificationCount: () => void;
}

const BadgeCountsContext = createContext<ContextValue>({
  counts: { pedidos: 0, usuarios: 0, incidencias: 0 },
  pendingUsers: [],
  refresh: () => {},
  resetNotificationCount: () => {},
});

export function BadgeCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<BadgeCounts>({ pedidos: 0, usuarios: 0, incidencias: 0 });
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const { unreadCount, resetUnreadCount } = useNotificationWebSocket();
  const { user, isLoading: authLoading } = useAuth();
  const canAccessAdmin = user?.role_name === 'admin' || user?.occupation === 'jefe';

  const refresh = useCallback(async () => {
    if (!canAccessAdmin) {
      setPendingUsers([]);
      try {
        const notifUnread = await getUnreadCount();
        setCounts((prev) => ({ ...prev, pedidos: notifUnread, usuarios: 0, incidencias: 0 }));
      } catch { /* silently ignore */ }
      return;
    }

    try {
      // Usuarios pendientes
      const usersRes = await apiClient.get<PendingUser[]>('/api/v1/admin/users/pending-validation');
      const users = usersRes.data;
      setPendingUsers(users);

      // Notificaciones no leídas
      const notifUnread = await getUnreadCount();

      // Incidencias pendientes de aprobación
      let pendingIncCount = 0;
      try {
        const incRes = await getPendingIncidences('pending');
        pendingIncCount = incRes.total ?? 0;
      } catch { /* silently ignore */ }

      setCounts({
        pedidos: notifUnread,
        usuarios: users.length,
        incidencias: pendingIncCount,
      });
    } catch {
      // silently ignore
    }
  }, [canAccessAdmin]);

  // Sincronizar contador WebSocket con el estado local
  useEffect(() => {
    setCounts((prev) => ({ ...prev, pedidos: unreadCount }));
  }, [unreadCount]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh, authLoading]);

  const resetNotificationCount = useCallback(() => {
    resetUnreadCount();
    setCounts((prev) => ({ ...prev, pedidos: 0 }));
  }, [resetUnreadCount]);

  return (
    <BadgeCountsContext.Provider value={{ counts, pendingUsers, refresh, resetNotificationCount }}>
      {children}
    </BadgeCountsContext.Provider>
  );
}

export function useBadgeCounts() {
  return useContext(BadgeCountsContext);
}
