# Arquitectura del Proyecto - Sistema de Gestión y Producción de Calzado - CALZADO J&R

**Arquitecto:** Ronald Guerrero
**Última Actualización:** 15 de Mayo de 2026
**Estado:** ✅ MVP Fase 1 (Sprints 1-5) | 🔄 En desarrollo (Sprints 6-7)

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
                      - 8 routers modulares
                      - Middleware (auth, CORS)
                              │ SQL/TCP
                    PostgreSQL 17
                      - 22 tablas + audit columns
```

---

## Stack Tecnológico - Verificado

### Backend (BE)

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **Python** | 3.12-slim | Runtime principal del servidor |
| **FastAPI** | 0.115.0+ | Framework HTTP asincrónico con validación automática |
| **SQLAlchemy** | 2.0+ | ORM para mapeo objeto-relacional |
| **Alembic** | 1.14.0 | Sistema de migraciones de BD (23 migraciones) |
| **Pydantic** | 2.0+ | Validación y serialización de datos |
| **PyJWT (python-jose)** | 3.3+ | Creación y validación de JWT tokens |
| **bcrypt / passlib** | 4.0+ | Hash criptográfico de contraseñas |
| **pydantic-settings** | 2.0+ | Variables de entorno desde .env |
| **psycopg2-binary** | 2.9+ | Driver PostgreSQL para Python |
| **aiosmtplib** | 3.0+ | Envío de email asincrónico (vía Mailpit en dev) |
| **python-multipart** | 0.0.18+ | Soporte para formularios multipart |
| **ruff** | 0.8+ | Linter + formateador (line-length 100) |
| **pytest + httpx** | 8.0+ | Testing unitario e integración |

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
│   │   ├── core/               # Config, BD, seguridad, dependencias
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── dependencies.py
│   │   │   ├── security_config.py
│   │   │   └── logging_config.py
│   │   │
│   │   ├── middleware/          # Middleware personalizado
│   │   │   ├── audit_logger.py
│   │   │   ├── error_handler.py
│   │   │   ├── rate_limit.py
│   │   │   └── security_headers.py
│   │   │
│   │   ├── models/             # 22 modelos SQLAlchemy centralizados
│   │   │   ├── user.py, role.py, type_document.py
│   │   │   ├── product.py, category.py, brand.py, style.py
│   │   │   ├── order.py, tasks.py
│   │   │   ├── inventory.py, inventory_movement.py
│   │   │   ├── supplies.py, supply_categories.py, product_supplies.py, supplies_movement.py
│   │   │   ├── notifications.py, incidence.py
│   │   │   ├── vale.py, password_reset_token.py
│   │   │   └── ...
│   │   │
│   │   ├── modules/            # 8 módulos feature-based
│   │   │   ├── auth/           # Autenticación JWT (router, schemas, service)
│   │   │   ├── admin/          # Catálogo admin + reportes (router, catalog_router, reports_router)
│   │   │   ├── catalog/        # Catálogo público
│   │   │   ├── dashboard_jefe/ # Dashboard principal (router, schemas)
│   │   │   ├── orders/         # Pedidos + producción
│   │   │   ├── supplies/       # Insumos
│   │   │   ├── type_document/  # Tipos de documento
│   │   │   └── users/          # CRUD usuarios
│   │   │
│   │   ├── utils/              # Utilidades compartidas
│   │   │   ├── security.py
│   │   │   ├── email.py
│   │   │   └── sanitizer.py
│   │   │
│   │   ├── init/               # Seed data
│   │   │   ├── init_db_simple.py
│   │   │   └── seed_data.py
│   │   │
│   │   ├── init_db.py          # Auto-migraciones + seed al arrancar
│   │   └── main.py             # Punto de entrada FastAPI
│   │
│   ├── alembic/versions/       # 23 migraciones progresivas
│   ├── scripts/                # Utilidades standalone
│   │   ├── create_admin.py     # Crear admin fuera de API
│   │   └── heal_line_groups.py # Reparar line_group duplicados
│   ├── tests/                  # Tests unitarios e integración
│   ├── pyproject.toml          # Dependencias + tooling config (uv)
│   └── Dockerfile
│
├── fe/                         # Frontend - React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Componentes base reutilizables
│   │   │   │   ├── Modal.tsx           # createPortal + focus trap + a11y
│   │   │   │   ├── PageTransition.tsx  # Animación automática de rutas
│   │   │   │   ├── ThemeToggle.tsx     # Modo claro/oscuro
│   │   │   │   ├── Button.tsx, InputField.tsx, Alert.tsx
│   │   │   │   ├── Breadcrumbs.tsx
│   │   │   │   ├── LanguageSwitcher.tsx
│   │   │   │   └── CookieBanner.tsx, CookiePolicyModal.tsx
│   │   │   │   └── PasswordStrengthIndicator.tsx
│   │   │   │   └── ...
│   │   │   └── layout/         # Layouts compartidos
│   │   │       ├── AppLayout.tsx
│   │   │       ├── AuthLayout.tsx
│   │   │       └── DashboardFooter.tsx
│   │   │
│   │   ├── modules/            # 3 módulos feature-based
│   │   │   ├── auth/           # 5 páginas + servicios
│   │   │   │   ├── pages/LoginPage.tsx, RegisterPage.tsx
│   │   │   │   │       ForgotPasswordPage.tsx, ResetPasswordPage.tsx
│   │   │   │   │       ChangePasswordPage.tsx, DashboardPage.tsx
│   │   │   │   └── services/api.ts
│   │   │   │
│   │   │   ├── dashboard-jefe/ # 12 páginas de gestión
│   │   │   │   ├── pages/
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   ├── ClientsPage.tsx
│   │   │   │   │   ├── CatalogPage.tsx
│   │   │   │   │   ├── OrdersPage.tsx
│   │   │   │   │   ├── TasksPage.tsx
│   │   │   │   │   ├── InventoryPage.tsx
│   │   │   │   │   ├── InsumosPage.tsx
│   │   │   │   │   ├── EmployeesPage.tsx
│   │   │   │   │   ├── UsersManagementPage.tsx
│   │   │   │   │   ├── ReportsPage.tsx
│   │   │   │   │   ├── SettingsPage.tsx
│   │   │   │   │   └── AlertsPage.tsx
│   │   │   │   ├── components/       # ~20+ modales y subcomponentes
│   │   │   │   │   ├── layout/       # AdminLayout, AdminSidebar, AdminHeader
│   │   │   │   │   ├── home/         # MetricsCards, QuickActionsSection, etc.
│   │   │   │   │   ├── catalog/      # ProductFormModal, BrandFormModal, etc.
│   │   │   │   │   └── ...
│   │   │   │   ├── services/         # ordersApi, catalogService, adminApi, etc.
│   │   │   │   ├── context/          # BadgeCountsContext
│   │   │   │   └── types/           # dashboard.ts
│   │   │   │
│   │   │   └── landing/         # Landing page + catálogo público
│   │   │       ├── pages/LandingPage.tsx, CatalogPage.tsx
│   │   │       ├── components/  # HeroSection, Features, etc.
│   │   │       └── services/    # publicCatalogService
│   │   │
│   │   ├── api/                 # Cliente Axios + config
│   │   │   ├── axios.ts
│   │   │   └── type-documents.ts
│   │   │
│   │   ├── hooks/               # Hooks personalizados globales
│   │   │   ├── useAuth.ts
│   │   │   ├── useModalDialog.ts
│   │   │   └── useHeaderAnimation.ts
│   │   │
│   │   ├── context/             # Contextos globales
│   │   │   ├── AuthContext.tsx
│   │   │   ├── authContextDef.ts
│   │   │   └── ThemeContext.tsx
│   │   │
│   │   ├── types/               # Tipos TypeScript compartidos
│   │   │   ├── auth.ts, orders.ts, products.ts, tasks.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── locales/             # Traducciones i18next
│   │   │   ├── es/              # Español
│   │   │   └── en/              # Inglés
│   │   │
│   │   ├── utils/routing.ts
│   │   ├── config/api.ts
│   │   ├── i18n.ts
│   │   ├── index.css            # Tailwind v4 @theme + @import
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/                  # Logo, favicon, imágenes
│   ├── __tests__/               # Tests frontend
│   ├── package.json             # pnpm (NUNCA npm/yarn)
│   ├── vite.config.ts           # Proxy, polling, aliases @
│   ├── tsconfig.json
│   └── Dockerfile
│
├── db/                          # Solo bootstrap PostgreSQL
│   └── init/init.sql            # Extensiones (no esquema - lo crea Alembic)
│
├── docs/                        # Documentación
│   ├── project-documentation/   # Arquitectura, MER, requisitos, historias
│   └── sprints/                 # Backlogs por sprint
│
├── docker-compose.yml           # db + be + fe + mailpit
├── .env.example                 # Variables de entorno
├── .gitignore
├── opencode.json                # Config AI agent
├── AGENTS.md                    # Instrucciones para agentes OpenCode
├── COMO_CORRER_PROYECTO.md
└── README.md
```

