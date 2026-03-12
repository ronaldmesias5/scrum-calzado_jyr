-- =====================================================
-- Seed: Tipos de Documentos Válidos
-- =====================================================
-- Archivo: db/init/99_seed_type_documents.sql
-- Descripción: Datos iniciales para tabla type_document.
--
-- ¿Qué?
--   Inserta 6 tipos de documentos comunes en Colombia:
--   - Cédula de Ciudadanía (CC)
--   - Tarjeta de Identidad (TI)
--   - Pasaporte
--   - Cédula de Extranjería (CE)
--   - Permiso por Protección Temporal (PPT)
--   - Documento de Identificación Personal (DIPS)
--   Usa UUIDs fijos (00000000-*-00000001 a 000006) con ON CONFLICT DO NOTHING
--
-- ¿Para qué?
--   - Proveer opciones preconfiguradas para campo identity_document_type_id
--   - SELECT dropdown en RegisterPage usa estos valores
--   - Evitar insertar datos manualmente en producción
--
-- ¿Impacto?
--   MEDIO — Sin estos seeds, usuarios no pueden seleccionar tipo de documento.
--   Modificar name rompe: frontend si hardcodea nombres específicos.
--   Agregar tipos: simplemente añadir líneas con nuevos UUIDs.
--   Dependencias: 01_create_tables.sql (tabla type_document debe existir)
--
-- EJECUCIÓN:
--   Prefijo '99_' garantiza que se ejecuta AL FINAL (después de tablas creadas).
--   Docker procesa /docker-entrypoint-initdb.d en orden alfabético.
-- =====================================================

INSERT INTO type_document (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Cédula de Ciudadanía (CC)'),
  ('00000000-0000-0000-0000-000000000002', 'Tarjeta de Identidad (TI)'),
  ('00000000-0000-0000-0000-000000000003', 'Pasaporte'),
  ('00000000-0000-0000-0000-000000000004', 'Cédula de Extranjería (CE)'),
  ('00000000-0000-0000-0000-000000000005', 'Permiso por Protección Temporal (PPT)'),
  ('00000000-0000-0000-0000-000000000006', 'Documento de Identificación Personal (DIPS)')
ON CONFLICT (name) DO NOTHING;
