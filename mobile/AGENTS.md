# AGENTS.md — CALZADO J&R MOBILE

Instrucciones para agentes de OpenCode que trabajen en este repositorio.
Solo incluye información que un agente NO inferiría fácilmente de los archivos del proyecto.

---

## Qué es

App móvil (Expo SDK 54 + React Native 0.81 + expo-router 6) para CALZADO J&R, sistema de gestión
de pedidos/producción/inventario de una fábrica de calzado. **No tiene backend propio**: consume
la API FastAPI del backend (`be/`) con JWT.

- **Monorepo**: este proyecto vive en `mobile/` dentro del repo monorepo `scrum-calzado_jyr`.
- Backend: `../be/` (FastAPI + PostgreSQL)
- Frontend web: `../fe/` (React + Vite)
- Scripts DB: `../db/`

---

## Comandos esenciales

```bash
pnpm install              # instalar dependencias (NUNCA npm ni yarn)
pnpm start                # expo start (Metro)
pnpm android              # emulador Android
pnpm ios                  # simulador iOS
pnpm web                  # navegador
pnpm typecheck            # tsc --noEmit (TypeScript strict)
pnpm lint                 # expo lint (ESLint 9 + eslint-config-expo)
```

- **pnpm es OBLIGATORIO.** `npm`/`yarn` rompen la resolución de dependencias.
- No hay build de producción local; se usa EAS (`eas build`).

---

## Stack y versiones (bloqueadas)

| Paquete | Versión |
|---|---|
| expo | ~54.0.37 |
| react | 19.1.0 |
| react-native | 0.81.5 |
| expo-router | ~6.0.24 |
| typescript | ~5.9.3 (strict) |
| @tanstack/react-query | 5.100.10 |
| zustand | 5.0.13 |
| nativewind | 4.2.6 |
| tailwindcss | 3.4.19 (**v3**, requerida por NativeWind v4) |
| react-native-css-interop | 0.2.6 (**dependencia directa obligatoria**, ver gotcha) |
| expo-secure-store | ~15.0.8 |
| axios | 1.19.0 |

---

## Arquitectura

