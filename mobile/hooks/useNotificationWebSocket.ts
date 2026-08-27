import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth';
import { API_URL } from '@/constants/api';
import { emitSessionExpired } from '@/services/sessionEvents';
import type { Notification } from '@/types/notifications';

export function useNotificationWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (wsRef.current) return;

    try {
      const wsUrl = API_URL.replace(/^http/, 'ws') + '/notifications/ws';
      const ws = new WebSocket(`${wsUrl}?token=${accessToken}`);

      ws.onopen = () => {
        intervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30_000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'new_order' && msg.notification) {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
          }
        } catch {
          // Ignorar mensajes no parseables
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        wsRef.current = null;
        if (isAuthenticated && accessToken) {
          setTimeout(connect, 5000);
        }
      };

      wsRef.current = ws;
    } catch {
      // Error al crear WebSocket — reintentar después
      if (isAuthenticated && accessToken) {
        setTimeout(connect, 5000);
      }
    }
  }, [isAuthenticated, accessToken, queryClient]);

  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [isAuthenticated, accessToken, connect, disconnect]);
}
