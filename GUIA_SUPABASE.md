# GUÍA SUPABASE — Calzado J&R

> **¿Qué es esta guía?** Explica qué es Supabase, qué aportaría al proyecto, cómo funciona
> la integración, y la recomendación de cuándo/cómo implementarlo.
>
> **¿Para quién?** Desarrolladores y administradores del sistema que necesiten decidir
> si migrar la base de datos a la nube.

---

## 1. ¿Qué es Supabase?

**Supabase es PostgreSQL en la nube** con servicios adicionales (Auth, Storage, Realtime,
Edge Functions). Esencialmente: un PostgreSQL gestionado con panel web, backups automáticos
y API REST/GraphQL generada automáticamente sobre tus tablas.

| Capa | ¿Qué ofrece? | ¿Lo usamos? |
|------|-------------|------------|
| **Base de datos** | PostgreSQL 15+ gestionado, backups diarios, point-in-time recovery | ✅ **Sí — es lo único que necesitamos** |
| **Auth** | Login social, magic links, roles, row-level security | ❌ No — ya tenemos JWT + bcrypt propio |
| **Storage** | Almacenamiento de archivos con CDN | ❌ No — ya tenemos `/uploads/` local |
| **Realtime** | WebSockets para cambios en vivo | ❌ No — no hay requerimiento actual |
| **Edge Functions** | Funciones serverless Deno | ❌ No — FastAPI cubre toda la lógica |

**Conclusión:** Solo usaríamos Supabase como **hosting de PostgreSQL**, nada más. El resto
del stack (FastAPI, React, JWT, uploads) se mantiene exactamente igual.

---

## 2. ¿Cómo funciona la integración?

### 2.1 Arquitectura actual (100% local con Docker)

```
┌──────────────────────────────────────────────┐
│  docker compose up                           │
│                                              │
│  ┌─────────┐   ┌─────────┐   ┌───────────┐  │
│  │   FE    │──▶│   BE    │──▶│    DB     │  │
│  │ :5173   │   │ :8000   │   │ postgres  │  │
│  │ React   │   │ FastAPI │   │ :5432     │  │
│  └─────────┘   └─────────┘   └───────────┘  │
│                                              │
│  ┌─────────┐                                 │
│  │ mailpit │   (correos de prueba)           │
│  │ :8025   │                                 │
│  └─────────┘                                 │
│                                              │
│  Red interna: calzado_jyr_net                │
└──────────────────────────────────────────────┘
```

### 2.2 Arquitectura con Supabase (producción)

```
┌─────────── Internet ────────────────────────────────┐
│                                                     │
│  ┌─────────┐   ┌─────────┐       ┌──────────────┐  │
│  │   FE    │──▶│   BE    │──▶    │   SUPABASE   │  │
│  │ :5173   │   │ :8000   │  HTTPS │  PostgreSQL  │  │
│  │ React   │   │ FastAPI │──────▶│  ☁️ nube     │  │
│  └─────────┘   └─────────┘       └──────────────┘  │
│                                                     │
│  ┌─────────┐                                        │
│  │ mailpit │   (solo en desarrollo)                 │
│  │ :8025   │                                        │
│  └─────────┘                                        │
└─────────────────────────────────────────────────────┘
```

### 2.3 ¿Qué cambia en el código?

**NADA.** El backend se conecta vía URL de conexión PostgreSQL estándar:

```python
# be/app/core/database.py:30 — así se conecta el backend
engine = create_engine(settings.DATABASE_URL, ...)
```

Supabase te da un `DATABASE_URL` con formato idéntico:

```
# Actual (local con Docker)
postgresql://usuario:password@db:5432/calzado_jyr_db

# Supabase (producción)
postgresql://postgres.abc123:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**Solo cambia una variable de entorno.** Cero cambios de código.

### 2.4 ¿Qué cambia en Docker?

Se **elimina** el servicio `db` del `docker-compose.yml` porque la BD ya no corre localmente:

```yaml
# ESTO se elimina:
db:
  image: postgres:17-alpine
  container_name: calzado_jyr_db
  ...

