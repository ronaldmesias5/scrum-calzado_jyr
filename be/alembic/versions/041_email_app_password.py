"""add email_app_password to users

Per-user Gmail App Password (encrypted) so outgoing emails are sent
from the logged-in user's own account instead of the global MAIL_FROM.

Revision ID: 041_email_app_password
Revises: 040_client_pending_incidence
Create Date: 2026-08-24
"""

from alembic import op
import sqlalchemy as sa

revision = "041_email_app_password"
down_revision = "040_client_pending_incidence"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_app_password", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "email_app_password")
