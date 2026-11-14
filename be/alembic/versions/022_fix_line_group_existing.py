# ════════════════════════════════════════
# 📄 Migración — Reparar line_group para pedidos existentes con mismo product_id repetido
# ════════════════════════════════════════
# 022_fix_line_group_existing | Revises: 021_line_group_order_details | Creada: 2026-05-13 00:00:00.000000
from alembic import op

revision = '022_fix_line_group_existing'
down_revision = '021_line_group_order_details'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Para cada pedido, detecta grupos de tallas del mismo product_id que comparten"""
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