# ESTO se mantiene igual:
be:
  ...
fe:
  ...
mailpit:
  ...
```

También se eliminan:
- El volumen `calzado_jyr_data` (ya no hay datos locales)
- La dependencia `depends_on: db` en el servicio `be`
- El healthcheck de PostgreSQL

`be`, `fe` y `mailpit` siguen funcionando exactamente igual.

> **Alternativa:** Crear un `docker-compose.prod.yml` separado que no incluya `db`, en lugar
> de modificar el actual. Así se mantienen ambos entornos sin conflictos.

---

## 3. ¿Qué gana el proyecto con Supabase?

### Ventajas reales

| Ventaja | Descripción |
|---------|-------------|
| **Cero mantenimiento de BD** | No gestionar backups, updates de PostgreSQL, ni espacio en disco |
| **Panel web** | Ver tablas, filas, ejecutar SQL desde el navegador (Table Editor) |
| **Backups automáticos** | Supabase hace backups diarios + point-in-time recovery (últimos 7 días en plan gratuito) |
| **Pool de conexiones** | PgBouncer integrado para manejar múltiples conexiones concurrentes |
| **Accesible desde cualquier máquina** | Solo necesitas Docker para BE+FE, sin PostgreSQL local |
| **Escalable** | Plan gratuito: 500 MB BD, 2 GB transferencia. Plan Pro: 8 GB BD, 50 GB transferencia |
| **Conexión segura** | SSL/TLS forzado, IP allowlist, API keys para acceso programático |

### Lo que NO cambia

- **Auth (JWT + bcrypt):** Sigue funcionando con nuestra tabla `users`, no se toca
- **Migraciones Alembic:** Se siguen ejecutando al iniciar el backend
- **Seed data:** Roles, tipos de documento, catálogo, usuarios de prueba — todo igual
- **Lógica de negocio:** Inventory, orders, tasks, notifications — sin cambios
- **Frontend:** No se entera de dónde está la BD

---

## 4. Plan de implementación

### 4.1 ¿Cuándo implementarlo?

```
DESARROLLO                     PRODUCCIÓN
    │                               │
    │  NO usar Supabase             │  SÍ usar Supabase
    │  PostgreSQL local (Docker)    │  PostgreSQL en la nube
    │                               │
    ▼                               ▼
```

**Regla:** Supabase solo en producción. En desarrollo, Docker con PostgreSQL local es más
rápido (sin latencia de red) y no consume transferencia del plan gratuito.

### 4.2 Pasos para producción

#### Paso 1 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → "New project"
2. Elegir organización, nombre (`calzado-jyr`), región (la más cercana a tus usuarios)
3. **IMPORTANTE:** Guardar la contraseña de BD que te pide (no se puede recuperar después)
4. Esperar ~2 minutos a que el proyecto se cree

#### Paso 2 — Obtener la URL de conexión

En el dashboard de Supabase: **Settings → Database → Connection string**

Hay dos modos de conexión:

| Modo | Puerto | ¿Cuándo usarlo? |
|------|--------|-----------------|
| **Session mode** (PgBouncer) | `6543` | ✅ **Recomendado** — usa pool de conexiones, mejor para aplicaciones web |
| **Transaction mode** | `5432` | Conexión directa (solo para migraciones y operaciones administrativas) |

Para el backend usaremos **Session mode** (puerto 6543):

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

#### Paso 3 — Configurar `.env` de producción

```env
# ════════════════════════════════════════
# 🐘 PostgreSQL — Supabase (PRODUCCIÓN)
# ════════════════════════════════════════
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Ya no se necesitan estas variables (la BD no es local):
# POSTGRES_USER (innecesario)
# POSTGRES_PASSWORD (innecesario)
# POSTGRES_DB (innecesario)
# DB_PORT (innecesario)

# ════════════════════════════════════════
# 📧 Email — SMTP real (Gmail)
# ════════════════════════════════════════
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=jyrcalzado@gmail.com
MAIL_PASSWORD=[APP_PASSWORD]
ENVIRONMENT=production

