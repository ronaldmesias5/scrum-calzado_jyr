# Arquitectura del Proyecto - Sistema de Gestión y Producción de Calzado - CALZADO J&R

**Arquitecto:** Ronald Guerrero
**Última Actualización:** 3 de Octubre de 2026
**Estado:** ✅ Sprints 1-16 completados | Dashboards Jefe, Empleado y Cliente operativos + chatbot IA

---

## Resumen Arquitectónico

El sistema implementa una **arquitectura 3-tier (Presentación - Lógica - Datos)** con separación clara de responsabilidades y patrones modernos de desarrollo web. El diseño prioriza **escalabilidad, seguridad y mantenibilidad** usando container-based deployment con Docker Compose orquestando 4 servicios.

```
                    Frontend (React 19 + TS)
                      - SPA con routing dinámico
                      - Componentes UI con a11y
                      - Animaciones CSS con Tailwind
                              │ HTTP/HTTPS (JWT)
                    Backend (FastAPI + Python)
                      - REST API asincrónica
                      - 25 routers modulares
                      - Middleware (auth, CORS)
                              │ SQL/TCP
                    PostgreSQL 17
                      - 30 tablas + audit columns
```

---

## Stack Tecnológico - Verificado

### Backend (BE)

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **Python** | 3.12-slim | Runtime principal del servidor |
| **FastAPI** | 0.115.0+ | Framework HTTP asincrónico con validación automática |
| **SQLAlchemy** | 2.0+ | ORM para mapeo objeto-relacional |
| **Alembic** | 1.14.0 | Sistema de migraciones de BD (50 migraciones) |
| **Pydantic** | 2.0+ | Validación y serialización de datos |
| **PyJWT (python-jose)** | 3.3+ | Creación y validación de JWT tokens |
| **bcrypt / passlib** | 4.0+ | Hash criptográfico de contraseñas |
| **pydantic-settings** | 2.0+ | Variables de entorno desde .env |
| **psycopg2-binary** | 2.9+ | Driver PostgreSQL para Python |
| **aiosmtplib** | 3.0+ | Envío de email asincrónico (vía Mailpit en dev) |
| **python-multipart** | 0.0.18+ | Soporte para formularios multipart |
| **ruff** | 0.8+ | Linter + formateador (line-length 100) |
| **pytest + httpx** | 8.0+ | Testing unitario e integración |
| **pgvector + openai/groq/generativeai** | 0.3+ | Embeddings IA (Dim 768) para el chatbot |

**Gestor de dependencias:** `uv` (NO requirements.txt). Las dependencias se declaran en `pyproject.toml`.

### Frontend (FE)

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **Node.js** | 20+ LTS | Runtime de JavaScript |
| **pnpm** | 8+ | Gestor de dependencias (OBLIGATORIO, nunca npm/yarn) |
| **React** | 19.2+ | Librería de UI declarativa |
| **React Router** | 7.13+ | Enrutamiento de páginas (SPA) |
| **TypeScript** | 5.9+ | Lenguaje tipado que compila a JS |
| **Vite** | 7.2.4+ | Build tool y dev server ultra rápido |
| **Tailwind CSS** | 4.1+ | Utilidad CSS (v4 con @theme directive, sin tailwind.config.js) |
| **Lucide React** | 0.563+ | Biblioteca de iconos (todos los iconos del proyecto) |
| **i18next** | 23.10+ | Internacionalización (ES/EN) |
| **Axios** | 1.13+ | Cliente HTTP para API calls |
| **React Context** | Nativa | State management (AuthContext, ThemeContext, BadgeCountsContext) |
| **Vitest** | 4.0+ | Testing unitario |
| **React Testing Library** | 16.3+ | Testing de componentes |
| **Prettier** | 3.8+ | Formateo de código |
| **jspdf + jspdf-autotable** | 3.x | Export PDF (reportes + catálogo) |

### Base de Datos

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **PostgreSQL** | 17-alpine | SGBD relacional open-source |
| **Docker** | 27+ | Containerización de servicios |
| **Docker Compose** | 2.27+ | Orquestación local de 4 servicios |

### Testing

| Capa | Herramientas | Descripción |
|-----|-------------|-----------|
| **Backend** | pytest + httpx + pytest-cov + pytest-asyncio | Tests unitarios e integración |
| **Frontend** | Vitest + React Testing Library + jsdom | Tests de componentes y utilidades |

