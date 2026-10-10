# CALZADO J&R — Backend

Backend FastAPI para el sistema de gestión de calzado.

## Stack

- Python 3.12+
- FastAPI 0.115+
- SQLAlchemy 2.0 + Alembic (50 migraciones)
- PostgreSQL 17
- JWT (python-jose) + Bcrypt
- uv (gestor de dependencias)

## Estructura

```
be/app/
├── routers/         # 25 routers FastAPI (22 registrados en main.py)
├── controllers/     # 7 controllers (business logic delegation)
├── services/        # 10 services (domain logic)
├── models/          # 26 modelos SQLAlchemy (30 tablas)
├── schemas/         # 15 esquemas Pydantic (request/response)
├── middleware/      # Rate limiting, error handling, security headers
├── utils/           # Email SMTP, seguridad, crypto
├── init_db.py       # Auto-migraciones + seed al arrancar
└── main.py          # Punto de entrada
```

## Comandos

```bash
# Instalar
uv sync

# Desarrollo
uv run uvicorn app.main:app --reload

# Tests
uv run pytest

# Lint + formato
uv run ruff check
uv run ruff format
```

## Documentación API

http://localhost:8000/docs

## Scripts útiles

| Script | Propósito |
|--------|-----------|
| `be/scripts/create_admin.py` | Crear admin manualmente |
| `be/scripts/heal_line_groups.py` | Reparar `line_group` duplicados |
| `be/scripts/seed_full_flow.py` | Sembrar flujo completo de pedidos y tareas |
| `be/scripts/update_prices.py` | Actualizar precios en `task_prices` |
| `be/scripts/advance_tasks.py` | Avanzar tareas de producción |
| `be/scripts/fix_assignments.py` | Corregir asignaciones de tareas |
| `be/scripts/seed_ai_embeddings.py` | Sembrar embeddings para el chatbot IA |

## Seed automático

Al arrancar el backend, `init_db.py` ejecuta:
1. `alembic upgrade head` — 50 migraciones
2. Datos semilla: roles (3), tipos de documento, 65 productos, usuarios de prueba
