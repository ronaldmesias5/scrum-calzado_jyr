"""normaliza emails a minusculas e indexa

Revision ID: 051_lower_email_users
Revises: 050_perf_indexes
Create Date: 2026-01-01
"""

from typing import Union

from alembic import op

revision: str = "051_lower_email_users"
down_revision: Union[str, None] = "050_perf_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE users SET email = lower(trim(email)) WHERE email <> lower(trim(email))")
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM (
                    SELECT lower(email) AS normalized
                    FROM users
                    GROUP BY lower(email)
                    HAVING count(*) > 1
                ) duplicates
            ) THEN
                CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email));
            ELSE
                CREATE INDEX IF NOT EXISTS ix_users_email_lower ON users (lower(email));
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_users_email_lower")
    op.execute("DROP INDEX IF EXISTS ix_users_email_lower")
