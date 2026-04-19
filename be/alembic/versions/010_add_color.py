"""Add color field to supply_categories.

Revision ID: 010_add_color
Revises: 009_create_supply_categories
Create Date: 2026-04-14 01:50:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '010_add_color'
down_revision = '009_create_supply_categories'
branch_labels = None
depends_on = None

# Color palette for supply categories
CATEGORY_COLORS = {
    'corte': 'amber',
    'guarnicion': 'blue',
    'soladura': 'purple',
    'terminado': 'green',
    'otros': 'gray',
}


def upgrade() -> None:
    # Add color column if it doesn't exist
    op.execute("""
        ALTER TABLE supply_categories
        ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT 'blue'
    """)
    
    # Update existing categories with predefined colors
    for category, color in CATEGORY_COLORS.items():
        op.execute(f"""
            UPDATE supply_categories
            SET color = '{color}'
            WHERE name = '{category}'
        """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE supply_categories
        DROP COLUMN IF EXISTS color
    """)
