# 🔄 Migraciones Alembic — Proyecto Calzado J&R

## Conversión de SQL a Migraciones

Tu proyecto ha sido convertido de **scripts SQL estáticos** a **migraciones Alembic versionadas**, siguiendo el patrón del instructor.

### ¿Por qué Migraciones?

| Antes (SQL Scripts) | Ahora (Alembic) |
|---|---|
| SQL bruto en archivos `.sql` | Código Python + SQL automático |
| No hay control de versiones | Historial completo de cambios |
| Imposible revertir cambios | `alembic downgrade -1` revierte fácilmente |
| Datos hardcodeados en scripts | Separación clara: schema + datos + test users |
| Manual `psql < script.sql` | Automático en startup o `alembic upgrade head` |

---

## Estructura de Migraciones

```
be/alembic/versions/
├── 001_create_initial_schema.py     # Crea todas las tablas, tipos ENUM, triggers
├── 002_seed_initial_data.py         # Inserta: roles, tipos de documento
├── 003_seed_catalog_data.py         # Inserta: marcas, categorías, estilos, productos
└── 004_seed_test_users.py           # Inserta: 3 usuarios de prueba (admin, employee, client)
```

### Aplicación Secuencial

Alembic ejecuta automáticamente en orden:

```
001 (schema) ← esqueleto de BD
    ↓
002 (roles) ← datos base de seguridad
    ↓
003 (catálogo) ← datos de producto
    ↓
004 (usuarios) ← usuarios de prueba
```

---

## Migraciones Existentes

| Revisión | Descripción | Qué carga |
| -------- | ----------- | --------- |
| `001_create_initial_schema` | Crea tablas, tipos ENUM, triggers, índices | Estructura BD |
| `002_seed_initial_data` | Inserta roles y tipos de documento | 3 roles + 6 tipos doc |
| `003_seed_catalog_data` | Inserta catálogo completo | 5 marcas + 3 categorías + 22 estilos + 65 productos |
| `004_seed_test_users` | **Nuevo:** Usuarios de prueba | admin@, cortador@, cliente@ |

### 👤 Usuarios de Prueba Que Se Crean

Ver `USUARIOS_PRUEBA.md` para credenciales completas.

```
admin@calzadojyr.com    / admin123    → Rol: admin (dashboard completo)
cortador@calzadojyr.com / cortador123 → Rol: employee (producción)
cliente@calzadojyr.com  / cliente123  → Rol: client (compras)
```

---

## Comandos Principales

### 🚀 Aplicar todas las migraciones (primera vez)

```bash
cd be
alembic upgrade head
```

**Resultado:** BD completamente creada + datos iniciales + usuarios de prueba.

### 📊 Ver estado actual

```bash
alembic current
```

**Salida típica:**
```
004_seed_test_users (head)
```

### 📜 Ver historial de migraciones

```bash
alembic history --verbose
```

**Salida:**
```
<base> -> 001_create_initial_schema
001_create_initial_schema -> 002_seed_initial_data
002_seed_initial_data -> 003_seed_catalog_data
003_seed_catalog_data -> 004_seed_test_users (head)
```

### ↩️ Revertir última migración (SOLO DESARROLLO)

```bash
alembic downgrade -1
```

⚠️ **Destructivo** — Borra usuarios de prueba. Solo en desarrollo.

### 🔀 Ir a versión específica

```bash
alembic upgrade 003_seed_catalog_data
# Omite usuarios de prueba
```

---

## Crear Nueva Migración

Si modificas los modelos ORM, crea una migración:

```bash
# 1. Modificar modelo en app/models/algo.py
# 2. Generar migración automáticamente
alembic revision --autogenerate -m "descripcion del cambio"

# 3. Revisar be/alembic/versions/xxx_descripcion.py
# 4. Aplicar
alembic upgrade head
```

---

## Migraciones en Docker

Las migraciones se ejecutan **automáticamente** en el Dockerfile:

```dockerfile
# be/Dockerfile
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app ..."]
```

**Flujo:**
1. Contenedor inicia
2. `alembic upgrade head` crea/actualiza BD automáticamente
3. API se inicia
4. ✅ BD lista con usuarios de prueba

---

## Migraciones en Desarrollo Local

### Opción 1: Manual (explícito)

```bash
cd be
pip install -e .  # Instala deps
alembic upgrade head  # Aplica migraciones
python -m uvicorn app.main:app --reload
```

### Opción 2: Automático con Docker

```bash
docker compose up
# Todo automático:
# - BD creadaque
# - Migraciones aplicadas
# - Usuarios de prueba listos
```

---

## Troubleshooting

### "FATAL: role 'usuario' does not exist"

Las migraciones NO crean el usuario PostgreSQL. Hacerlo manualmente:

```bash
sudo -u postgres psql
CREATE USER tu_usuario WITH PASSWORD 'contraseña';
CREATE DATABASE tu_bd OWNER tu_usuario;
```

### "No such file or directory: alembic.ini"

Asegúrate de estar en el directorio correcto:

```bash
cd be && alembic upgrade head
# NO: cd proyecto_calzado_jyr && alembic upgrade head
```

### Error: "Can't locate revision x"

Las migraciones tienen una cadena de dependencias. Si alteras los IDs, se rompe. Solución:

```bash
alembic current
alembic downgrade base
alembic upgrade head
```

---

## Archivos Antiguos (Pueden Eliminarse)

Ya no necesitas estos scripts SQL, están reemplazados por Alembic:

```
db/deprecated/
├── 01_create_tables.sql
├── 02_triggers_and_indexes.sql
├── 03_seed_brands_categories_styles.sql
└── 99_seed_type_documents.sql
```

✅ Se han movido a `db/deprecated/` como referencia histórica.

---

## 🎯 Conclusión

**Tu BD ahora es:**
- ✅ Versionada (git history)
- ✅ Reversible (downgrade)
- ✅ Automática (Docker)
- ✅ Reproducible (otra PC)
- ✅ Con datos de prueba listos (admin@calzadojyr.com)

---

**¡Tu proyecto ahora usa migraciones profesionales como el instructor! 🎉**
