"""Add incidence_category, machinery_name, supply_id to loss_records; make product_id and size nullable

Revision ID: 033
Revises: 032
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '033'
down_revision = '032'


def upgrade():
    # Add incidence_category column (default 'producto' for existing rows)
    op.add_column('loss_records', sa.Column('incidence_category', sa.String(20), nullable=False, server_default='producto'))

    # Add machinery_name column
    op.add_column('loss_records', sa.Column('machinery_name', sa.String(255), nullable=True))

    # Add supply_id column
    op.add_column('loss_records', sa.Column('supply_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Make product_id nullable (existing rows have product_id, new non-product rows won't)
    op.alter_column('loss_records', 'product_id', nullable=True)

    # Make size nullable
    op.alter_column('loss_records', 'size', nullable=True)

    # Foreign key for supply_id
    op.create_foreign_key('fk_loss_records_supply_id', 'loss_records', 'supplies', ['supply_id'], ['id'])

    # Index for incidence_category
    op.create_index('ix_loss_records_incidence_category', 'loss_records', ['incidence_category'])


def downgrade():
    op.drop_index('ix_loss_records_incidence_category', table_name='loss_records')
    op.drop_constraint('fk_loss_records_supply_id', 'loss_records')
    op.drop_column('loss_records', 'supply_id')
    op.drop_column('loss_records', 'machinery_name')
    op.alter_column('loss_records', 'size', nullable=False)
    op.alter_column('loss_records', 'product_id', nullable=False)
    op.drop_column('loss_records', 'incidence_category')