### Servicios Docker

| Servicio | Imagen | Propósito |
|---------|--------|----------|
| **db** | postgres:17-alpine | Base de datos relacional |
| **be** | custom (Dockerfile) | Backend FastAPI con hot-reload |
| **fe** | custom (Dockerfile) | Frontend Vite con HMR |
| **mailpit** | axllent/mailpit:latest | Captura de correos en desarrollo (UI en :8025) |

---

## Estructura del Proyecto

```
scrum/
│
├── .opencode/                  # Configuración de agente AI + skills
│
├── be/                         # Backend - FastAPI + Python
│   ├── app/
│   │   ├── config.py            # Config (pydantic-settings)
│   │   ├── database.py          # Engine + SessionLocal
│   │   ├── dependencies.py      # Dependencias inyectables
│   │   ├── logging_config.py    # Logging
│   │   │
│   │   ├── middleware/          # Middleware personalizado
│   │   │   ├── csrf.py
│   │   │   ├── error_handler.py
│   │   │   ├── rate_limit.py
│   │   │   └── security_headers.py
│   │   │
│   │   ├── models/             # 26 modelos SQLAlchemy centralizados (30 tablas)
│   │   │   ├── user.py, role.py, type_document.py
│   │   │   ├── product.py, category.py, brand.py, style.py
│   │   │   ├── order.py, tasks.py, client_price.py
│   │   │   ├── inventory.py, inventory_movement.py
│   │   │   ├── supplies.py, supply_categories.py, product_supplies.py, supplies_movement.py
│   │   │   ├── notifications.py, incidence.py, pending_incidence.py, scrap.py
│   │   │   ├── vale.py, password_reset_token.py, email_verification_token.py
│   │   │   ├── reactivation_ticket.py, report_share.py, ai_embedding.py
│   │   │   └── ...
│   │   │
│   │   ├── routers/             # 25 routers FastAPI (endpoint definitions)
│   │   │   ├── auth.py          # Autenticación JWT
│   │   │   ├── admin.py         # Catálogo admin + reportes + usuarios
│   │   │   ├── catalog*.py      # Catálogo público (5 routers)
│   │   │   ├── catalog_categories.py # CRUD categorías (admin)
│   │   │   ├── client_prices.py # Precios por cliente (admin)
│   │   │   ├── dashboard_*.py   # Dashboards jefe/empleado (5 routers)
│   │   │   ├── orders*.py       # Pedidos + producción (3 routers)
│   │   │   ├── client.py        # Dashboard cliente
│   │   │   ├── scrap.py         # Incidencias
│   │   │   ├── supplies.py      # Insumos
│   │   │   ├── reports.py       # Reportes admin
│   │   │   ├── notifications.py # Notificaciones WebSocket
│   │   │   ├── type_document.py # Tipos de documento
│   │   │   ├── users.py         # CRUD usuarios
│   │   │   ├── bulk_import.py   # Importación masiva CSV
│   │   │   └── ai_chat.py       # Chatbot IA (Águila J&R)
│   │   │
│   │   ├── controllers/         # 7 controllers (business logic delegation)
│   │   ├── services/            # 10 services (domain logic)
│   │   ├── schemas/             # 15 esquemas Pydantic (request/response)
│   │   │
│   │   ├── utils/              # Utilidades compartidas
│   │   │
│   │   ├── init/               # Seed data
│   │   │   └── seed_data.py
│   │   │
│   │   ├── init_db.py          # Auto-migraciones + seed al arrancar
│   │   └── main.py             # Punto de entrada FastAPI
│   │
│   ├── alembic/versions/       # 50 migraciones progresivas (001–049, 043 duplicado)
│   ├── scripts/                # Utilidades standalone (7)
│   │   ├── create_admin.py     # Crear admin fuera de API
│   │   ├── heal_line_groups.py # Reparar line_group duplicados
│   │   ├── seed_ai_embeddings.py # Semilla de embeddings IA
│   │   ├── seed_full_flow.py, update_prices.py, advance_tasks.py, fix_assignments.py
│   │   └── ...
│   ├── tests/                  # Tests unitarios e integración
│   ├── pyproject.toml          # Dependencias + tooling config (uv)
│   └── Dockerfile
│
├── fe/                         # Frontend - React + TypeScript
│   ├── src/
│   │   ├── app/                 # Entry points (App.tsx, main.tsx, i18n.ts, ProtectedRoute, RoleProtectedRoute)
│   │   │   ├── App.tsx, main.tsx, i18n.ts
│   │   │   └── ProtectedRoute.tsx, RoleProtectedRoute.tsx
│   │   │
│   │   ├── assets/              # Recursos estáticos
│   │   │
│   │   ├── components/          # Componentes UI reutilizables
│   │   │   ├── atoms/           # Átomos globales (Button, Modal, Toast, PageTransition, Pagination…)
│   │   │   │   ├── Modal.tsx           # createPortal + focus trap + a11y
│   │   │   │   ├── PageTransition.tsx  # Animación automática de rutas
│   │   │   │   ├── ThemeToggle.tsx     # Modo claro/oscuro
│   │   │   │   ├── Button.tsx, InputField.tsx, Alert.tsx
│   │   │   │   ├── Breadcrumbs.tsx
│   │   │   │   ├── LanguageSwitcher.tsx
│   │   │   │   ├── CookieBanner.tsx, CookiePolicyModal.tsx
│   │   │   │   └── PasswordStrengthIndicator.tsx
│   │   │   └── layout/         # Layouts globales (AppLayout, AuthLayout…)
│   │   │       ├── AppLayout.tsx
│   │   │       ├── AuthLayout.tsx
│   │   │       └── DashboardFooter.tsx
│   │   │
│   │   ├── features/            # Features de negocio (Atomic Design por feature)
│   │   │   ├── admin/           # Panel admin (16 páginas) — components/{atoms,molecules,organisms}, utils/{reportsUtils,catalogPdfUtils}.ts
│   │   │   │   ├── components/  # molecules: modales CRUD, SummarySizer, TaskCard; organisms: OrderFormModal, home/, layout/
│   │   │   │   │   ├── layout/  # AdminLayout, AdminSidebar, AdminHeader, NotificationsPanel
│   │   │   │   │   ├── home/    # AlertsPanel, AvailableTasksPanel, etc.
│   │   │   │   │   └── ...
│   │   │   │   └── utils/       # reportsUtils.ts (PDF reportes), catalogPdfUtils.ts (PDF catálogo)
│   │   │   ├── ai/              # Chatbot IA (Águila J&R) — ChatWidget, aiApi, useChat
│   │   │   ├── auth/            # Login, Register, Password Reset — components/{molecules,organisms}
│   │   │   ├── client/          # Panel cliente — components/{molecules,organisms}
│   │   │   ├── employee/        # Panel empleado (6 páginas) — components/{molecules,organisms}, utils/reportsUtils.ts
│   │   │   └── landing/         # Landing pública + catálogo — components/{atoms,molecules,organisms}, config/whatsappConfig.ts
│   │   │
│   │   ├── pages/               # Páginas enrutables: admin(16), auth(8), client(6), employee(6), public(2)
│   │   │   ├── admin/           # DashboardPage, OrdersPage, CalendarPage, CategoriesPage, ClientPricesPage, ReportsPage, …
│   │   │   ├── auth/            # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, …
│   │   │   ├── client/          # DashboardPage, OrdersPage, WholesaleCatalogPage, MisIncidenciasPage, ReportsPage, SettingsPage
│   │   │   ├── employee/        # DashboardPage, TasksPage, AvailableTasksPage, IncidencesPage, ReportsPage, SettingsPage
│   │   │   └── public/          # LandingPage, CatalogPage
│   │   │
│   │   ├── hooks/               # Hooks reutilizables (useAuth, useModalDialog, useHeaderAnimation, useNotificationWebSocket…)
│   │   │
│   │   ├── services/            # Servicios de API globales
│   │   │   ├── axios.ts         # Cliente Axios + interceptores (JWT)
│   │   │   ├── config.ts        # Configuración de API
│   │   │   ├── adminApi.ts, ordersApi, authService, employeeApi, clientApi, etc.
│   │   │
│   │   ├── store/               # Contextos globales (Auth, Theme, Toast, BadgeCounts, EmployeeBadgeCounts)
│   │   │   ├── AuthContext.tsx
│   │   │   ├── authContextDef.ts
│   │   │   ├── ThemeContext.tsx
│   │   │   └── ...
│   │   │
│   │   ├── types/               # Tipos TypeScript compartidos
│   │   │   ├── auth.ts, orders.ts, products.ts, tasks.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/               # Utilidades (format, routing…)
│   │   │
│   │   ├── styles/              # Estilos globales (TailwindCSS)
│   │   │   └── index.css        # Tailwind v4 @theme + @import
│   │   │
│   │   └── locales/             # Traducciones i18next
│   │       ├── es/              # Español
│   │       └── en/              # Inglés
│   │
│   ├── public/                  # Logo, favicon, imágenes
│   ├── src/__tests__/           # Tests frontend
│   ├── package.json             # pnpm (NUNCA npm/yarn)
│   ├── vite.config.ts           # Proxy, polling, aliases @
│   ├── tsconfig.json
│   └── Dockerfile
│
├── db/                          # Solo bootstrap PostgreSQL
│   └── init/init.sql            # Extensiones (no esquema - lo crea Alembic)
│
├── mobile/                      # App móvil (Expo SDK 54 + React Native)
├── test/                        # pruebas_bd (SQL) + selenium (E2E)
├── scripts/                     # check.ps1 (verificación pre-push)
├── .githooks/                   # Hook pre-push
├── .github/workflows/           # CI (ruff, pytest, tsc, vitest)
│
├── docs/                        # Documentación
│   ├── project-documentation/   # Arquitectura, MER, requisitos, historias
│   ├── IA_BOT/                  # Conocimiento del chatbot (knowledge.md)
│   └── sprints/                 # Backlogs por sprint
│
├── docker-compose.yml           # db + be + fe + mailpit
├── docker-compose.prod.yml      # Compose de producción
├── .env.example                 # Variables de entorno
├── .gitignore
├── AGENTS.md                    # Instrucciones para agentes OpenCode
├── COMO_CORRER_PROYECTO.md
└── README.md
```

