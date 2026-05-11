"""Add task_prices column to products table.

Revision ID: 018_product_task_prices
Revises: 017_add_completed_at_to_tasks
Create Date: 2026-05-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '018_product_task_prices'
down_revision = '017_add_completed_at_to_tasks'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS task_prices JSONB NOT NULL DEFAULT '{}'::jsonb
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE products
        DROP COLUMN IF EXISTS task_prices
    """)
