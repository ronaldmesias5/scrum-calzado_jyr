"""add email_sender to users

Custom sender email chosen by the user (may differ from login email).
Used together with the encrypted app password for outgoing mail.

Revision ID: 042_email_sender
Revises: 041_email_app_password
Create Date: 2026-08-24
"""

from alembic import op
import sqlalchemy as sa

revision = "042_email_sender"
down_revision = "041_email_app_password"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_sender", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "email_sender")
