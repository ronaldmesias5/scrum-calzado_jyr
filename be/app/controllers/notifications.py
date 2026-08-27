"""Wrappers para `services.notifications` expuestos a routers.

Mantengo nombres compatibles con `services.notifications` para que los
`routers` puedan importarlos sin cambios en lógica.
"""

def create_notification_controller(db, user_id, title, message, **kwargs):
    from app.services.notifications import create_notification
    return create_notification(db=db, user_id=user_id, title=title, message=message, **kwargs)


def create_notification(db, user_id, title, message, **kwargs):
    return create_notification_controller(db, user_id, title, message, **kwargs)


def get_notifications(db, user_id, limit: int = 50):
    from app.services.notifications import get_notifications
    return get_notifications(db=db, user_id=user_id, limit=limit)


def get_unread_count(db, user_id):
    from app.services.notifications import get_unread_count
    return get_unread_count(db=db, user_id=user_id)


def mark_as_read(db, notification_id, user_id):
    from app.services.notifications import mark_as_read
    return mark_as_read(db=db, notification_id=notification_id, user_id=user_id)


def mark_all_as_read(db, user_id):
    from app.services.notifications import mark_all_as_read
    return mark_all_as_read(db=db, user_id=user_id)


def dismiss_notification(db, notification_id, user_id):
    from app.services.notifications import dismiss_notification
    return dismiss_notification(db=db, notification_id=notification_id, user_id=user_id)


def get_jefes(db):
    from app.services.notifications import get_jefes
    return get_jefes(db)

