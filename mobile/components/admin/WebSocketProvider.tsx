import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth';
import { API_URL } from '@/constants/api';

export function WebSocketProvider() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    let ws: WebSocket | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      try {
        const wsUrl = API_URL.replace(/^http/, 'ws') + '/notifications/ws';
        ws = new WebSocket(`${wsUrl}?token=${accessToken}`);

        ws.onopen = () => {
          pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
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
          } catch {}
        };

        ws.onerror = () => ws?.close();

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          ws = null;
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [isAuthenticated, accessToken, queryClient]);

  return null;
}