---

## Arquitectura Modular - Backend y Frontend

### Backend (Capas por funcionalidad)

El backend tiene **25 routers** organizados por funcionalidad. La estructura usa capas (routers → controllers → services):

| Router | Ruta base | Propósito |
|--------|----------|-----------|
| **auth** | `/api/v1/auth` | Login, registro, refresh token, cambio/recuperación de contraseña |
| **admin** | `/api/v1/admin` | CRUD usuarios, reportes, gestión de clientes/empleados |
| **catalog** | `/api/v1/catalog` | Catálogo público (productos visibles sin auth) |
| **catalog_products** | `/api/v1/admin/catalog` | CRUD productos (admin) |
| **catalog_brands** | `/api/v1/admin/catalog` | CRUD marcas (admin) |
| **catalog_styles** | `/api/v1/admin/catalog` | CRUD estilos (admin) |
| **catalog_inventory** | `/api/v1/admin/catalog` | Gestión inventario (admin) |
| **catalog_categories** | `/api/v1/admin/catalog` | CRUD categorías (admin) |
| **dashboard_jefe** | `/api/v1/dashboard/admin` | Métricas, stats, resúmenes del dashboard principal |
| **dashboard_empleado** | `/api/v1/dashboard/employee` | Métricas del empleado |
| **dashboard_empleado_tasks** | `/api/v1/dashboard/employee/tasks` | Tareas del empleado |
| **dashboard_empleado_metrics** | `/api/v1/dashboard/employee/metrics` | Métricas del empleado |
| **dashboard_empleado_incidences** | `/api/v1/dashboard/employee/incidences` | Incidencias del empleado |
| **orders** | `/api/v1/admin/orders` | Pedidos CRUD + calendario |
| **orders_tasks** | `/api/v1/admin/orders/tasks` | Tareas de producción |
| **client** | `/api/v1/client` | Dashboard cliente y pedidos |
| **client_prices** | `/api/v1/admin/client-prices` | Precios por cliente (admin CRUD + bulk) |
| **supplies** | `/api/v1` | Gestión de insumos (`/supplies…`, `/products/{id}/supplies`) |
| **scrap** | `/api/v1/scrap` | Incidencias (scrap, pérdidas, pendientes) |
| **reports** | `/api/v1/admin/reports` | Reportes (dashboard, empleados, clientes, producción) |
| **notifications** | `/api/v1/notifications` | Notificaciones en tiempo real (WebSocket) |
| **type_document** | `/api/v1/document-types` | Tipos de documento (catálogo) |
| **users** | `/api/v1/users` | CRUD de usuarios del sistema |
| **bulk_import** | `/api/v1/admin/bulk` | Importación masiva CSV (productos, usuarios) |
| **ai_chat** | `/api/v1/ai` | Chatbot IA (Águila J&R) |

