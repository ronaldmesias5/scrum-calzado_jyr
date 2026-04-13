-- Migration manual: Crear tabla supply_categories
CREATE TABLE IF NOT EXISTS supply_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar categorías por defecto
INSERT INTO supply_categories (name) VALUES 
    ('corte'), ('guarnicion'), ('soladura'), ('terminado'), ('otros')
ON CONFLICT (name) DO NOTHING;
