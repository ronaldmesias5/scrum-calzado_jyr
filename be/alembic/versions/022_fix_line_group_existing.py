"""Reparar line_group para pedidos existentes con mismo product_id repetido.

Revision ID: 022_fix_line_group_existing
Revises: 021_line_group_order_details
Create Date: 2026-05-13 00:00:00.000000

"""
from alembic import op

revision = '022_fix_line_group_existing'
down_revision = '021_line_group_order_details'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Para cada pedido, detecta grupos de tallas del mismo product_id que comparten
    line_group=0 y les asigna valores únicos secuenciales (1, 2, 3...) dentro del
    mismo pedido, preservando la agrupación original por product_id.
    
    La lógica: dentro de cada order_id + product_id, todas las filas con el mismo
    line_group original pertenecen al mismo grupo. Si hay múltiples grupos del mismo
    producto (diferente numeración), se les asigna un line_group distinto a cada uno.
    
    Como no podemos distinguir automáticamente si dos filas del mismo producto con
    line_group=0 son del mismo grupo o de grupos distintos, asignamos un line_group
    único por cada fila individual. Esto es conservador: garantiza que no se mezclen,
    aunque puede separar más de lo necesario en pedidos antiguos.
    """
    op.execute("""
        WITH numbered AS (
            SELECT 
                id,
                order_id,
                product_id,
                line_group,
                ROW_NUMBER() OVER (
                    PARTITION BY order_id, product_id 
                    ORDER BY id
                ) AS rn
            FROM order_details
            WHERE line_group = 0
        )
        UPDATE order_details od
        SET line_group = n.rn
        FROM numbered n
        WHERE od.id = n.id
          AND od.line_group = 0
    """)


def downgrade() -> None:
    """Revertir: volver a poner line_group=0 no es seguro, se omite."""
    pass
