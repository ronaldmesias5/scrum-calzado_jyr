"""Add order_id, product_id, vale_number, and amount columns to tasks table.

Revision ID: 020_add_tasks_order_product
Revises: 019_add_por_liquidar_enum
Create Date: 2026-05-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '020_add_tasks_order_product'
down_revision = '019_add_por_liquidar_enum'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
        ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
        ADD COLUMN IF NOT EXISTS vale_number INTEGER,
        ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_tasks_order_id ON tasks (order_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tasks_product_id ON tasks (product_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tasks_vale_number ON tasks (vale_number)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_tasks_vale_number")
    op.execute("DROP INDEX IF EXISTS ix_tasks_product_id")
    op.execute("DROP INDEX IF EXISTS ix_tasks_order_id")
    op.execute("""
        ALTER TABLE tasks
        DROP COLUMN IF EXISTS amount,
        DROP COLUMN IF EXISTS vale_number,
        DROP COLUMN IF EXISTS product_id,
        DROP COLUMN IF EXISTS order_id
    """)
