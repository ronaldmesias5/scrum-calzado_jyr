"""Crear vistas de base de datos para reportes y alertas.

Crea tres vistas SQL en PostgreSQL que agregan datos de negocio para
cumplir el requisito del sistema: "Existen vistas, procedimientos
almacenados y/o consultas agregadas según necesidad del sistema".

Vistas creadas:
  - v_customer_order_summary: resumen de pedidos por cliente.
  - v_low_inventory_alert: alerta de inventario bajo / sin stock.
  - v_employee_performance: rendimiento de empleados por tareas.

Se usa CREATE OR REPLACE VIEW para idempotencia.

Revision ID: 044_create_database_views
Revises: 043_email_verification_tokens
Create Date: 2026-08-31
"""

from alembic import op

revision = "044_create_database_views"
down_revision = "043_task_priority_remove_media"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Vista 1: Resumen de pedidos por cliente ──────────────────────────
    op.execute("""
        CREATE OR REPLACE VIEW v_customer_order_summary AS
        SELECT
            u.id AS customer_id,
            u.email,
            u.name_user,
            u.last_name,
            u.business_name,
            COUNT(o.id) AS total_orders,
            COALESCE(SUM(o.total_pairs), 0) AS total_pairs,
            COUNT(CASE WHEN o.state = 'pendiente' THEN 1 END) AS pending_orders,
            COUNT(CASE WHEN o.state = 'en_progreso' THEN 1 END) AS in_progress_orders,
            COUNT(CASE WHEN o.state = 'completado' THEN 1 END) AS completed_orders,
            COUNT(CASE WHEN o.state = 'entregado' THEN 1 END) AS delivered_orders,
            COUNT(CASE WHEN o.state = 'cancelado' THEN 1 END) AS cancelled_orders,
            MAX(o.created_at) AS last_order_date
        FROM users u
        LEFT JOIN orders o ON o.customer_id = u.id AND o.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, u.email, u.name_user, u.last_name, u.business_name;
    """)

    # ── Vista 2: Alerta de inventario bajo ────────────────────────────────
    op.execute("""
        CREATE OR REPLACE VIEW v_low_inventory_alert AS
        SELECT
            i.id AS inventory_id,
            p.id AS product_id,
            p.name_product,
            b.name_brand,
            c.name_category,
            i.size,
            i.colour,
            i.amount AS current_stock,
            i.reserved,
            (i.amount - i.reserved) AS available_stock,
            i.minimum_stock,
            CASE
                WHEN (i.amount - i.reserved) <= 0 THEN 'SIN STOCK'
                WHEN (i.amount - i.reserved) <= i.minimum_stock THEN 'STOCK BAJO'
                ELSE 'OK'
            END AS stock_status
        FROM inventory i
        JOIN products p ON p.id = i.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE (i.amount - i.reserved) <= i.minimum_stock
          AND p.deleted_at IS NULL;
    """)

    # ── Vista 3: Rendimiento de empleados ─────────────────────────────────
    op.execute("""
        CREATE OR REPLACE VIEW v_employee_performance AS
        SELECT
            u.id AS employee_id,
            u.email,
            u.name_user,
            u.last_name,
            u.occupation,
            COUNT(t.id) AS total_tasks,
            COUNT(CASE WHEN t.status = 'completado' THEN 1 END) AS completed_tasks,
            COUNT(CASE WHEN t.status = 'en_progreso' THEN 1 END) AS in_progress_tasks,
            COUNT(CASE WHEN t.status = 'pendiente' THEN 1 END) AS pending_tasks,
            COALESCE(SUM(t.amount), 0) AS total_pairs_produced,
            MIN(t.created_at) AS first_task_date,
            MAX(t.completed_at) AS last_completed_date
        FROM users u
        LEFT JOIN tasks t ON t.assigned_to = u.id AND t.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
          AND u.occupation IS NOT NULL
        GROUP BY u.id, u.email, u.name_user, u.last_name, u.occupation;
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS v_employee_performance;")
    op.execute("DROP VIEW IF EXISTS v_low_inventory_alert;")
    op.execute("DROP VIEW IF EXISTS v_customer_order_summary;")