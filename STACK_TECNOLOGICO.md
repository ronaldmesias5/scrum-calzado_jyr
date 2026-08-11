# CALZADO J&R — Stack Tecnológico

> Sistema de gestión de pedidos, producción e inventario para la fábrica de calzado J&R.
> Documento que describe la estructura del proyecto, el tipo de arquitectura elegido y cómo se comunican los componentes con la API.

---

## 1. Modelo Cliente-Servidor — ¿Cómo funciona?

CALZADO J&R usa el **modelo cliente-servidor**: la interfaz (React) es el **cliente** que pide datos, y el backend (FastAPI) es el **servidor** que los procesa y responde. El cliente nunca accede a la base de datos directamente; siempre pasa por el servidor.

### ¿Cómo funciona?

1. El usuario interactúa con la aplicación **React** (el frontend).
2. React hace una solicitud HTTP, por ejemplo: `GET /api/v1/admin/orders`.
3. **FastAPI** recibe la petición.
4. FastAPI valida la solicitud y consulta **PostgreSQL**.
5. PostgreSQL devuelve los datos.
6. FastAPI responde en formato **JSON**.
7. React muestra los datos en la interfaz.

```
  React (cliente)          FastAPI (servidor)          PostgreSQL (BD)
  ┌──────────────┐  HTTP   ┌──────────────────┐  SQL   ┌──────────────┐
  │ Interfaz Web │ ──────▶ │ Validación +     │ ─────▶ │ Almacenamiento│
  │ (axios)      │ ◀────── │ lógica de negocio│ ◀───── │ persistente   │
  └──────────────┘  JSON   └──────────────────┘        └──────────────┘
```

### El porqué de la estructura

La estructura de CALZADO J&R se eligió siguiendo la que nos enseñaron durante la formación para el desarrollo de proyectos. Es el modelo de referencia que aprendimos para construir aplicaciones web completas: separar el proyecto en capas (cliente, servidor y base de datos), dividir la lógica por responsabilidades dentro de cada capa, y centralizar la comunicación bajo un mismo contrato (la API REST). Así el código es ordenado, mantenible y escalable.

---

## 2. API REST — ¿Qué es una API REST?

Una API REST es una **interfaz que permite que dos sistemas se comuniquen a través de HTTP**, por ejemplo entre un frontend hecho con React, HTML o una app móvil, y un backend hecho con FastAPI, Node.js, Django, Spring, etc.

La palabra **REST** viene de *Representational State Transfer*. **No es un lenguaje ni una librería**, sino un *estilo arquitectónico* para diseñar servicios web.

### Cómo aplicamos REST en CALZADO J&R

- El backend expone **recursos** (pedidos, productos, tareas, incidencias, insumos…) identificados por URLs bajo `/api/v1`.
- Las peticiones usan los **verbos HTTP** (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) según la operación.
- El servidor responde siempre en **JSON**, que el frontend consume directamente.
- REST es **sin estado** (stateless): cada petición es independiente y se autoriza con un token JWT.

### Stack Tecnológico

| Capa | Tecnología | Rol |
|---|---|---|
| **Frontend Web** | React 19 + Vite 7 + TypeScript + TailwindCSS 4 | Interfaz de usuario (cliente) |
| **Backend** | FastAPI + Python 3.12 + SQLAlchemy 2.0 + Alembic | API REST (servidor) |
| **Base de datos** | PostgreSQL 17 (Docker) | Almacenamiento persistente |
| **Infraestructura** | Docker Compose (db, be, fe, mailpit) | Despliegue y correos de prueba |
| **Pruebas** | pytest (BE) · Vitest (FE) | Calidad |
| **Linting/Formato** | Ruff (BE) · ESLint + Prettier (FE) | Estilo de código |

---

## 3. Estructura → MVC

**MVC** es un patrón de arquitectura de software que organiza el código en tres componentes principales: **Modelo**, **Vista** y **Controlador**. La idea principal de MVC es **separar responsabilidades** para que el código sea más ordenado, mantenible y escalable.

En CALZADO J&R aplicamos este patrón dentro del backend, adaptado a las herramientas que usamos:

| Componente MVC | En CALZADO J&R | Carpeta |
|---|---|---|
| **Model** | Modelos ORM SQLAlchemy (entidades de la BD) | `be/app/models/` |
| **Vista** | Schemas Pydantic (contrato de entrada/salida en JSON) | `be/app/schemas/` |
| **Controlador** | Rutas HTTP (`routers/`) + lógica de negocio (`services/`), con `controllers/` como adaptadores intermedios | `be/app/routers/` · `be/app/controllers/` · `be/app/services/` |

```
Petición HTTP
      │
      ▼
  Router  ──▶  Controller  ──▶  Service  ──▶  Model (ORM)  ──▶  PostgreSQL
  (Vista:   (adaptador)        (lógica de     (Model)
   schemas                    negocio)
   Pydantic)
```

### Tipos de estructura y por qué los usamos

| Ámbito | Tipo de estructura | Por qué la hacemos así |
|---|---|---|
| **Global** | **Modelo Cliente-Servidor** | Existen varios clientes (Web y Postman) que consumen un único servidor (FastAPI) que a su vez consulta la base de datos. Es el modelo estándar para aplicaciones web. |
| **Backend** | **API REST** | La comunicación entre clientes y servidor se hace con peticiones HTTP sobre recursos, devolviendo JSON. |
| **Backend (interna)** | **Arquitectura en capas / MVC** | Separamos Model (modelos ORM), Vista (schemas Pydantic) y Controlador (routers + services). Así la lógica es reutilizable y testeable. |
| **Frontend** | **Organización por módulo + inspiración Atomic Design** | Los componentes se agrupan por módulo de negocio, con carpetas de estructura y de átomos reutilizables. |
| **Base de datos** | **Esquema versionado con migraciones (Alembic)** | Las tablas no se crean "a mano" sino mediante **38 migraciones versionadas** que se aplican automáticamente al arrancar el backend. |

---

## 4. Estructura → Frontend

### 4.1 Organización por módulo de negocio

El frontend se organiza **por módulo de negocio**. Cada módulo reúne sus páginas, componentes, servicios de API, tipos y utilidades, de modo que todo lo relacionado con una funcionalidad esté en el mismo lugar y sea fácil de encontrar y escalar.

```
fe/src/
├── api/                    # Cliente HTTP compartido (axios.ts) + catálogos
├── components/
│   ├── ui/                 # Átomos reutilizables (Button, Modal, Toast…)
│   └── layout/             # Layouts y estructura de la app (AppLayout, AuthLayout…)
├── config/                 # Configuración (api.ts)
├── context/                # Contextos globales (Auth, Theme, Toast)
├── hooks/                  # Hooks reutilizables (useAuth, useModalDialog…)
├── modules/                # Módulos de negocio
│   ├── auth/               # Login, Register, Password Reset (7 páginas)
│   ├── dashboard-jefe/     # Panel admin (14 páginas)
│   ├── dashboard-empleado/ # Panel empleado (6 páginas)
│   ├── dashboard-cliente/  # Panel cliente (3 páginas)
│   └── landing/            # Landing pública + catálogo
├── types/                  # Tipos TypeScript compartidos
├── utils/                  # Utilidades (format, routing)
└── locales/                # Traducciones
```

### 4.2 Patrones de organización de componentes

Los **patrones de organización de componentes** son formas de estructurar el código del frontend para que los componentes, páginas, hooks, servicios y archivos relacionados estén ordenados, sean fáciles de encontrar y puedan escalar cuando el proyecto crece.

En lugar de tener todos los componentes mezclados en una sola carpeta, organizamos según su **propósito**:

| Categoría | En CALZADO J&R |
|---|---|
| **Componentes reutilizables** | `components/ui/` — Button, Modal, InputField, Toast, Alert, Pagination… |
| **Componentes de layout** | `components/layout/` — AppLayout, AuthLayout, layouts de cada dashboard |
| **Funcionalidades específicas** | `modules/<módulo>/components/` — OrderFormModal, CreateUserForm… |
| **Páginas** | `modules/<módulo>/pages/` — OrdersPage, TasksPage, ReportsPage… |
| **Servicios** | `modules/<módulo>/services/` + `api/` — llamadas HTTP a la API |
| **Hooks** | `hooks/` y `modules/<módulo>/hooks/` — useAuth, useModalDialog… |
| **Tipos** | `types/` y `modules/<módulo>/types/` — auth, orders, products, tasks… |
| **Utilidades** | `utils/` y `modules/<módulo>/utils/` — format, routing… |

### 4.3 Estructura → Atomic Design