**Patrón por capa:**
```
be/app/{capa}/
├── {nombre}.py       # Endpoints FastAPI (routers) o lógica de negocio (services)
└── service.py      # Lógica de negocio (opcional, algunos inyectan directo)
```

Los modelos están centralizados en `be/app/models/` (no hay `models/` por módulo); la lógica de negocio vive en `controllers/` (7), `services/` (10) y `schemas/` (15).

### Frontend (Features)

El frontend tiene **6 features**:

| Feature | Propósito |
|---------|----------|
| **auth** | Login, registro, recuperación de contraseña (8 páginas) |
| **admin** | Panel administrativo completo (16 páginas + ~20 componentes) |
| **employee** | Panel empleado (6 páginas: tareas, incidencias, reportes con PDF, configuración con avatar) |
| **client** | Panel cliente (6 páginas: dashboard, pedidos, catálogo mayorista, incidencias, reportes, ajustes) |
| **ai** | Chatbot IA "Águila J&R" (ChatWidget, embeddings) |
| **landing** | Landing page pública + catálogo público visible |

---

## Patrones Arquitectónicos Clave

### 1. Modal base con focus trap + createPortal

`fe/src/components/atoms/Modal.tsx` es el componente base para todos los modales del sistema:
- Usa `createPortal` para renderizar fuera del árbol DOM
- `role="dialog"` + `aria-modal="true"` para accesibilidad
- Focus trap interno (Tab/Shift+Tab cíclico)
- Cierre con Escape
- Variantes de tamaño: `sm`, `md`, `lg`, `xl`, `full`
- Variantes de color: `default`, `danger`

