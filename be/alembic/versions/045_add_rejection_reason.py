"""Add rejection_reason to pending_product_incidences.

Adds a nullable String(500) column to store the jefe's written reason
when rejecting a product incidence. Backward-compatible: existing
rejected incidences will have NULL.

Revision ID: 045_add_rejection_reason
Revises: 044_create_database_views
Create Date: 2026-09-02
"""

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
