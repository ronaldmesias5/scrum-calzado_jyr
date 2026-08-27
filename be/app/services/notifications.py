"""
NotificationService — funciones síncronas para CRUD de notificaciones en BD.
Usa Session (síncrona), NO AsyncSession.

Todas las funciones reciben una sesión SQLAlchemy activa.
Las operaciones son atómicas (commit dentro de cada función).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, update, desc
from sqlalchemy.orm import Session

from app.models.notifications import Notification, NotificationType
from app.models.user import User


def create_notification(
    db: Session,
    user_id: uuid.UUID,
    title: str,
    message: str,
    type_: NotificationType = NotificationType.info,
    order_id: uuid.UUID | None = None,
    link_url: str | None = None,
    created_by: uuid.UUID | None = None,
) -> Notification:
    """
    Crea una nueva notificación en BD y hace commit.
    Retorna la notificación creada (refresheada).
    """
    notif = Notification(
        user_id=user_id,
        title_notification=title,
        message_notification=message,
        type_notification=type_,
        order_id=order_id,
        link_url=link_url,
        created_by=created_by,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def get_notifications(
    db: Session, user_id: uuid.UUID, limit: int = 50
) -> list[Notification]:
    """Obtiene las notificaciones activas de un usuario, ordenadas por fecha descendente."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id, Notification.deleted_at.is_(None))
        .order_by(desc(Notification.created_at))
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def get_unread_count(db: Session, user_id: uuid.UUID) -> int:
    """Cuenta las notificaciones no leídas de un usuario."""
    stmt = select(func.count(Notification.id)).where(
        Notification.user_id == user_id,
        Notification.is_read.is_(False),
        Notification.deleted_at.is_(None),
    )
    return db.execute(stmt).scalar() or 0


def mark_as_read(db: Session, notification_id: uuid.UUID, user_id: uuid.UUID) -> None:
    """Marca una notificación como leída."""
    stmt = (
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(is_read=True, updated_at=datetime.now(timezone.utc))
    )
    db.execute(stmt)
    db.commit()


def mark_all_as_read(db: Session, user_id: uuid.UUID) -> None:
    """Marca todas las notificaciones del usuario como leídas."""
    stmt = (
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True, updated_at=datetime.now(timezone.utc))
    )
    db.execute(stmt)
    db.commit()


def dismiss_notification(
    db: Session, notification_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    """Eliminación lógica (soft delete) de una notificación."""
    now = datetime.now(timezone.utc)
    stmt = (
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(deleted_at=now, updated_at=now)
    )
    db.execute(stmt)
    db.commit()


def get_jefes(db: Session) -> list[User]:
    """Obtiene todos los usuarios con ocupación 'jefe' y no eliminados."""
    stmt = select(User).where(
        User.occupation == "jefe",
        User.deleted_at.is_(None),
    )
    return list(db.execute(stmt).scalars().all())
