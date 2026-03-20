-- ============================================================
-- CALZADO J&R — Triggers, índices adicionales y constraints
-- ============================================================
-- Archivo: db/init/02_triggers_and_indexes.sql
-- Descripción: Automatización y optimización de consultas BD.
--
-- ¿Qué?
--   - Función set_updated_at(): trigger function para updated_at automático
--   - Triggers: trg_roles_updated_at, trg_users_updated_at
--   - Índices parciales: deleted_at IS NULL (optimiza soft-delete queries)
--   - Índices compuestos: email+deleted_at, role_id+is_active, etc.
--
-- ¿Para qué?
--   - Automatizar updated_at (evita olvidos en código Python)
--   - Reducir O(n) → O(log n) en búsquedas (email, role_id, etc.)
--   - Optimizar queries con soft-delete (WHERE deleted_at IS NULL)
--   - Garantizar auditabilidad (cualquier UPDATE registra timestamp)
--
-- ¿Impacto?
--   CRÍTICO PERFORMANCE — Sin índices, tabla users con 10k+ registros es LENTA.
--   Sin trigger updated_at: pérdida de auditabilidad (¿cuándo se modificó X?).
--   Índices parciales reducen tamaño del índice (solo activos, ignora deleted).
--   Dependencias: 01_create_tables.sql (debe existir tabla roles/users primero)
--
-- EJECUCIÓN:
--   Docker ejecuta en orden: 01_create_tables.sql → 02_triggers_*.sql → 99_seed*.sql
--   Los archivos en /docker-entrypoint-initdb.d se procesan alfabéticamente.
-- ============================================================


-- ══════════════════════════════════════════════════════════
-- SECCIÓN 1: Función y triggers para updated_at automático
-- ══════════════════════════════════════════════════════════

