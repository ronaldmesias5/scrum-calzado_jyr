"""Add line_group column to tasks table.

Revision ID: 023_add_line_group_to_tasks
Revises: 022_fix_line_group_existing
Create Date: 2026-05-13 00:00:00.000000

"""
from alembic import op

revision = '023_add_line_group_to_tasks'
down_revision = '022_fix_line_group_existing'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS line_group INTEGER NOT NULL DEFAULT 0
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE tasks
        DROP COLUMN IF EXISTS line_group
    """)
