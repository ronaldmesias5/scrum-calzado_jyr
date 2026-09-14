"""Add client_prices table and unit_price on order_details.

¿Qué? Tabla de precios personalizados por cliente y columna unit_price en order_details.
¿Para qué? El jefe asigna precios por cliente; al crear pedido se autorellena el precio.
¿Impacto? Sin esta migración no hay precios personalizados. unit_price default 0.

Revision ID: 049_client_prices
Revises: 048_add_pgvector_ai_embeddings
Create Date: 2026-09-13
"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "049_client_prices"
down_revision: str | Sequence[str] | None = "048_add_pgvector_ai_embeddings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── Tabla client_prices ──
    op.create_table(
        "client_prices",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("client_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("product_id", UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False, comment="Precio unitario COP para este cliente"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("client_id", "product_id", name="uq_client_product_price"),
    )

    # ── Columna unit_price en order_details ──
    op.add_column(
        "order_details",
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=True, comment="Precio unitario al momento del pedido"),
    )


def downgrade() -> None:
    op.drop_column("order_details", "unit_price")
    op.drop_table("client_prices")
