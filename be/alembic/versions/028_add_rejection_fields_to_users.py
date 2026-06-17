"""
Migration 028: Add rejection fields to users table

Agrega las columnas rejected_by, rejected_at y rejection_reason a la tabla
users para permitir al admin rechazar una cuenta con motivo y auditoría.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "028_add_rejection_fields_to_users"
down_revision: Union[str, None] = "027_add_avatar_url_to_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("rejected_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("rejection_reason", sa.String(500), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_rejected_by",
        "users",
        "users",
        ["rejected_by"],
        ["id"],
        ondelete="SET NULL",
        onupdate="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_rejected_by", "users", type_="foreignkey")
    op.drop_column("users", "rejection_reason")
    op.drop_column("users", "rejected_at")
    op.drop_column("users", "rejected_by")
