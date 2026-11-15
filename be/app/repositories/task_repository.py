# ════════════════════════════════════════
# 📄 Acceso a datos de tareas de producción (Task)
# ════════════════════════════════════════

import uuid

from sqlalchemy import and_, desc, distinct, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.order import OrderDetail
from app.models.product import Product
from app.models.tasks import Task


class TaskRepository:
    """Consultas y mutaciones de Task. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def _pairs_subquery(filter_deleted: bool = False):
        """Subconsulta: total de pares por (order_id, product_id) desde OrderDetail."""
        query = select(
            OrderDetail.order_id,
            OrderDetail.product_id,
            func.sum(OrderDetail.amount).label("total"),
        )
        if filter_deleted:
            query = query.where(OrderDetail.deleted_at == None)
        return query.group_by(OrderDetail.order_id, OrderDetail.product_id).subquery()

    def order_ids_with_live_tasks(self, order_ids: list[uuid.UUID]) -> set[uuid.UUID]:
        """Ids de pedidos que tienen al menos una tarea viva (producción iniciada)."""
        if not order_ids:
            return set()
        rows = self.db.execute(
            select(distinct(Task.order_id)).where(
                Task.order_id.in_(order_ids), Task.deleted_at.is_(None)
            )
        ).all()
        return {row[0] for row in rows}

    def count_live_by_order(self, order_id: uuid.UUID) -> int:
        return (
            self.db.execute(
                select(func.count(Task.id)).where(
                    Task.order_id == order_id, Task.deleted_at.is_(None)
                )
            ).scalar()
            or 0
        )

    def count_pending_by_assignee(self, user_id: uuid.UUID) -> int:
        """Tareas asignadas no completadas ni canceladas."""
        return (
            self.db.execute(
                select(func.count(Task.id)).where(
                    Task.assigned_to == user_id,
                    Task.status.in_(["pendiente", "por_liquidar", "en_progreso"]),
                    Task.deleted_at.is_(None),
                )
            ).scalar()
            or 0
        )

    def count_completed_between(self, user_id: uuid.UUID, start, end) -> int:
        """Tareas completadas por el usuario dentro de un rango de fechas."""
        return (
            self.db.execute(
                select(func.count(Task.id)).where(
                    Task.assigned_to == user_id,
                    Task.status == "completado",
                    Task.completed_at >= start,
                    Task.completed_at <= end,
                    Task.deleted_at.is_(None),
                )
            ).scalar()
            or 0
        )

    def sum_amount_by_assignee(self, user_id: uuid.UUID) -> int:
        """Total de pares asignados al usuario, excluyendo tareas canceladas."""
        total = self.db.execute(
            select(func.coalesce(func.sum(Task.amount), 0)).where(
                Task.assigned_to == user_id,
                Task.status != "cancelado",
                Task.deleted_at.is_(None),
            )
        ).scalar()
        return int(total or 0)

    def max_vale_number(self) -> int:
        return self.db.execute(select(func.max(Task.vale_number))).scalar() or 0

    def add(self, task: Task) -> None:
        self.db.add(task)

    def get_live_by_id(self, task_id) -> Task | None:
        return self.db.execute(
            select(Task).where(Task.id == task_id, Task.deleted_at == None)
        ).scalar_one_or_none()

    def get_by_id_with_product(self, task_id) -> Task | None:
        query = select(Task).options(joinedload(Task.product)).where(Task.id == task_id)
        return self.db.execute(query).unique().scalar_one_or_none()

    def get_by_id_with_product_and_user(self, task_id) -> Task | None:
        query = select(Task).options(
            joinedload(Task.product), joinedload(Task.assigned_user)
        ).where(Task.id == task_id)
        return self.db.execute(query).unique().scalar_one_or_none()

    def get_vale_task(self, task_id) -> Task | None:
        query = (
            select(Task)
            .options(joinedload(Task.product).joinedload(Product.category))
            .where(Task.id == task_id, Task.deleted_at == None)
        )
        return self.db.execute(query).scalar_one_or_none()

    def list_all_with_totals(self, status=None, type_=None, assigned_to=None) -> list:
        """Todas las tareas vivas con el total de pares del pedido+producto (tuplas (Task, total))."""
        pairs_subquery = self._pairs_subquery(filter_deleted=True)
        query = (
            select(Task, pairs_subquery.c.total)
            .outerjoin(
                pairs_subquery,
                and_(
                    Task.order_id == pairs_subquery.c.order_id,
                    Task.product_id == pairs_subquery.c.product_id,
                ),
            )
            .options(joinedload(Task.product))
            .where(Task.deleted_at == None)
        )
        if status:
            query = query.where(Task.status == status)
        if type_:
            query = query.where(Task.type == type_)
        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)
        query = query.order_by(desc(Task.created_at))
        return self.db.execute(query).all()

    def list_by_order_with_totals(self, order_id, product_id=None) -> list:
        """Tareas vivas de un pedido con total de pares (tuplas (Task, total))."""
        pairs_subquery = self._pairs_subquery()
        query = (
            select(Task, pairs_subquery.c.total)
            .outerjoin(
                pairs_subquery,
                and_(
                    Task.order_id == pairs_subquery.c.order_id,
                    Task.product_id == pairs_subquery.c.product_id,
                ),
            )
            .options(joinedload(Task.product))
            .where(Task.order_id == order_id, Task.deleted_at == None)
        )
        if product_id:
            query = query.where(Task.product_id == product_id)
        return self.db.execute(query).all()

    def list_with_totals_by_ids(self, task_ids) -> list:
        """Recarga tareas por ids con total de pares y relaciones para serializar."""
        pairs_subquery = self._pairs_subquery()
        query = (
            select(Task, pairs_subquery.c.total)
            .outerjoin(
                pairs_subquery,
                and_(
                    Task.order_id == pairs_subquery.c.order_id,
                    Task.product_id == pairs_subquery.c.product_id,
                ),
            )
            .options(joinedload(Task.product), joinedload(Task.assigned_user))
            .where(Task.id.in_(task_ids))
        )
        return self.db.execute(query).unique().all()

    def list_active_by_order(self, order_id) -> list[Task]:
        return (
            self.db.execute(
                select(Task).where(
                    Task.order_id == order_id,
                    Task.status != 'cancelado',
                    Task.deleted_at == None,
                )
            )
            .scalars()
            .all()
        )

    def min_vale_map_by_order(self, order_id) -> list:
        """(product_id, line_group, vale_number mínimo) por grupo de línea del pedido."""
        return self.db.execute(
            select(Task.product_id, Task.line_group, func.min(Task.vale_number))
            .where(
                Task.order_id == order_id,
                Task.vale_number.isnot(None),
            )
            .group_by(Task.product_id, Task.line_group)
        ).all()

    def find_active_next(self, order_id, product_id, line_group, next_type) -> Task | None:
        """Tarea activa de la siguiente etapa para el mismo pedido+producto+línea."""
        return self.db.execute(
            select(Task).where(
                Task.order_id == order_id,
                Task.product_id == product_id,
                Task.line_group == line_group,
                Task.type == next_type,
                Task.status != 'cancelado',
                Task.deleted_at == None,
            )
        ).scalar_one_or_none()

    def list_assigned_to(self, user_id, status=None, type_=None) -> list[Task]:
        """Tareas vivas asignadas a un empleado, con producto/categoría y asignado cargados."""
        query = (
            select(Task)
            .options(
                joinedload(Task.product).joinedload(Product.category),
                joinedload(Task.assigned_user),
            )
            .where(Task.assigned_to == user_id, Task.deleted_at == None)
        )
        if status:
            query = query.where(Task.status == status)
        if type_:
            query = query.where(Task.type == type_)
        query = query.order_by(desc(Task.created_at))
        return self.db.execute(query).scalars().unique().all()

    def list_available(self, task_type) -> list[Task]:
        """Tareas pendientes sin asignar del tipo dado."""
        query = (
            select(Task)
            .options(joinedload(Task.product).joinedload(Product.category))
            .where(
                Task.assigned_to == None,
                Task.type == task_type,
                Task.status == 'pendiente',
                Task.deleted_at == None,
            )
            .order_by(desc(Task.created_at))
        )
        return self.db.execute(query).scalars().unique().all()

    def list_by_order_product_linegroup(self, order_id, product_id, line_group) -> list[Task]:
        """Tareas vivas del mismo pedido+producto+línea, ordenadas por creación (vale)."""
        return (
            self.db.execute(
                select(Task)
                .options(joinedload(Task.assigned_user))
                .where(
                    Task.order_id == order_id,
                    Task.product_id == product_id,
                    Task.line_group == line_group,
                    Task.deleted_at == None,
                )
                .order_by(Task.created_at)
            )
            .scalars()
            .all()
        )