# El resto de variables se mantienen igual
```

#### Paso 4 — Ejecutar migraciones

```bash
# Opción A: Dejar que el backend las ejecute (init_db.py)
docker compose up -d --build be

# Opción B: Ejecutarlas manualmente desde tu máquina
cd be
DATABASE_URL=postgresql://...[URL_SUPABASE] uv run alembic upgrade head
```

Las migraciones de Alembic crearán todas las tablas, constraints, e índices
automáticamente. El seed data (roles, catálogo, usuarios de prueba) también
se insertará.

#### Paso 5 — Verificar

```bash
# Verificar que el backend se conectó
docker logs calzado_jyr_be

# Deberías ver algo como:
# INFO:     Started server process [1]
# INFO:     Waiting for application startup.
# INFO:     ✓ Database tables verified successfully
# INFO:     Application startup complete.
```

Probar login con el usuario admin de prueba (`ronald.jefe@gmail.com` / `Test123456!`).

---

## 5. Preguntas frecuentes

### ¿Puedo tener Supabase en desarrollo también?

Sí, pero **no se recomienda**. Razones:

- Cada consulta va por internet (latencia ~50-200ms vs <1ms local)
- Consume los 2 GB de transferencia del plan gratuito
- Si te quedas sin internet, no puedes trabajar

Docker con PostgreSQL local es más rápido y no tiene límites.

### ¿Qué pasa con los datos que ya tengo en desarrollo?

Si ya tienes datos reales que quieres migrar a producción, puedes hacer un dump/restore:

```bash
# Exportar desde Docker local
docker exec calzado_jyr_db pg_dump -U usuario calzado_jyr_db > backup.sql

# Importar a Supabase
psql "postgresql://...[URL_SUPABASE]" < backup.sql
```

### ¿Supabase ve mis datos?

Sí, igual que cualquier proveedor de hosting de BD. Los datos están cifrados en disco
y en tránsito (SSL), pero el proveedor tiene acceso técnico. Para datos extremadamente
sensibles, considera cifrado a nivel de aplicación.

### ¿Qué pasa si Supabase se cae?

El backend intentará reconectarse automáticamente (gracias al pool de SQLAlchemy).
Los usuarios verían errores 500 mientras dure la caída. El plan gratuito tiene
99.9% de uptime. Para producción crítica, considera el plan Pro (99.95% SLA).

### ¿Necesito las otras features de Supabase (Auth, Storage, etc.)?

**No.** El proyecto ya tiene:

- **Auth:** JWT + bcrypt + refresh tokens + must_change_password
- **Storage:** `/uploads/` servido estáticamente por FastAPI
- **Realtime:** No hay requerimiento de actualizaciones en tiempo real

Migrar a Supabase Auth implicaría reescribir todo el módulo `be/app/modules/auth/`,
los guards de autorización, y el frontend de login. No vale la pena.

---

## 6. Resumen

| | Desarrollo | Producción |
|---|---|---|
| **Base de datos** | PostgreSQL 17 en Docker | Supabase (PostgreSQL gestionado) |
| **Conexión** | `postgresql://...@db:5432/...` | `postgresql://...@pooler.supabase.com:6543/...` |
| **Cambios en código** | Ninguno | Ninguno |
| **Docker** | Servicio `db` incluido | Servicio `db` eliminado |
| **Backups** | Manuales (pg_dump) | Automáticos (Supabase) |
| **Panel web** | No (usar DBeaver/pgAdmin) | Sí (Table Editor de Supabase) |

**Recomendación final:**

> Mantener PostgreSQL local en Docker durante todo el desarrollo.
> El día que el sistema vaya a producción, cambiar `DATABASE_URL` en `.env`
> a la URL de Supabase y eliminar el servicio `db` del `docker-compose.yml`.
> Nada más.

---

## 7. Referencias

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [PgBouncer en Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Migraciones con Alembic](https://alembic.sqlalchemy.org/en/latest/)
