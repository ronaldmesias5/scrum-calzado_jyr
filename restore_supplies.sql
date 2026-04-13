CREATE TABLE IF NOT EXISTS supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_supplies VARCHAR(255) NOT NULL,
    description_supplies TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_supplies_created_by ON supplies (created_by);
CREATE INDEX IF NOT EXISTS ix_supplies_deleted_at ON supplies (deleted_at);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplies_movement_type') THEN
        CREATE TYPE supplies_movement_type AS ENUM ('entrada', 'salida');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS supplies_movement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplies_id UUID NOT NULL REFERENCES supplies(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type_of_movement supplies_movement_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    colour VARCHAR(100),
    size VARCHAR(50),
    movement_date TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_supplies_movement_supplies_id ON supplies_movement (supplies_id);
CREATE INDEX IF NOT EXISTS ix_supplies_movement_user_id ON supplies_movement (user_id);
CREATE INDEX IF NOT EXISTS ix_supplies_movement_movement_date ON supplies_movement (movement_date);
