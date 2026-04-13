"""Add color and custom category to supplies

Revision ID: 006_supplies_custom
Revises: 005_supplies_module
Create Date: 2026-04-12 19:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = '006_supplies_color_category'
down_revision: Union[str, Sequence[str], None] = '005_supplies_module'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add color
    op.add_column('supplies', sa.Column('color', sa.String(length=50), nullable=True))
    
    # Change category to string
    op.execute("ALTER TABLE supplies ALTER COLUMN category DROP DEFAULT")
    op.execute("ALTER TABLE supplies ALTER COLUMN category TYPE VARCHAR(50) USING category::VARCHAR(50)")
    op.execute("ALTER TABLE supplies ALTER COLUMN category SET DEFAULT 'otros'")
    
    # Optionally drop the enum type if it isn't used elsewhere
    op.execute("DROP TYPE IF EXISTS supply_category_type CASCADE")


def downgrade() -> None:
    op.drop_column('supplies', 'color')
    
    op.execute("CREATE TYPE supply_category_type AS ENUM ('corte', 'guarnicion', 'soladura', 'terminado', 'otros')")
    op.execute("ALTER TABLE supplies ALTER COLUMN category DROP DEFAULT")
    op.execute("ALTER TABLE supplies ALTER COLUMN category TYPE supply_category_type USING category::supply_category_type")
    op.execute("ALTER TABLE supplies ALTER COLUMN category SET DEFAULT 'otros'")
