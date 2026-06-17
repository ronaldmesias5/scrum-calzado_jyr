"""
Módulo: notifications
Descripción: Sistema de notificaciones en tiempo real para CALZADO J&R.
Provee notificaciones en BD, WebSockets en tiempo real y emails transaccionales.

Arquitectura WebSocket:
  - ConnectionManager singleton (ws_manager) trackea conexiones por user_id
  - Token JWT validado en query param para auth WebSocket
  - No socket.io, no dependencias extra — solo WebSocket nativo de FastAPI

Flujo de notificación (ej: nuevo pedido):
  1. create_order() en orders/router.py
  2. NotificationService.create_notification() → guarda en BD
  3. ws_manager.broadcast_to_user() → envía JSON en tiempo real
  4. send_order_notification_email() → email async fire-and-forget
"""