---

## Arquitectura Modular - Backend y Frontend

### Backend (Feature-Based Modules)

El backend tiene **8 módulos** organizados por feature. Cada módulo expone su propio router FastAPI registrado en `main.py`:

| Módulo | Ruta base | Propósito |
|--------|----------|-----------|
| **auth** | `/api/v1/auth` | Login, registro, refresh token, cambio/recuperación de contraseña |
| **admin** | `/api/v1/admin` | CRUD catálogo (productos, marcas, estilos, categorías) + reportes |
| **catalog** | `/api/v1/catalog` | Catálogo público (productos visibles sin auth) |
| **dashboard_jefe** | `/api/v1/dashboard` | Métricas, stats, resúmenes del dashboard principal |
| **orders** | `/api/v1/orders` | Pedidos, producción, seguimiento de estados |
| **supplies** | `/api/v1/supplies` | Gestión de insumos y movimientos |
| **type_document** | `/api/v1/type-documents` | Tipos de documento (catálogo) |
| **users** | `/api/v1/users` | CRUD de usuarios del sistema |

**Patrón por módulo (simplificado):**
```
be/app/modules/{nombre}/
├── router.py       # Endpoints FastAPI (Router APIRouter)
├── schemas.py      # Schemas Pydantic (request/response)
└── service.py      # Lógica de negocio (opcional, algunos inyectan directo)
```