```
app/                      # expo-router (rutas = archivos)
├── _layout.tsx           # providers (QueryClient + Theme) + auth gate (hydrate)
├── login.tsx             # pantalla de inicio de sesión
├── forgot-password.tsx   # recuperar contraseña
└── (admin)/              # grupo del rol jefe (guard de rol + <Stack>)
    ├── _layout.tsx       # guard isJefe() + <Stack> (tabs + secciones empujadas) + <HubMenu>
    ├── (tabs)/           # bottom tabs: Inicio, Pedidos, Incidencias, Reportes, Perfil
    │   ├── _layout.tsx   # <Tabs>
    │   ├── index.tsx     # Inicio = dashboard (greeting + resumen; StatCards en F3)
    │   ├── orders.tsx    # pedidos (listado con filtros/búsqueda/paginación)
    │   ├── losses.tsx    # incidencias (placeholder)
    │   ├── reports.tsx   # reportes (placeholder)
    │   └── profile.tsx   # perfil + cerrar sesión
    ├── order-detail.tsx  # detalle de pedido (info, detalles producto, tareas, cambio estado)
    ├── catalog.tsx       # catálogo productos con búsqueda, CRUD modal
    ├── catalog-manage.tsx # gestión marcas/estilos/categorías
    ├── inventory.tsx     # inventario con búsqueda, ajustes, eliminar
    ├── insumos.tsx       # CRUD insumos completo con categorías y vinculación a productos
    ├── tasks.tsx         # grid tareas, filtros, asignación, cambio estado
    ├── employees.tsx     # CRUD empleados con filtros por ocupación/estado
    ├── clients.tsx       # CRUD clientes con filtros
    ├── users.tsx         # gestión usuarios (pendientes, todos, reactivaciones)
    ├── alerts.tsx        # centro de alertas con mark read/delete
    └── settings.tsx      # perfil, notificaciones, apariencia, seguridad
components/
├── admin/HubMenu.tsx     # overlay full-screen con el grid de 13 secciones (menú de 3 líneas)
├── admin/ContactClientModal.tsx  # modal contacto cliente (email/teléfono con copy)
├── admin/ImageViewerModal.tsx    # modal imagen fullscreen con zoom
├── admin/ProductionModal.tsx     # modal flujo producción 2 pasos (Opción A/B + 4 etapas)
├── admin/ProductFormModal.tsx    # modal crear/editar producto
├── admin/BrandFormModal.tsx      # modal crear/editar marca
├── admin/StyleFormModal.tsx      # modal crear/editar estilo
├── admin/CategoryFormModal.tsx   # modal crear/editar categoría
├── admin/DeleteConfirmModal.tsx  # modal confirmar eliminación
├── admin/AdjustInventoryModal.tsx # modal ajustar inventario
├── admin/OrderFormModal.tsx      # modal crear pedido
└── ui/                           # átomos NativeWind (Button, Card, Input, Badge, Loading, ErrorState, EmptyState, UnderConstruction, SectionTile, AppHeader, StatCard)
constants/
├── api.ts                # API_URL por entorno (ver abajo)
├── theme.ts              # tokens de color de GUIA_DISENO
└── adminSections.ts      # las 13 secciones del sidebar web (label, icono, href, color, fase)
services/
├── apiClient.ts          # axios + interceptor de refresh JWT (cola de peticiones)
├── tokenStorage.ts       # SecureStore (access + refresh)
├── sessionEvents.ts      # evento "sesión expirada" → force logout
├── authService.ts        # /auth/login, /users/me, /auth/logout, etc.
├── ordersService.ts      # /admin/orders CRUD, /admin/orders/{id}/tasks
├── dashboardService.ts   # /dashboard/admin/{metrics, recent-orders, alerts}
├── catalogService.ts     # /admin/catalog/* (products, brands, styles, inventory)
├── adminService.ts       # /admin/users CRUD (empleados, clientes, reactivación)
├── suppliesService.ts    # /supplies CRUD + categorías + vinculación a productos
├── incidencesService.ts  # /scrap CRUD (incidencias, scrap stock, pending)
├── reportsService.ts     # /admin/reports (dashboard, employee, customer, production)
├── notificationsService.ts # /notifications (notificaciones + unread count)
store/auth.ts             # Zustand: tokens, user, login/hydrate/logout
store/ui.ts               # Zustand: estado del menú de secciones (HubMenu)
types/auth.ts             # TokenResponse, UserResponse, Role
types/orders.ts           # Order, OrderDetail, OrderStatus, ProductionTask, etc.
types/catalog.ts          # Product, Brand, Style, Category, InventoryItem, etc.
types/dashboard.ts        # Metric, RecentOrder, Alert
types/users.ts            # AdminUser, PendingUser, CreateEmployeeRequest, ReactivationTicket
types/supplies.ts         # SupplyCategory, Supply, SupplyCreateRequest, LinkSupplyRequest
types/incidences.ts       # LossRecord, ScrapStock, PendingIncidence, CreateIncidentRequest
types/reports.ts          # DashboardReport, EmployeeReport, CustomerReport
types/notifications.ts    # Notification, NotificationListResponse
utils/                    # cn(), getErrorMessage(), isJefe(), resolveImageUrl()
global.css                # entrada de NativeWind (@tailwind directives)
tailwind.config.js        # tokens de color del web
babel.config.js / metro.config.js  # config de NativeWind
```

### Roles (del backend)
`role_name` devuelve **`admin` | `employee` | `client`** (minúsculas). El "jefe" es rol `admin`
con `occupation: "jefe"`. **OJO**: el usuario jefe del seed (`ronald.jefe@gmail.com`) tiene
`role_name: "employee"` con `occupation: "jefe"`. Usar **siempre** `utils/roles.ts#isJefe()`
(devuelve true si `admin` o si `employee` con `occupation === 'jefe'`), nunca comparar contra
`'admin'` a secas.

### Usuarios de prueba (seed del backend)
```
Jefe:   ronald.jefe@gmail.com / Test123456!
```

---

## Base de datos / API

- La app consume el backend web: `docker compose up -d be db` en el repo web.
- `constants/api.ts`: usa `EXPO_PUBLIC_API_URL` si está definida; si no:
  - Android emulador → `http://10.0.2.2:8000/api/v1`
  - iOS/web → `http://localhost:8000/api/v1`
  - Celular físico → definir `EXPO_PUBLIC_API_URL=http://<IP-LAN>:8000/api/v1` en `.env`
- Autenticación: POST `/api/v1/auth/login` → `{access_token, refresh_token}`. El interceptor
  `services/apiClient.ts` inyecta `Authorization: Bearer` y hace refresh automático en 401 con
  cola de peticiones; si el refresh falla emite `sessionEvents` → logout forzado.

---

## Gotchas

