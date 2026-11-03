# ════════════════════════════════════════
# 📄 Migración — Add unique constraint on inventory (product_id, size, colour) with dedupe
# ════════════════════════════════════════
# 039 | Revises: 038 | Creada: 2026-08-14
from alembic import op

revision = '039_inventory_unique_constraint'
down_revision = '038'


def upgrade():
    # 1) Normalizar colour NULL -> '' (mismo stock físico que colour '')
    op.execute("UPDATE inventory SET colour = '' WHERE colour IS NULL")

    # 2) Ranking de duplicados por (product_id, size, colour).
    #    La fila "maestra" es la más antigua activa (deleted_at IS NULL).
    op.execute(
        """
        CREATE TEMP TABLE inv_dups AS
        SELECT id,
               product_id,
               size,
               colour,
               amount,
               reserved,
               deleted_at,
               ROW_NUMBER() OVER (
                   PARTITION BY product_id, size, colour
                   ORDER BY (deleted_at IS NOT NULL), created_at, id
               ) AS rn,
               COUNT(*) OVER (PARTITION BY product_id, size, colour) AS cnt
        FROM inventory
        """
    )

    # 3) Sumar amount/reserved de los duplicados activos en la fila maestra
    op.execute(
        """
        UPDATE inventory inv
        SET amount = inv.amount + COALESCE(d.sum_amount, 0),
            reserved = inv.reserved + COALESCE(d.sum_reserved, 0)
        FROM (
            SELECT product_id,
                   size,
                   colour,
                   SUM(amount) FILTER (WHERE rn > 1 AND deleted_at IS NULL) AS sum_amount,
                   SUM(reserved) FILTER (WHERE rn > 1 AND deleted_at IS NULL) AS sum_reserved
            FROM inv_dups
            GROUP BY product_id, size, colour
            HAVING COUNT(*) > 1
        ) d
        WHERE inv.id IN (SELECT id FROM inv_dups WHERE rn = 1 AND deleted_at IS NULL)
          AND inv.product_id = d.product_id
          AND inv.size = d.size
          AND inv.colour = d.colour
        """
    )

    # 4) Soft-delete de los duplicados sobrantes (sin tocar su deleted_at previo)
    op.execute(
        """
        UPDATE inventory inv
        SET deleted_at = COALESCE(inv.deleted_at, NOW()),
            amount = 0,
            reserved = 0
        WHERE inv.id IN (SELECT id FROM inv_dups WHERE rn > 1)
        """
    )

    op.execute("DROP TABLE inv_dups")

    # 5) Unique constraint
    op.create_unique_constraint(
        'uq_inventory_product_size_colour',
        'inventory',
        ['product_id', 'size', 'colour'],
    )


def downgrade():
    op.drop_constraint(
        'uq_inventory_product_size_colour',
        'inventory',
        type_='unique',
    )