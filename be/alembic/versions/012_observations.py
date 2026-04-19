"""Add observations to order_details.

Revision ID: 012_observations
Revises: 011_global_stage
Create Date: 2026-04-16 13:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '012_observations'
down_revision = '011_global_stage'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add observations column if it doesn't exist
    op.execute("""
        ALTER TABLE order_details
        ADD COLUMN IF NOT EXISTS observations TEXT
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE order_details
        DROP COLUMN IF EXISTS observations
    """)
