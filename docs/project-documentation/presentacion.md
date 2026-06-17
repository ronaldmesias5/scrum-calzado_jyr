# 👟 CALZADO J&R 

> Sistema de Gestión y Producción de Calzado  
> **Equipo:** Andrés Felipe Gil Diaz, Ronald Jefrey Guerrero Mesías, Andrés Santiago Rivera Galeano  
> **Programa:** Análisis y Desarrollo de Software - SENA  

---

## 📋 1. DESCRIPCIÓN DEL PROYECTO

**Calzado J&R** es una fábrica dedicada a la producción de calzado tipo nacional, con más de 5 años de experiencia en el mercado, cuenta con diversas referencias y estilos, actualmente cuenta con 7 empleados incluyendo el dueño que se encarga de algunas actividades y la administradora encargada de supervisar y ejercer actividades en la fábrica, Calzado J&R cuenta con 4 clientes mayoristas ubicados en Bogotá D.C.

### Problema a Solucionar
Actualmente la fábrica de calzado enfrenta varias dificultades en su manera de trabajar:
- Los pedidos de los mayoristas se registran de forma manual, lo cual genera errores y pérdida de información.
- El inventario insumos y de calzado ya fabricado en bodega no se encuentra actualizado en tiempo real, lo que ocasiona confusión sobre la cantidad de calzado disponible.
- La asignación de tareas a los empleados se hace sin un control adecuado, lo que provoca retrasos y desorganización en la producción.

### Solución Propuesta
Desarrollar una aplicación web que unifique los procesos de la fábrica de calzado:
- **Clientes mayoristas:** Consultar catálogo digital y realizar pedidos de forma sencilla.
- **Dueño:** Control actualizado del inventario de insumos y calzado ya fabricado en bodega.
- **Empleados:** Asignación de tareas de producción, logrando una mejor organización del trabajo.

---

## 🎯 2. OBJETIVOS Y ALCANCE DEL PROYECTO

### 2.1. Objetivo General

Desarrollar una aplicación web para la gestión y producción de la fábrica de calzado J&R, que permita optimizar el control de pedidos, inventario y catálogo de productos, facilitando la toma de decisiones y mejorando la eficiencia en los procesos administrativos y productivos.

### 2.2. Objetivos Específicos

1. **Gestión de Pedidos:** Implementar un módulo de catálogo digital y pedidos en línea para que los clientes mayoristas puedan realizar sus compras de forma automatizada, eliminando el registro manual y reduciendo errores.

2. **Control de Inventario:** Desarrollar un sistema de inventario en tiempo real que permita al dueño conocer el stock actualizado de insumos y calzado fabricado en bodega.

3. **Asignación de Tareas:** Crear un módulo de asignación y seguimiento de tareas de producción para los empleados, mejorando la organización del trabajo y evitando retrasos.

4. **Centralización de Información:** Unificar todos los procesos (pedidos, inventario, tareas) en una sola plataforma accesible desde cualquier lugar.

### 2.3. Justificación

La fábrica necesita modernizar su gestión para trabajar de una forma más ordenada y eficiente. Al contar con una aplicación web, se logrará:

- **Para los clientes mayoristas:** Podrán realizar sus pedidos con más facilidad, consultar disponibilidad en tiempo real y hacer seguimiento de sus pedidos.
- **Para el dueño:** Tendrá la información centralizada, podrá tomar decisiones basadas en datos reales y controlar la producción eficientemente.
- **Para los empleados:** Sabrán con claridad qué tareas deben realizar, en qué fechas y podrán reportar su avance.

Esto no solo mejorará la productividad, sino que también fortalecerá la relación con los clientes y permitirá que la empresa sea más competitiva en un mercado que cada vez exige soluciones digitales.

### 2.4. Alcance del Proyecto

**Dentro del alcance (PRIMERA VERSIÓN):**

| Módulo | Funcionalidades incluidas |
|--------|---------------------------|
| **Catálogo de productos** | Visualización de calzado con talla, color |
| **Pedidos de clientes** | Registro de pedidos en línea, historial de pedidos por cliente |
| **Inventario de bodega e insumos** | Control de stock de calzado fabricado e insumos 
| **Asignación de tareas** | Creación de tareas por el admin, visualización por empleado, cambio de estado |
| **Gestión de usuarios** | Registro de clientes, creación de empleados por admin, validación de cuentas |
| **Autenticación** | Login seguro con JWT, recuperación de contraseña, cambio de contraseña obligatorio para empleados nuevos |

**Fuera del alcance (PARA VERSIONES FUTURAS):**

| Funcionalidad | Motivo |
|---------------|--------|
| **Facturación electrónica** | Requiere validación ante la DIAN, complejidad adicional |
| **Pagos en línea (Pasarela de pagos)** | Implica manejo de transacciones financieras y normativa legal ||
 |  |


---

## 🛠️ 3. STACK TECNOLÓGICO

### 3.1. Base de Datos

