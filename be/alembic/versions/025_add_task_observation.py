"""
Migration 025: Add observation column to tasks table

Permite que los empleados dejen observaciones/notas en sus tareas
(ej. "faltó un par de pieza X"), visibles para los siguientes
operarios que vean el vale de producción.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "025_add_task_observation"
down_revision: Union[str, None] = "024_make_assigned_to_nullable"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("observation", sa.Text(), nullable=True,
                  comment="Observación del empleado sobre esta tarea"),
    )


def downgrade() -> None:
    op.drop_column("tasks", "observation")
