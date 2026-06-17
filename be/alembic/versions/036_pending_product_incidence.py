"""Create pending_product_incidences table for employee product incidences awaiting jefe approval

Revision ID: 036
Revises: 035
Create Date: 2026-06-17
"""
from alembic import op
import sqlalchemy as sa

revision = '036'
down_revision = '035'


def upgrade():
    op.create_table(
        'pending_product_incidences',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('employee_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False),
        sa.Column('task_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False),
        sa.Column('product_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False),
        sa.Column('size', sa.String(50), nullable=False),
        sa.Column('colour', sa.String(100), nullable=True),
        sa.Column('defect_code_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('defect_codes.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False),
        sa.Column('quantity', sa.Numeric(10, 2), nullable=False),
        sa.Column('observations', sa.Text, nullable=True),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='pending_incidence_status'), nullable=False, server_default='pending'),
        sa.Column('approved_type', sa.String(20), nullable=True),
        sa.Column('reviewed_by_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('loss_record_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('loss_records.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index('ix_pending_product_incidences_employee_id', 'pending_product_incidences', ['employee_id'])
    op.create_index('ix_pending_product_incidences_task_id', 'pending_product_incidences', ['task_id'])
    op.create_index('ix_pending_product_incidences_status', 'pending_product_incidences', ['status'])


def downgrade():
    op.drop_table('pending_product_incidences')
    op.execute("DROP TYPE pending_incidence_status")
