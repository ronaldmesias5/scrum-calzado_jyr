/**
 * BadgeCountsContext — provee conteos reales para badges del sidebar y panel de notificaciones.
 * Hace polling al backend cada 30 segundos.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiClient from '@/api/axios';
import { getOrders } from '../services/ordersApi';

// ─────────────────────────── Tipos ───────────────────────────

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
  pedidos: number;   // pedidos con estado "pendiente"
  usuarios: number;  // usuarios sin validar
}

interface ContextValue {
  counts: BadgeCounts;
  pendingUsers: PendingUser[];
  refresh: () => void;
}

// ─────────────────────────── Contexto ───────────────────────────

const BadgeCountsContext = createContext<ContextValue>({
  counts: { pedidos: 0, usuarios: 0 },
  pendingUsers: [],
  refresh: () => {},
});

// ─────────────────────────── Provider ───────────────────────────

export function BadgeCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<BadgeCounts>({ pedidos: 0, usuarios: 0 });
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [ordersRes, usersRes] = await Promise.allSettled([
        getOrders(1, 1, 'pendiente'),
        apiClient.get<PendingUser[]>('/api/v1/admin/users/pending-validation'),
      ]);

      const pedidos =
        ordersRes.status === 'fulfilled' ? ordersRes.value.total : 0;

      const users =
        usersRes.status === 'fulfilled' ? usersRes.value.data : [];

      setCounts({ pedidos, usuarios: users.length });
      setPendingUsers(users);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <BadgeCountsContext.Provider value={{ counts, pendingUsers, refresh }}>
      {children}
    </BadgeCountsContext.Provider>
  );
}

// ─────────────────────────── Hook ───────────────────────────

export function useBadgeCounts() {
  return useContext(BadgeCountsContext);
}
