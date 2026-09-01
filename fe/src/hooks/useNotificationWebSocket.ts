import { useCallback, useEffect, useRef, useState } from 'react';
import type { BackendNotification } from '../services/notificationApi';

interface WsMessage {
  type: string;
  notification?: BackendNotification;
}

export function useNotificationWebSocket() {
  const [lastNotification, setLastNotification] = useState<BackendNotification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const connectRef = useRef<() => void>(() => undefined);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) return;

    // Limpiar conexión previa
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const baseUrl = import.meta.env.VITE_API_URL || '';
    const apiUrl = baseUrl || window.location.origin;
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    const url = `${wsUrl}/api/v1/notifications/ws?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === 'new_order' && msg.notification) {
          if (mountedRef.current) {
            setLastNotification(msg.notification);
            setUnreadCount((prev) => prev + 1);
          }
        }
      } catch {
        // ignorar mensajes malformados
      }
    };

    ws.onclose = (event) => {
      if (mountedRef.current) {
        setIsConnected(false);
        // No reconectar si el token expiró (403) — evita bucle infinito y ruido en consola
        if (event.code === 1008 || event.code === 1006) {
          const code = event.code;
          if (code === 1008) return;
        }
        // Reconectar después de 5 segundos solo si no fue cierre por auth
        reconnectTimerRef.current = setTimeout(() => connectRef.current(), 5000);
      }
    };

    ws.onerror = () => {
      // Silenciar para no spamear consola en 403/401
    };
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Mantener conexión viva con ping cada 30s
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const resetUnreadCount = useCallback(() => setUnreadCount(0), []);

  return { lastNotification, unreadCount, isConnected, resetUnreadCount };
}