**Atomic Design** es una metodología de organización de interfaces creada por **Brad Frost**, inspirada en la química. La idea es construir la interfaz **desde lo más simple hasta lo más complejo**, combinando componentes pequeños para formar componentes más grandes.

| Nivel | Concepto | En CALZADO J&R |
|---|---|---|
| **Átomos** | Componentes básicos que no se descomponen más | `components/ui/` (Button, InputField, Modal, Toast…) |
| **Moléculas** | Combinación de átomos que forman una unidad funcional | Componentes de un módulo (OrderFormModal, SummarySizer…) |
| **Organismos** | Unión de moléculas que forman una sección completa | Vistas compuestas de cada página y layouts (AppLayout, AdminLayout…) |
| **Plantillas / Páginas** | Estructura final que se enruta | `modules/<módulo>/pages/` |

En la práctica, aplicamos una **inspiración Atomic Design**: los átomos viven en `components/ui/`, las moléculas en cada módulo, y las páginas las componen.

---

## 5. Estructura del proyecto

### 5.1 Estructura completa

```
CALZADO-J&R/
├── .env.example              # Plantilla de variables de entorno (los secretos no se suben)
├── .gitignore
├── docker-compose.yml        # Orquesta los servicios: db, be, fe, mailpit
├── README.md                 # Documentación de uso del proyecto
├── STACK_TECNOLOGICO.md      # Este documento
├── be/                       # Backend — FastAPI (Python 3.12)
├── db/                       # Base de datos — PostgreSQL 17 (Docker)
├── docs/                     # Documentación: arquitectura, casos de uso, sprints, guía de diseño
└── fe/                       # Frontend — React + Vite + TypeScript
```

### 5.2 Estructura del backend (`be/`)

```
be/
├── app/
│   ├── main.py               # Punto de entrada: CORS, security headers, rate limit, 18 routers
│   ├── config.py             # Configuración (Pydantic Settings): BD, JWT, SMTP
│   ├── database.py           # Engine SQLAlchemy 2.0 + SessionLocal + Base
│   ├── dependencies.py       # get_db(), get_current_user(), _require_admin_or_jefe()
│   ├── init_db.py            # Aplica migraciones Alembic y datos semilla al arrancar
│   ├── logging_config.py     # Configuración de logs (error_logger)
│   ├── controllers/          # (14) Adaptadores entre routers y services (thin controllers)
│   ├── init/                 # Datos semilla (roles, tipos de documento, catálogo, usuarios demo)
│   ├── middleware/           # error_handler, rate_limit, security_headers
│   ├── models/               # (24 archivos) Modelos ORM SQLAlchemy 2.0
│   │   ├── user.py  role.py  type_document.py  password_reset_token.py
│   │   ├── order.py  product.py  brand.py  style.py  category.py
│   │   ├── inventory.py  inventory_movement.py  supplies.py  supply_categories.py
│   │   ├── tasks.py  vale.py  incidence.py  scrap.py  pending_incidence.py
│   │   ├── reactivation_ticket.py  notifications.py  report_share.py …
│   ├── routers/              # (21 archivos) Endpoints HTTP por módulo (ver sección 6.3)
│   │   ├── auth.py  users.py  admin.py  type_document.py
│   │   ├── catalog.py  catalog_brands.py  catalog_styles.py
│   │   ├── catalog_products.py  catalog_inventory.py
│   │   ├── orders.py  orders_tasks.py  client.py
│   │   ├── dashboard_jefe.py  dashboard_empleado.py
│   │   ├── dashboard_empleado_tasks.py  dashboard_empleado_metrics.py
│   │   ├── dashboard_empleado_incidences.py
│   │   ├── reports.py  scrap.py  supplies.py  notifications.py
│   ├── schemas/              # (13) Schemas Pydantic — contrato de entrada/salida (JSON)
│   ├── services/             # (8) Lógica de negocio (auth, orders, scrap, supplies…)
│   └── utils/                # security.py (JWT/bcrypt), email.py, ws_manager.py
├── alembic/                  # 38 migraciones de base de datos versionadas
│   └── versions/
├── scripts/                  # create_admin.py, heal_line_groups.py
├── tests/                    # Pruebas con pytest
├── pyproject.toml            # Dependencias (uv)
├── entrypoint.sh             # Ejecuta migraciones y lanza uvicorn
└── Dockerfile
```

