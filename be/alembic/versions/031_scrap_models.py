"""scrap_models

Revision ID: 031
Revises: 030
Create Date: 2026-06-15

Crea tablas para registro de pérdidas por calzado defectuoso:
  - defect_codes: códigos de defecto (DEF-FAB, DEF-ALM, etc.)
  - loss_records: registros de pérdida
  - scrap_stock: stock de scrap generado por pérdidas
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "031"
down_revision: Union[str, None] = "030"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # ────────────────────────────
    # 1. defect_codes
    # ────────────────────────────
    if "defect_codes" not in existing_tables:
        op.create_table(
            "defect_codes",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("code", sa.String(50), unique=True, nullable=False),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("description", sa.Text, nullable=True),
            sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )
    else:
        # Verificar columnas existentes y agregar las que falten
        existing_cols = {c["name"] for c in inspector.get_columns("defect_codes")}
        if "is_active" not in existing_cols:
            op.add_column("defect_codes", sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")))

    # ────────────────────────────
    # 2. loss_records
    # ────────────────────────────
    if "loss_records" not in existing_tables:
        op.create_table(
            "loss_records",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False),
            sa.Column("size", sa.String(50), nullable=False),
            sa.Column("colour", sa.String(100), nullable=True),
            sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
            sa.Column("defect_code_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("defect_codes.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False),
            sa.Column("reason", sa.Text, nullable=True),
            sa.Column("observations", sa.Text, nullable=True),
            sa.Column("status", sa.String(20), nullable=False, server_default="approved"),
            sa.Column("registered_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False),
            sa.Column("approved_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True),
            sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )
    else:
        # Verificar columnas y FKs existentes
        existing_cols = {c["name"] for c in inspector.get_columns("loss_records")}
        existing_fks = {fk["name"] for fk in inspector.get_foreign_keys("loss_records")}

        if "defect_code_id" not in existing_cols:
            op.add_column("loss_records", sa.Column("defect_code_id", postgresql.UUID(as_uuid=True), nullable=False))
            op.create_foreign_key("fk_loss_records_defect_code_id", "loss_records", "defect_codes", ["defect_code_id"], ["id"], ondelete="RESTRICT")

        if "approved_by_id" not in existing_cols:
            op.add_column("loss_records", sa.Column("approved_by_id", postgresql.UUID(as_uuid=True), nullable=True))
            if "fk_loss_records_approved_by_id" not in existing_fks:
                op.create_foreign_key("fk_loss_records_approved_by_id", "loss_records", "users", ["approved_by_id"], ["id"], ondelete="SET NULL")

        if "approved_at" not in existing_cols:
            op.add_column("loss_records", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))

    # Índices para loss_records
    existing_idxs = {ix["name"] for ix in inspector.get_indexes("loss_records")} if "loss_records" in existing_tables else set()
    if "loss_records" in existing_tables:
        if "ix_loss_records_product_id" not in existing_idxs:
            op.create_index("ix_loss_records_product_id", "loss_records", ["product_id"])
        if "ix_loss_records_defect_code_id" not in existing_idxs:
            op.create_index("ix_loss_records_defect_code_id", "loss_records", ["defect_code_id"])
        if "ix_loss_records_status" not in existing_idxs:
            op.create_index("ix_loss_records_status", "loss_records", ["status"])
        if "ix_loss_records_registered_by_id" not in existing_idxs:
            op.create_index("ix_loss_records_registered_by_id", "loss_records", ["registered_by_id"])

    # ────────────────────────────
    # 3. scrap_stock
    # ────────────────────────────
    if "scrap_stock" not in existing_tables:
        op.create_table(
            "scrap_stock",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False),
            sa.Column("size", sa.String(50), nullable=False),
            sa.Column("colour", sa.String(100), nullable=True),
            sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
            sa.Column("defect_code_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("defect_codes.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False),
            sa.Column("loss_record_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("loss_records.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )
    else:
        # Verificar columnas y FKs existentes
        existing_cols = {c["name"] for c in inspector.get_columns("scrap_stock")}
        existing_fks = {fk["name"] for fk in inspector.get_foreign_keys("scrap_stock")}

        if "loss_record_id" not in existing_cols:
            op.add_column("scrap_stock", sa.Column("loss_record_id", postgresql.UUID(as_uuid=True), nullable=True))
            if "fk_scrap_stock_loss_record_id" not in existing_fks:
                op.create_foreign_key("fk_scrap_stock_loss_record_id", "scrap_stock", "loss_records", ["loss_record_id"], ["id"], ondelete="SET NULL")

    # Índices para scrap_stock
    existing_idxs_scrap = {ix["name"] for ix in inspector.get_indexes("scrap_stock")} if "scrap_stock" in existing_tables else set()
    if "scrap_stock" in existing_tables:
        if "ix_scrap_stock_product_id" not in existing_idxs_scrap:
            op.create_index("ix_scrap_stock_product_id", "scrap_stock", ["product_id"])
        if "ix_scrap_stock_defect_code_id" not in existing_idxs_scrap:
            op.create_index("ix_scrap_stock_defect_code_id", "scrap_stock", ["defect_code_id"])

    # Índices para defect_codes
    existing_idxs_dc = {ix["name"] for ix in inspector.get_indexes("defect_codes")} if "defect_codes" in existing_tables else set()
    if "defect_codes" in existing_tables:
        if "ix_defect_codes_code" not in existing_idxs_dc:
            op.create_index("ix_defect_codes_code", "defect_codes", ["code"], unique=True)


def downgrade() -> None:
    op.drop_table("scrap_stock")
    op.drop_table("loss_records")
    op.drop_table("defect_codes")