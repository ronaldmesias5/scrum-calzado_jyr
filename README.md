<div align="center">

# 👟 CALZADO J&R

### Sistema de Gestión y Producción de Calzado

**Inventario · Producción · Pedidos · Scrap · Reportes**

[![CI](https://github.com/ronaldmesias5/scrum-calzado_jyr/actions/workflows/ci.yml/badge.svg)](https://github.com/ronaldmesias5/scrum-calzado_jyr/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

---

## 📋 Descripción

**CALZADO J&R** es un sistema integral de gestión y producción para una marca de calzado urbano y casual. Centraliza el inventario, la planificación de producción, el ciclo de pedidos, el control de scrap (mermas e incidencias) y los reportes de negocio, con dashboards diferenciados por rol:

- **Dashboard Jefe** (16 páginas): supervisión total — catálogo, categorías, clientes y precios personalizados, pedidos y calendario, inventario, insumos, tareas de producción, incidencias (scrap, pérdidas, pendientes), usuarios, reportes con export PDF y chatbot IA.
- **Dashboard Empleado** (6 páginas): tareas disponibles y propias, incidencias de maquinaria/producto, rendimiento con PDF, perfil con avatar.
- **Dashboard Cliente** (6 páginas): catálogo mayorista con precios personalizados, pedidos con detalle de precio/subtotal, reportes e incidencias.
- **Público**: landing page y catálogo con pedido vía WhatsApp.

Además incluye una **app móvil** (Expo SDK 54) que consume la misma API para el panel de jefe.

**Estado**: funcionalidad completa (sprints 1–16), 104 tests de backend, pipeline de CI/CD activo.

---

## 🏗️ Arquitectura y Stack

Monorepo con 4 módulos:

```text
scrum-calzado_jyr/
├── be/          🐍 Backend — FastAPI + SQLAlchemy + Alembic + PostgreSQL
├── fe/          ⚛️ Frontend — React 19 + Vite + TailwindCSS 4
├── mobile/      📱 App móvil — Expo SDK 54 + React Native
├── db/          🗄️ Bootstrap de PostgreSQL (init.sql: extensiones)
├── docs/        📚 Arquitectura, diccionario de datos, sprints
└── docker-compose.yml / docker-compose.prod.yml
```

### 🐍 Backend — `be/`

| Tecnología | Uso |
|---|---|
| **FastAPI** | API REST + WebSockets (notificaciones en tiempo real) |
| **Python 3.12+ / uv** | Gestión de dependencias moderna y reproducible |
| **SQLAlchemy 2.0** | ORM con tipado estático (30 tablas, 26 modelos) |
| **Pydantic v2** | Validación de request/response y esquemas tipados |
| **Alembic** | 50 migraciones versionadas (se ejecutan solas al arrancar) |
| **PostgreSQL + pgvector** | BD relacional + embeddings para el chatbot IA |
| **JWT (access + refresh)** | Autenticación con logout global (versionado de sesiones) |

Arquitectura en capas: `routers/ → controllers/ → services/ → models/`, con middleware de rate limiting, manejo centralizado de errores, security headers y CSRF.

### ⚛️ Frontend — `fe/`

| Tecnología | Uso |
|---|---|
| **React 19 + TypeScript 5.9** | UI con type-safety estricto |
| **Vite 7** | Dev server ultrarrápido + build con code splitting por ruta |
| **TailwindCSS 4** | Sistema de diseño utility-first, dark mode |
| **React Router 7** | Enrutamiento con guardas por rol (`ProtectedRoute`, `RoleProtectedRoute`) |
| **axios** | Cliente HTTP con interceptor JWT |
| **i18next** | Internacionalización (español, inglés) |
| **jsPDF + autotable** | Export de reportes y catálogo a PDF |
| **Vitest + Testing Library** | Tests unitarios y de componente |

Atomic Design por feature (`features/{admin,client,employee,auth,landing,ai}/`), alias `@/` = `fe/src/`.

### 📱 Móvil — `mobile/`

Expo SDK 54 · React Native 0.81 · NativeWind · expo-router · Zustand · TanStack Query · SecureStore. Consume la misma API FastAPI con JWT (ver `mobile/AGENTS.md`).

---

## ✨ Características Clave

### 🔐 Seguridad

- **Control de roles** por ruta y por endpoint: `jefe`, `empleado`, `cliente` (guards en frontend + dependencias en backend).
- **Prevención de IDOR**: todo endpoint que recibe un ID valida pertenencia del recurso al usuario autenticado antes de retornar datos o mutar.
- **Rate limiting** en endpoints sensibles (login, registro) con bypass automático en entornos de test.
- **JWT con access (15 min) + refresh tokens** y logout global por rotación de versión de sesión.
- **Security headers + CSRF middleware** en todo el stack.
- **Docs de API (`/docs`, `/redoc`, `/openapi.json`) deshabilitadas en producción** (404) — solo disponibles en desarrollo.

### 🗄️ Integridad de Datos

- **Máquina de estados** en pedidos (`pendiente → en_progreso → completado → entregado / cancelado`), tareas e incidencias: transiciones inválidas rechazadas por backend.
- **Control de concurrencia con `SELECT ... FOR UPDATE`** en movimientos de inventario: sin race conditions al descontar stock entre usuarios simultáneos.
- **Soft deletes** + timestamps `created_at`/`updated_at` automáticos en todas las tablas.
- **Restricciones de unicidad** (ej. `uq_inventory_product_size_colour`) y claves foráneas con comportamiento explícito (`RESTRICT`/`SET NULL`/`CASCADE`).
- **Congelamiento de precios**: el precio se congela en `order_details` al crear el pedido (no cambia si cambia la tabla de precios).

### 📡 Observabilidad

- **Loggers centralizados** (`app_logger`, `error_logger`, `audit_logger`, `ai_logger`) con archivos rotativos + consola (12-factor). Cero `print()` en código de producción.
- **Health check real** `GET /api/v1/health` que verifica la conexión a BD (200/503), ejecutado en threadpool sin bloquear el event loop.
- **Handler global de excepciones** que loguea con traceback y IP del cliente.

### ⚡ Rendimiento

- **Code splitting por ruta** en Vite: cada página admin/empleado/cliente es un chunk separado (bundle inicial reducido).
- **Compresión GZip** vía middleware Starlette en todo el backend.
- **Índices de BD** en columnas de consulta frecuente (migración 050).
- **Caché de dependencias** en CI (uv + pnpm) para pipelines rápidos.

### 🚀 CI/CD — GitHub Actions

Pipeline en `.github/workflows/ci.yml` (push a `main`/`develop` + PRs):

| Job | Checks |
|---|---|
| **Backend** | Ruff (lint+format) → pytest (**104 tests**) con cobertura (`pytest-cov`, reporte XML como artifact) |
| **Frontend** | ESLint → `tsc -b` (typecheck estricto) → Vitest → `vite build` (build de producción) |

Plus **pre-push hook** local (`.githooks/pre-push`) que corre los mismos 5 checks antes de cada push. Activar con:

```bash
git config core.hooksPath .githooks
```

---

## 🚀 Instalación y Ejecución

### Requisitos

- Docker + Docker Compose **o** (manual) Python 3.12+ con [uv](https://docs.astral.sh/uv/) y Node 22+ con [pnpm](https://pnpm.io/)
- ⚠️ **pnpm es obligatorio** para `fe/` y `mobile/` — nunca npm ni yarn

### Opción A — Docker (recomendada)

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Levantar todo (db + backend + frontend + mailpit)
docker compose up -d --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API + `/docs` | http://localhost:8000/docs |
| Mailpit (correos dev) | http://localhost:8025 |

Los datos se migran y siembran automáticamente al arrancar el backend (`init_db.py`: tablas, roles, catálogo de 65 productos, usuarios de prueba).

### Opción B — Manual

**1. Variables de entorno**

```bash
cp .env.example .env
```

> En local sin Docker, ajusta `DATABASE_URL` para usar `localhost` en lugar de `db`.

**2. Base de datos (solo si no usas Docker para todo)**

```bash
docker compose up -d db
```

**3. Backend**

```bash
cd be
uv sync
uv run uvicorn app.main:app --reload
```

**4. Frontend**

```bash
cd fe
pnpm install
pnpm dev
```

### 🧪 Tests y calidad de código

```bash
# Backend (requiere Docker con db corriendo)
cd be && uv run ruff check && uv run pytest -q

# Frontend
cd fe && pnpm lint && npx tsc -b && pnpm test

# Verificación completa pre-push
.\scripts\check.ps1
```

### 📱 App móvil

```bash
cd mobile && pnpm install && pnpm start
```

---

## ⚙️ Variables de Entorno

Único archivo `.env.example` en la raíz. Copiar con `cp .env.example .env` y editar:

| Variable | Ejemplo | Descripción |
|---|---|---|
| `DATABASE_URL` | `postgresql://jyr_user:jyr_password@db:5432/calzado_jyr_db` | URL de conexión (host `db` en Docker, `localhost` en local) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `jyr_user` / `jyr_password` / `calzado_jyr_db` | Credenciales del contenedor PostgreSQL |
| `DB_PORT` | `5432` | Puerto del host hacia la BD (solo desarrollo) |
| `SECRET_KEY` | *(generar: `python -c "import secrets; print(secrets.token_urlsafe(48))"`)* | Firma JWT — **nunca en producción el default** |
| `ALGORITHM` | `HS256` | Algoritmo de firma JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Vida del access token |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | `10` | Vida del refresh token |
| `MAIL_SERVER` / `MAIL_PORT` | `mailpit` / `1025` | SMTP (Mailpit en dev; `smtp.gmail.com` / `587` para correos reales) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | | Credenciales SMTP (Gmail: App Password de 16 caracteres) |
| `MAIL_FROM` / `MAIL_FROM_NAME` | `notificaciones@calzadojyr.com` / `Calzado J&R` | Remitente |
| `FRONTEND_URL` | `http://localhost:5173` | Origen permitido por CORS |
| `VITE_API_URL` | `http://localhost:8000` | URL de la API para el cliente HTTP del frontend |
| `BE_PORT` / `FE_PORT` | `8000` / `5173` | Puertos expuestos al host |
| `ENVIRONMENT` | `development` | `development` \| `production` — en producción se ocultan docs y detalles de errores |
| `UPLOAD_DIR` | *(vacío = `be/uploads`)* | Directorio de imágenes y avatares |
| `AI_PROVIDER` | `groq` | Proveedor IA: `groq` \| `gemini` \| `ollama` \| `openai` |
| `AI_API_KEY` | | Clave del proveedor IA (vacío = chatbot deshabilitado, no rompe el sistema) |
| `AI_MODEL` / `AI_EMBEDDING_MODEL` | `openai/gpt-oss-20b` / `nomic-embed-text` | Modelo de chat y de embeddings |
| `AI_MAX_TOKENS` / `AI_EMBEDDING_DIM` | `512` / `768` | Límite de tokens y dimensión de embeddings |

---

## 🔑 Credenciales de Prueba

Al iniciar por primera vez el sistema siembra un usuario administrador:

| Campo | Valor |
|---|---|
| **Email** | `ronald.jefe@gmail.com` |
| **Contraseña** | `Test123456!` |

---

## 📚 Documentación Adicional

- `COMO_CORRER_PROYECTO.md` — instrucciones detalladas de arranque (español)
- `AGENTS.md` — convenciones para agentes de IA que trabajan en el repo
- `GUIA_RAPIDA_PROYECTO.md` — referencia rápida de routers, rutas y comandos
- `docs/project-documentation/` — arquitectura, diccionario de datos, requisitos
- `docs/sprints/` — plan de trabajo y backlogs de los 16 sprints
- Swagger (dev): http://localhost:8000/docs

---

## 👥 Equipo

| Rol | Integrante |
|---|---|
| Líder de Proyecto / Arquitecto FullStack | **Ronald Mesias** |
| Scrum Master | **Andrés** |
| DB / Infraestructura | **Santiago** |

---

<div align="center">

**© 2026 CALZADO J&R — Calidad y estilo en cada paso.**

Proyecto educativo · SENA

</div>
