"""
Migration 027: Add avatar_url column to users table

Agrega la columna avatar_url a la tabla users para
permitir que los usuarios tengan una foto de perfil.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "027_add_avatar_url_to_users"
down_revision: Union[str, None] = "026_create_report_shares"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
