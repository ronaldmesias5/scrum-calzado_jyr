"""supplies float and sizes

Revision ID: 007_supplies_float_sizes
Revises: 006_supplies_color_category
Create Date: 2026-04-12 20:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = '007_supplies_float_sizes'
down_revision: Union[str, None] = '006_supplies_color_category'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Alter supplies stock_quantity to Numeric(10, 2)
    op.alter_column(
        'supplies',
        'stock_quantity',
        existing_type=sa.Integer(),
        type_=sa.Numeric(precision=10, scale=2),
        existing_nullable=False
    )
    # 2. Alter supplies_movement amount to Numeric(10, 2)
    op.alter_column(
        'supplies_movement',
        'amount',
        existing_type=sa.Integer(),
        type_=sa.Numeric(precision=10, scale=2),
        existing_nullable=False
    )
    # 3. Add sizes column to supplies
    op.add_column('supplies', sa.Column('sizes', JSONB(), nullable=True))
    # 4. Add sizes column to supplies_movement
    op.add_column('supplies_movement', sa.Column('sizes', JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column('supplies_movement', 'sizes')
    op.drop_column('supplies', 'sizes')
    
    op.alter_column(
        'supplies_movement',
        'amount',
        existing_type=sa.Numeric(precision=10, scale=2),
        type_=sa.Integer(),
        existing_nullable=False
    )
    
    op.alter_column(
        'supplies',
        'stock_quantity',
        existing_type=sa.Numeric(precision=10, scale=2),
        type_=sa.Integer(),
        existing_nullable=False
    )
