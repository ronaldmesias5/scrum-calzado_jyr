# ════════════════════════════════════════
# 📄 Migración — Add rejection_reason to pending_product_incidences
# ════════════════════════════════════════
# 045_add_rejection_reason | Revises: 044_create_database_views | Creada: 2026-09-02

from alembic import op
import sqlalchemy as sa

revision = "045_add_rejection_reason"
down_revision = "044_create_database_views"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "pending_product_incidences",
        sa.Column("rejection_reason", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pending_product_incidences", "rejection_reason")
