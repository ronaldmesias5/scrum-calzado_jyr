# AGENTS.md — CALZADO J&R

Instrucciones para agentes de OpenCode que trabajen en este repositorio.
Solo incluye información que un agente NO inferiría fácilmente de los archivos del proyecto.

---

## Arquitectura general

Monorepo con 3 módulos:
- `be/` — Backend Python 3.12+ (FastAPI + SQLAlchemy + Alembic + PostgreSQL)
- `fe/` — Frontend TypeScript (React 19 + Vite + TailwindCSS 4)
- `db/` — Solo scripts de bootstrap PostgreSQL (`init.sql`: extensiones, no esquema)

**El esquema de BD lo crean las migraciones Alembic al arrancar el backend**, no `db/init/`. El orden real es: `init.sql` (extensiones) → Alembic `init_db.py` (tablas/esquema) → seed data.

---

## Comandos esenciales

### Arranque con Docker (recomendado)
```bash
cp .env.example .env              # solo la primera vez
docker compose up -d --build      # levanta db + be + fe + mailpit
```

### Backend sin Docker
```bash
cd be
uv sync                           # instalar dependencias
uv run uvicorn app.main:app --reload
```
- **No hay `requirements.txt`** — usa `pyproject.toml` con `uv`.
- Python 3.12+ obligatorio (usa sintaxis de tipos nueva).

### Frontend sin Docker
```bash
cd fe
pnpm install                      # NUNCA npm ni yarn
pnpm dev
```
- **pnpm es OBLIGATORIO para el frontend.** `npm` y `yarn` rompen la resolución de dependencias.
- En Windows con Docker, Vite usa polling (`vite.config.ts:55`) porque inotify no funciona.

### Pruebas
```bash
# Backend
cd be && uv run pytest            # todos los tests
uv run pytest tests/test_security.py -v  # un archivo específico

# Frontend
cd fe && pnpm test                # vitest run (single pass)
pnpm test:watch                   # vitest en modo watch
pnpm test:coverage                # coverage con v8
```

### Linting y formateo
```bash
# Backend — Ruff (lint + format en uno)
cd be && uv run ruff check        # lint
uv run ruff format                # formato (line-length 100)

# Frontend
cd fe && pnpm lint                # ESLint
pnpm format                       # Prettier write
pnpm format:check                 # Prettier solo verificar
```

### Typecheck
```bash
cd fe && npx tsc -b               # TypeScript strict mode
```
**El backend no tiene typecheck separado** (sin mypy/pyright).

### Build de producción
```bash
# Frontend: typecheck + build
cd fe && pnpm build               # ejecuta tsc -b && vite build
```

---

## Base de datos y migraciones

- Las migraciones de Alembic se ejecutan **automáticamente al iniciar el backend** (`be/app/init_db.py`), tanto en Docker como local.
- Los datos semilla también se insertan automáticamente (roles, tipos de documento, catálogo con 65 productos, usuarios de prueba).
- **Nunca ejecutes `alembic upgrade head` manualmente** a menos que estés depurando algo muy específico.
- Hay 19 migraciones en `be/alembic/versions/`. Al crear una nueva, el hook `ruff check --fix` se dispara automáticamente.

### Usuario admin de prueba
```
Email: ronald.jefe@gmail.com
Contraseña: Test123456!
```

---

## Variables de entorno

Un solo `.env` en la raíz. Copiar de `.env.example`. Los `.env` individuales en `be/` y `fe/` son obsoletos (ignorar).

**Dato clave para Docker**: `DATABASE_URL` usa `db` como hostname (nombre del servicio), no `localhost`. En local sin Docker debe ser `localhost`.

---

## Estructura y convenciones

### Backend — módulos por funcionalidad
```
be/app/modules/
├── auth/            # Autenticación (JWT + Bcrypt)
├── users/           # CRUD usuarios
├── admin/           # Rutas admin + catálogo admin + reportes
├── dashboard_jefe/  # Dashboard del jefe
├── orders/          # Pedidos
├── catalog/         # Catálogo público
├── supplies/        # Insumos
└── type_document/   # Tipos de documento
```
- Cada módulo tiene `router.py`, `controller.py`, `service.py`, `repository.py`.
- Modelos centralizados en `be/app/models/` (no dentro de cada módulo).

### Frontend — import alias `@`
```typescript
import { Button } from "@/components/ui/Button"   // @ = fe/src/
```
Usar **siempre** `@/` para imports internos, nunca rutas relativas largas.

### Frontend — módulos
```
fe/src/modules/
├── auth/            # Login, Register, Password Reset
├── dashboard-jefe/  # Panel admin completo
└── landing/         # Landing page pública + catálogo
```

---

## Gotchas y peculiaridades

1. **pnpm, no npm/yarn**: El `package.json` no tiene `engines` que lo bloqueen, pero las dependencias se resolvieron con pnpm. Usar otro gestor rompe `node_modules`.

2. **Docker en Windows**: Vite necesita `usePolling: true` para hot-reload. Ya está configurado en `vite.config.ts`. Si los cambios no se detectan, NO lo quites.

3. **Volumen anónimo de node_modules**: En Docker, `docker-compose.yml` define `/app/node_modules` como volumen anónimo para que el mount `./fe:/app` no sobrescriba los módulos instalados. Si los imports fallan en Docker, reconstruye con `docker compose up -d --build`.

4. **CORS**: `FRONTEND_URL` en `.env` debe coincidir con la URL real desde la que se sirve el frontend. El backend lo usa para configurar `CORSMiddleware`.

5. **Línea de build del frontend**: `pnpm build` primero ejecuta `tsc -b` (typecheck). Si el typecheck falla, el build falla.

6. **Ruff line-length**: 100 caracteres. No uses `black` ni `flake8` — solo Ruff.

7. **`asyncio_mode = "auto"`** en pytest. Los tests async no necesitan decorador `@pytest.mark.asyncio`.

8. **Mailpit**: En desarrollo los correos van a http://localhost:8025, no se envían realmente.

9. **No hay CI/CD**: El proyecto no tiene GitHub Actions ni pre-commit hooks.

10. **Script standalone**: `be/scripts/create_admin.py` — crea un admin por fuera de la API. Útil si la BD se corrompe o se pierde el seed.

---

## Fuentes de verdad adicionales

- `COMO_CORRER_PROYECTO.md` — instrucciones en español para arrancar el proyecto
- `docs/project-documentation/` — arquitectura, diccionario de datos, requerimientos
- `docs/sprints/` — plan de trabajo y backlogs de sprints
- `docs/GUIA_DISENO.md` — guía de diseño visual, consistencia de UI y plantilla para nuevas secciones
- `README.md` (raíz) — descripción general del sistema