**Nunca crear un modal manualmente** — usar `<Modal>` + hook `useModalDialog`.

### 2. PageTransition para animación automática de rutas

`fe/src/components/atoms/PageTransition.tsx` envuelve `<Outlet />` en `AdminLayout.tsx`:
- Aplica `animate-in fade-in slide-in-from-top-4 duration-500` en cada navegación
- Usa `key={location.pathname}` para re-triggerear animación
- **TODAS** las páginas del dashboard heredan esta animación automáticamente

### 3. useModalDialog hook

```typescript
const { isOpen, open, close } = useModalDialog();
// Usar con <Modal isOpen={isOpen} onClose={close}>...</Modal>
```

### 4. Patrón line_group para productos duplicados en pedidos

En la tabla `order_details`, cuando un mismo producto aparece múltiples veces en un pedido (ej: 2 pares del mismo modelo pero diferentes números), se usa el campo `line_group` para agrupar las filas que pertenecen a la misma "línea" de pedido. Esto permite:
- Diferenciar visualmente cada línea
- Asignar tareas de producción por grupo
- Mantener trazabilidad sin duplicar registros de producto

### 5. 4 etapas de producción vía tasks table

El sistema rastrea la producción en 4 etapas usando la tabla `tasks` (enum `task_type`):
1. **Corte** (corte de material)
2. **Guarnición** (ensamblaje)
3. **Soladura** (pegado de suela)
4. **Emplantillado** (plantilla final)

Cada tarea está vinculada a un `order_detail` específico y tiene su propio estado, fechas y asignación. Esto permite al dashboard mostrar el progreso granular de cada pedido.

### 6. Tailwind CSS v4 con @theme directive

Tailwind v4 se configura mediante la directiva `@theme` directamente en `index.css`, **sin archivo `tailwind.config.js`**:

```css
@import "tailwindcss";
@theme {
  --color-primary: #1e40af;
  --color-primary-dark: #1e3a8a;
  --color-primary-light: #3b82f6;
  --color-secondary: #d97706;
}
```

### 7. Auto-migraciones + seed al arrancar

El backend ejecuta automáticamente en `init_db.py`:
1. Migraciones Alembic pendientes (`alembic upgrade head`) — 50 migraciones
2. Datos semilla (roles, tipos documento, catálogo 65 productos, usuarios de prueba)

**No ejecutar `alembic upgrade head` manualmente** a menos que se esté depurando.

