"""
Migration 029: Create reactivation_tickets table

Crea la tabla reactivation_tickets para RF-005 — Solicitud de Reactivación de Cuentas.
Almacena tickets de reactivación enviados por usuarios con cuentas inactivas.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "029_create_reactivation_tickets"
down_revision: Union[str, None] = "028_add_rejection_fields_to_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reactivation_tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("identity_document", sa.String(20), nullable=False),
        sa.Column("evidence_url", sa.String(500), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("admin_comment", sa.Text(), nullable=True),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reactivation_tickets_user_id", "reactivation_tickets", ["user_id"])
    op.create_index("ix_reactivation_tickets_status", "reactivation_tickets", ["status"])


def downgrade() -> None:
    op.drop_index("ix_reactivation_tickets_status", table_name="reactivation_tickets")
    op.drop_index("ix_reactivation_tickets_user_id", table_name="reactivation_tickets")
    op.drop_table("reactivation_tickets")
