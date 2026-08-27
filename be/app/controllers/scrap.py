"""Wrappers para `services.scrap` expuestos a routers.

Permiten migrar imports de `routers` a `controllers` sin cambiar los nombres
de las funciones usadas en los routers.
"""


def register_incident_controller(db, **kwargs):
    from app.services.scrap import register_incident
    return register_incident(db=db, **kwargs)


def register_incident(db, **kwargs):
    return register_incident_controller(db, **kwargs)


def get_defect_codes(db):
    from app.services.scrap import get_defect_codes
    return get_defect_codes(db)


def create_defect_code(db, code, name, description=None):
    from app.services.scrap import create_defect_code
    return create_defect_code(db, code, name, description)


def get_incidents(db, **filters):
    from app.services.scrap import get_incidents
    return get_incidents(db, **filters)


def get_incident_by_id(db, incident_id):
    from app.services.scrap import get_incident_by_id
    return get_incident_by_id(db, incident_id)


def repair_incident(db, loss_id, user_id, repair_destination):
    from app.services.scrap import repair_incident
    return repair_incident(db, loss_id, user_id, repair_destination)


def solve_incident(db, loss_id, user_id):
    from app.services.scrap import solve_incident
    return solve_incident(db, loss_id, user_id)


def approve_loss(db, loss_id, user_id):
    from app.services.scrap import approve_loss
    return approve_loss(db, loss_id, user_id)


def reject_loss(db, loss_id, user_id):
    from app.services.scrap import reject_loss
    return reject_loss(db, loss_id, user_id)


def get_scrap_stock(db):
    from app.services.scrap import get_scrap_stock
    return get_scrap_stock(db)

