# CALZADO J&R — Backend

Backend FastAPI para el sistema de gestión de calzado.

## Stack

- Python 3.12+
- FastAPI 0.115+
- SQLAlchemy 2.0 + Alembic (42 migraciones)
- PostgreSQL 17
- JWT (python-jose) + Bcrypt
- uv (gestor de dependencias)

## Estructura

```
be/app/
├── routers/         # 21 routers FastAPI (endpoint definitions)
├── controllers/     # 14 controllers (business logic delegation)
├── services/        # 8 services (domain logic)
├── models/          # 23 modelos SQLAlchemy
├── schemas/         # 13 esquemas Pydantic (request/response)
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

## Seed automático

Al arrancar el backend, `init_db.py` ejecuta:
1. `alembic upgrade head` — 42 migraciones
2. Datos semilla: roles (3), tipos de documento, 65 productos, usuarios de prueba