### 8. Internacionalización con i18next

Traducciones ES/EN vía `i18next` + `react-i18next`. Archivos en `fe/src/locales/{es,en}/`. Cambio de idioma sin recargar página.

---

## Middleware del Backend

| Middleware | Archivo | Propósito |
|-----------|---------|----------|
| **CSRF** | `middleware/csrf.py` | Protección CSRF en peticiones mutantes |
| **Error Handler** | `middleware/error_handler.py` | Captura excepciones no controladas y responde JSON consistente |
| **Security Headers** | `middleware/security_headers.py` | CSP, X-Frame-Options, X-Content-Type-Options |
| **Rate Limiting** | `middleware/rate_limit.py` | Límite de peticiones por IP para prevenir abusos |

---

## Diagrama de Despliegue (Docker)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend   │     │   Backend    │     │     BD      │     │   Mailpit    │
│   Vite      │────▶│   FastAPI    │────▶│ PostgreSQL  │     │ SMTP Capture │
│  :5173      │     │   :8000      │     │   :5432     │     │   :8025      │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
       │                    │                    │                    │
       └────────────────────┴────────────────────┴────────────────────┘
                            calzado_jyr_net (bridge)
```

**Flujo de inicio:**
1. `db` inicia → healthcheck espera `pg_isready`
2. `be` inicia → depende de `db` saludable → ejecuta Alembic + seed → levanta API
3. `fe` inicia → depende de `be` → sirve SPA con proxy a `be:8000`
4. `mailpit` inicia en paralelo → captura correos del backend

**Red interna:** Los servicios se comunican por nombre de contenedor (`db`, `be`, `fe`, `mailpit`). Solo los puertos mapeados son accesibles desde el host.

---

## Variables de Entorno Críticas

| Variable | Dónde se usa |
|---------|-------------|
| `DATABASE_URL` | Conexión a PostgreSQL (usa `db` como host en Docker, `localhost` sin Docker) |
| `SECRET_KEY` | Firma de JWT tokens |
| `FRONTEND_URL` | Origen permitido por CORS |
| `MAIL_*` | Configuración SMTP (Mailpit en dev) |
| `VITE_API_URL` | URL del backend desde el frontend (`http://localhost:8000`) |

---

## Estados del Sistema (Order → Task Progression)

```
Pedido (order_status): pendiente → en_progreso → completado → entregado
                                                   ↘ cancelado

Tarea (task_status): pendiente → por_liquidar → en_progreso → completado → pagado
                                                                 ↘ cancelado

Etapas (task_type): corte → guarnicion → soladura → emplantillado
```

Las tareas individuales (`tasks`) tienen su propio estado y seguimiento; el estado del pedido se deriva del avance de sus tareas. No existe una columna `global_stage` en `order_details`.

---

## Features Clave Añadidas (post-sprints)

- **Calendario de Pedidos** — `GET /api/v1/admin/orders/calendar`, `CalendarPage.tsx`, entrada "Calendario" en el sidebar.
- **Precios por cliente** — tabla `client_prices` (mig 049), CRUD `/api/v1/admin/client-prices`, precio congelado en `order_details.unit_price`.
- **Export PDF del catálogo** — `fe/src/features/admin/utils/catalogPdfUtils.ts`.
- **CRUD de categorías** — `catalog_categories.py` + `CategoriesPage.tsx`.
- **Chatbot IA "Águila J&R"** — `ai_chat.py`, `ai_embeddings` pgvector Dim 768, `docs/IA_BOT/knowledge.md`.
- **Importación masiva CSV** — `bulk_import.py` (productos y usuarios).
- **App móvil** — `mobile/` (Expo SDK 54), consume la misma API.

---

## Convenciones No Negociables

- **pnpm es OBLIGATORIO** en frontend — npm/yarn rompen resolución de dependencias
- **uv es OBLIGATORIO** en backend — no hay requirements.txt
- **Todos los iconos** son de `lucide-react` — nunca emojis ni SVG inline
- **Todos los elementos** deben tener variante `dark:` — el proyecto no tiene solo modo claro
- **TypeScript strict mode** habilitado — `tsc -b` debe pasar antes del build
- **Ruff line-length 100** — no usar black ni flake8
- **Modal base** con focus trap + createPortal, nunca crear modales manualmente