1. **pnpm, no npm/yarn**: rompe `node_modules`. Solo pnpm.
2. **`react-native-css-interop` debe estar como dependencia directa** (0.2.6). NativeWind la trae
   como transitiva, pero con pnpm Metro no la resuelve desde los archivos del proyecto y el bundle
   falla con `Unable to resolve module react-native-css-interop/jsx-runtime`. No la quites.
3. **NativeWind v4** requiere: `babel.config.js` con `jsxImportSource: 'nativewind'` + preset
   `nativewind/babel`; `metro.config.js` con `withNativeWind` e input `./global.css`;
   `nativewind-env.d.ts`; import de `./global.css` en `app/_layout.tsx`.
4. **tailwindcss debe ser v3** (3.4.19). NativeWind v4 NO soporta Tailwind v4.
5. **`app.json`** usa `newArchEnabled: true`, `typedRoutes: true`, `reactCompiler: true`. Si tocas
   Babel, no rompas el preset de `babel-preset-expo`.
6. **Dark mode**: NativeWind sigue el color scheme del dispositivo (`dark:` variant). Toda pantalla
   debe tener variantes `dark:` (regla de GUIA_DISENO del web). El fondo base es
   `bg-gray-50 dark:bg-slate-950`.
7. **Paleta (GUIA_DISENO)**: primary `#1e40af`, primary-light `#3b82f6`, primary-dark `#1e3a8a`,
   secondary `#d97706`. Estados: pendiente=yellow, en progreso=blue, completado=green,
   entregado=purple, cancelado=red. Énfasis con `font-bold`.
8. **expo-env.d.ts** está en `.gitignore` (lo genera Expo). `dist/` también está ignorado.
9. **Contraseña mínima del backend**: 8+ chars, minúscula+mayúscula+número+carácter especial.
10. **No usar JSX nativo con `className` sin NativeWind**: cualquier componente con estilos debe
    usar `className`. Los estilos de navegación (tab bar) usan objetos de estilo de
    `@react-navigation`.

---

## Plan por fases (estado) — v2: ESPEJO del dashboard web

El objetivo es que cada dashboard móvil tenga **las mismas secciones que el web** (`fe/src/features/*/sidebars`).

- [x] F0 Fundación del repo (Expo SDK 54 + NativeWind + alias `@/`)
- [x] F1 Auth + cliente API (login, refresh, rutas protegidas)
- [x] F2 Sistema de diseño + navegación: bottom tabs (Inicio/Pedidos/Incidencias/Reportes/Perfil) + `AppHeader` con menú de 3 líneas que abre `HubMenu` (overlay full-screen con el grid de las 13 secciones del jefe desde `constants/adminSections.ts`) + rutas por sección
- [x] F3 Jefe · Inicio + Configuración (StatCards, resumen, perfil/logout)
- [x] F4 Jefe · Pedidos (listado con filtros/búsqueda/paginación, detalle con detalles+tasks, cambio de estado)
- [x] F5 Jefe · Catálogo + Inventario (listado productos con búsqueda, stock por talla, estados)
- [x] F6 Jefe · Usuarios + Empleados + Clientes (crear, renovar invitación, estados)
- [x] F7 Jefe · Reportes (los del web + PDF con `expo-print`)
- [x] F8 Jefe · Incidencias + Alertas (pérdidas, pendientes de aprobación, alertas)
- [x] F9 Jefe · Insumos + Tareas de producción
- [x] F10 Dashboard Empleado (6 secciones del `EmployeeSidebar`)
- [x] F11 Dashboard Cliente (6 secciones del `ClientSidebar`)
- [x] F12 Notificaciones WebSocket con badges (transversal)
- [ ] F13 Build EAS (APK)

### Secciones del web por rol (fuente: `fe/src/features/*/components/organisms/*Sidebar.tsx`)
- **Jefe (13)**: Inicio, Pedidos, Catálogo, Inventario, Incidencias, Insumos, Tareas, Empleados, Clientes, Usuarios, Alertas, Reportes, Configuración.
- **Empleado (6)**: Inicio, Mis Tareas, Tareas Disponibles, Incidencias, Reportes, Configuración.
- **Cliente (6)**: Inicio, Catálogo Mayorista, Mis Pedidos, Reportes, Mis Incidencias, Configuración.

Adaptaciones móviles frente al web: tablas→listas/tarjetas, sidebar→menú de 3 líneas en `AppHeader`
que abre `HubMenu` (overlay con grid de secciones) + bottom tabs (5 fijas) para lo más usado,
modales→bottom sheets, jsPDF→expo-print, Lucide→`@expo/vector-icons` Ionicons.