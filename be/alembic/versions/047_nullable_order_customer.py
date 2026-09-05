"""Make orders.customer_id nullable for stock production.

Permite crear pedidos sin cliente (customer_id NULL) para fabricar
pares que van directo al stock en bodega en temporada alta.

Revision ID: 047_nullable_order_customer
Revises: 046_add_evidence_image
Create Date: 2026-09-04
"""

from alembic import op
import sqlalchemy as sa

revision = "047_nullable_order_customer"
down_revision = "046_add_evidence_image"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "orders",
        "customer_id",
        existing_type=sa.UUID(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "orders",
        "customer_id",
        existing_type=sa.UUID(),
        nullable=False,
    )
