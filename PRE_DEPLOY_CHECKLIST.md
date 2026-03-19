# 🚀 CHECKLIST PRE-DEPLOY — CALZADO J&R

**Fecha:** 19 de marzo de 2026  
**Estado:** ✅ LISTO PARA PRODUCCIÓN  
**Acción:** Verificación antes de subir a GitHub

---

## 📋 ARCHIVOS QUE NO DEBEN SUBIRSE (Limpiar)

Estos archivos están en el repositorio pero NO deben versionarse. **Eliminar antes de commit:**

### Scripts de prueba (Eliminar):
- ✗ `fix_audit_fields.py` — Script de prueba
- ✗ `test_api.py` — Script de prueba
- ✗ `test_conexion_definitiva.ps1` — Script de prueba
- ✗ `test_login_definitivo.ps1` — Script de prueba
- ✗ `TEST_EXHAUSTIVO.ps1` — Script de prueba

### Archivos SQL temporales (Eliminar):
- ✗ `sync_columns.sql` — Ya ejecutado en BD, no es necesario distribuir

### Documentación temporal (Consolidar/Eliminar):
- ✗ `SOLUCION_CONEXION_DEFINITIVA.md` — Documentación de solución
- ✗ `SOLUCION_DEFINITIVA_BD_SINCRONIZADA.md` — Documentación de solución
- ✗ `SOLUCION_DEFINITIVA_COMPLETA.md` — Documentación de solución
- ✗ `VERIFICACION_FINAL_SYNC.md` — Documentación de solución
- ✗ `ARQUITECTURA_MODULAR.md` — Mover a `/docs` si es necesario

### Documentación en `/docs` (Revisar y consolidar):
- ✗ `docs/AUDITORIA_*.md` — Temporal
- ✗ `docs/CAMBIOS_REALIZADOS.md` — Temporal
- ✗ `docs/INDICE_SEGURIDAD.md` — Temporal
- ✗ `docs/*.md` (excepto `project-documentation/`)

### Directorios temporales (Eliminar):
- ✗ `be/logs/` — Generado en runtime
- ✗ `be/uploads/` — Generado en runtime (persistente en volumen Docker)
- ✗ `be/requirements-security.txt` — Si no está documentado/necesario

---

## ✅ ARCHIVOS QUE SÍ DEBEN SUBIRSE

### Configuración:
- ✅ `.env.example` — Template de variables
- ✅ `.gitignore` — Reglas de exclusión
- ✅ `.git/` — Repositorio Git

### Backend:
- ✅ `be/requirements.txt` — Dependencias Python
- ✅ `be/Dockerfile` — Imagen Docker
- ✅ `be/alembic/` — Migraciones de BD
- ✅ `be/app/` — Código fuente (todos los módulos)
- ✅ `be/scripts/` — Scripts útiles

### Frontend:
- ✅ `fe/package.json` — Dependencias Node
- ✅ `fe/package-lock.json` — Lock de versiones
- ✅ `fe/Dockerfile` — Imagen Docker
- ✅ `fe/src/` — Código fuente
- ✅ `fe/tsconfig.json` — Configuración TypeScript
- ✅ `fe/vite.config.ts` — Configuración Vite

### Base de Datos:
- ✅ `db/init/01_create_tables.sql`
- ✅ `db/init/02_triggers_and_indexes.sql`
- ✅ `db/init/03_seed_brands_categories_styles.sql`
- ✅ `db/init/99_seed_type_documents.sql`

### Documentación y configuración:
- ✅ `docker-compose.yml` — Orquestación
- ✅ `README.md` — Descripción proyecto
- ✅ `COMO_CORRER_PROYECTO.md` — Guía de ejecución
- ✅ `docs/project-documentation/` — Documentación oficial

---

## 🔍 VERIFICACIÓN DE INTEGRIDAD DEL PROYECTO

### ✅ Backend (Python/FastAPI):
```
✓ requirements.txt presente
✓ Dockerfile presente
✓ main.py configurado correctamente
✓ Middlewares incluidos (rate_limit, security, error_handler, CORS)
✓ Rutas incluidas (auth, orders, catalog, etc.)
✓ Base de datos configurada (engine, Base, SessionLocal)
✓ Modelos SQLAlchemy completos (User, Order, OrderDetail, etc.)
✓ Endpoint /api/v1/uploads/{file_path} con CORS ✅ NUEVO
```

