# 📦 Carpeta `db/` — Infraestructura y Operaciones de PostgreSQL

## Propósito de esta Carpeta

Esta carpeta es la **capa de infraestructura y operaciones** de PostgreSQL. Contiene:
- `.dockerignore` — Archivos que Docker ignora al construir contexto
- `init/init.sql` — Scripts de bootstrap que se ejecutan al inicializar PostgreSQL
- Este README — Documentación de arquitectura

## 🏗️ Arquitectura: Separación de Responsabilidades

```
db/init/init.sql              ← Bootstrap técnico (extensiones, configuraciones del motor)
                                  Se ejecuta UNA VEZ al inicializar PostgreSQL en Docker

be/alembic/versions/          ← Esquema y datos de NEGOCIO (versionado en git)
  ├── 001_create_initial_schema.py     (tablas: users, roles, products, etc.)
  ├── 002_seed_initial_data.py         (datos iniciales: roles, tipos de documento)
  ├── 003_seed_catalog_data.py         (catálogo: marcas, categorías, productos)
  └── 004_seed_test_users.py           (usuarios de prueba: admin, cortador, cliente)
```

## ✅ ¿Qué va en `db/init/init.sql`?

- ✅ **Extensiones PostgreSQL** (`uuid-ossp`, `pg_trgm`, etc.)
- ✅ **Configuraciones del motor** (timezone, encoding, parámetros)
- ✅ **Comentarios y documentación** para el equipo

## ❌ ¿Qué NO va en `db/init/init.sql`?

- ❌ Creación de tablas de negocio (`users`, `products`, `orders`, etc.)
- ❌ Creación de índices o triggers funcionales
- ❌ Inserción de datos (roles, productos, etc.)
- ❌ Versionamiento de esquema (eso es responsabilidad de **Alembic**)

## 🐘 Uso de PostgreSQL en Docker

El servicio `db` en `docker-compose.yml` usa la imagen oficial directamente:

```yaml
db:
  image: postgres:17-alpine
```

No se necesita un Dockerfile personalizado porque la imagen oficial cubre todas las necesidades (extensiones vía `init.sql`, config vía variables de entorno).

## 📊 Tabla Comparativa: `db/init/` vs Alembic

| Aspecto | `db/init/init.sql` | Alembic (`be/alembic/versions/`) |
|--------|---|---|
| **Propósito** | Inicializar motor PostgreSQL | Version control del esquema funcional |
| **Cambios** | Raros (casi nunca cambia) | Frecuentes (en cada feature nueva) |
| **Reproducibilidad** | 1 sola ejecución (idempotente) | Ejecutable en orden (upgrade/downgrade) |
| **Control de versiones** | No necesario (bootstrap) | ✅ Versionado en git |
| **Rollback** | No es reversible | ✅ Reversible (downgrade) |
| **Ejemplo** | `CREATE EXTENSION uuid-ossp` | `CREATE TABLE users (...)` |

## 🔄 Flujo de Inicialización Completo

```
1. Docker Compose inicia -> docker compose up -d

2. PostgreSQL 17 arranca
   └─> Crea BD: calzado_jyr_db
   └─> Crea usuario: jyr_user
   
3. Scripts de /docker-entrypoint-initdb.d/ se ejecutan
   └─> db/init/init.sql se ejecuta
   └─> CREATE EXTENSION uuid-ossp
   └─> CREATE EXTENSION pg_trgm
   └─> ALTER DATABASE SET timezone TO 'UTC'
   └─> PostgreSQL lista ✅
   
4. Backend (FastAPI) arranca
   └─> be/app/main.py inicia
   └─> lifespan() ejecuta: run_migrations()
   └─> Ejecuta: alembic upgrade head
   └─> Crea tablas desde migraciones (001 → 004)
   └─> Inserta datos iniciales (roles, tipos de doc, usuarios)
   └─> Backend listo ✅
   
5. Frontend (React) arranca
   └─> FE listo ✅

6. Sistema completo operacional ✅
   ├─ BD con 17 tablas versionadas
   ├─ 65 productos en catálogo
   ├─ 3 roles (admin, employee, client)
   ├─ 3 usuarios de prueba
   └─ Ready para desarrollo / demostración
```

## 🛠️ Comandos Útiles

### Ver estado de migraciones

```bash
# Versión actual aplicada
docker compose exec backend alembic current

# Historial completo de migraciones
docker compose exec backend alembic history

# Ver siguiente migración a aplicar
docker compose exec backend alembic current --verbose
```

### Ejecutar migraciones

```bash
# Aplicar todas migraciones hasta 'head' (último)
# (Normalmente automático al arrancar, pero puedes forzar)
docker compose exec backend alembic upgrade head

# Aplicar hasta versión específica
docker compose exec backend alembic upgrade 003_seed_catalog_data
```

### Hacer rollback (deshacer migraciones)

```bash
# Deshacer 1 migración
docker compose exec backend alembic downgrade -1

# Deshacer 2 migraciones
docker compose exec backend alembic downgrade -2

# Deshacer TODAS (si es necesario)
docker compose exec backend alembic downgrade base
```

### Conectarse directamente a la BD

```bash
# Entrar a PostgreSQL dentro del contenedor
docker compose exec db psql -U jyr_user -d calzado_jyr_db

# Comandos útiles en psql:
\dt                    # Ver todas las tablas
\d users               # Ver estructura de tabla 'users'
SELECT COUNT(*) FROM users;  # Ver cantidad de usuarios
SELECT COUNT(*) FROM products;  # Ver cantidad de productos (debe ser 65)
\q                     # Salir
```

### Ver logs para debugging

```bash
# Logs del backend (donde se ejecutan las migraciones)
docker compose logs backend -f

# Logs de PostgreSQL
docker compose logs db -f
```

## 📚 Referencias Documentación

- **Guía completa de migraciones:** [MIGRACIONES.md](../MIGRACIONES.md) (si existe)
- **Usuarios de prueba:** [USUARIOS_PRUEBA.md](../USUARIOS_PRUEBA.md) (si existe)
- **Cómo correr el proyecto:** [COMO_CORRER_PROYECTO.md](../COMO_CORRER_PROYECTO.md)
- **Análisis de arquitectura:** [ANALISIS_ARQUITECTURA_ALEMBIC.md](../ANALISIS_ARQUITECTURA_ALEMBIC.md)
- **Arquitectura del proyecto:** [docs/project-documentation/arquitectura_proyecto.md](../docs/project-documentation/arquitectura_proyecto.md)

## ✅ Exigencia Académica Cumplida

- ✅ Carpeta `db/` como **capa de infraestructura y operaciones**
- ✅ Alembic como **fuente oficial de tablas y datos de negocio**
- ✅ Bootstrap técnico separado (`init.sql` solo con extensiones)
- ✅ **Cero duplicaciones** entre `db/init/` y `be/alembic/versions/`
- ✅ Documentación clara de responsabilidades
- ✅ Compatible con reproducibilidad en nuevas máquinas

---

**Última actualización:** 2026-03-25
