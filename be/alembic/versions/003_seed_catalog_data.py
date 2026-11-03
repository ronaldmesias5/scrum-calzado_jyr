# ════════════════════════════════════════
# 📄 Migración que inserta datos base del catálogo:
# ════════════════════════════════════════
# 003_seed_catalog_data | Revises: 002_seed_initial_data | Creada: 2026-03-25 00:00:02.000000

from typing import Sequence, Union

from alembic import op

revision: str = "003_seed_catalog_data"
down_revision: Union[str, Sequence[str], None] = "002_seed_initial_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Inserta marcas, categorías, estilos y productos."""

    # ═══════════════════════════════════════════════════════════
    # INSERTAR MARCAS (5)
    # ═══════════════════════════════════════════════════════════
    op.execute(
        """
        INSERT INTO brands (name_brand, description_brand, created_at, updated_at)
        VALUES
            ('Nike', 'Marca estadounidense de calzado y ropa deportiva', NOW(), NOW()),
            ('Adidas', 'Líder global en ropa y calzado deportivo', NOW(), NOW()),
            ('Puma', 'Marca internacional de calzado deportivo y casual', NOW(), NOW()),
            ('New Balance', 'Fabricante de calzado deportivo y casual', NOW(), NOW()),
            ('Reebok', 'Marca de calzado deportivo y fitness', NOW(), NOW())
        ON CONFLICT (name_brand) DO NOTHING;
        """
    )

    # ═══════════════════════════════════════════════════════════
    # INSERTAR CATEGORÍAS (3)
    # ═══════════════════════════════════════════════════════════
    op.execute(
        """
        INSERT INTO categories (name_category, description_category, created_at, updated_at)
        VALUES
            ('Dama', 'Zapatos para mujeres', NOW(), NOW()),
            ('Caballero', 'Zapatos para hombres', NOW(), NOW()),
            ('Infantil', 'Zapatos para niños', NOW(), NOW())
        ON CONFLICT (name_category) DO NOTHING;
        """
    )

    # ═══════════════════════════════════════════════════════════
    # INSERTAR ESTILOS (22)
    # ═══════════════════════════════════════════════════════════
    op.execute(
        """
        INSERT INTO styles (name_style, description_style, brand_id, created_at, updated_at)
        SELECT name, description, (SELECT id FROM brands WHERE brands.name_brand = temp.brand_name LIMIT 1), NOW(), NOW()
        FROM (VALUES
          ('Air Force One', 'Icónico zapato de Nike', 'Nike'),
          ('SB', 'Línea de skate de Nike', 'Nike'),
          ('Force One Bota', 'Air Force One en formato bota', 'Nike'),
          ('Air Jordan 1', 'Primer modelo de Air Jordan', 'Nike'),
          ('Air Jordan 11', 'Modelo emblemático Air Jordan', 'Nike'),
          ('Air Max', 'Tecnología Air Max de Nike', 'Nike'),
          ('Superstar', 'Clásico de Adidas', 'Adidas'),
          ('Forum', 'Diseño retro de Adidas', 'Adidas'),
          ('Ultraboost', 'Tecnología Boost de Adidas', 'Adidas'),
          ('Stan Smith', 'Icono del tenis de Adidas', 'Adidas'),
          ('Campus', 'Clásico vinilo de Adidas', 'Adidas'),
          ('Varial', 'Zapato de skate Adidas', 'Adidas'),
          ('Neo', 'Línea casual Neo de Adidas', 'Adidas'),
          ('California', 'Modelo clásico de Puma', 'Puma'),
          ('9060', 'Modelo moderno New Balance', 'New Balance'),
          ('574', 'Icónico modelo New Balance', 'New Balance'),
          ('1300', 'Clásico New Balance', 'New Balance'),
          ('530', 'Retro New Balance', 'New Balance'),
          ('Princesa', 'Línea Princesa de Reebok', 'Reebok'),
          ('Plus Clásico', 'Plus Clásico Reebok', 'Reebok'),
          ('Bota Clásica', 'Bota Clásica Reebok', 'Reebok'),
          ('Running', 'Línea Running de Reebok', 'Reebok')
        ) AS temp(name, description, brand_name)
        WHERE NOT EXISTS (SELECT 1 FROM styles WHERE styles.name_style = temp.name)
        ON CONFLICT DO NOTHING;
        """
    )



def downgrade() -> None:
    """Revierte la migración: elimina estilos, categorías y marcas."""


    # Eliminar estilos
    op.execute(
        """
        DELETE FROM styles WHERE name_style IN
        ('Air Force One', 'SB', 'Force One Bota', 'Air Jordan 1', 'Air Jordan 11', 'Air Max',
         'Superstar', 'Forum', 'Ultraboost', 'Stan Smith', 'Campus', 'Varial', 'Neo',
         'California', '9060', '574', '1300', '530', 'Princesa', 'Plus Clásico', 'Bota Clásica', 'Running');
        """
    )

    # Eliminar categorías
    op.execute(
        """
        DELETE FROM categories WHERE name_category IN ('Dama', 'Caballero', 'Infantil');
        """
    )

    # Eliminar marcas
    op.execute(
        """
        DELETE FROM brands WHERE name_brand IN ('Nike', 'Adidas', 'Puma', 'New Balance', 'Reebok');
        """
    )
