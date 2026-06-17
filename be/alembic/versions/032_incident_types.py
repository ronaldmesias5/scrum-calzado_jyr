"""Add incident_type, order linking, and repair tracking to loss_records

Revision ID: 032
Revises: 031
Create Date: 2026-06-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '032'
down_revision = '031'

def upgrade():
    # Add incident_type column
    op.add_column('loss_records', sa.Column('incident_type', sa.String(20), nullable=False, server_default='perdida'))
    # Migrate existing data: map old status to incident_type
    op.execute("UPDATE loss_records SET incident_type = 'perdida'")
    # Drop old status column and its index
    op.drop_index('ix_loss_records_status', table_name='loss_records', if_exists=True)
    op.drop_column('loss_records', 'status')
    # Add order linking columns
    op.add_column('loss_records', sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('loss_records', sa.Column('order_detail_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('loss_records', sa.Column('line_group', sa.Integer(), nullable=True))
    # Add repair tracking
    op.add_column('loss_records', sa.Column('repaired_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('loss_records', sa.Column('repaired_by_id', postgresql.UUID(as_uuid=True), nullable=True))
    # Foreign keys
    op.create_foreign_key('fk_loss_records_order_id', 'loss_records', 'orders', ['order_id'], ['id'])
    op.create_foreign_key('fk_loss_records_order_detail_id', 'loss_records', 'order_details', ['order_detail_id'], ['id'])
    op.create_foreign_key('fk_loss_records_repaired_by_id', 'loss_records', 'users', ['repaired_by_id'], ['id'])
    op.create_index('ix_loss_records_order_id', 'loss_records', ['order_id'])
    op.create_index('ix_loss_records_incident_type', 'loss_records', ['incident_type'])


def downgrade():
    op.drop_index('ix_loss_records_incident_type', table_name='loss_records')
    op.drop_index('ix_loss_records_order_id', table_name='loss_records')
    op.drop_constraint('fk_loss_records_repaired_by_id', 'loss_records')
    op.drop_constraint('fk_loss_records_order_detail_id', 'loss_records')
    op.drop_constraint('fk_loss_records_order_id', 'loss_records')
    op.drop_column('loss_records', 'repaired_by_id')
    op.drop_column('loss_records', 'repaired_at')
    op.drop_column('loss_records', 'line_group')
    op.drop_column('loss_records', 'order_detail_id')
    op.drop_column('loss_records', 'order_id')
    op.add_column('loss_records', sa.Column('status', sa.String(20), nullable=False, server_default='approved'))
    op.create_index('ix_loss_records_status', 'loss_records', ['status'])
    op.drop_column('loss_records', 'incident_type')