| Componente          | Tecnología         | Versión | Justificación |
|---------------------|--------------------|---------|---------------|
| **Motor de BD**     | PostgreSQL         | 17+     | Robustez, integridad referencial, soporte para UUID. |
| **ORM**             | SQLAlchemy         | 2.0+    | Abstracción de BD para Python. |
| **Migraciones**     | Alembic            | 1.13+   | Control de versiones del esquema. |
| **Cliente SQL**     | psql / DBeaver     | -       | Consultas manuales. |

**Entorno Docker:**
- Imagen: `postgres:17-alpine`
- Puerto: `5432`
- Scripts iniciales: `./db/init/*.sql`

### 3.2. Backend (API REST)

| Capa               | Tecnología         | Versión | Justificación |
|--------------------|--------------------|---------|---------------|
| **Lenguaje**       | Python             | 3.12+   | Curva de aprendizaje baja, tipado moderno. |
| **Framework Web**  | FastAPI            | 0.115+  | Alto rendimiento, validación automática. |
| **ORM**            | SQLAlchemy         | 2.0+    | Consistente con BD. |
| **Autenticación**  | JWT + python-jose  | -       | Stateless, seguro. |
| **Hashing**        | bcrypt (passlib)   | -       | Estándar de la industria. |
| **Validación**     | Pydantic           | 2.0+    | Schemas tipados. |
| **Servidor ASGI**  | Uvicorn            | 0.30+   | Servidor rápido. |

**Entorno Docker:**
- Imagen base: `python:3.12-slim`
- Puerto: `8000`
- Dependencias: `be/pyproject.toml` (gestor: uv)

### 3.3. Frontend (Interfaz de Usuario)

| Capa               | Tecnología         | Versión | Justificación |
|--------------------|--------------------|---------|---------------|
| **Lenguaje**       | TypeScript         | 5.5+    | Tipado estático. |
| **Framework UI**   | React              | 19+     | Componentización, Server Components opcional. |
| **Build Tool**     | Vite               | 5.4+    | Extremadamente rápido. |
| **Estilos**        | TailwindCSS        | 4.0+    | Utilidades first. |
| **Enrutamiento**   | React Router DOM   | 6.26+   | Estándar en React. |
| **Peticiones HTTP**| Axios              | 1.7+    | Interceptores. |
| **Estado Global**  | React Context      | nativo  | Suficiente para el proyecto. |

**Entorno Docker:**
- Imagen base (dev): `node:22-alpine`
- Imagen base (prod): `nginx:alpine`
- Puerto dev: `5173`
- Puerto prod: `80`

### 3.4. Orquestación con Docker Compose

**Archivo:** `docker-compose.yml`
```yaml
Servicios:
  - db: PostgreSQL 17 Alpine (puerto 5432)
  - be: Backend FastAPI Python 3.12 (puerto 8000)
  - fe: Frontend React + Vite (puerto 5173)
  - mailpit: Captura de correos en desarrollo (puertos 8025 web, 1025 SMTP)
```
**Red interna:** `calzado_jyr_net`
**Volumen persistente:** `calzado_jyr_data` para PostgreSQL

---

## 🔐 4. SEGURIDAD Y AUTENTICACIÓN

- **JWT**: Tokens con refresh, versionado (`token_version`) para Logout Global.
- **Roles**: `admin`, `empleado`, `cliente`. Protección de rutas por rol (`RoleGuard`).
- **Brute-force protection**: Rate limiter en endpoint de login (5 intentos/min).
- **Creación de empleados**: Sin contraseña manual — el sistema genera contraseña temporal, la envía por email y fuerza cambio en primer login (`must_change_password=true`).
- **Recuperación de contraseña**: Email con token de un solo uso y expiración de 15 min.
- **Validación de clientes**: Pendientes de aprobación en dashboard jefe.

---

## 📊 5. MÓDULOS PRINCIPALES

### 🏭 Producción
- **Pedidos**: Catálogo → creación de pedidos → producción con vales → completar desde bodega → entrega.
- **Tareas**: Asignación por admin, aceptación por empleado, cambio de estados (pendiente → proceso → completado), precios por operación.
- **Insumos**: Inventario de materiales con movimientos, categorías, colores.
- **Incidencias**: Registro de scrap, pérdidas y devoluciones. Flujo de aprobación pendientes.

### 👥 Gestión de Usuarios
- **Admin**: CRUD de empleados, clientes, jefes. Validación de cuentas nuevas.
- **Empleados**: Dashboard con tareas, incidencias, reportes de rendimiento, perfil con avatar.
- **Clientes**: Dashboard con historial de pedidos y consulta de estado.

### 📈 Reportes
- Exportación PDF (`jspdf` + `jspdf-autotable`) en todas las secciones.
- Reportes compartidos entre jefe y empleados.

---

## 🎯 6. ESTADO DEL PROYECTO (Sprint 7 — Junio 2026)

| Aspecto | Estado |
|---------|--------|
| Sprints completados | 1-7 (backlog), 8-16 (código implementado) |
| Migraciones BD | 37 |
| Modelos | 23 |
| Módulos backend | 12 |
| Páginas frontend | 31 (7 auth + 14 jefe + 6 empleado + 2 cliente + 2 landing) |
| Notificaciones | WebSocket en tiempo real |
| Badges | Conteos en sidebars (pedidos, usuarios, tareas, incidencias) |