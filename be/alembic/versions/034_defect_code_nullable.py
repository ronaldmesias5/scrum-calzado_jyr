"""Make defect_code_id nullable on loss_records for non-product incidences

Revision ID: 034
Revises: 033
Create Date: 2026-06-16
"""
from alembic import op

revision = '034'
down_revision = '033'


def upgrade():
    op.alter_column('loss_records', 'defect_code_id', nullable=True)


def downgrade():
    op.alter_column('loss_records', 'defect_code_id', nullable=False)
