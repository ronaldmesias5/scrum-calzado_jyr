"""product_supplies float quantities

Revision ID: 008_product_supplies_float
Revises: 007_supplies_float_sizes
Create Date: 2026-04-12 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '008_product_supplies_float'
down_revision: Union[str, None] = '007_supplies_float_sizes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Alter product_supplies quantity_required to Numeric(10, 4)
    op.alter_column(
        'product_supplies',
        'quantity_required',
        existing_type=sa.Integer(),
        type_=sa.Numeric(precision=10, scale=4),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'product_supplies',
        'quantity_required',
        existing_type=sa.Numeric(precision=10, scale=4),
        type_=sa.Integer(),
        existing_nullable=False,
    )
