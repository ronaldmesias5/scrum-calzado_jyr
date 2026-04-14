"""Create supply_categories table.

Revision ID: 009_create_supply_categories
Revises: 008_product_supplies_float
Create Date: 2026-04-13 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '009_create_supply_categories'
down_revision = '008_product_supplies_float'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the supply_categories table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS supply_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    
    # Insert predefined categories (idempotent with ON CONFLICT)
    op.execute("""
        INSERT INTO supply_categories (name) VALUES 
            ('corte'), ('guarnicion'), ('soladura'), ('terminado'), ('otros')
        ON CONFLICT (name) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS supply_categories CASCADE")
