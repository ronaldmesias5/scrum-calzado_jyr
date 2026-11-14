# ════════════════════════════════════════
# 📄 Migración — Add invitation_expires_at column to users table
# ════════════════════════════════════════
# 038 | Revises: 037 | Creada: 2026-06-21
from alembic import op
import sqlalchemy as sa

revision = '038'
down_revision = '037'


def upgrade():
    op.add_column(
        'users',
        sa.Column('invitation_expires_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_column('users', 'invitation_expires_at')