"""Add global_stage field to supply_categories.

Revision ID: 011_global_stage
Revises: 010_add_color
Create Date: 2026-04-16 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '011_global_stage'
down_revision = '010_add_color'
branch_labels = None
depends_on = None

# Mapping existing categories to global stages (Robust variants)
STAGE_MAPPING = {
    # CORTE
    'corte': 'corte',
    'maya': 'corte',
    'mayas': 'corte',
    'sintetico': 'corte',
    'sinteticos': 'corte',
    'sintéticos': 'corte',
    'forro': 'corte',
    'forros': 'corte',
    'cambre': 'corte',
    'carnaza': 'corte',
    'carnazas': 'corte',
    'apliques': 'corte',
    
    # GUARNICION
    'guarnicion': 'guarnicion',
    'guarnición': 'guarnicion',
    'hilo': 'guarnicion',
    'hilos': 'guarnicion',
    'tira': 'guarnicion',
    'tiras': 'guarnicion',
    
    # SOLADURA
    'soladura': 'soladura',
    'suela': 'soladura',
    'suelas': 'soladura',
    
    # EMPLANTILLADO
    'emplantillado': 'emplantillado',
    'terminado': 'emplantillado',
    'plantilla': 'emplantillado',
    'plantillas': 'emplantillado',
    'lujo': 'emplantillado',
    'lujos': 'emplantillado',
    
    # OTROS
    'otros': 'otros',
    'otro': 'otros'
}


def upgrade() -> None:
    # Add global_stage column if it doesn't exist
    op.execute("""
        ALTER TABLE supply_categories
        ADD COLUMN IF NOT EXISTS global_stage VARCHAR(50) DEFAULT 'otros'
    """)
    
    # Update existing categories with logical production stages (Case-insensitive match)
    for category, stage in STAGE_MAPPING.items():
        op.execute(f"""
            UPDATE supply_categories
            SET global_stage = '{stage}'
            WHERE LOWER(name) = LOWER('{category}')
        """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE supply_categories
        DROP COLUMN IF EXISTS global_stage
    """)
