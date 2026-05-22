# CALZADO J&R — Backend

Backend FastAPI para el sistema de gestión de calzado.

## Stack

- Python 3.12+
- FastAPI 0.115+
- SQLAlchemy 2.0 + Alembic (23 migraciones)
- PostgreSQL 17
- JWT (python-jose) + Bcrypt
- uv (gestor de dependencias)

## Estructura

```
be/app/
├── core/          # Configuración, base de datos, seguridad
├── init_db.py     # Auto-migraciones + seed al arrancar
├── models/        # Modelos SQLAlchemy (22 tablas)
├── modules/       # 8 módulos funcionales
│   ├── admin/     # Catálogo admin, reportes, gestión usuarios
│   ├── auth/      # Login, registro, JWT, logout global
│   ├── catalog/   # Catálogo público
│   ├── dashboard_jefe/  # Métricas del dashboard
│   ├── orders/    # Pedidos, producción, vales
│   ├── supplies/  # Insumos y movimientos
│   ├── type_document/  # Tipos de documento
│   └── users/     # CRUD usuarios
├── utils/         # Email SMTP, sanitizado, seguridad
└── main.py        # Punto de entrada
```

Cada módulo tiene: `router.py`, `controller.py` (o directo), `service.py`, `repository.py`.
Modelos están centralizados en `be/app/models/`, NO dentro de cada módulo.

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
1. `alembic upgrade head` — 23 migraciones
2. Datos semilla: roles (3), tipos de documento, 65 productos, usuarios de prueba
