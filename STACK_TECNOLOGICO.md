# CALZADO J&R — Stack Tecnológico

> Sistema de gestión de pedidos, producción e inventario para la fábrica de calzado J&R.
> Documento que describe la estructura del proyecto, el tipo de arquitectura elegido y cómo se comunican los componentes con la API.

---

## 1. ¿Qué estructura tiene el proyecto y por qué?

### 1.1 El porqué de la estructura

La estructura de CALZADO J&R se eligió siguiendo la que nos enseñaron durante la formación para el desarrollo de proyectos. Es el modelo de referencia que aprendimos para construir aplicaciones web completas: separar el proyecto en capas (cliente, servidor y base de datos), dividir la lógica por responsabilidades dentro de cada capa, y centralizar la comunicación bajo un mismo contrato (la API REST).

### 1.2 Stack Tecnológico

| Capa | Tecnología | Rol |
|---|---|---|
| **Frontend Web** | React 19 + Vite 7 + TypeScript + TailwindCSS 4 | Interfaz de usuario (cliente) |
| **Backend** | FastAPI + Python 3.12 + SQLAlchemy 2.0 + Alembic | API REST (servidor) |
| **Base de datos** | PostgreSQL 17 (Docker) | Almacenamiento persistente |
| **Infraestructura** | Docker Compose (db, be, fe, mailpit) | Despliegue y correos de prueba |
| **Pruebas** | pytest (BE) · Vitest (FE) | Calidad |
| **Linting/Formato** | Ruff (BE) · ESLint + Prettier (FE) | Estilo de código |

### 1.3 Tipos de estructura y por qué los usamos

| Ámbito | Tipo de estructura | Por qué la hacemos así |
|---|---|---|
| **Global** | **Modelo Cliente-Servidor** | Existen varios clientes (Web y Postman) que consumen un único servidor (FastAPI) que a su vez consulta la base de datos. Es el modelo estándar para aplicaciones web y fue el que aprendimos en la formación: el cliente pide, el servidor responde, nunca el cliente toca la BD directamente. |
| **Backend** | **API REST** | La comunicación entre clientes y servidor se hace con peticiones HTTP sobre recursos (pedidos, productos, tareas, incidencias…), devolviendo **JSON**. REST es un estilo arquitectónico ampliamente usado porque es simple, sin estado y funciona con el protocolo HTTP que ya conocemos. |
| **Backend (interna)** | **Arquitectura en capas** | Dentro del servidor separamos: **Model** (modelos ORM SQLAlchemy en `models/`), **Vista** (contratos Pydantic en `schemas/`, que definen cómo se ve la información al salir/entrar) y **Controlador** (rutas HTTP en `routers/` + lógica de negocio en `services/` con `controllers/` como adaptadores intermedios). Lo hacemos así para que la lógica sea reutilizable, testeable y el código quede ordenado. |
| **Frontend** | **Organización por módulo de negocio** | Los componentes se agrupan **por módulo de negocio** (`modules/dashboard-jefe/`, `modules/dashboard-empleado/`…), cada uno con sus páginas, componentes, servicios de API y utilidades. Los átomos reutilizables viven en `components/ui/`. Así los componentes son fáciles de encontrar y escalan cuando el proyecto crece. |
| **Base de datos** | **Esquema versionado con migraciones (Alembic)** | Las tablas no se crean "a mano" sino mediante **38 migraciones versionadas** que se aplican automáticamente al arrancar el backend. Esto garantiza que todos los desarrolladores tengan la misma estructura de BD y que los cambios sean controlados y reversibles. |

---

## 2. Estructura del proyecto

### 2.1 Estructura completa

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

### 2.2 Estructura del backend (`be/`)

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
│   ├── routers/              # (21 archivos) Endpoints HTTP por módulo (ver sección 3.3)
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

### 2.3 Estructura del frontend (`fe/src/`)

```
fe/
├── src/
│   ├── main.tsx              # Punto de entrada
│   ├── App.tsx               # Router y providers
│   ├── index.css             # Tema (TailwindCSS 4)
│   ├── modules/              # Módulos de negocio (import alias @/modules/…)
│   │   ├── auth/             # (7 páginas) Login, Register, Password Reset
│   │   ├── dashboard-jefe/   # (14 páginas) Panel admin: usuarios, pedidos, catálogo,
│   │   │                     #   inventario, insumos, reportes, incidencias
│   │   ├── dashboard-empleado/  # (6 páginas) Tareas, vale, incidencias, reportes
│   │   ├── dashboard-cliente/   # (3 páginas) Pedidos, catálogo mayorista
│   │   └── landing/          # (2 páginas) Landing pública + catálogo
│   │       └── (cada módulo: pages/ · components/ · services/ · types/ · utils/)
│   ├── components/
│   │   ├── ui/               # (16) Átomos reutilizables: Button, Modal, PageTransition…
│   │   └── layout/           # Estructura: AdminLayout, EmployeeLayout, ClientLayout…
│   ├── context/              # EmployeeBadgeCountsContext y otros
│   ├── hooks/                # useModalDialog y otros
│   ├── lib/                  # Utilidades (axios, format)
│   └── types/                # Tipos TypeScript compartidos (auth, orders, products…)
├── package.json  vite.config.ts  tsconfig.json
└── Dockerfile
```

### 2.4 Estructura de la base de datos (`db/`)

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

## 3. Comunicación con la API

### 3.1 ¿Cómo se comunican los componentes?

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

### 3.2 Convención de rutas

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

### 3.3 Mapa de rutas por módulo (resumen)

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

**Health check**

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/` | Estado del servicio |
| GET | `/api/v1/health` | Salud del backend |

### 3.4 Autenticación y autorización

- **JWT de doble token**: al iniciar sesión se reciben un **access token** (15 min) y un **refresh token** (7 días). El access viaja en cada petición como `Authorization: Bearer <token>`.
- **Roles del sistema**: cada usuario tiene un rol (**admin/jefe**, **empleado**, **cliente**). El control de acceso se hace de forma declarativa en la firma de la ruta con dependencias como `get_current_user`, `_require_admin_or_jefe` y `_require_jefe`.
- **Protección de rutas**: las rutas públicas (auth, catálogo) no requieren token; las del dashboard, cliente, pedidos, reportes e insumos sí.
- **Contraseñas temporales**: al crear empleados, clientes o jefes, el sistema genera una contraseña temporal (válida 24 h), la envía por email y obliga al cambio en el primer inicio de sesión (`must_change_password`).

---