### 5.3 Estructura de la base de datos (`db/`)

```
db/
├── Dockerfile      # Imagen postgres:17-alpine
├── init.sql        # Bootstrap: extensiones (uuid-ossp, pgcrypto)
└── .dockerignore
```

> La base de datos es una pieza deliberadamente mínima. El esquema real
> (más de 20 tablas) no se define aquí sino en las 38 migraciones Alembic del backend,
> que se aplican automáticamente al arrancar el servicio `be`.

---

## 6. Comunicación con la API

### 6.1 Modelos de comunicación con el backend

Existen varios modelos para que el frontend consuma datos del backend. CALZADO J&R usa **REST API** como modelo principal y **WebSocket** para notificaciones en tiempo real.

| Modelo | ¿Se usa en CALZADO J&R? | Dónde |
|---|---|---|
| **REST API** | ✅ Sí | Toda la comunicación HTTP del sistema (pedidos, catálogo, reportes…) |
| **GraphQL** | ❌ No | — |
| **WebSocket** | ✅ Sí | Notificaciones en tiempo real (`/api/v1/notifications/ws`) |
| **Server-Sent Events** | ❌ No | — |
| **tRPC** | ❌ No | — |
| **RPC** | ❌ No | — |
| **Polling** | ❌ No | El frontend refresca datos puntuales, pero no hay polling del backend |
| **Real-time** | ✅ Sí | Notificaciones WebSocket (`app/utils/ws_manager.py`) |

### 6.2 ¿Cómo se comunican los componentes?

CALZADO J&R usa el modelo **REST**: los clientes (Web, Postman) hacen peticiones HTTP al backend FastAPI, y este responde en **JSON**. El flujo completo de una petición es:

```
Interfaz (React)
   │  1. axios inyecta: Authorization: Bearer <access_token>
   ▼
GET /api/v1/admin/orders           ← petición REST
   │
   ▼
FastAPI → get_current_user (valida el JWT)
   │
   ├── _require_admin_or_jefe (si aplica)   ← autorización por rol
   ▼
Router (valida la petición con un schema Pydantic)
   │
   ▼
Controller → Service (lógica de negocio)
   │
   ▼
Modelo SQLAlchemy → PostgreSQL
   │
   ▼
Respuesta JSON (schema Pydantic) → Cliente → Interfaz
```

**Ejemplo real (crear un pedido):**

1. El jefe llena el formulario de pedido en el dashboard.
2. `fe/src/modules/dashboard-jefe/services/ordersApi.ts` llama a la API con `POST /api/v1/admin/orders`.
3. FastAPI valida el JWT y verifica que el usuario es admin o jefe.
4. El router valida los datos con `OrderCreateRequest` (Pydantic).
5. El service guarda el pedido y sus líneas en PostgreSQL vía el modelo ORM `Order` / `OrderDetail`.
6. La API responde `201 Created` con el pedido creado en JSON.
7. La interfaz muestra el pedido en la lista de órdenes.

### 6.3 Convención de rutas

Todas las rutas parten de `/api/v1`. El diseño separa por rol: rutas **públicas**, rutas de **usuario autenticado**, rutas de **empleado**, rutas de **cliente** y rutas **admin/jefe**.

```
/api/v1
├── /auth/*                → público (registro, login, contraseña)
├── /document-types        → público (tipos de documento)
├── /catalog/*             → público (catálogo de productos)
├── /users/me              → usuario autenticado
├── /client/*              → cliente autenticado
├── /dashboard/employee/*  → empleado autenticado (tareas, incidencias, métricas)
├── /dashboard/admin/*     → jefe/admin autenticado (KPIs, alertas)
├── /notifications         → usuario autenticado (notificaciones)
├── /admin
│   ├── /users*            → CRUD de usuarios, validaciones, reactivaciones
│   ├── /catalog/*         → catálogo de administración (marcas, estilos, productos, inventario)
│   ├── /orders*           → pedidos y tareas de producción
│   └── /reports/*         → reportes y dashboards globales
├── /scrap/*               → incidencias y pérdidas
└── /supplies/*            → insumos y categorías de insumo
```

### 6.4 Mapa de rutas por módulo (resumen)

Cada router del backend se corresponde con un módulo de negocio. Los verbos usados son **GET**, **POST**, **PUT**, **PATCH** y **DELETE**.