-- ¿Qué?    Función PL/pgSQL reutilizable que actualiza updated_at.
-- ¿Para?   Un solo trigger function se puede asignar a múltiples
--           tablas (DRY — Don't Repeat Yourself).
-- ¿Impacto? Garantiza auditabilidad: cualquier UPDATE en roles o
--           users registra exactamente cuándo ocurrió el cambio.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- NEW es la fila con los nuevos valores; le asignamos la hora actual.
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ────────────────────────────
-- Trigger para la tabla roles
-- BEFORE UPDATE: actualiza updated_at ANTES de escribir la fila.
-- FOR EACH ROW: se ejecuta una vez por cada fila afectada por el UPDATE.
-- ────────────────────────────
CREATE OR REPLACE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────
-- Trigger para la tabla users
-- ────────────────────────────
CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ══════════════════════════════════════════════════════════
-- SECCIÓN 2: Índices parciales para soft-delete
-- ══════════════════════════════════════════════════════════

-- ¿Qué?    Índices que solo indexan filas donde deleted_at IS NULL.
-- ¿Para?   El patrón soft-delete (borrado lógico) marca registros
--           con deleted_at en lugar de eliminarlos físicamente.
--           Las consultas casi siempre filtran registros ACTIVOS
--           (WHERE deleted_at IS NULL).
-- ¿Impacto? Un índice parcial es más pequeño y más rápido que un
--           índice completo porque solo incluye las filas activas
--           (normalmente el 95%+ del total). PostgreSQL lo usa
--           automáticamente cuando la query contiene
--           `WHERE deleted_at IS NULL`.

-- Usuarios activos por email (login)
CREATE INDEX IF NOT EXISTS idx_users_email_active
    ON users (email)
    WHERE deleted_at IS NULL;

-- Usuarios activos por role_id (listar empleados, clientes, etc.)
CREATE INDEX IF NOT EXISTS idx_users_role_id_active
    ON users (role_id)
    WHERE deleted_at IS NULL;

-- Usuarios activos pendientes de validación (admin dashboard)
-- ¿Qué hace? Índice compuesto: role_id + is_validated para consultas
--            del tipo "clientes no validados".
CREATE INDEX IF NOT EXISTS idx_users_role_validated
    ON users (role_id, is_validated)
    WHERE deleted_at IS NULL;

-- Roles activos por nombre (búsqueda de rol por nombre en login)
CREATE INDEX IF NOT EXISTS idx_roles_name_active
    ON roles (name_role)
    WHERE deleted_at IS NULL;

-- ────────────────────────────
-- Índices para Catálogo y Productos
-- ────────────────────────────

-- Productos activos (por nombre y estado)
CREATE INDEX IF NOT EXISTS idx_products_name_active
    ON products (name_product)
    WHERE deleted_at IS NULL;

-- Productos activos por estilo (muy usado en filtrado)
CREATE INDEX IF NOT EXISTS idx_products_style_active
    ON products (style_id)
    WHERE deleted_at IS NULL;

-- Inventario activo con stock disponible
CREATE INDEX IF NOT EXISTS idx_inventory_stock_active
    ON inventory (product_id, amount)
    WHERE deleted_at IS NULL AND amount > 0;

-- Estilos activos por marca
CREATE INDEX IF NOT EXISTS idx_styles_brand_active
    ON styles (brand_id)
    WHERE deleted_at IS NULL;

-- Categorías y Marcas activas
CREATE INDEX IF NOT EXISTS idx_categories_name_active ON categories (name_category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brands_name_active ON brands (name_brand) WHERE deleted_at IS NULL;


-- ══════════════════════════════════════════════════════════
-- SECCIÓN 3: Índices para tokens de recuperación de contraseña
-- ══════════════════════════════════════════════════════════

-- ¿Qué?    Índice compuesto token + used para validar tokens ágil.
-- ¿Para?   Cuando el usuario hace clic en el enlace de reset, la
--           API busca el token y verifica que no fue usado.
--           Esta query combina ambas condiciones.
-- ¿Impacto? Con índice: microsegundos. Sin índice: scan completo
--           de la tabla, lento si hay miles de tokens expirados.
CREATE INDEX IF NOT EXISTS idx_prt_token_unused
    ON password_reset_tokens (token)
    WHERE used = FALSE;

-- Índice en user_id para invalidar todos los tokens de un usuario
-- (útil al cambiar contraseña: marcar todos sus tokens como usados)
CREATE INDEX IF NOT EXISTS idx_prt_user_id
    ON password_reset_tokens (user_id);

-- Índice en expires_at para limpieza periódica de tokens expirados
-- ¿Para? Tarea de mantenimiento: DELETE FROM password_reset_tokens
--         WHERE expires_at < NOW(); — usa este índice para ser eficiente.
CREATE INDEX IF NOT EXISTS idx_prt_expires_at
    ON password_reset_tokens (expires_at);


-- ══════════════════════════════════════════════════════════
-- SECCIÓN 4: Check constraints de integridad de datos
-- ══════════════════════════════════════════════════════════

-- ¿Qué?    Restricciones que la BD verifica en cada INSERT/UPDATE.
-- ¿Para?   La BD es la última línea de defensa. Aunque el backend
--           valida los datos, un bug o acceso directo SQL no
--           puede insertar datos inválidos si la BD los rechaza.
-- ¿Impacto? Integridad garantizada a nivel de motor, no solo de app.
--
-- ¿Por qué DO $$ BEGIN ... IF NOT EXISTS?
--   ALTER TABLE ADD CONSTRAINT no soporta IF NOT EXISTS en PostgreSQL.
--   El bloque DO permite verificar primero si el constraint ya existe
--   antes de intentar crearlo → el script es idempotente (se puede
--   ejecutar múltiples veces sin errores de "ya existe").

DO $$
BEGIN
    -- El email debe contener @ (validación mínima)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_email_format'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT chk_users_email_format
            CHECK (email LIKE '%@%');
    END IF;

    -- El teléfono solo permite dígitos, espacios, +, - y paréntesis
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_phone_format'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT chk_users_phone_format
            CHECK (phone IS NULL OR phone ~ '^[0-9\s\+\-\(\)]+$');
    END IF;

    -- validated_at debe estar presente si is_validated es TRUE
    -- ¿Por qué? Detecta inconsistencias: un usuario validado sin fecha
    --            de validación indica un bug en el flujo de validación.
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_validated_consistency'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT chk_users_validated_consistency
            CHECK (
                (is_validated = FALSE) OR
                (is_validated = TRUE AND validated_at IS NOT NULL)
            );
    END IF;

    -- expires_at del token debe ser posterior a created_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_prt_expires_after_created'
    ) THEN
        ALTER TABLE password_reset_tokens
            ADD CONSTRAINT chk_prt_expires_after_created
            CHECK (expires_at > created_at);
    END IF;
END $$;
