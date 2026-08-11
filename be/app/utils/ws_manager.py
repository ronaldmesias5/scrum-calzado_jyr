"""
WebSocket Connection Manager para notificaciones en tiempo real.

Usa WebSocket nativo de FastAPI (NO socket.io, NO dependencias extra).
El singleton ws_manager se comparte a nivel de módulo.

Arquitectura:
  - Dict: user_id (str) → set[WebSocket]
  - broadcast_to_user() envía JSON a todas las conexiones de un usuario
  - broadcast_to_users() envía a múltiples usuarios
  - Conexiones muertas se limpian automáticamente
"""

from fastapi import WebSocket


class ConnectionManager:
    """
    Gestiona conexiones WebSocket por user_id.
    Singleton a nivel módulo — corre en un solo proceso.
    """

    def __init__(self) -> None:
        # Dict user_id -> set of WebSocket connections
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        """Acepta una nueva conexión WebSocket y la registra para el usuario."""
        await ws.accept()
        self._connections.setdefault(user_id, set()).add(ws)

    def disconnect(self, user_id: str, ws: WebSocket) -> None:
        """Remueve una conexión WebSocket del registro."""
        conns = self._connections.get(user_id)
        if conns:
            conns.discard(ws)
            if not conns:
                del self._connections[user_id]

    async def broadcast_to_user(self, user_id: str, message: dict) -> None:
        """
        Envía un mensaje JSON a todas las conexiones activas de un usuario.
        Limpia conexiones muertas automáticamente.
        """
        conns = self._connections.get(user_id, set())
        dead = set()
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(user_id, ws)

    async def broadcast_to_users(self, user_ids: list[str], message: dict) -> None:
        """Envía un mensaje JSON a múltiples usuarios."""
        for uid in user_ids:
            await self.broadcast_to_user(uid, message)


# Singleton a nivel módulo
ws_manager = ConnectionManager()
