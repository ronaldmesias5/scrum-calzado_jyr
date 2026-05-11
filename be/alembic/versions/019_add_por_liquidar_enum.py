"""Add por_liquidar status to task_status enum.

Revision ID: 019_add_por_liquidar_enum
Revises: 018_product_task_prices
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '019_add_por_liquidar_enum'
down_revision = '018_product_task_prices'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add pendiente and por_liquidar to task_status enum
    # PostgreSQL requires ALTER TYPE ADD VALUE to be in a separate transaction
    # Alembic transactional DDL needs special handling
    op.execute("ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'pendiente'")
    op.execute("ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'por_liquidar'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values
    pass
