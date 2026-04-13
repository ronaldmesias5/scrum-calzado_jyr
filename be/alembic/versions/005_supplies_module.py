"""Add category and stock to supplies, create product_supplies linking table.

¿Qué?
  - Añade columna `category` (enum: corte, guarnicion, soladura, terminado, otros) a tabla supplies
  - Añade columna `stock_quantity` (Integer, default 0) a supplies
  - Crea tabla `product_supplies` para ligar productos con insumos requeridos
  
¿Para qué?
  - Clasificar insumos por tipo de proceso de fabricación
  - Controlar stock de insumos
  - Verificar si hay insumos suficientes para fabricar un producto pedido

Revision ID: 005_add_supplies_category_and_product_link
Revises: 004_seed_test_users
Create Date: 2026-04-12 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID, ENUM

revision: str = "005_supplies_module"
down_revision: Union[str, Sequence[str], None] = "004_seed_test_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Crear el tipo ENUM para categoría de insumos
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supply_category_type') THEN
                CREATE TYPE supply_category_type AS ENUM (
                    'corte', 'guarnicion', 'soladura', 'terminado', 'otros'
                );
            END IF;
        END $$;
    """)

    # 2. Añadir columnas a supplies
    op.add_column(
        "supplies",
        sa.Column(
            "category",
            ENUM(
                "corte", "guarnicion", "soladura", "terminado", "otros",
                name="supply_category_type",
                create_type=False,
            ),
            nullable=True,
            server_default=sa.text("'otros'"),
        ),
    )
    op.add_column(
        "supplies",
        sa.Column(
            "stock_quantity",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.add_column(
        "supplies",
        sa.Column("unit", sa.String(50), nullable=True, server_default=sa.text("'unidades'")),
    )

    # Hacer category NOT NULL después de agregar el valor por defecto
    op.execute("UPDATE supplies SET category = 'otros' WHERE category IS NULL")
    op.alter_column("supplies", "category", nullable=False)

    # 3. Crear tabla product_supplies (relación M:M productos ↔ insumos)
    op.create_table(
        "product_supplies",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("product_id", UUID(as_uuid=True), nullable=False),
        sa.Column("supply_id", UUID(as_uuid=True), nullable=False),
        sa.Column(
            "quantity_required",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("1"),
            comment="Cuántas unidades del insumo se necesitan por par/producto",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["supply_id"],
            ["supplies.id"],
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        sa.UniqueConstraint("product_id", "supply_id", name="uq_product_supply"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_supplies_product_id", "product_supplies", ["product_id"])
    op.create_index("ix_product_supplies_supply_id", "product_supplies", ["supply_id"])


def downgrade() -> None:
    op.drop_index("ix_product_supplies_supply_id", "product_supplies")
    op.drop_index("ix_product_supplies_product_id", "product_supplies")
    op.drop_table("product_supplies")
    op.drop_column("supplies", "unit")
    op.drop_column("supplies", "stock_quantity")
    op.drop_column("supplies", "category")
    op.execute("DROP TYPE IF EXISTS supply_category_type CASCADE")
