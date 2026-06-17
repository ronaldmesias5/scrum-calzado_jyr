"""Make defect_code_id nullable and add description column on pending_product_incidences + loss_records

Revision ID: 037
Revises: 036
Create Date: 2026-06-17
"""
from alembic import op
import sqlalchemy as sa

revision = '037'
down_revision = '036'


def upgrade():
    # 1. Hacer defect_code_id nullable en pending_product_incidences
    op.alter_column('pending_product_incidences', 'defect_code_id', nullable=True)
    # 2. Agregar columna description en pending_product_incidences
    op.add_column('pending_product_incidences', sa.Column('description', sa.String(500), nullable=True))
    # 3. Agregar columna description en loss_records
    op.add_column('loss_records', sa.Column('description', sa.String(500), nullable=True))


def downgrade():
    op.drop_column('loss_records', 'description')
    op.drop_column('pending_product_incidences', 'description')
    op.alter_column('pending_product_incidences', 'defect_code_id', nullable=False)