**Autenticación — `/api/v1/auth`**

| Método | Ruta | Propósito |
|---|---|---|
| POST | `/login` | Inicio de sesión (devuelve access + refresh) |
| POST | `/register` | Registro de usuario (cliente) |
| POST | `/refresh` | Renovar tokens |
| POST | `/change-password` | Cambiar contraseña |
| POST | `/forgot-password` | Solicitar restablecimiento de contraseña |
| POST | `/reset-password` | Restablecer contraseña con token |
| POST | `/logout` | Cerrar sesión |
| POST | `/logout-all` | Cerrar sesión en todos los dispositivos |
| POST | `/request-new-invitation` | Solicitar una nueva invitación (invitación expirada) |

**Usuarios — `/api/v1/users`**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/me` | Datos del usuario autenticado |
| POST | `/me/avatar` | Subir foto de perfil |
| DELETE | `/me/avatar` | Eliminar foto de perfil |

**Catálogo público — `/api/v1/catalog`**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/brands` | Listar marcas |
| GET | `/categories` | Listar categorías |
| GET | `/styles` | Listar estilos |
| GET | `/products` · `/products/{id}` | Listar y consultar productos |
| GET | `/products/{id}/inventory` | Inventario disponible de un producto |

**Admin — gestión de usuarios — `/api/v1/admin`**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/users` · `/users/{user_id}` | Listar y consultar usuarios |
| GET | `/users/pending-validation` | Usuarios pendientes de validar |
| PATCH | `/users/{user_id}/validate` · `/reject` | Validar o rechazar cuenta |
| PATCH | `/users/{user_id}/force-password-change` | Forzar cambio de contraseña |
| POST | `/users/create-employee` · `/create-client` · `/create-jefe` | Crear usuarios (sin contraseña) |
| POST | `/users/{user_id}/renew-invitation` | Renovar invitación expirada |
| GET | `/reactivation-tickets` | Solicitudes de reactivación |
| PATCH | `/reactivation-tickets/{id}/approve` · `/reject` | Aprobar o rechazar reactivación |
| PUT | `/users/{user_id}` | Actualizar datos de un usuario |
| DELETE | `/users/{user_id}` | Eliminar usuario (soft delete) |

**Admin — catálogo — `/api/v1/admin/catalog`**

| Método | Ruta | Propósito |
|---|---|---|
| GET · POST | `/brands` | Listar y crear marcas |
| PUT · DELETE | `/brands/{brand_id}` | Actualizar y eliminar marca |
| GET · POST | `/styles` | Listar y crear estilos |
| PUT · DELETE | `/styles/{style_id}` | Actualizar y eliminar estilo |
| GET · POST | `/products` | Listar y crear productos |
| PUT · DELETE | `/products/{product_id}` | Actualizar y eliminar producto |
| PUT | `/products/{id}/toggle-state` | Activar/desactivar producto |
| POST | `/products/{id}/image` | Subir imagen del producto |
| PATCH | `/products/{id}/manufactured-pairs` | Registrar pares fabricados |
| GET | `/products/{id}/inventory-by-size` | Inventario agrupado por talla |
| GET · POST | `/inventory` | Listar y registrar inventario |
| POST | `/inventory/bulk` | Actualización masiva de inventario |
| POST | `/inventory/movements` | Registrar movimiento de inventario |
| DELETE | `/inventory/{inventory_id}` | Eliminar registro de inventario |

**Pedidos — `/api/v1/admin/orders`**

| Método | Ruta | Propósito |
|---|---|---|
| GET · POST | `` | Listar y crear pedidos |
| GET | `/{order_id}` | Detalle de un pedido |
| PATCH | `/{order_id}/status` | Cambiar estado del pedido |
| PUT | `/{order_id}` | Actualizar líneas del pedido |
| DELETE | `/{order_id}` | Eliminar pedido |

**Producción — tareas y vales — `/api/v1/admin/orders/tasks`**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/tasks/next-number` | Siguiente número de vale |
| GET | `/tasks/all` | Listar tareas de producción (filtros) |
| GET · POST | `/{order_id}/tasks` | Listar y crear tareas de una orden |
| PATCH | `/tasks/{id}/assign` | Asignar tarea a un empleado |
| PATCH | `/tasks/{id}/status` | Actualizar estado de una tarea |

