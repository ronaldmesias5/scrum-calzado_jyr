"""Add custom_supply_name column to loss_records for free-text supply names

Revision ID: 035
Revises: 034
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = '035'
down_revision = '034'


def upgrade():
    op.add_column('loss_records', sa.Column('custom_supply_name', sa.String(255), nullable=True))


def downgrade():
    op.drop_column('loss_records', 'custom_supply_name')