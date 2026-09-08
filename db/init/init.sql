-- ============================================================================
-- BOOTSTRAP TÉCNICO DE POSTGRESQL
-- ============================================================================
-- Este archivo es la inicialización TÉCNICA del motor PostgreSQL.
-- 
-- ¿QUÉ VA AQUÍ?
-- - Extensiones PostgreSQL (uuid-ossp, pg_trgm, etc.)
-- - Configuraciones del motor de BD
--
-- ¿QUÉ NO VA AQUÍ?
-- - Tablas de negocio (users, products, orders, etc.)
-- - Datos de negocio
-- - Triggers funcionales
--
-- Las tablas y datos se controlan a través de Alembic (be/alembic/versions/)
-- ============================================================================

-- ============================================================================
-- PASO 1: Extensiones PostgreSQL
-- ============================================================================

-- UUID: Para generar identificadores únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostgreSQL Text Search / Full-Text Search: Para búsquedas de productos
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- IA — pgvector: búsqueda semántica para asistente (Fase 0)
-- Requiere imagen pgvector/pgvector:pg17 (ver docker-compose.yml)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- PASO 2: Configuraciones de la Base de Datos
-- ============================================================================

-- Timezone: Asegurar que todos los timestamps estén en UTC
ALTER DATABASE calzado_jyr_db SET timezone TO 'UTC';

-- ============================================================================
-- PASO 3: Verificación (log de que todo fue correcto)
-- ============================================================================

-- Este log se verá en: docker compose logs db
-- NOTICE: Este es un marcador de que el bootstrap técnico se ejecutó correctamente
SELECT 'Bootstrap técnico completado: Extensiones y configuraciones activadas' AS status;

-- ============================================================================
-- NOTAS IMPORTANTES PARA EL EQUIPO
-- ============================================================================
--
-- 1. ORDEN DE INICIALIZACIÓN EN DOCKER COMPOSE:
--    a) PostgreSQL arranca y crea BD: calzado_jyr_db
--    b) Este script (init.sql) se ejecuta automáticamente
--    c) Backend (FastAPI) arranca
--    d) Backend ejecuta: alembic upgrade head (crea todas las tablas)
--
-- 2. DÓNDE VER LAS MIGRACIONES:
--    - be/alembic/versions/001_create_initial_schema.py  (crea tablas)
--    - be/alembic/versions/002_seed_initial_data.py      (datos iniciales)
--    - be/alembic/versions/003_seed_catalog_data.py      (catálogo)
--    - be/alembic/versions/004_seed_test_users.py        (usuarios de prueba)
--
-- 3. PARA EJECUTAR MIGRACIONES MANUALMENTE:
--    docker compose exec backend alembic upgrade head
--
-- 4. PARA VER HISTORIAL DE MIGRACIONES:
--    docker compose exec backend alembic history
--
-- 5. PARA HACER ROLLBACK A VERSIÓN ANTERIOR:
--    docker compose exec backend alembic downgrade -1
--
-- ============================================================================
