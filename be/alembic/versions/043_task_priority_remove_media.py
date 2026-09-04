"""remove media from task_priority enum

Migrates the Postgres enum task_priority from ('baja', 'media', 'alta')
to ('baja', 'alta'). All existing 'media' rows are set to 'baja'.

Revision ID: 043_task_priority_remove_media
Revises: 042_email_sender
Create Date: 2026-08-31
"""

from alembic import op

revision = "043_task_priority_remove_media"
down_revision = "043_email_verification_tokens"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Migrate rows with 'media' to 'baja' before changing the enum
    op.execute("UPDATE tasks SET priority = 'baja' WHERE priority = 'media'")

    # Create new enum type with only baja and alta
    op.execute("CREATE TYPE task_priority_v2 AS ENUM ('baja', 'alta')")

    # Update column to use new enum
    op.execute(
        "ALTER TABLE tasks ALTER COLUMN priority TYPE task_priority_v2 "
        "USING priority::text::task_priority_v2"
    )

    # Drop old enum and rename new one
    op.execute("DROP TYPE task_priority")
    op.execute("ALTER TYPE task_priority_v2 RENAME TO task_priority")


def downgrade() -> None:
    op.execute("CREATE TYPE task_priority_old AS ENUM ('baja', 'media', 'alta')")
    op.execute(
        "ALTER TABLE tasks ALTER COLUMN priority TYPE task_priority_old "
        "USING priority::text::task_priority_old"
    )
    op.execute("DROP TYPE task_priority")
    op.execute("ALTER TYPE task_priority_old RENAME TO task_priority")
