"""Add evidence_image_url to pending_product_incidences.

Adds a nullable String(500) column to store the URL of an optional
photographic evidence image uploaded by the reporter (employee or customer).

Revision ID: 046_add_evidence_image_to_pending_incidences
Revises: 045_add_rejection_reason_to_pending_incidences
Create Date: 2026-09-03
"""

from alembic import op
import sqlalchemy as sa

revision = "046_add_evidence_image_to_pending_incidences"
down_revision = "045_add_rejection_reason_to_pending_incidences"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "pending_product_incidences",
        sa.Column("evidence_image_url", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pending_product_incidences", "evidence_image_url")
