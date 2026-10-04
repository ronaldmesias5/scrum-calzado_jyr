# AGENTS.md — CALZADO J&R

Instrucciones para agentes de OpenCode que trabajen en este repositorio.
Solo incluye información que un agente NO inferiría fácilmente de los archivos del proyecto.

---

## Arquitectura general

Monorepo con 4 módulos:
- `be/` — Backend Python 3.12+ (FastAPI + SQLAlchemy + Alembic + PostgreSQL)
- `fe/` — Frontend TypeScript (React 19 + Vite + TailwindCSS 4)
- `db/` — Solo scripts de bootstrap PostgreSQL (`init.sql`: extensiones, no esquema)
- `mobile/` — App móvil (Expo SDK 54 + React Native 0.81 + NativeWind + expo-router 6)

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
- En Windows con Docker, Vite usa polling (`vite.config.ts:52`) porque inotify no funciona.

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

### Verificación pre-push
```bash
# Script manual — corre todos los checks de CI localmente
.\scripts\check.ps1

# El pre-push hook se ejecuta automáticamente al hacer git push.
# Corre: validación de migration IDs, ruff, pytest (Docker), tsc, pnpm test.
# Para activarlo: git config core.hooksPath .githooks
# Para saltarlo: git push --no-verify
```

### App móvil
```bash
cd mobile
pnpm install                      # NUNCA npm ni yarn
pnpm start                        # expo start (Metro)
pnpm typecheck                    # tsc --noEmit
pnpm lint                         # expo lint
```
- **pnpm es OBLIGATORIO** para mobile también.
- La app móvil consume el backend FastAPI (`be/`) con JWT. Ver `mobile/AGENTS.md` para detalles.

---

## Base de datos y migraciones

- Las migraciones de Alembic se ejecutan **automáticamente al iniciar el backend** (`be/app/init_db.py`), tanto en Docker como local.
- Los datos semilla también se insertan automáticamente (roles, tipos de documento, catálogo con 65 productos, usuarios de prueba).
- **Nunca ejecutes `alembic upgrade head` manualmente** a menos que estés depurando algo muy específico.
- Hay 50 migraciones en `be/alembic/versions/` (001–049, con 043 duplicado intencionalmente: `email_verification_tokens` y `task_priority_remove_media`). Al crear una nueva, el hook `ruff check --fix` se dispara automáticamente.

### Usuario admin de prueba
```
Email: ronald.jefe@gmail.com
Contraseña: Test123456!
```

---

## Variables de entorno

Un solo `.env` en la raíz. Copiar de `.env.example`. No existen `.env` en `be/` ni `fe/`.

**Dato clave para Docker**: `DATABASE_URL` usa `db` como hostname (nombre del servicio), no `localhost`. En local sin Docker debe ser `localhost`.

---

## Estructura y convenciones

### Backend — capas por funcionalidad
```
be/app/
├── routers/           # 25 routers FastAPI (22 registrados en main.py)
├── controllers/       # 7 controllers (business logic delegation)
├── services/          # 10 services (domain logic)
├── models/            # 26 modelos SQLAlchemy (30 tablas)
├── schemas/           # 15 esquemas Pydantic (request/response)
├── middleware/        # Rate limiting, error handling, security headers
├── utils/             # Email, seguridad, crypto
├── init_db.py         # Auto-migraciones + seed al arrancar
└── main.py            # Punto de entrada
```
- Modelos centralizados en `be/app/models/` (26 modelos, 30 tablas) — no dentro de cada módulo.
- Routers nuevos sin registrar en docs anteriores: `client_prices.py`, `catalog_categories.py`, `bulk_import.py`, `ai_chat.py`.
- No existe directorio `be/app/modules/` — la estructura es por capa (routers/, controllers/, services/).

### Frontend — import alias `@`
```typescript
import { Button } from "@/components/atoms/Button"   // @ = fe/src/
```
Usar **siempre** `@/` para imports internos, nunca rutas relativas largas.

