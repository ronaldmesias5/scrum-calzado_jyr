
"""Add vale_number and order_id to tasks.

Revision ID: 013_tasks_columns
Revises: 012_observations
Create Date: 2026-04-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '013_tasks_columns'
down_revision = '012_observations'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add columns to tasks table
    op.execute("""
        ALTER TABLE tasks 
        ADD COLUMN IF NOT EXISTS vale_number INTEGER,
        ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE tasks 
        DROP COLUMN IF EXISTS vale_number,
        DROP COLUMN IF EXISTS order_id
    """)
