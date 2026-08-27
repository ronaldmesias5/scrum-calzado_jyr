"""Stubs para controlador del dashboard del jefe."""

def list_admin_orders(db, filters=None):
    from app.services.dashboard_jefe import get_recent_orders_data
    return get_recent_orders_data(db)


def get_recent_orders_data(db):
    from app.services.dashboard_jefe import get_recent_orders_data
    return get_recent_orders_data(db)


def get_metrics_data(db):
    from app.services.dashboard_jefe import get_metrics_data
    return get_metrics_data(db)


def get_alerts_data(db):
    from app.services.dashboard_jefe import get_alerts_data
    return get_alerts_data(db)
