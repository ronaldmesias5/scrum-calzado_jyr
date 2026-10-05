"""
Rutas REST + WebSocket para el módulo de notificaciones.

Endpoints REST:
  GET    /api/v1/notifications          — lista notificaciones del usuario
  GET    /api/v1/notifications/unread-count — conteo de no leídas
  PATCH  /api/v1/notifications/{id}/read    — marcar como leída
  PATCH  /api/v1/notifications/read-all     — marcar todas como leídas
  DELETE /api/v1/notifications/{id}         — eliminar (soft delete)

WebSocket:
  WS     /api/v1/notifications/ws?token=JWT — tiempo real
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.notifications import (
    NotificationResponse,
    NotificationListResponse,
    NotificationsUnreadResponse,
)
from app.controllers.notifications import (
    get_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
    dismiss_notification,
)
from app.utils.security import decode_token
from app.utils.ws_manager import ws_manager

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(default=50, le=100),
) -> NotificationListResponse:
    """Lista las notificaciones del usuario autenticado."""
    items = get_notifications(db, current_user.id, limit=limit)
    unread = get_unread_count(db, current_user.id)
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        total=len(items),
        unread_count=unread,
    )


@router.get("/unread-count", response_model=NotificationsUnreadResponse)
def unread_count(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> NotificationsUnreadResponse:
    """Devuelve el número de notificaciones no leídas del usuario."""
    count = get_unread_count(db, current_user.id)
    return NotificationsUnreadResponse(unread_count=count)


@router.patch("/{notification_id}/read")
def read_notification(
    notification_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    """Marca una notificación como leída."""
    mark_as_read(db, notification_id, current_user.id)
    return {"detail": "ok"}


@router.patch("/read-all")
def read_all_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    """Marca todas las notificaciones del usuario como leídas."""
    mark_all_as_read(db, current_user.id)
    return {"detail": "ok"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    """Eliminación lógica de una notificación."""
    dismiss_notification(db, notification_id, current_user.id)
    return {"detail": "ok"}


@router.websocket("/ws")
async def websocket_notifications(
    ws: WebSocket,
    db: Annotated[Session, Depends(get_db)],
    token: str = Query(...),
) -> None:
    """
    WebSocket para recibir notificaciones en tiempo real.

    Autenticación vía token JWT en query param (token=...).
    Valida tipo 'access', que la cuenta esté activa y la versión de sesión
    (mismas reglas que `get_current_user`). Conecta usando el UUID del usuario
    como clave para casar con los `broadcast_to_user(str(user.id))`.
    El cliente puede enviar "ping" para mantener la conexión viva.
    """
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await ws.close(code=4001, reason="Token inválido")
        return

    email: str | None = payload.get("sub")
    if not email:
        await ws.close(code=4001, reason="Token inválido")
        return

    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None or not user.is_active:
        await ws.close(code=4001, reason="Token inválido")
        return

    token_version = payload.get("version")
    if token_version is not None and token_version != user.session_version:
        await ws.close(code=4001, reason="Token inválido")
        return

    user_id = str(user.id)
    await ws_manager.connect(user_id, ws)
    try:
        while True:
            # Mantener conexión viva, recibir pings del cliente
            data = await ws.receive_text()
            # Cliente puede enviar "ping" para mantener viva la conexión
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(user_id, ws)
