# 👥 Usuarios de Prueba — Calzado J&R

> Archivo generado el 16/05/2026 para probar todos los roles y dashboards del sistema.
> URL del frontend: http://localhost:5173

---

## 1. Jefe — Dashboard completo

| Campo | Valor |
|-------|-------|
| Email | `ronald.jefe@gmail.com` |
| Contraseña | `Test123456!` |
| Rol | `employee` |
| Cargo | `jefe` |
| Acceso | `/dashboard/admin/*` (Dashboard jefe completo) |

---

## 2. Empleados — Dashboard empleado

Todos con contraseña `Test123456!` y acceso a `/dashboard/employee/*`.

| Nombre | Email | Cargo |
|--------|-------|-------|
| Carlos Cortador | `carlos@test.com` | **cortador** 🥩 |
| Sandra Guarnecedora | `sandra.g@test.com` | **guarnecedor** 🧵 |
| Pedro Solador | `pedro@test.com` | **solador** 👞 |
| Maria Emplantilladora | `maria@test.com` | **emplantillador** 📐 |

El dashboard empleado muestra:
- **Inicio**: métricas (tareas pendientes, completadas hoy, pares totales, incidencias) + tareas recientes
- **Mis Tareas**: listado filtrado con búsqueda y estados
- **Incidencias**: tarjetas de incidencias con filtro por estado

---

## 3. Cliente — Solo landing page

| Campo | Valor |
|-------|-------|
| Email | `santi@gmail.com` |
| Contraseña | `Test123456!` |
| Rol | `client` |
| Acceso | Solo landing page y catálogo público |

Los clientes no tienen dashboard. Su flujo es: landing → catálogo → login/register.

> ⚠️ **Nota**: Los clientes redirigen a `/dashboard/client`, ruta que no tiene UI implementada. Después del login serán redirigidos a la landing page.

---

## 4. Usuarios adicionales (contraseñas generadas)

Estos usuarios fueron creados desde el panel admin. Sus contraseñas temporales se mostraron **una sola vez** en pantalla y se enviaron por email. Si no las recuerdas, créalos de nuevo desde el dashboard o usa los de prueba de la sección 2.

| Email | Cargo |
|-------|-------|
| `calzadoproyecto8@gmail.com` | cortador |
| `ronaldmesias512@gmail.com` | solador |
| `sandra@gmail.com` | guarnecedor |
| `marina@gmail.com` | emplantillador |

---

## 5. Nota importante sobre el primer inicio de sesión

Todos los usuarios creados desde el panel admin (incluyendo los de prueba) tienen `must_change_password = true`. Esto significa que **en su primer inicio de sesión serán redirigidos a `/change-password`** para cambiar la contraseña obligatoriamente.

Después de cambiar la contraseña, el sistema los redirige automáticamente al dashboard correcto.

---

## 6. Rutas del sistema

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing page |
| `/auth/login` | Público | Inicio de sesión |
| `/dashboard/admin/*` | Jefe | Dashboard jefe (pedidos, catálogo, empleados, etc.) |
| `/dashboard/employee/*` | Empleados | Dashboard empleado (tareas, incidencias) |

---

## 6. Probar el envío de emails

Para probar que los emails se envían correctamente vía Gmail SMTP:

1. Inicia sesión como `ronald.jefe@gmail.com` / `Test123456!`
2. Ve a **Empleados** → **Crear empleado**
3. Completa el formulario (sin contraseña)
4. El sistema genera una contraseña temporal, la muestra en pantalla Y envía un email a la dirección registrada
5. Revisa los logs del backend: `docker logs calzado_jyr_be`
6. Si el email llegó al destinatario, el SMTP con Gmail funciona correctamente
