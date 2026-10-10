"""Add performance indexes on hot filter columns.

¿Qué? Índices btree en columnas de filtro frecuente (state, status, FKs, fechas)
    e índice GIN trigram en products.name_product para búsquedas ILIKE.
¿Para qué? Eliminar sequential scans en listados de pedidos, tareas, notificaciones,
    incidencias, catálogo y reportes cuando crezca el volumen de datos.
¿Impacto? Sin esta migración las consultas filtradas hacen seq scans completos.

Revision ID: 050_perf_indexes
Revises: 049_client_prices
Create Date: 2026-10-09
"""

from typing import Sequence

from alembic import op

revision: str = "050_perf_indexes"
down_revision: str | Sequence[str] | None = "049_client_prices"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _idx(name: str, table: str, cols: list[str], unique: bool = False) -> None:
    op.create_index(
        name,
        table,
        cols,
        unique=unique,
        if_not_exists=True,
        postgresql_using="btree",
    )


def upgrade() -> None:
    # ── orders: filtros de estado, calendario (delivery_date) y reportes mensuales ──
    _idx("ix_orders_state", "orders", ["state"])
    _idx("ix_orders_delivery_date", "orders", ["delivery_date"])
    _idx("ix_orders_creation_date", "orders", ["creation_date"])

    # ── tasks: dashboards de empleado (assigned_to + status), listados por pedido/producto ──
    op.create_index(
        "ix_tasks_assigned_status",
        "tasks",
        ["assigned_to", "status"],
        if_not_exists=True,
    )
    _idx("ix_tasks_status", "tasks", ["status"])
    _idx("ix_tasks_order_id", "tasks", ["order_id"])
    _idx("ix_tasks_product_id", "tasks", ["product_id"])
    _idx("ix_tasks_created_at", "tasks", ["created_at"])

    # ── notifications: panel y badge de no leídas por usuario ──
    op.create_index(
        "ix_notifications_user_unread",
        "notifications",
        ["user_id", "is_read"],
        if_not_exists=True,
    )

    # ── incidence: joins con tasks y conteos de abiertas en dashboards ──
    _idx("ix_incidence_task_id", "incidence", ["task_id"])
    _idx("ix_incidence_state", "incidence", ["state"])

    # ── pending_product_incidences: lista de pendientes del jefe ──
    _idx("ix_pending_product_incidences_status", "pending_product_incidences", ["status"])

    # ── products: filtros del catálogo por estilo/marca/categoría ──
    _idx("ix_products_style_id", "products", ["style_id"])
    _idx("ix_products_brand_id", "products", ["brand_id"])
    _idx("ix_products_category_id", "products", ["category_id"])

    # Búsqueda ILIKE '%patrón%' del catálogo y del chatbot (pg_trgm ya instalado en init.sql)
    op.create_index(
        "ix_products_name_trgm",
        "products",
        ["name_product"],
        if_not_exists=True,
        postgresql_using="gin",
        postgresql_ops={"name_product": "gin_trgm_ops"},
    )

    # ── loss_records / scrap_stock: filtros del módulo de scrap ──
    _idx("ix_loss_records_product_id", "loss_records", ["product_id"])
    _idx("ix_loss_records_incident_type", "loss_records", ["incident_type"])
    _idx("ix_scrap_stock_product_id", "scrap_stock", ["product_id"])

    # ── vale: lookup de comprobantes por pedido ──
    _idx("ix_vale_order_id", "vale", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_vale_order_id", table_name="vale", if_exists=True)
    op.drop_index("ix_scrap_stock_product_id", table_name="scrap_stock", if_exists=True)
    op.drop_index("ix_loss_records_incident_type", table_name="loss_records", if_exists=True)
    op.drop_index("ix_loss_records_product_id", table_name="loss_records", if_exists=True)
    op.drop_index("ix_products_name_trgm", table_name="products", if_exists=True)
    op.drop_index("ix_products_category_id", table_name="products", if_exists=True)
    op.drop_index("ix_products_brand_id", table_name="products", if_exists=True)
    op.drop_index("ix_products_style_id", table_name="products", if_exists=True)
    op.drop_index(
        "ix_pending_product_incidences_status",
        table_name="pending_product_incidences",
        if_exists=True,
    )
    op.drop_index("ix_incidence_state", table_name="incidence", if_exists=True)
    op.drop_index("ix_incidence_task_id", table_name="incidence", if_exists=True)
    op.drop_index("ix_notifications_user_unread", table_name="notifications", if_exists=True)
    op.drop_index("ix_tasks_created_at", table_name="tasks", if_exists=True)
    op.drop_index("ix_tasks_product_id", table_name="tasks", if_exists=True)
    op.drop_index("ix_tasks_order_id", table_name="tasks", if_exists=True)
    op.drop_index("ix_tasks_status", table_name="tasks", if_exists=True)
    op.drop_index("ix_tasks_assigned_status", table_name="tasks", if_exists=True)
    op.drop_index("ix_orders_creation_date", table_name="orders", if_exists=True)
    op.drop_index("ix_orders_delivery_date", table_name="orders", if_exists=True)
    op.drop_index("ix_orders_state", table_name="orders", if_exists=True)
