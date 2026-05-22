"""
Migration 024: Make tasks.assigned_to nullable

Permite que una tarea de producción se cree sin empleado asignado
(estado pendiente). El empleado se asigna después desde el dashboard.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "024_make_assigned_to_nullable"
down_revision: Union[str, None] = "023_add_line_group_to_tasks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "tasks",
        "assigned_to",
        existing_type=sa.UUID(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "tasks",
        "assigned_to",
        existing_type=sa.UUID(),
        nullable=False,
    )
