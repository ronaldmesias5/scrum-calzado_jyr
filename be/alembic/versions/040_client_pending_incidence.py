"""Add customer/order/order_detail columns and make task nullable on pending_product_incidences

Revision ID: 040_client_pending_incidence
Revises: 039_inventory_unique_constraint
Create Date: 2026-08-16

Contexto:
  - Soporta el flujo de incidencias del cliente: un cliente reporta un
    reclamo sobre un producto de un pedido ya entregado.
  - Para eso `employee_id` y `task_id` pasan a nullable (el cliente no
    tiene tarea), y se agregan `customer_id`, `order_id` y
    `order_detail_id` para vincular el reclamo al pedido.
"""
from alembic import op
import sqlalchemy as sa

revision = '040_client_pending_incidence'
down_revision = '039_inventory_unique_constraint'


def upgrade():
    # 1) employee_id nullable (cliente reporta sin empleado)
    op.alter_column('pending_product_incidences', 'employee_id', nullable=True)
    # 2) task_id nullable (cliente reporta sin tarea)
    op.alter_column('pending_product_incidences', 'task_id', nullable=True)

    # 3) Nuevas columnas de vinculación al pedido del cliente
    op.add_column(
        'pending_product_incidences',
        sa.Column(
            'customer_id',
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey('users.id', ondelete='RESTRICT', onupdate='CASCADE'),
            nullable=True,
        ),
    )
    op.add_column(
        'pending_product_incidences',
        sa.Column(
            'order_id',
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey('orders.id', ondelete='RESTRICT', onupdate='CASCADE'),
            nullable=True,
        ),
    )
    op.add_column(
        'pending_product_incidences',
        sa.Column(
            'order_detail_id',
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey('order_details.id', ondelete='RESTRICT', onupdate='CASCADE'),
            nullable=True,
        ),
    )

    op.create_index('ix_pending_product_incidences_customer_id', 'pending_product_incidences', ['customer_id'])
    op.create_index('ix_pending_product_incidences_order_id', 'pending_product_incidences', ['order_id'])


def downgrade():
    op.drop_index('ix_pending_product_incidences_order_id', table_name='pending_product_incidences')
    op.drop_index('ix_pending_product_incidences_customer_id', table_name='pending_product_incidences')
    op.drop_column('pending_product_incidences', 'order_detail_id')
    op.drop_column('pending_product_incidences', 'order_id')
    op.drop_column('pending_product_incidences', 'customer_id')
    op.alter_column('pending_product_incidences', 'task_id', nullable=False)
    op.alter_column('pending_product_incidences', 'employee_id', nullable=False)