A diferencia de la estructura documentada inicialmente, los módulos actuales **no tienen carpetas separadas** controllers/, models/ ni services/ — los modelos están centralizados en `be/app/models/` y la lógica se inyecta directamente desde el router o desde un service simplificado.

### Frontend (Feature-Based Modules)

El frontend tiene **3 módulos**:

| Módulo | Propósito |
|--------|----------|
| **auth** | Login, registro, recuperación de contraseña (5 páginas) |
| **dashboard-jefe** | Panel administrativo completo (12 páginas + ~20 componentes) |
| **landing** | Landing page pública + catálogo público visible |

---

## Patrones Arquitectónicos Clave

### 1. Modal base con focus trap + createPortal

`fe/src/components/ui/Modal.tsx` es el componente base para todos los modales del sistema:
- Usa `createPortal` para renderizar fuera del árbol DOM
- `role="dialog"` + `aria-modal="true"` para accesibilidad
- Focus trap interno (Tab/Shift+Tab cíclico)
- Cierre con Escape
- Variantes de tamaño: `sm`, `md`, `lg`, `xl`, `full`
- Variantes de color: `default`, `danger`

**Nunca crear un modal manualmente** — usar `<Modal>` + hook `useModalDialog`.

### 2. PageTransition para animación automática de rutas

`fe/src/components/ui/PageTransition.tsx` envuelve `<Outlet />` en `AdminLayout.tsx`:
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

El sistema rastrea la producción en 4 etapas usando la tabla `tasks`:
1. **Corte** (material prima)
2. **Armado** (ensamblaje)
3. **Empaque** (preparación)
4. **Entregado** (finalizado)

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
1. Migraciones Alembic pendientes (`alembic upgrade head`)
2. Datos semilla (roles, tipos documento, catálogo 65 productos, usuarios de prueba)

**No ejecutar `alembic upgrade head` manualmente** a menos que se esté depurando.

### 8. Internacionalización con i18next

Traducciones ES/EN vía `i18next` + `react-i18next`. Archivos en `fe/src/locales/{es,en}/`. Cambio de idioma sin recargar página.

---

## Middleware del Backend

| Middleware | Archivo | Propósito |
|-----------|---------|----------|
| **Error Handler** | `middleware/error_handler.py` | Captura excepciones no controladas y responde JSON consistente |
| **Security Headers** | `middleware/security_headers.py` | CSP, X-Frame-Options, X-Content-Type-Options |
| **Rate Limiting** | `middleware/rate_limit.py` | Límite de peticiones por IP para prevenir abusos |
| **Audit Logger** | `middleware/audit_logger.py` | Registro de acciones críticas para trazabilidad |

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
Pedido ──▶ Corte ──▶ Armado ──▶ Empaque ──▶ Entregado
  │          │          │           │
  ▼          ▼          ▼           ▼
pendiente   corte     armado     empaque
aprobado    (en progreso)
rechazado   completado
pagado
```

Cada `order_detail` tiene una etapa global (`global_stage`) que avanza solo cuando todas las tareas de esa etapa están completadas. Las tareas individuales tienen su propio estado y seguimiento.

---

## Convenciones No Negociables

- **pnpm es OBLIGATORIO** en frontend — npm/yarn rompen resolución de dependencias
- **uv es OBLIGATORIO** en backend — no hay requirements.txt
- **Todos los iconos** son de `lucide-react` — nunca emojis ni SVG inline
- **Todos los elementos** deben tener variante `dark:` — el proyecto no tiene solo modo claro
- **TypeScript strict mode** habilitado — `tsc -b` debe pasar antes del build
- **Ruff line-length 100** — no usar black ni flake8
- **Modal base** con focus trap + createPortal, nunca crear modales manualmente