**Dashboard empleado — `/api/v1/dashboard/employee`**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/metrics` | KPIs del empleado |
| GET | `/tasks` · `/available-tasks` | Mis tareas y tareas disponibles |
| POST | `/tasks/{id}/claim` | Tomar una tarea disponible |
| PATCH | `/tasks/{id}/observation` · `/status` | Observación y estado de la tarea |
| GET | `/tasks/{id}/vale` | Vale de producción de una tarea |
| GET | `/report/my-performance` · `/my-tasks` | Reportes del empleado |
| GET | `/reports/shared` · `/reports/shared/{id}` | Reportes compartidos |
| GET · POST | `/incidences` · `/general-incidences` · `/product-incidences` | Incidencias |

**Dashboard jefe — `/api/v1/dashboard/admin`**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/metrics` | KPIs del panel del jefe |
| GET | `/recent-orders` | Últimos pedidos |
| GET | `/alerts` | Alertas activas |

**Cliente — `/api/v1/client`**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/orders` · `/orders/{order_id}` | Mis pedidos y detalle |

**Reportes — `/api/v1/admin/reports`**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/dashboard` | KPIs y gráficas del panel admin |
| GET | `/employee/{user_id}` | Reporte de un empleado |
| GET | `/role/{role_name}` | Reporte consolidado por rol |
| GET | `/customer/{user_id}` · `/customer/all/orders` | Reporte de clientes |
| GET | `/global/production` · `/global/sales` | Producción y ventas globales |
| PATCH | `/tasks/mark-paid` | Marcar tareas como pagadas |
| POST | `/send-email` | Enviar reporte por email |
| POST | `/share-internal` | Compartir reporte internamente |

**Insumos — `/api/v1/supplies`**

| Método | Ruta | Propósito |
|---|---|---|
| GET · POST | `/supplies/categories` | Categorías de insumo |
| GET · POST | `/supplies` | Listar y crear insumos |
| PUT · DELETE | `/supplies/{supply_id}` | Actualizar y eliminar insumo |
| POST | `/products/{product_id}/supplies` | Asociar insumos a un producto |
| GET | `/products/{product_id}/supplies/check` | Verificar disponibilidad de insumos |

**Incidencias y pérdidas — `/api/v1/scrap`**

| Método | Ruta | Propósito |
|---|---|---|
| GET · POST | `/defect-codes` | Códigos de defecto |
| GET · POST | `/losses` | Listar y registrar pérdidas |
| GET | `/losses/{loss_id}` | Detalle de una pérdida |
| PATCH | `/losses/{id}/repair` · `/solve` · `/approve` · `/reject` | Gestión de pérdidas |
| GET | `/stock` | Stock de scrap |
| GET | `/pending-incidences` | Incidencias pendientes de aprobación |
| POST | `/pending-incidences/{id}/approve` · `/reject` | Aprobar o rechazar incidencia |

**Notificaciones — `/api/v1/notifications`**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `` | Listar notificaciones del usuario |
| GET | `/unread-count` | Número de no leídas |
| PATCH | `/{id}/read` · `/read-all` | Marcar como leídas |
| DELETE | `/{notification_id}` | Eliminar notificación |
| WS | `/ws` | Notificaciones en tiempo real (WebSocket) |

**Health check**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/` | Estado del servicio |
| GET | `/api/v1/health` | Salud del backend |

### 6.5 Autenticación y autorización

- **JWT de doble token**: al iniciar sesión se reciben un **access token** (15 min) y un **refresh token** (7 días). El access viaja en cada petición como `Authorization: Bearer <token>`.
- **Roles del sistema**: cada usuario tiene un rol (**admin/jefe**, **empleado**, **cliente**). El control de acceso se hace de forma declarativa en la firma de la ruta con dependencias como `get_current_user`, `_require_admin_or_jefe` y `_require_jefe`.
- **Protección de rutas**: las rutas públicas (auth, catálogo) no requieren token; las del dashboard, cliente, pedidos, reportes e insumos sí.
- **Contraseñas temporales**: al crear empleados, clientes o jefes, el sistema genera una contraseña temporal (válida 24 h), la envía por email y obliga al cambio en el primer inicio de sesión (`must_change_password`).
- **Tiempo real**: las notificaciones se entregan vía WebSocket (`/api/v1/notifications/ws`) usando `app/utils/ws_manager.py`.

---