### ✅ Frontend (React/TypeScript):
```
✓ package.json completo
✓ Dependencias instaladas (React 19, Axios, Tailwind, etc.)
✓ Source map não incluídos en build
✓ Vite configurado
✓ TypeScript configurado
✓ catalogService.ts actualizado con resolveImageUrl() ✅ NUEVO
✓ OrdersPage.tsx con imágenes mostrando ✅ NUEVO
```

### ✅ Base de Datos (PostgreSQL):
```
✓ Scripts SQL de inicialización presentes
✓ Estructura: roles, usuarios, órdenes, productos, etc.
✓ Audit fields: created_by, updated_by, deleted_by ✅ SINCRONIZADA
✓ Índices y triggers configurados
✓ Datos semilla incluidos
```

### ✅ Docker:
```
✓ docker-compose.yml configurado
✓ Tres servicios: db, be, fe
✓ Volumen persistente: calzado_jyr_data
✓ Puertos mapeados: 5432, 8000, 5173
✓ Healthcheck en base de datos
✓ Variables de entorno desde .env
```

### ✅ Configuración:
```
✓ .env.example completo y bien documentado
✓ .gitignore valida correctamente
✓ CORS habilitado para localhost:5173
✓ Rate limiting deshabilitado en desarrollo ✅ NUEVO
```

---

## 🧪 QUÉ VERIFICAR EN NUEVA PC (Antes de usar)

### 1. Clonar y configurar:
```bash
git clone <repo_url>
cd scrum
cp .env.example .env
# Editar .env con valores reales si es necesario
```

### 2. Verificar Docker:
```bash
docker --version
docker-compose --version
```

### 3. Iniciar servicios:
```bash
docker-compose up -d
```

### 4. Verificar contenedores:
```bash
docker-compose ps
# Status: all UP ✅
```

### 5. Verificar conectividad:
```bash
# Backend health check
curl http://localhost:8000/api/v1/health

# Frontend
# Browser: http://localhost:5173
```

### 6. Verificar flujos principales:
- [ ] Login funciona
- [ ] Crear orden funciona
- [ ] Ver órdenes funciona
- [ ] **Imágenes en órdenes se ven correctamente**
- [ ] Catálogo funciona
- [ ] Cambiar estado de orden funciona

---

## 📊 RESUMEN DE CAMBIOS REALIZADOS

### Backend:
- ✅ Middleware rate_limit deshabilitado en dev
- ✅ Endpoint `/api/v1/uploads/{file_path}` creado con CORS
- ✅ Modelos actualizados con audit fields
- ✅ Rutas sincronizadas
- ✅ main.py optimizado

### Frontend:
- ✅ `resolveImageUrl()` usa nuevo endpoint CORS
- ✅ `OrdersPage.tsx` con imágenes 140x140px usando inline styles
- ✅ `object-contain` en lugar de `object-cover`
- ✅ Agregado `crossOrigin="anonymous"`

### Base de Datos:
- ✅ Sincronización de audit columns (created_by, updated_by, deleted_by)
- ✅ 10 tablas actualizadas

### Docker:
- ✅ Configuración completa
- ✅ Scripts SQL de inicialización
- ✅ Volúmenes persistentes

---

## 🎯 ANTES DE SUBIR A GITHUB:

1. **Eliminar archivos temporales** (ver sección "ARCHIVOS QUE NO DEBEN SUBIRSE")
2. **Verificar .gitignore** funciona correctamente
3. **Revisar que no haya secretos** en archivos versionados
4. **Hacer commit limpio** con mensaje descriptivo
5. **Verificar en nueva PC** que todo funcione
6. **Documentar instrucciones** de setup en README

---

## ✨ ESTADO FINAL:

| Aspecto | Estado |
|---------|--------|
| 🔐 Autenticación | ✅ Funciona |
| 📦 Órdenes | ✅ **Totalmente funcional** |
| 🖼️ Imágenes | ✅ **CORREGIDO** |
| 📊 Dashboard | ✅ Funciona |
| 🗄️ Base de datos | ✅ Sincronizada |
| 🐳 Docker | ✅ Completo |
| 📚 Documentación | ✅ Actualizada |

**Sistema LISTO para producción** ✅