### Frontend — estructura feature-based
Cada feature organiza sus componentes con **Atomic Design** dentro de `components/{atoms,molecules,organisms}/`. Los átomos globales viven en `fe/src/components/atoms/`.
```
fe/src/
├── app/                  # Entry points (App.tsx, main.tsx, i18n.ts, ProtectedRoute, RoleProtectedRoute)
├── assets/               # Recursos estáticos
├── components/
│   ├── atoms/            # Átomos globales (Button, Modal, Toast, PageTransition, Pagination…)
│   └── layout/           # Layouts globales (AppLayout, AuthLayout…)
├── features/             # Features de negocio (Atomic Design por feature)
│   ├── admin/            # Panel admin (16 páginas)
│   │   ├── components/
│   │   │   ├── atoms/    # StatCard, StatusBadgeComponent
│   │   │   ├── molecules/  # SummarySizer, TaskCard, CreateUserForm, modales (DeleteConfirmModal,
│   │   │   │              #   StatusConfirmModal, ImageViewerModal, AdjustInventoryModal,
│   │   │   │              #   AdjustManufacturedModal, ContactClientModal, EditProductModal,
│   │   │   │              #   LossFormModal, ProductCreateModal, ProductEditModal,
│   │   │   │              #   ViewManufacturedModal, BrandFormModal, InventoryFormModal,
│   │   │   │              #   ProductFormModal, StyleFormModal)
│   │   │   └── organisms/  # OrderFormModal, home/ (AlertsPanel, AvailableTasksPanel…), layout/ (AdminHeader,
│   │   │                  #   AdminLayout, AdminSidebar, NotificationsPanel)
│   │   └── utils/        # reportsUtils.ts, catalogPdfUtils.ts (export PDF catálogo)
│   ├── ai/               # Chatbot IA (Águila J&R) con embeddings deterministas Dim 768
│   ├── auth/             # Login, Register, Password Reset
│   │   └── components/   # molecules/ (LoginForm, RegisterForm…), organisms/ (AuthModals)
│   ├── client/           # Panel cliente
│   │   └── components/   # molecules/ (WholesaleCatalogFilters, WholesaleProductCard), organisms/ (ClientLayout, ClientSidebar)
│   ├── employee/         # Panel empleado
│   │   ├── components/   # molecules/ (EmployeeValeModal), organisms/ (EmployeeLayout, EmployeeSidebar)
│   │   └── utils/        # reportsUtils.ts (exportPerformancePDF)
│   └── landing/         # Landing page pública + catálogo
│       ├── components/   # atoms/ (WhatsAppButton), molecules/ (ProductCard, CatalogFilters), organisms/ (LandingHeader…)
│       └── config/      # whatsappConfig.ts
├── pages/                # Páginas enrutables
│   ├── admin/            # 16 páginas del panel admin
│   ├── auth/             # 8 páginas (login, register, password reset…)
│   ├── client/           # 6 páginas (DashboardPage, OrdersPage, WholesaleCatalogPage, ReportsPage, SettingsPage, MisIncidenciasPage)
│   ├── employee/         # 6 páginas (Dashboard, Tasks, AvailableTasks, Incidences, Reports, Settings)
│   └── public/           # 2 páginas (LandingPage, CatalogPage)
├── hooks/                # Hooks reutilizables (useAuth, useModalDialog, useNotificationWebSocket…)
├── services/             # Servicios de API globales (adminApi, authService, ordersApi, employeeApi, clientApi…)
├── store/                # Contextos globales (Auth, Theme, Toast, BadgeCounts, EmployeeBadgeCounts)
├── types/                # Tipos TypeScript compartidos (auth, orders, products, tasks…)
├── utils/                # Utilidades (format, routing…)
├── styles/               # Estilos globales (TailwindCSS)
└── locales/              # Traducciones (en, es)
```

---

## Features implementadas (últimos sprints)

- **Precios por cliente** (migración 049, `client_prices`): cada cliente puede tener precio propio por producto. CRUD admin `GET/POST/PUT/DELETE /api/v1/admin/client-prices` (más `POST /bulk`) en `client_prices.py`; el catálogo cliente (`GET /api/v1/client/catalog/products`) devuelve `unit_price`. La columna `client_prices.unit_price` guarda el precio por par; al crear un pedido se congela en `order_details.unit_price` (no se actualiza si el precio de tabla cambia).
- **Precio unitario en detalle de pedido**: `OrderDetailItem.unit_price` en responses de admin y cliente; badges de precio/subtotal en `OrdersPage.tsx` (admin y cliente) y fila "Total Pedido".
- **Export PDF del catálogo**: `fe/src/features/admin/utils/catalogPdfUtils.ts` (jspdf + autotable) para exportar productos del catálogo admin.
- **CRUD de categorías** (HU-007 / RF-007): endpoints `GET/POST/PUT/DELETE /admin/categories` en `catalog_categories.py`, con validación de nombres únicos y filtrado `isRealCategory()` en el frontend para excluir nombres de etapas de producción usados como categoría falsos.
- **Edición de tareas** (HU-027 / RF-027): `PUT /orders/tasks/{task_id}` en `orders_tasks.py` permite editar fase, prioridad, notas, fechas y asignación. **No existe DELETE** — las tareas no se eliminan (FK a pedidos, vales, incidencias); solo se editan.
- **Reportes mensuales** (HU-035 / RF-035): `GET /admin/reports/customer/{id}/monthly` (migración 047 + `reports.py`) devuelve órdenes agrupadas por mes calendario; gráfico mensual en `fe/src/pages/admin/ReportsPage.tsx`.
- **Catálogo mayorista con precios**: `WholesaleCatalogPage` y `WholesaleProductCard` muestran precio por docena/par con precio personalizado del cliente si existe.
- **Chatbot IA "Águila J&R"**: embeddings deterministas Dim 768 (`fe/src/features/ai/`), router `ai_chat.py` con rate limit e inyección de instrucciones protegida. Scripts: `be/scripts/seed_ai_embeddings.py`.
- **Calendario de Pedidos**: `GET /api/v1/admin/orders/calendar` (solo jefe, en `orders.py`), devuelve pedidos con `delivery_date` en el rango + pedidos sin fecha, con `vale_numbers` y tareas pendientes. Frontend: `fe/src/pages/admin/CalendarPage.tsx`, ruta `/dashboard/admin/calendar`, entrada "Calendario" en `AdminSidebar.tsx`.

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

