"""Add line_group column to order_details table.

Revision ID: 021_line_group_order_details
Revises: 020_add_tasks_order_product
Create Date: 2026-05-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '021_line_group_order_details'
down_revision = '020_add_tasks_order_product'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE order_details
        ADD COLUMN IF NOT EXISTS line_group INTEGER NOT NULL DEFAULT 0
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE order_details
        DROP COLUMN IF EXISTS line_group
    """)
