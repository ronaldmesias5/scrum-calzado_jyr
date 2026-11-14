# ════════════════════════════════════════
# 📄 Migración — Make orders.customer_id nullable for stock production
# ════════════════════════════════════════
# 047_nullable_order_customer | Revises: 046_add_evidence_image | Creada: 2026-09-04

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
