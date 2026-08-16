"""Stubs para controlador del dashboard del empleado."""


def list_employee_tasks(db, employee_id):
    from app.services.dashboard_empleado import list_tasks_for_employee

    return list_tasks_for_employee(db=db, employee_id=employee_id)


def create_pending_incidence(
    db,
    employee_id,
    task_id,
    size,
    colour,
    defect_code_id=None,
    description=None,
    quantity=1,
    observations=None,
):
    from app.services.dashboard_empleado_pending import create_pending_incidence

    return create_pending_incidence(
        db=db,
        employee_id=employee_id,
        task_id=task_id,
        size=size,
        colour=colour,
        defect_code_id=defect_code_id,
        description=description,
        quantity=quantity,
        observations=observations,
    )


def get_employee_pending_incidences(db, employee_id):
    from app.services.dashboard_empleado_pending import get_employee_pending_incidences

    return get_employee_pending_incidences(db=db, employee_id=employee_id)


def get_all_pending_incidences(db, status_filter: str | None = None):
    from app.services.dashboard_empleado_pending import get_all_pending_incidences

    return get_all_pending_incidences(db=db, status_filter=status_filter)


def approve_pending_incidence(db, pending_id, jefe_id, incident_type):
    from app.services.dashboard_empleado_pending import approve_pending_incidence

    return approve_pending_incidence(
        db=db, pending_id=pending_id, jefe_id=jefe_id, incident_type=incident_type
    )


def reject_pending_incidence(db, pending_id, jefe_id, reason=None):
    from app.services.dashboard_empleado_pending import reject_pending_incidence

    return reject_pending_incidence(db=db, pending_id=pending_id, jefe_id=jefe_id)


def create_customer_pending_incidence(
    db,
    customer_id,
    order_id,
    order_detail_id,
    size,
    colour=None,
    defect_code_id=None,
    description=None,
    quantity=1,
    observations=None,
):
    from app.services.dashboard_empleado_pending import create_customer_pending_incidence

    return create_customer_pending_incidence(
        db=db,
        customer_id=customer_id,
        order_id=order_id,
        order_detail_id=order_detail_id,
        size=size,
        colour=colour,
        defect_code_id=defect_code_id,
        description=description,
        quantity=quantity,
        observations=observations,
    )


def get_customer_pending_incidences(db, customer_id):
    from app.services.dashboard_empleado_pending import get_customer_pending_incidences

    return get_customer_pending_incidences(db=db, customer_id=customer_id)


def get_task_type_for_occupation(occupation: str | None) -> str | None:
    from app.services.dashboard_empleado import get_task_type_for_occupation as _g

    return _g(occupation)
