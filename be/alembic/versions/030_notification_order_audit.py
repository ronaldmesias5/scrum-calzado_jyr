"""notification_order_audit

Revision ID: 030
Revises: 029_create_reactivation_tickets
Create Date: 2026-06-15

Agrega columnas a la tabla notifications:
  - order_id: referencia al pedido relacionado
  - link_url: enlace a la página de detalle

NOTA: created_by/updated_by/deleted_by ya existen en la BD
      desde la migración 001 (el modelo SQLAlchemy no los tenía).
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "030"
down_revision: Union[str, None] = "029_create_reactivation_tickets"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing = {c["name"] for c in inspector.get_columns("notifications")}

    if "order_id" not in existing:
        op.add_column(
            "notifications",
            sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        )
    if "link_url" not in existing:
        op.add_column(
            "notifications",
            sa.Column("link_url", sa.String(512), nullable=True),
        )

    existing_fks = {fk["name"] for fk in inspector.get_foreign_keys("notifications")}
    if "fk_notifications_order_id" not in existing_fks and "order_id" in existing:
        op.create_foreign_key(
            "fk_notifications_order_id",
            "notifications",
            "orders",
            ["order_id"],
            ["id"],
            ondelete="SET NULL",
        )

    existing_idxs = {ix["name"] for ix in inspector.get_indexes("notifications")}
    if "ix_notifications_order_id" not in existing_idxs:
        op.create_index(
            "ix_notifications_order_id", "notifications", ["order_id"]
        )


def downgrade() -> None:
    op.drop_index("ix_notifications_order_id", table_name="notifications")
    op.drop_constraint(
        "fk_notifications_order_id", "notifications", type_="foreignkey"
    )
    op.drop_column("notifications", "link_url")
    op.drop_column("notifications", "order_id")