9. **Pre-push hook**: Git ejecuta `.githooks/pre-push` automáticamente antes de cada push. Corre los mismos checks que CI (ruff, pytest, tsc, pnpm test, validación de migration IDs). Para activarlo: `git config core.hooksPath .githooks`. Para saltarlo: `git push --no-verify`. Script manual: `.\scripts\check.ps1`.

10. **Script standalone**: `be/scripts/create_admin.py` — crea un admin por fuera de la API. Útil si la BD se corrompe o se pierde el seed.
11. **Script heal**: `be/scripts/heal_line_groups.py` — repara `line_group` duplicados en `order_details`.

12. **Avatar upload**: Los avatares se almacenan en `/uploads/` (misma infraestructura que imágenes de producto). El backend sirve estos archivos estáticamente. La URL incluye `?v=timestamp` para cache-busting. Formato de archivo: `avatar_{user_id}.ext`.

13. **Dashboard Empleado**: Feature `fe/src/features/employee/` con 6 páginas en `fe/src/pages/employee/`. Las preferencias del empleado se almacenan en localStorage con prefijo `emp_` para evitar colisiones con las del admin.

14. **Dashboard Cliente**: Feature `fe/src/features/client/` con 6 páginas en `fe/src/pages/client/` (DashboardPage, OrdersPage, WholesaleCatalogPage, ReportsPage, SettingsPage, MisIncidenciasPage).

15. **PDF export**: Usa `jspdf` + `jspdf-autotable`. La función `sanitizeFilename()` elimina caracteres prohibidos por Windows (`<>:"/\|?*`) de los nombres de archivo. Hay implementaciones separadas en `features/admin/utils/reportsUtils.ts` y `features/employee/utils/reportsUtils.ts`.

16. **App móvil**: `mobile/` es una app Expo SDK 54 que consume la misma API del backend. En desarrollo, Metro web corre en `http://localhost:8081` — asegúrate de que CORS en `be/app/main.py` incluya ese origen. Ver `mobile/AGENTS.md` para stack completo, gotchas y plan de fases.

## Patrones de frontend implementados

### Modal base (`fe/src/components/atoms/Modal.tsx`)
- Usa `createPortal`, `role="dialog"`, `aria-modal="true"`, focus trap, Escape handler
- Variantes de tamaño: `sm`, `md`, `lg`, `xl`, `full`
- Variantes de color: `default`, `danger`
- **NUNCA** crear un modal manualmente — usar `<Modal>` + `useModalDialog` hook

### PageTransition (`fe/src/components/atoms/PageTransition.tsx`)
- Envuelve `<Outlet />` en `AdminLayout.tsx`
- Aplica `animate-in fade-in slide-in-from-top-4 duration-500` en cada navegación
- Usa `key={location.pathname}` para re-triggerear animación
- **TODAS** las páginas del dashboard heredan esta animación automáticamente

### useModalDialog hook
```typescript
const { isOpen, open, close } = useModalDialog();
// Usar con <Modal isOpen={isOpen} onClose={close}>...</Modal>
```

---

## Fuentes de verdad adicionales

- `COMO_CORRER_PROYECTO.md` — instrucciones en español para arrancar el proyecto
- `docs/project-documentation/` — arquitectura, diccionario de datos, requerimientos
- `docs/sprints/` — plan de trabajo y backlogs de sprints
- `README.md` (raíz) — descripción general del sistema
