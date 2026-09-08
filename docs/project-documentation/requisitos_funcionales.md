# REQUERIMIENTOS FUNCIONALES CONSOLIDADOS

**Sistema de Gestión Integral de Calzado**

---

# RF-001 — Creación de Cuentas de Acceso

| Campo | Valor |
|-------|-------|
| **ID** | RF-001 |
| **Nombre** | Creación de Cuentas de Acceso |
| **Módulo** | Gestión de Usuarios y Autenticación |
| **Prioridad** | Alta |
| **Estado** | No implementado según lo descrito |

**Descripción:**

Este requerimiento permite a los usuarios potenciales (clientes mayoristas) crear una cuenta de acceso de manera autónoma desde la página principal del sistema, sin intervención del administrador en la fase inicial. Los empleados no pueden crear cuentas; el administrador les asigna su cuenta con sus credenciales directamente. La funcionalidad establece un punto de entrada controlado y autogestionado exclusivo para clientes, donde el usuario proporciona sus datos personales para crear su acceso al sistema. El proceso valida que los datos ingresados sean válidos y únicos, y crea la cuenta activa y validada de inmediato. El sistema envía un correo de verificación de email no bloqueante (válido por 24 horas). No existe estado "pendiente de validación administrativa" para el auto-registro ni notificación al panel del administrador. La creación de cuentas de empleados permanece centralizada en el administrador.

**Controles y Restricciones:**

Cualquier cliente potencial puede acceder al formulario de registro desde la página principal sin necesidad de autenticación, mientras que los empleados no tienen acceso al formulario de registro público ya que sus cuentas son creadas exclusivamente por el administrador. Los campos del formulario son: nombres, apellidos, correo electrónico, número de teléfono, tipo y número de documento de identidad, nombre comercial opcional (solo clientes), contraseña y aceptación de términos. No se solicitan razón social ni NIT. El sistema valida que el correo electrónico no esté ya registrado, impidiendo duplicidades. El correo electrónico debe tener formato válido. Una vez enviado el formulario, el sistema crea la cuenta activa y validada de inmediato. No se genera solicitud pendiente ni notificación al administrador. Los eventos relevantes quedan registrados en el archivo de log `audit.log`.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando un cliente potencial puede acceder al formulario desde la página principal, diligenciar todos los campos obligatorios con información válida y única, enviar el formulario y recibir confirmación visual de que su cuenta fue creada y está activa. El sistema debe validar en el momento los datos e impedir el registro si el correo ya existe. Si el formulario está incompleto o con errores de formato debe impedir el envío y mostrar mensajes específicos. Si el cliente intenta registrarse nuevamente con el mismo correo, el sistema debe rechazar el duplicado. Los eventos relevantes deben quedar registrados en el archivo de log `audit.log`.

---

# RF-002 — Validación y Activación de Cuentas por Administrador

| Campo | Valor |
|-------|-------|
| **ID** | RF-002 |
| **Nombre** | Validación y Activación de Cuentas por Administrador |
| **Módulo** | Gestión de Usuarios y Autenticación |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite al administrador del sistema revisar, validar y activar cuentas de acceso. La funcionalidad aplica a invitaciones y solicitudes gestionadas por el administrador: las cuentas creadas por el administrador (empleados, clientes, jefes) se generan activas y validadas con contraseña temporal de 12 caracteres e `invitation_expires_at` de 24 horas; el auto-registro público no produce cuentas pendientes, por lo que el flujo de validación no aplica a cuentas auto-registradas. El administrador evalúa la información proporcionada, puede aprobar o rechazar la solicitud, y al aprobar, el sistema activa técnicamente la cuenta y envía un correo de notificación al usuario.

**Controles y Restricciones:**

Solo el administrador o el jefe tienen acceso al módulo de validación de cuentas. El sistema presenta la lista de usuarios pendientes con los datos proporcionados. El administrador puede aprobar o rechazar cada solicitud, siendo obligatorio ingresar un comentario de justificación en caso de rechazo. Al aprobar, el sistema activa los flags `is_validated` e `is_active`, registra quién validó y cuándo, y envía un correo de notificación al usuario. No se genera contraseña temporal al aprobar (solo se generan al crear cuentas por administrador, con vigencia de 24 horas). No hay estado intermedio "aprobada - pendiente de notificación" ni validación de correo rebotado. Cada acción (aprobación, rechazo, envío de correo) queda registrada en el archivo de log `audit.log`.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede visualizar las solicitudes pendientes, seleccionar una, revisar la información, y completar el proceso de aprobación o rechazo sin errores. Al aprobar, el sistema debe activar la cuenta, enviar el correo de notificación al usuario y mostrar confirmación de la acción. Al rechazar, debe registrar el motivo y notificar al usuario por correo sobre la decisión, cambiando el estado de la solicitud a "rechazada". Los eventos deben quedar registrados en el archivo de log `audit.log`.

---

# RF-003 — Inicio de Sesión

| Campo | Valor |
|-------|-------|
| **ID** | RF-003 |
| **Nombre** | Inicio de Sesión |
| **Módulo** | Gestión de Usuarios y Autenticación |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite a los usuarios registrados, clientes mayoristas y empleados, acceder al sistema mediante sus credenciales personales. La funcionalidad de autenticación es esencial para garantizar que cada usuario interactúe únicamente con los módulos que le corresponden según su rol, manteniendo la seguridad, trazabilidad y control de acceso. El sistema debe autenticar al usuario utilizando algoritmos de cifrado seguros, iniciar una sesión controlada temporalmente, y redirigirlo al entorno operativo correspondiente ya sea para registrar pedidos, consultar tareas asignadas o gestionar procesos internos.

**Controles y Restricciones:**

Solo los usuarios con cuentas activas pueden iniciar sesión. El sistema valida que el correo esté asociado a una cuenta registrada y que la contraseña coincida usando hashing con bcrypt. Tras 5 intentos fallidos consecutivos la cuenta se bloquea 15 minutos (HTTP 429). Los tokens duran 15 minutos (access) y 10 minutos (refresh, con rotación en cada uso); no hay cierre por inactividad separado ni bloqueo de sesiones simultáneas (multisesión permitida; existe cierre de todas las sesiones manual desde Ajustes). Los intentos de acceso se registran en el archivo `audit.log`, no en un historial consultable en pantalla.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando un usuario con cuenta activa puede iniciar sesión correctamente y acceder al panel correspondiente a su rol sin errores. El sistema valida los datos ingresados, autentica al usuario y lo redirige según corresponda. Si el usuario omite campos se impide el acceso; si el correo no existe o la contraseña es incorrecta se muestra un mensaje genérico (sin distinguir el caso, anti-enumeración). Tras 5 intentos fallidos la cuenta se bloquea 15 minutos. Los tokens expiran a los 15 minutos (access) y 10 minutos (refresh con rotación); no hay bloqueo multisesión. Los eventos de autenticación se registran en el archivo `audit.log`.

---

# RF-004 — Recuperación de Cuentas

| Campo | Valor |
|-------|-------|
| **ID** | RF-004 |
| **Nombre** | Recuperación de Cuentas |
| **Módulo** | Gestión de Usuarios y Autenticación |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite a los usuarios registrados recuperar el acceso a sus cuentas en caso de olvido de contraseña, mediante un proceso seguro de verificación y restablecimiento. La funcionalidad garantiza la continuidad operativa sin comprometer la seguridad del sistema, validando la identidad del usuario, generando un enlace temporal de recuperación y permitiendo el establecimiento de una nueva contraseña que cumple con las políticas de seguridad. Todo el flujo debe estar protegido contra accesos no autorizados, intentos automatizados y enlaces caducados, registrando cada evento para fines de trazabilidad.

**Controles y Restricciones:**

El sistema permite la recuperación únicamente a usuarios con cuenta registrada y activa. El usuario ingresa su correo electrónico; la respuesta es genérica anti-enumeración ("Si el email está registrado...") y no confirma si el correo existe. Una vez validado, genera un token único con vigencia de 60 minutos y envía el enlace por correo electrónico. La nueva contraseña debe cumplir la política real: mínimo 8 caracteres con mayúscula, minúscula y número (sin símbolo obligatorio). El evento se registra en el archivo `audit.log`, sin IP persistida en base de datos.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el usuario puede iniciar el proceso de recuperación, ingresar un correo, recibir el enlace (si el correo existe), acceder al formulario de restablecimiento, establecer una nueva contraseña válida y recuperar el acceso. Si el enlace expira se bloquea el acceso y se solicita una nueva solicitud; si la nueva contraseña no cumple los requisitos se impide el cambio. Una vez completado se muestra "Contraseña restablecida exitosamente". Todos los eventos se registran en el archivo `audit.log`.

---

# RF-005 — Solicitud de Reactivación de Cuentas

| Campo | Valor |
|-------|-------|
| **ID** | RF-005 |
| **Nombre** | Solicitud de Reactivación de Cuentas |
| **Módulo** | Gestión de Usuarios y Autenticación |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite a los usuarios cuya cuenta está inactiva (`is_active=False` y `deleted_at IS NULL`) solicitar su reactivación mediante un formulario simple. El formulario real solo pide correo electrónico, teléfono y documento de identidad; el motivo queda fijo como "Solicitud de reactivación de cuenta", sin carga de evidencia ni identificador visible para el usuario. La solicitud crea un ticket interno con estado pendiente que el jefe o administrador revisa en el panel de usuarios (pestaña Reactivación) y aprueba o rechaza.

**Controles y Restricciones:**

El backend solo valida que la cuenta exista con `is_active=False`, sin distinguir sub-estados "suspendida" o "inactiva" como estados separados. El formulario no incluye motivo detallado ni evidencia opcional. La aprobación o rechazo la realiza el jefe o administrador desde el panel; la evidencia fotográfica no está implementada en el frontend. No existe tabla de auditoría consultable: los eventos de autenticación se registran en el archivo `audit.log`.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando un usuario con cuenta inactiva puede enviar la solicitud con correo, teléfono y documento válidos, el ticket queda pendiente para revisión del jefe, y al aprobarse la cuenta vuelve a estado activo. Si el formulario está incompleto se impide el envío. No implementado: motivo detallado, evidencia adjunta, identificador de ticket visible, comentarios obligatorios verificables en frontend, estados diferenciados "suspendida/inactiva" e historial de auditoría en base de datos.

---

# RF-006 — Creación de Catálogo

| Campo | Valor |
|-------|-------|
| **ID** | RF-006 |
| **Nombre** | Creación de Catálogo |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite al jefe o administrador registrar productos en el catálogo digital del sistema, incluyendo nombre, descripción, color, categoría, marca, estilo, imagen y precios por tarea. Cada producto queda vinculado a sus atributos operativos y se refleja en los módulos de consulta según su estado de activación. No existe campo de referencia única ni SKU: la unicidad se valida por combinación de nombre dentro del mismo estilo, marca y categoría (error 409 si se repite).

**Controles y Restricciones:**

Solo el jefe y el administrador tienen acceso al módulo de creación de catálogo (no existe rol de "diseñador de producto"). El sistema valida duplicados por nombre + estilo + marca + categoría, no por referencia única. Las imágenes permiten JPG, PNG, WEBP, GIF, AVIF, BMP, HEIC y TIFF hasta 5 MB. La eliminación es lógica (soft delete) y no valida si el producto tiene historial de pedidos asociados. No existe tabla de auditoría consultable: los eventos se registran en el archivo `audit.log`.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el jefe puede registrar el producto con datos válidos y vincularlo con categorías y marcas existentes. Si hay duplicado por nombre dentro del mismo estilo, marca y categoría se rechaza con error 409. Si el archivo de imagen no cumple formato o tamaño se bloquea la carga. No implementado según lo descrito: campo de referencia única/SKU, restricción a JPG/PNG de 2 MB, bloqueo de borrado con pedidos asociados, mensaje "Producto registrado exitosamente." y "El modelo no puede eliminarse. Cambie su estado a inactivo.", rol de diseñador y auditoría en base de datos.

---

# RF-007 — Clasificación por Categorías

| Campo | Valor |
|-------|-------|
| **ID** | RF-007 |
| **Nombre** | Clasificación por Categorías |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite organizar los productos del catálogo digital en categorías definidas, facilitando la navegación y la búsqueda por parte de los usuarios. El catálogo público expone el listado de categorías para filtrar productos. Verificado en código: el endpoint público filtra categorías solo por borrado lógico, sin filtro por estado activo.

**Controles y Restricciones:**

El endpoint público de categorías filtra únicamente por `deleted_at IS NULL`, sin filtro por estado activo. No se encontró verificado en código un CRUD administrativo de categorías con bloqueo de borrado que liste modelos dependientes en ventana emergente (esa protección sí existe y está verificada para marcas y estilos, no para categorías). No existe tabla de auditoría consultable.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el catálogo público lista las categorías no eliminadas y el filtrado por categoría muestra solo los productos correspondientes. Pendiente de verificar o implementar: CRUD administrativo de categorías, bloqueo de borrado con lista de modelos dependientes, ocultamiento de productos por categoría inactiva, tiempo de respuesta menor a 2 segundos y registro de auditoría.

---

# RF-008 — Gestión de Marcas y Estilos

| Campo | Valor |
|-------|-------|
| **ID** | RF-008 |
| **Nombre** | Gestión de Marcas y Estilos |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Implementado, con matices |

**Descripción:**

Este requerimiento permite al jefe o administrador registrar, editar y eliminar marcas comerciales asociadas a los productos del catálogo, así como definir los estilos que pertenecen a cada marca. Verificado en código: el CRUD de marcas y estilos existe, se rechazan duplicados por nombre (409) y se bloquea el borrado de marcas con estilos asociados y de estilos con productos asociados.

**Controles y Restricciones:**

Solo el jefe y el administrador tienen acceso al módulo de gestión de marcas y estilos. Al registrar una nueva marca o estilo, el sistema valida que no existan duplicados en el nombre (409). No se puede eliminar marca o estilo si está asociado a modelos dependientes. Matiz verificado: el endpoint público de estilos filtra solo por borrado lógico, no por estado activo, por lo que un estilo inactivo no queda necesariamente oculto. No existe tabla de auditoría inmutable: los eventos se registran en el archivo `audit.log`.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el jefe puede registrar marcas y estilos con nombres válidos y únicos, editarlos y eliminarlos si no tienen vínculos registrados. Si se intenta eliminar marca o estilo vinculado a modelos dependientes se muestra mensaje de error justificando la imposibilidad. Pendiente de corregir o ajustar en el documento: ocultamiento de estilos inactivos en el catálogo público (el código solo filtra eliminados) y auditoría inmutable en base de datos.

---

# RF-009 — Visualización de Catálogo como Visitante

| Campo | Valor |
|-------|-------|
| **ID** | RF-009 |
| **Nombre** | Visualización de Catálogo como Visitante |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite a cualquier usuario visitante, sin necesidad de estar registrado o autenticado, consultar el catálogo público de productos disponibles desde la página principal del sistema. Verificado en código: el endpoint público lista productos con filtros por categoría, marca, estilo, color y búsqueda, con paginación, y el detalle solo muestra productos con estado activo. Matiz importante: la API pública expone disponibilidad agregada (`available` y `sizes_inventory`), por lo que no es cierto que no exponga información de inventario.

**Controles y Restricciones:**

El acceso al catálogo público está habilitado desde la página principal sin requerir inicio de sesión. El sistema muestra únicamente productos con estado activo. La API pública expone disponibilidad agregada por producto (`available`, `sizes_inventory`); si se requiere ocultar todo rastro de inventario, debe filtrarse en el backend. Los mensajes de lista vacía y la redirección al registro son comportamiento del frontend, no respuestas del backend. No hay garantía de tiempo de carga menor a 3 segundos verificada con prueba de carga, ni registro de navegación para análisis de comportamiento.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando cualquier visitante puede acceder al catálogo desde la página principal, visualizar únicamente productos activos y consultar información básica sin errores. Si el visitante aplica filtros debe responder con resultados adecuados o mensaje de sin coincidencias. No implementado según lo descrito: mensaje "No hay productos disponibles en este momento" como respuesta del backend, ausencia total de datos de stock en el JSON (la API expone `available`), mensaje "Debe crear una cuenta para acceder a esta funcionalidad.", mensajes por categoría vacía y tiempo de respuesta menor a 3 segundos garantizado.

---

# RF-010 — Consulta de Catálogo por Cliente Mayorista

| Campo | Valor |
|-------|-------|
| **ID** | RF-010 |
| **Nombre** | Consulta de Catálogo por Cliente Mayorista |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Parcialmente implementado (falta favoritos, registro de visualizaciones y estado borrador) |

**Descripción:**

Este requerimiento permite al cliente mayorista, una vez autenticado en el sistema, consultar el catálogo completo de productos disponibles para solicitud de fabricación o entrega inmediata. La funcionalidad está diseñada para ofrecer una experiencia de navegación clara, segmentada y operativamente útil, permitiendo al cliente visualizar productos activos con información detallada incluyendo tallas, colores, marcas y estilos. Esta consulta es fundamental para que el cliente pueda preparar sus pedidos con base en la oferta actual, identificar combinaciones disponibles y tomar decisiones comerciales informadas. El catálogo mayorista existe y funciona (`WholesaleCatalogPage`, `wholesaleCatalogApi`); no existe función de favoritos (sin resultados en código), ni registro de visualizaciones, ni estado borrador de pedido.

**Controles y Restricciones:**

Solo usuarios con rol de cliente mayorista que hayan iniciado sesión correctamente pueden acceder al módulo de catálogo interno. El sistema debe validar la sesión activa antes de mostrar productos y mostrar únicamente aquellos con estado "activo" y habilitados para consulta interna. Cada producto debe mostrar imagen principal, nombre, tallas y colores disponibles, marca y estilo. El sistema debe permitir aplicar filtros (categoría, marca, estilo, color, búsqueda) y el cliente debe poder iniciar proceso de pedido seleccionando modelos con transferencia automática al formulario de pedido (carrito `CartContext`). No implementado: guardar como favorito persistente, combinaciones agotadas deshabilitadas (el cliente no ve stock en la interfaz), ni garantía de inventario en tiempo real.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el cliente mayorista puede acceder al catálogo tras iniciar sesión, visualizar únicamente productos activos y disponibles, y consultar toda la información relevante sin errores. Si selecciona modelos e inicia proceso de pedido, el sistema debe crear un pedido en estado "pendiente" (sin estado "borrador" intermedio). Si intenta acceder sin autenticación debe impedir el acceso y redirigir al inicio de sesión. No implementado: persistencia de favoritos entre sesiones, combinaciones agotadas deshabilitadas, ni registro de eventos de visualización en historial.

---

# RF-011 — Sistema de Filtrado de Búsqueda

| Campo | Valor |
|-------|-------|
| **ID** | RF-011 |
| **Nombre** | Sistema de Filtrado de Búsqueda |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Parcial (filtros compuestos básicos; sin garantía de <2s con 5.000 modelos, sin log de eventos ni validación de incompatibilidad) |

**Descripción:**

Este requerimiento permite implementar un motor de búsqueda y filtrado que facilite la localización de productos dentro del catálogo digital, tanto en la vista pública como en los módulos internos de consulta. La funcionalidad está diseñada para mejorar la experiencia de navegación, reducir el tiempo de búsqueda y permitir la localización precisa de productos según atributos operativos como categoría, marca, estilo, color y búsqueda por texto libre con coincidencias parciales. Existen filtros compuestos básicos con paginación (`WholesaleCatalogPage`, `WholesaleCatalogFilters`); sin prueba de carga que respalde rendimiento con grandes volúmenes.

**Controles y Restricciones:**

El sistema de filtrado debe estar disponible en todos los módulos de visualización de catálogo incluyendo página principal para visitantes, panel de clientes mayoristas y entorno de empleados. Los filtros deben poder combinarse entre sí permitiendo búsquedas específicas simultáneas por múltiples atributos. Los resultados deben actualizarse en tiempo real sin necesidad de recargar la página. El sistema debe permitir limpiar los filtros aplicados mediante un botón visible que restablezca la vista general del catálogo. No implementado: indexación garantizada con límite de 2 segundos ante más de 5.000 modelos, registro de eventos de filtrado para análisis, ni bloqueo por filtros incompatibles.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el sistema permite aplicar filtros de búsqueda mostrando únicamente productos que cumplen con criterios seleccionados. Cuando un usuario aplica filtros compuestos simultáneamente debe retornar el conjunto exacto de resultados. Si no hay coincidencias debe mostrar mensaje de vacío. El botón para limpiar filtros debe funcionar correctamente y restaurar la vista general. No implementado: garantía de respuesta en menos de 2 segundos con 5.000 modelos, mensajes exactos "No se encontraron productos que coincidan con los criterios seleccionados", bloqueo por filtros incompatibles, ni registro de eventos para auditoría y análisis.

---

# RF-012 — Realización de Pedidos por Cliente Mayorista

| Campo | Valor |
|-------|-------|
| **ID** | RF-012 |
| **Nombre** | Realización de Pedidos por Cliente Mayorista |
| **Módulo** | Gestión de Pedidos |
| **Prioridad** | Alta |
| **Estado** | Parcial (el endpoint existe y crea pedidos; sin cantidad mínima, verificación de bodega, número legible ni estados intermedios) |

**Descripción:**

Este requerimiento permite al cliente mayorista, una vez autenticado en el sistema, registrar pedidos de fabricación de calzado según las combinaciones disponibles en el catálogo digital (`POST /client/orders`, `create_order` en `services/orders.py`). La funcionalidad permite que el cliente seleccione productos específicos, defina tallas, colores y cantidades requeridas, y envíe una solicitud formal que será procesada por el área administrativa. El formulario captura los modelos, desagregación de cantidades por talla y color, cantidad total (`total_pairs` recalculado en servidor) y fecha de entrega requerida. El pedido se crea en estado `pendiente` con UUID como identificador; sin cantidad mínima configurable, sin verificación de bodega y sin número de pedido legible.

**Controles y Restricciones:**

Solo clientes mayoristas verificados y activos pueden enviar pedidos. El sistema debe validar la sesión activa antes de permitir la operación. Al iniciar el proceso, el cliente debe seleccionar uno o más productos del catálogo activo, permitiendo la selección de talla, color y cantidad, validando que la cantidad sea un valor numérico positivo (`total_pairs > 0`, `details.amount > 0`). Debe registrar fecha y hora de solicitud, y al enviarse genera un pedido con estado inicial `pendiente`. No implementado: cantidad mínima por pedido configurable, verificación de disponibilidad en bodega con clasificación "aprobado para entrega"/"pendiente de fabricación", número de pedido único legible, ni estado "pendiente de revisión administrativa" (el estado real es `pendiente`).

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el cliente mayorista puede acceder al módulo de pedidos, seleccionar productos válidos con combinaciones registradas, establecer cantidades, confirmar el pedido y recibir notificación de registro exitoso. Si el cliente envía pedido válido debe generar ID único (UUID) y notificar al área comercial. Si intenta registrar pedido sin productos debe mostrar mensaje de error, si la cantidad es inválida debe impedirlo. No implementado: bloqueo con "La cantidad mínima de pedido es X pares", clasificación "aprobado para entrega"/"pendiente de fabricación", número de pedido de cliente único legible, ni trazado de eventos en auditoría.

---

# RF-013 — Notificación de Nuevos Pedidos

| Campo | Valor |
|-------|-------|
| **ID** | RF-013 |
| **Nombre** | Notificación de Nuevos Pedidos |
| **Módulo** | Gestión de Pedidos |
| **Prioridad** | Alta |
| **Estado** | Parcial (notifica vía BD+WS+email sin garantía de <5s; enlace al listado, sin deduplicación) |

**Descripción:**

Este requerimiento permite al sistema generar notificaciones automáticas dirigidas a los jefes cada vez que un cliente mayorista registra un nuevo pedido (`_trigger_notifications` en `routers/orders.py`, broadcast WS en `ws_manager`, emails fire-and-forget). La funcionalidad asegura que el equipo operativo quede informado sobre las solicitudes entrantes. La notificación incluye datos esenciales del pedido y queda registrada para trazabilidad operativa; sin garantía de latencia menor a 5 segundos.

**Controles y Restricciones:**

Las notificaciones deben generarse automáticamente tras la creación exitosa del pedido por parte de un cliente mayorista autenticado. El sistema debe validar que el pedido esté completo con productos seleccionados, combinaciones válidas de talla y color, y cantidades definidas. La notificación debe incluir: ID de pedido, nombre del cliente, fecha y hora de registro, cantidad total de ítems, combinaciones solicitadas y estado inicial. Esta información debe aparecer en el panel del administrador y enviarse por correo electrónico si está habilitado. Todas las notificaciones deben quedar registradas en el historial del sistema. No implementado: enlace directo autenticado a la ficha del pedido (el enlace lleva al listado `/dashboard/admin/orders`), envío con prioridad alta verificable, indicación de entrega-directa vs producción, ni deduplicación de alertas.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando tras el registro exitoso de un pedido, el sistema genera notificación automática que aparece en el panel de usuarios autorizados con los datos relevantes. El cuerpo del correo debe incluir al menos nombre del cliente, ID del pedido y cantidad total. Si el pedido no se registra correctamente no debe emitirse alerta. Si el correo falla debe registrar el evento. No implementado: indicación de atención por entrega directa o producción, prevención de duplicidades si el pedido ya fue notificado, enlace directo a la ficha del pedido, ni trazado en historial más allá del registro en BD.

---

# RF-014 — Consulta de Estado de Pedidos por Cliente

| Campo | Valor |
|-------|-------|
| **ID** | RF-014 |
| **Nombre** | Consulta de Estado de Pedidos por Cliente |
| **Módulo** | Gestión de Pedidos |
| **Prioridad** | Alta |
| **Estado** | Parcial (listado y detalle existen; sin filtros en servidor, % avance, alertas de retraso ni página de acceso no autorizado) |

**Descripción:**

Este requerimiento permite al cliente mayorista consultar el historial de pedidos que ha registrado en el sistema (`GET /client/orders` paginado + detalle), incluyendo el estado actual de cada solicitud, las combinaciones de productos solicitadas, las cantidades y los eventos asociados. El módulo ofrece una vista clara y ordenada de todos los pedidos realizados. Sin línea de tiempo con fechas por estado, sin porcentaje de avance de producción, y sin alertas automáticas de retraso.

**Controles y Restricciones:**

Solo usuarios con rol de cliente mayorista que hayan iniciado sesión correctamente pueden acceder al módulo de consulta de pedidos. El cliente solo puede visualizar sus propios pedidos (el acceso a pedidos de otros clientes devuelve 404, no existe página de "acceso no autorizado" ni bitácora de seguridad). La información de costos o márgenes está oculta. Una vez dentro, el sistema debe mostrar todos los pedidos organizados cronológicamente con: número de pedido, fecha de registro, estado actual, productos solicitados, tallas, colores y cantidades. No implementado: filtros por estado, fecha o referencia en el servidor (el frontend solo filtra por ID en memoria), alertas automáticas de retraso, sincronización de porcentaje de avance con producción, ni registro de eventos de consulta para trazabilidad.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el cliente mayorista puede acceder al módulo tras iniciar sesión, visualizar todos sus pedidos con información completa y actualizada. Si no tiene pedidos debe mostrar mensaje apropiado. Si aplica filtros sin coincidencias debe responder con mensaje adecuado. No implementado: porcentaje de avance en producción, página de "acceso no autorizado" con registro en bitácora, distinción entre pedidos aprobados con disponibilidad en bodega y los que requieren fabricación, ni registro de eventos de visualización en el historial del sistema.

---

# RF-015 — Actualización de Estado de Pedidos por Administrador

| Campo | Valor |
|-------|-------|
| **ID** | RF-015 |
| **Nombre** | Actualización de Estado de Pedidos por Administrador |
| **Módulo** | Gestión de Pedidos |
| **Prioridad** | Alta |
| **Estado** | No implementado según lo descrito |

**Descripción:**

Este requerimiento permite al jefe modificar el estado de los pedidos mediante `PATCH /api/v1/admin/orders/{id}/status`. Los estados reales del sistema (`OrderStatus`) son: pendiente, en_progreso, completado, entregado y cancelado. No existen los estados aprobado, en producción, aprobado para entrega, pendiente de fabricación ni fabricado. El endpoint acepta cualquier transición entre estados (no hay matriz de transiciones válidas) y no exige motivo, responsable ni fecha: solo recibe el campo `state`. Al completar se ajustan las reservas de inventario y al entregar se descuentan. No se genera orden de producción automáticamente ni se notifica al cliente.

**Controles y Restricciones:**

Solo el jefe o admin pueden modificar el estado (`_require_admin_or_jefe`). El sistema valida que el pedido exista. No se bloquean transiciones no permitidas (cualquier salto de estado es aceptado). No se registra motivo del cambio ni historial por transición: no hay tabla de historial de estados. No se genera orden de producción al aprobar (no existe ese estado), no se reservan insumos automáticamente, no se verifica disponibilidad en bodega al entregar y no se envía notificación al cliente.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el jefe puede acceder al módulo de pedidos, seleccionar un pedido válido, aplicar un cambio de estado y el sistema actualiza el campo `state`. Al completar (`completado`) el sistema suma las cantidades a `inventory.reserved` (o a `amount` si es pedido para stock); al entregar (`entregado`) descuenta de `reserved`. No hay mensaje de transición inválida porque todas las transiciones están permitidas. Pendiente de implementar según lo descrito: estados aprobado/en producción/aprobado para entrega/pendiente de fabricación/fabricado, motivo obligatorio, orden de producción automática, reserva de insumos, verificación de bodega, notificación al cliente e historial de estados.

---

# RF-016 — Gestión de Inventario de Calzado Fabricado

| Campo | Valor |
|-------|-------|
| **ID** | RF-016 |
| **Nombre** | Gestión de Inventario de Calzado Fabricado |
| **Módulo** | Gestión de Inventario |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite al jefe registrar, consultar y actualizar el inventario mediante `POST /api/v1/admin/catalog/inventory` (crear/actualizar por producto+talla), `POST /api/v1/admin/catalog/inventory/bulk` (múltiples tallas a la vez) y `POST /api/v1/admin/catalog/inventory/movements` (entradas/salidas con trazabilidad en `InventoryMovement`). Los listados se filtran solo por producto. Existen los campos `minimum_stock` e `insufficient_threshold`, pero no generan alertas automáticas. El stock negativo solo está bloqueado en movimientos tipo `salida`; el bulk y la creación aceptan cualquier cantidad sin validar negativos. No hay descuento automático al aprobar pedidos ni alerta al jefe de compras.

**Controles y Restricciones:**

Solo el jefe o admin tienen acceso al módulo de inventario. Los movimientos tipo `salida` validan stock disponible y muestran error si es insuficiente; el bulk y la creación directa no validan negativos. Cada movimiento de entrada/salida queda registrado en `InventoryMovement` con producto, talla, cantidad, tipo, usuario y motivo. No se exige motivo obligatorio en bulk ni en creación. No se genera alerta automática al alcanzar el umbral mínimo. La consulta se filtra por `product_id`, sin filtros por talla, color o fecha.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el jefe puede registrar ingresos de calzado fabricado, consultar el inventario por producto, aplicar el ajuste masivo por tallas y registrar movimientos con trazabilidad. Al registrar una `salida` mayor al stock disponible, el sistema rechaza la operación y el saldo permanece sin cambios. Al consultar el historial de movimientos se muestra producto, talla, tipo, cantidad, motivo y usuario. Pendiente: bloqueo total de stock negativo en todas las vías, alerta automática de umbral mínimo, filtros por talla/color/fecha, motivo obligatorio en bulk y descuento automático al aprobar pedidos.

---

# RF-017 — Actualización Automática del Ingreso de Productos al Inventario

| Campo | Valor |
|-------|-------|
| **ID** | RF-017 |
| **Nombre** | Actualización Automática del Ingreso de Productos al Inventario |
| **Módulo** | Gestión de Inventario |
| **Prioridad** | Alta |
| **Estado** | No implementado según lo descrito |

**Descripción:**

El ingreso automático real se dispara al completar la etapa de emplantillado (`complete_emplantillado` en `be/app/services/orders.py`), no al marcar un pedido como "fabricado" ni con aprobación de control de calidad (ese gate no existe). Al completarse el emplantillado, las cantidades se suman a `inventory.reserved` (pedidos con cliente) o a `inventory.amount` (pedidos para stock), con movimiento tipo `entrada` que referencia el vale. No hay validación de estado "en fabricación", ni tolerancia del 2%, ni control anti-duplicados (re-ejecutar suma de nuevo), ni etiqueta de orden de producción en el registro.

**Controles y Restricciones:**

El trigger real es la finalización del emplantillado vía `PATCH /tasks/{id}/status` con estado `completado`. No se requiere aprobación de calidad, no se valida que el pedido esté "en fabricación", no se verifica que todas las combinaciones estén completas y la cantidad de entrada es la de la tarea (intervención manual posible al completar tareas parciales). Si la combinación producto+talla no existe en inventario, se crea el registro. No se genera incidencia por diferencias de cantidad ni se impide el ingreso duplicado.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando al completar el emplantillado el sistema suma las cantidades al inventario (a `reserved` con cliente, a `amount` para stock) y registra el movimiento de `entrada`. Pendiente de implementar según lo descrito: gate de aprobación de calidad, validación de estado "en fabricación", tolerancia del 2% con alerta, idempotencia del ingreso, etiqueta con ID de orden de producción y trazabilidad en historial del sistema.

---

# RF-018 — Registro de Ventas y Descuento en Inventario

| Campo | Valor |
|-------|-------|
| **ID** | RF-018 |
| **Nombre** | Registro de Ventas y Descuento en Inventario |
| **Módulo** | Gestión de Inventario |
| **Prioridad** | Alta |
| **Estado** | Pendiente de implementar |

**Nota de estado:** no existe modelo ni endpoint de ventas (sin `Sale` en `be/app/models` ni `be/app/routers`; `GET /reports/global/sales` es solo agregación de pedidos, no registro de ventas). Lo descrito abajo es la especificación a implementar, igual que HU-018.

**Descripción:**

Este requerimiento permite al administrador y personal comercial registrar manualmente las ventas de calzado fabricado y descontar automáticamente las unidades correspondientes del inventario en bodega. La funcionalidad está diseñada para reflejar las salidas físicas de productos que no provienen de pedidos registrados por clientes mayoristas dentro del sistema, sino de ventas externas, entregas directas o movimientos comerciales no gestionados por el módulo de pedidos. Este registro garantiza que el inventario se mantenga actualizado, que las cantidades disponibles reflejen la realidad operativa, y que cada salida esté trazada con su respectiva justificación comercial y referencia de venta para fines contables.

**Controles y Restricciones:**

Solo el administrador y personal comercial pueden registrar ventas. Antes de procesar la venta, el sistema debe realizar validación de stock en tiempo real y bloquear la venta si el saldo es inferior a la cantidad solicitada. El sistema debe permitir seleccionar referencia del producto, talla, color, cantidad vendida, fecha de salida, destino y motivo de la venta como campos obligatorios incluyendo cliente, referencia de la venta, cantidad y responsable. Una vez validado debe descontar automáticamente la cantidad vendida del inventario de bodega y registrar el movimiento como "salida por venta directa". El descuento en inventario es irreversible y genera registro inmutable. Debe impedir duplicidad de registro verificando número de documento o referencia de salida. Todas las operaciones deben quedar registradas en el historial de inventario incluyendo fecha, hora, tipo de operación, cantidad descontada, referencia del producto, destino y usuario responsable.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede registrar una venta manual de calzado fabricado, especificar todos los atributos requeridos, validar disponibilidad en bodega, y descontar automáticamente las unidades correspondientes del inventario. Cuando hay cantidad específica de un SKU y se registra una venta de cantidad menor, el inventario del SKU se debe reducir inmediatamente a la diferencia y se genera el registro de venta. Si el stock es menor y se intenta vender cantidad mayor, la transacción debe ser rechazada y el stock no se modifica. Si todo es válido debe registrar la venta, descontar el inventario y mostrar mensaje de éxito. Si se intenta duplicar una venta debe bloquear la acción y mostrar mensaje correspondiente. Todos los eventos deben quedar trazados en el historial del sistema.

---

# RF-019 — Registro de Pérdidas por Calzado Defectuoso

| Campo | Valor |
|-------|-------|
| **ID** | RF-019 |
| **Nombre** | Registro de Pérdidas por Calzado Defectuoso |
| **Módulo** | Gestión de Inventario |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite registrar las pérdidas de inventario ocasionadas por calzado defectuoso, con el fin de mantener actualizado el stock real en bodega y garantizar la trazabilidad de las unidades descartadas. La funcionalidad refleja las salidas no comerciales del inventario, generadas por defectos de fabricación, daños durante almacenamiento o errores de producción. El registro directo (`POST /losses`, cualquier usuario autenticado) descuenta del inventario de bodega de inmediato y mueve el stock defectuoso al acumulado de "scrap stock" (`be/app/services/scrap.py:129-140,330-395`). El flujo "operario registra → queda pendiente sin mover inventario" solo existe para incidencias de empleado/cliente (`PendingProductIncidence`, `be/app/services/dashboard_empleado_pending.py:27-77`), donde el jefe aprueba y ahí sí se descuenta (`approve_pending_incidence:274-334`). Hay códigos de defecto predefinidos (`defect-codes`), pero el registro acepta también descripción libre. No hay control anti-duplicados ni auditoría inmutable: la trazabilidad vive en `InventoryMovement`.

**Controles y Restricciones:**

El formulario exige producto, talla, color, cantidad, fecha del evento y motivo; el código de defecto puede elegirse de la lista predefinida o describirse libremente. Antes de confirmar se valida que la combinación de producto exista en el inventario y que la cantidad no exceda el stock disponible. Una vez validado se descuentan automáticamente las unidades del inventario de bodega y el stock defectuoso pasa al acumulado de "scrap stock" con referencia al motivo. No hay bloqueo anti-duplicidad: dos registros iguales descuentan dos veces. Todas las operaciones generan movimientos de inventario (`InventoryMovement`) con fecha, tipo, cantidad, motivo, producto y usuario responsable; no existe tabla de auditoría inmutable.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando se puede registrar una pérdida de calzado fabricado, especificar los atributos requeridos, validar disponibilidad en bodega, y descontar automáticamente las unidades correspondientes del inventario. Cuando se detectan productos defectuosos y se registra la pérdida directa, el inventario de bodega se reduce en la cantidad correspondiente y el "scrap stock" aumenta en la misma cantidad, con referencia al motivo. Si un empleado o cliente reporta una incidencia de producto, el registro queda como pendiente (`pending`) y no mueve inventario hasta que el jefe lo aprueba o rechaza (con motivo). El sistema impide el registro si los datos están incompletos, si la combinación no existe o si la cantidad excede el stock disponible. Todos los eventos generan movimientos de inventario trazables.

---

# RF-020 — Proceso de Restauración de Calzado Defectuoso

| Campo | Valor |
|-------|-------|
| **ID** | RF-020 |
| **Nombre** | Proceso de Restauración de Calzado Defectuoso |
| **Módulo** | Gestión de Inventario |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite al administrador y al jefe gestionar el proceso de restauración de calzado defectuoso previamente registrado como pérdida. La funcionalidad recupera unidades que, tras una intervención, pueden reincorporarse al inventario: el incidente pasa a `en_reparacion` (vía `PATCH /losses/{id}/repair` + `repair_incident`, que restaura inventario con `_restore_inventory` y da de baja el scrap con borrado lógico) y termina en `reparado` (reincorporado) o `rechazado` (vía `PATCH .../reject`, se mantiene como pérdida definitiva). No existen las etapas "reportado/revisión/restaurado", ni estado "cuarentena", ni campo de costo de reparación, ni rol "jefe de calidad" (solo verificación genérica admin/jefe). Tipos reales: perdida/en_reparacion/reparado/devuelto/falla/faltante/solucionado.

**Controles y Restricciones:**

Solo el administrador y el jefe tienen acceso al módulo de restauración (verificación genérica admin/jefe, sin rol "jefe de calidad"). El sistema permite seleccionar productos previamente registrados como defectuosos en el historial de pérdidas, especificando referencia, talla, color, cantidad a restaurar, tipo de defecto y tipo de intervención aplicada. Debe validar que la cantidad a restaurar no exceda la cantidad previamente descartada. No hay estado "en restauración" que bloquee visualización en inventario, ni costo de reparación contable, ni actualización de costo unitario. Una vez finalizado, el incidente queda en `reparado` (reincorporado al inventario) o `rechazado` (pérdida definitiva).

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede seleccionar productos defectuosos previamente registrados, iniciar un proceso de restauración con datos válidos, marcar el resultado final, y reincorporar automáticamente las unidades aprobadas al inventario. El incidente pasa por `en_reparacion` y termina en `reparado` (las unidades vuelven al inventario) o `rechazado` (se mantiene como pérdida definitiva). El sistema valida que la cantidad no exceda el total descartado. No existen: estado "cuarentena", autorización exclusiva del jefe de calidad, costo de reparación asociado al producto, ni historial de restauración separado (la trazabilidad queda en los movimientos de inventario).

---

# RF-021 — Creación de Tareas por el Administrador

| Campo | Valor |
|-------|-------|
| **ID** | RF-021 |
| **Nombre** | Creación de Tareas por el Administrador |
| **Módulo** | Gestión de Producción y Tareas |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite al jefe registrar tareas operativas dentro del sistema mediante creación en lote por orden (`POST /{order_id}/tasks`), opcionalmente asignadas a empleados específicos. Las tareas quedan obligatoriamente vinculadas a una orden de producción, con tipo de proceso (corte, guarnición, soladura, emplantillado), cantidad a procesar, prioridad y fecha límite (heredada de la fecha de entrega de la orden). No existe campo de tiempo estándar en horas-hombre ni ficha de modelo con tiempos. La funcionalidad está diseñada para organizar el trabajo interno y distribuir responsabilidades.

**Controles y Restricciones:**

Solo el jefe tiene acceso al módulo de creación de tareas. Los campos por tarea son: producto, tipo de proceso, cantidad, prioridad y desglose opcional por tallas. El sistema impide duplicados para la misma combinación orden + producto + line_group + tipo (reutiliza el vale existente). Al completar una etapa se auto-crea la siguiente como pendiente. No se genera notificación al crear la tarea (la notificación se genera al asignarla). No se valida que el empleado esté activo (solo que exista) y no existe historial de operaciones con fecha/hora/usuario.

**Criterios de Aceptación:**

El requerimiento se considera parcialmente implementado cuando el jefe puede crear el lote de tareas de una orden y visualizarlo en el panel correspondiente. Cuando se crea una tarea, entonces su estado inicial es `pendiente` (sin notificación al empleado hasta que se le asigne). El sistema valida los datos ingresados y evita duplicados por combinación orden + producto + line_group + tipo. No se valida contra tiempo estándar (no existe), no se impide asignar a usuarios inactivos y no existe trazabilidad en historial del sistema.

---

# RF-022 — Asignación de Tareas a Empleados

| Campo | Valor |
|-------|-------|
| **ID** | RF-022 |
| **Nombre** | Asignación de Tareas a Empleados |
| **Módulo** | Gestión de Producción y Tareas |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite al jefe asignar tareas previamente registradas a empleados (`PATCH /tasks/{task_id}/assign`), estableciendo responsabilidades operativas claras. Al asignar, la tarea pasa automáticamente de `pendiente` a `en_progreso` y se genera una notificación in-app al empleado (sin correo electrónico). No existe validación de carga de trabajo ni fecha límite por asignación (se usa la fecha de entrega de la orden).

**Controles y Restricciones:**

Solo el jefe puede asignar tareas. El sistema vincula la tarea al empleado indicado y la muestra de inmediato en su panel personal. Una vez asignada la tarea queda con estado `en_progreso` (no existe estado `asignada`). El código permite reasignar tareas incluso completadas o canceladas (sin bloqueo). No existe historial de asignaciones con fecha/hora/usuario.

**Criterios de Aceptación:**

El requerimiento se considera parcialmente implementado cuando el jefe puede asignar una tarea a un empleado y visualizarla en su panel con estado `en_progreso`, y el empleado recibe la notificación in-app. No se envía correo electrónico, no hay advertencia de sobrecarga, no se exige fecha límite por asignación y no se bloquea la reasignación de tareas finalizadas.

---

# RF-023 — Consulta de Tareas Asignadas por el Empleado

| Campo | Valor |
|-------|-------|
| **ID** | RF-023 |
| **Nombre** | Consulta de Tareas Asignadas por el Empleado |
| **Módulo** | Gestión de Tareas y Producción |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al empleado autenticado consultar las tareas que le han sido asignadas, incluyendo detalles operativos, estado actual, fechas clave y vínculos con procesos internos. Cada empleado tiene un panel personal donde consulta todas sus tareas asignadas, filtradas por estado y tipo, con el objetivo de proveer una herramienta clara de organización del trabajo diario. La funcionalidad está diseñada para que cada empleado tenga visibilidad clara sobre sus responsabilidades, pueda organizar su carga de trabajo y dar seguimiento a actividades pendientes, en progreso o finalizadas. El backend entrega el `deadline` de cada tarea y el cálculo del tiempo restante lo hace el frontend.

**Controles y Restricciones:**

Solo los usuarios con rol de empleado que hayan iniciado sesión correctamente pueden acceder al módulo de consulta de tareas. El aislamiento se hace en el backend filtrando por el usuario autenticado (`assigned_to == usuario actual`), por lo que el empleado solo visualiza sus tareas y no las de otros compañeros. El sistema valida la sesión activa antes de mostrar la información. Una vez dentro muestra todas las tareas asignadas al empleado organizadas cronológicamente y clasificadas por su estado real: "pendiente", "en_progreso", "por_liquidar", "completado", "pagado" o "cancelado" (no existe un estado "asignada"). Cada tarea incluye: descripción, tipo de tarea, prioridad, fecha límite (`deadline`), estado actual, observaciones y vínculo con el pedido y el producto. La interfaz permite ordenación por prioridad o fecha límite, y el frontend calcula el indicador de tiempo restante a partir del `deadline`. Las tareas "completadas" permanecen visibles para consulta histórica; el empleado sí puede devolverlas a "en_progreso" mediante el cambio de estado (no son inmutables). No existe registro de eventos de consulta en el backend.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el empleado puede acceder al módulo de tareas tras iniciar sesión, visualizar todas las tareas que le han sido asignadas, aplicar filtros sin errores, y consultar los detalles completos de cada tarea. Cuando un empleado ingresa a su panel y utiliza el filtro "prioridad alta", entonces solo ve las tareas marcadas como alta y no tiene acceso a la vista de tareas de otros compañeros. Al abrir el detalle de una tarea debe mostrar la descripción completa y la orden de producción vinculada. El sistema valida el acceso, muestra únicamente las tareas del usuario autenticado, y refleja correctamente el estado y atributos operativos. Si el empleado no tiene tareas debe mostrar mensaje correspondiente. Si aplica filtros sin coincidencias debe responder con mensaje adecuado. Todas las tareas deben estar organizadas y actualizadas en tiempo real. No se registran eventos de consulta en el backend.

---

# RF-024 — Reporte de Avances e Incidencias en Tareas

| Campo | Valor |
|-------|-------|
| **ID** | RF-024 |
| **Nombre** | Reporte de Avances e Incidencias en Tareas |
| **Módulo** | Gestión de Tareas y Producción |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite al empleado asignado a una tarea registrar observaciones técnicas durante su ejecución y cambiar el estado de su tarea (por ejemplo a `en_progreso` o `completado`) mediante `PATCH /tasks/{id}/status` con `{status, observation}` (`be/app/schemas/dashboard_empleado.py:102-115`). El registro de incidencias existe pero en un flujo separado (`be/app/routers/dashboard_empleado_incidences.py:222-252`): la incidencia de producto queda en estado pendiente con foto de evidencia para revisión del jefe. No existe check-in/entrada ni salida con hora del servidor, no hay pausa ni cálculo de tiempo real invertido, no se genera ticket automático, no hay latencia garantizada inferior a 60 segundos y no existe el estado `bloqueada` en el modelo `Task` (`be/app/models/tasks.py:35-42`).

**Controles y Restricciones:**

Solo el empleado asignado a la tarea (o el jefe) puede actualizar su estado y observaciones. El sistema valida que la sesión esté activa y que el usuario sea el asignado o tenga ocupación de jefe. No hay estados `asignada`/`bloqueada`: los estados reales son `pendiente`, `en_progreso`, `por_liquidar`, `completado`, `pagado` y `cancelado`. No se valida que un empleado no tenga dos tareas simultáneas, no hay porcentaje de avance ni tiempo estándar contra el cual justificar pausas, y el reporte de una incidencia crítica no cambia el estado de la tarea ni dispara notificación de emergencia con latencia garantizada. Cada actualización queda registrada con `completed_at` cuando aplica, sin historial de ejecución separado.

**Criterios de Aceptación:**

El requerimiento se considera parcialmente implementado cuando el empleado puede acceder a sus tareas, actualizar el estado con observaciones y reportar incidencias de producto con foto que quedan pendientes de revisión del jefe. Quedan como especificación futura (no implementados): marcas de tiempo de inicio/pausa/fin del servidor, cálculo de eficiencia (tiempo estándar / tiempo real), bloqueo de dos tareas simultáneas, tickets automáticos de mantenimiento o compras, notificación de emergencia en menos de 60 segundos, confirmación adicional al llegar al 100%, bloqueo automático a estado `bloqueada` e historial de ejecución consultable.

---

# RF-025 — Confirmación de Finalización de Tareas

| Campo | Valor |
|-------|-------|
| **ID** | RF-025 |
| **Nombre** | Confirmación de Finalización de Tareas |
| **Módulo** | Gestión de Producción y Tareas |
| **Prioridad** | Media |
| **Estado** | No Implementado |

**Descripción:**

El cierre de una tarea es hoy un simple cambio de estado vía `PATCH /tasks/{task_id}/status` (`status` = `completado`), sin formulario de cierre: no pide cantidad procesada, resumen, fecha efectiva ni evidencia. El estado `completado` es reversible a `en_progreso`, no genera etiqueta de desperdicio/falta, no hay tolerancia del 1% ni clave de supervisor, no existe alerta de control de calidad para la última tarea, y la notificación al jefe es la genérica de tarea completada (tipo/producto/vale/empleado) solo en la vía admin. La foto como evidencia solo existe en el flujo de incidencias, no en el cierre.

**Controles y Restricciones:**

Solo el jefe o el empleado asignado pueden cambiar el estado (`orders_tasks.py`, `dashboard_empleado_tasks.py`). Los estados reales son pendiente/en_progreso/por_liquidar/completado/pagado/cancelado (no existe estado "asignada"). No hay validación de cantidad reportada contra asignada, ni tolerancia del 1%, ni clave de supervisor, ni etiqueta de desperdicio/falta, ni resumen/fecha/evidencia obligatorios. Una tarea `completado` sí puede modificarse (reversible a `en_progreso`); no queda bloqueada ni inmutable. No hay alerta automática a control de calidad al cerrar la última tarea, ni historial de cierre separado (solo `completed_at`).

**Criterios de Aceptación:**

El cierre real se verifica cuando el jefe o el empleado asignado cambian el estado a `completado` vía PATCH y el sistema registra `completed_at`. No implementados: solicitud de cantidad al cerrar, tolerancia del 1% con clave de supervisor, etiqueta de desperdicio, foto o informe en el cierre, cambio de la orden a "pendiente de inspección de calidad", bloqueo de edición tras completar, e historial de cierre dedicado.

---

# RF-026 — Notificación al Administrador de Tareas Finalizadas

| Campo | Valor |
|-------|-------|
| **ID** | RF-026 |
| **Nombre** | Notificación al Administrador de Tareas Finalizadas |
| **Módulo** | Gestión de Tareas y Producción |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento genera una notificación automática dirigida a los jefes cada vez que una tarea se marca como completada por la vía del administrador. La notificación incluye el tipo de tarea, el producto, el número de vale y el nombre de quien la completó. No incluye eficiencia calculada, resumen de desempeño, enlace a evidencia ni flujo de aprobación/rechazo con reapertura: el cierre es un simple cambio de estado y una tarea completada puede revertirse a en_progreso.

**Controles y Restricciones:**

La notificación se crea únicamente cuando una tarea se marca como "completado" desde el endpoint de estado de la vía admin (`PATCH /tasks/{task_id}/status`), que notifica a todos los usuarios con ocupación jefe. La vía del empleado (`dashboard_empleado_tasks.py`) completa la tarea y auto-crea la siguiente etapa sin generar notificación. El mensaje contiene tipo, producto, vale y empleado; no contiene eficiencia, resumen, prioridad, fechas de asignación ni enlace a evidencia. No existe estado "reabierta" en el modelo de tareas, ni registro de tiempo de retrabajo, ni deduplicación de alertas, ni envío por correo.

**Criterios de Aceptación:**

El requerimiento se considera parcialmente implementado: al completar una tarea por la vía admin se crea una notificación simple para cada jefe con tipo, producto, vale y empleado. No implementado: notificación en la vía del empleado, eficiencia calculada, botón de aprobar/rechazar, estado "reabierta" con notificación al operario, tiempo de retrabajo, enlace a evidencia, deduplicación y envío por correo.

---

# RF-027 — Modificación y Eliminación de Tareas por el Administrador

| Campo | Valor |
|-------|-------|
| **ID** | RF-027 |
| **Nombre** | Modificación y Eliminación de Tareas por el Administrador |
| **Módulo** | Gestión de Tareas y Producción |
| **Prioridad** | Alta |
| **Estado** | No Implementado |

**Descripción:**

Este requerimiento (edición y eliminación de tareas) no está implementado según lo descrito. En el código solo existen tres operaciones sobre tareas: asignar empleado (`PATCH /tasks/{task_id}/assign`), cambiar estado (`PATCH /tasks/{task_id}/status`) y cambiar prioridad (`PATCH /tasks/{task_id}/priority`). No existen endpoints `PUT` ni `DELETE` de tareas, no hay cancelación con motivo, ni bloqueo por tiempo registrado, ni auditoría de cambios. Una tarea completada sí puede editarse indirectamente porque el estado es reversible a en_progreso.

**Controles y Restricciones:**

Solo el jefe puede asignar, cambiar estado o cambiar prioridad de tareas. No existe validación de empleado activo (solo se verifica que exista), no hay estados "pendiente/asignada" (los estados reales son pendiente, en_progreso, por_liquidar, completado, pagado y cancelado), y no hay bloqueo para reasignar o mover tareas completadas o canceladas. La eliminación con confirmación explícita y el registro de auditoría con valor anterior/nuevo no existen.

**Criterios de Aceptación:**

No implementado: edición de atributos (título, tipo, fecha límite), eliminación con confirmación, cancelación con motivo, bloqueo de eliminación con tiempo registrado, auditoría de modificaciones y bloqueo de edición sobre tareas cerradas. Lo único disponible es el cambio de prioridad, la reasignación de empleado y el cambio de estado vía PATCH.

---

# RF-028 — Registro de Incidencias de Maquinaria e Insumos

| Campo | Valor |
|-------|-------|
| **ID** | RF-028 |
| **Nombre** | Registro de Incidencias de Maquinaria e Insumos |
| **Módulo** | Gestión de Tareas y Producción |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite al empleado registrar incidencias de maquinaria e insumos mediante un formulario JSON simple (sin foto y sin vínculo a tarea). Solo las incidencias de producto (ligadas a una de sus tareas, con talla, cantidad y foto de evidencia) quedan en estado pendiente para aprobación del jefe. No se generan tickets de mantenimiento o compras, no hay roles de jefe de compras/mantenimiento y no hay notificación con ticket.

**Controles y Restricciones:**

Cualquier empleado autenticado puede registrar incidencias generales de maquinaria o insumo, sin necesidad de tener tareas activas asignadas. No se valida tarea activa, no se vincula la incidencia a ninguna tarea, no se cambia ningún estado a "bloqueada" (ese estado no existe en el modelo de tareas), no hay tickets con prioridad "urgente", no hay anti-duplicados en 30 minutos y la foto solo existe en incidencias de producto, no en las generales.

**Criterios de Aceptación:**

Parcialmente implementado: registro simple de incidencias de maquinaria/insumo, e incidencias de producto con foto que quedan pendientes de aprobación del jefe. No implementado: foto obligatoria en la incidencia general, vínculo a tarea activa, bloqueo a "bloqueada", tickets a mantenimiento/compras, notificación con ticket y anti-duplicados de 30 minutos.

---

# RF-029 — Módulo de Notificaciones

| Campo | Valor |
|-------|-------|
| **ID** | RF-029 |
| **Nombre** | Módulo de Notificaciones |
| **Módulo** | Notificaciones y Alertas |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento implementa el centro de notificaciones: cada usuario consulta sus notificaciones (lista, contador de no leídas, marcar una o todas como leídas, eliminación lógica) y recibe eventos por WebSocket con JWT. El modelo solo tiene tipo (info, advertencia, error, exito), leído/no leído y borrado lógico: no hay campo de prioridad, ni estado "archivada" (eliminar oculta del panel), ni filtros por tipo o prioridad.

**Controles y Restricciones:**

La consulta de notificaciones solo acepta límite de cantidad, sin filtros por tipo o prioridad. No existe estado "archivada", no hay anti-duplicidad, y no existe un panel global de administración con filtros por tipo, estado, fecha o destinatario. Cada notificación incluye título, mensaje, tipo, fecha, pedido relacionado y enlace al módulo. El tiempo real se entrega por WebSocket; los eventos quedan en base de datos, no en un historial de auditoría separado.

**Criterios de Aceptación:**

Parcialmente implementado: listado, contador de no leídas, marcar como leída (una o todas), borrado lógico y WebSocket autenticado. No implementado: filtrado por tipo o prioridad, estado "archivada", anti-duplicidad y panel global del administrador con filtros.

---

# RF-030 — Alertas al Administrador sobre Pedidos, Tareas e Inventario

| Campo | Valor |
|-------|-------|
| **ID** | RF-030 |
| **Nombre** | Alertas al Administrador sobre Pedidos, Tareas e Inventario |
| **Módulo** | Notificaciones y Alertas |
| **Prioridad** | Alta |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento implementa las alertas del jefe como una lista básica de incidencias abiertas (con tipo "error" fijo), sin enlace a la entidad que la originó. No hay umbrales configurables conectados a las alertas, ni correo urgente, ni banner con acuse de recibo, ni bitácora de tiempos de respuesta. El campo `insufficient_threshold` existe en el producto pero no alimenta las alertas.

**Controles y Restricciones:**

Las alertas no tienen prioridad configurable (ni "media" ni "siempre alta": el tipo es fijo), no se envían por correo, no hay banner con acuse obligatorio, no hay tiempo de respuesta medido y no hay panel de control específico con filtros. Solo el jefe consulta el listado de incidencias abiertas.

**Criterios de Aceptación:**

Parcialmente implementado: listado básico de incidencias abiertas para el jefe. No implementado: umbrales configurables, correo urgente, banner con acuse, bitácora de respuesta, enlace directo a la entidad, deduplicación y panel de alertas con filtros.

---

# RF-031 — Reportes de Pedidos e Inventario

| Campo | Valor |
|-------|-------|
| **ID** | RF-031 |
| **Nombre** | Reportes de Pedidos e Inventario |
| **Módulo** | Reportes y Analítica |
| **Prioridad** | Media |
| **Estado** | Parcial |

**Descripción:**

Este requerimiento permite al sistema generar reportes sobre los pedidos registrados y el inventario disponible en bodega. La funcionalidad está diseñada para ofrecer al administrador una visión operativa que facilite la toma de decisiones y la planificación de producción. Los reportes son accesibles desde el panel administrativo, con filtros por fecha, estado y categoría, y exportación a PDF. La exportación a Excel solo existe en la pantalla de inventario, no en el módulo de reportes. No hay reportes programados ni envío automático por correo, y no se calculan métricas de valor de stock, rotación ni valor histórico de ventas.

**Controles y Restricciones:**

La generación de reportes está restringida al rol de administrador y jefe. El sistema permite generar reportes en tiempo real sobre pedidos e inventario, con filtros por rango de fechas, estado y categoría. Para pedidos incluye: cliente mayorista, fecha de registro, estado actual, productos solicitados y cantidades. Para inventario muestra: producto, marca, estilo, talla, color, cantidad disponible y cantidad reservada. Los reportes son de solo lectura y se exportan a PDF. No se garantiza un tiempo máximo de generación, no hay exportación a Excel en este módulo, y no existe registro de auditoría de cada reporte generado.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede acceder al módulo de reportes, aplicar filtros válidos, generar el reporte sin errores y consultar los resultados con información actualizada. Si el reporte no arroja resultados muestra mensaje correspondiente. No implementado: tasa de cumplimiento, descarga en Excel desde este módulo, validación de inconsistencias antes de generar, ni historial de eventos de reporte.

---

# RF-032 — Reportes de Tareas por Empleado

| Campo | Valor |
|-------|-------|
| **ID** | RF-032 |
| **Nombre** | Reportes de Tareas por Empleado |
| **Módulo** | Reportes y Analítica |
| **Prioridad** | Media |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador generar reportes consolidados sobre las tareas asignadas a los empleados, con desglose por etapa de producción, precio, producto, estado y fecha. La funcionalidad está diseñada para ofrecer una visión del rendimiento individual y colectivo de los empleados. El empleado también puede consultar su propio reporte de tareas y rendimiento desde su panel. Los reportes se exportan a PDF y pueden compartirse internamente con el empleado.

**Controles y Restricciones:**

Solo el administrador y jefe pueden acceder al módulo de reportes desde el panel admin. El empleado accede a sus propios reportes desde el panel empleado. El sistema permite filtrar por cargo (rol), empleado específico, rango de fechas, estado (completado, pagado) y categoría de producto. Cada reporte incluye: nombre del empleado, cargo, tareas completadas, pares producidos, ganancias totales, desglose por etapa de producción (planta, emplantillado, prenda, cutting, etc.), y lista detallada de tareas con vale, proceso, producto, color, cantidad, estado, fecha y valor. El endpoint principal es `GET /api/v1/admin/reports/employee/{user_id}` para empleado individual y `GET /api/v1/admin/reports/role/{role_name}` para reporte por cargo. El empleado consulta su propio rendimiento con `GET /api/v1/dashboard/employee/report/my-performance` y sus tareas con `GET /api/v1/dashboard/employee/report/my-tasks`. Los reportes son de solo lectura. El administrador puede marcar tareas completadas como pagadas con `PATCH /api/v1/admin/reports/tasks/mark-paid`. El administrador puede enviar reportes por correo con `POST /api/v1/admin/reports/send-email` y compartir internamente con `POST /api/v1/admin/reports/share-internal`. El empleado ve reportes compartidos con `GET /api/v1/dashboard/employee/reports/shared`.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede seleccionar un cargo o empleado específico, aplicar filtros de fecha y estado, generar el reporte sin errores y consultar los resultados con información completa y actualizada. Cuando se genera el reporte de un empleado individual, entonces el sistema muestra sus KPIs (tareas completadas, pares producidos, ganancias) y desglose por etapa. Cuando el empleado accede a su panel, puede ver su propio rendimiento y lista de tareas detallada. Cuando el administrador comparte un reporte internamente, el empleado lo ve en la sección de compartidos. Si el reporte no arroja resultados muestra mensaje correspondiente. La exportación a PDF genera un documento con tabla de tareas, resumen y encabezado corporativo.

---

# RF-033 — Reporte de Producción Global

| Campo | Valor |
|-------|-------|
| **ID** | RF-033 |
| **Nombre** | Reporte de Producción Global |
| **Módulo** | Reportes y Analítica |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador visualizar un reporte consolidado de producción y ventas, con métricas semanales de pares fabricados, pares pedidos, tareas completadas y pedidos creados. La funcionalidad ofrece una visión periódica del volumen de fabricación y su relación con la demanda, facilitando la planificación operativa.

**Controles y Restricciones:**

Solo el administrador puede acceder a este reporte desde el módulo de reportes del panel admin. El endpoint es `GET /api/v1/admin/reports/global/production`. El reporte devuelve un resumen semanal (`ProductionWeeklyMetric`) con campos: semana calendario (`week`), tareas completadas (`tasks_completed`), pares fabricados (`pairs_manufactured`), pedidos creados (`orders_created`) y pares pedidos (`pairs_ordered`). También incluye una lista detallada de pedidos con su estado y items. El frontend presenta sub-pestañas de "Pedidos" y "Tareas" dentro de la pestaña de Producción y Ventas, con filtros por fecha, estado y categoría. Los datos se agrupan por semana usando `isocalendar()`. No existe corte automático semanal ni envío por correo. Los reportes se exportan a PDF con `exportProductionPDF`.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede acceder al reporte de producción, ver las métricas semanales actualizadas, navegar entre las sub-pestañas de pedidos y tareas, y exportar a PDF. Cuando se genera el reporte para un período determinado, muestra la cantidad total de pares fabricados, pares pedidos, tareas completadas y pedidos creados, desglose por semana, y lista detallada de pedidos. Si no hay producción en una semana, el valor es cero. El reporte refleja datos en tiempo real provenientes de las tablas de pedidos y tareas.

---

# RF-034 — Métricas Semanales de Producción y Ventas

| Campo | Valor |
|-------|-------|
| **ID** | RF-034 |
| **Nombre** | Métricas Semanales de Producción y Ventas |
| **Módulo** | Reportes y Analítica |
| **Prioridad** | Media |
| **Estado** | Implementado (parcialmente) |

**Descripción:**

Este requerimiento permite al sistema consolidar métricas semanales de producción (pares fabricados, tareas completadas) y ventas (pares pedidos, pedidos creados), agrupadas por semana calendario. La funcionalidad está integrada dentro del reporte de producción global, no como un reporte independiente.

**Controles y Restricciones:**

Las métricas semanales se calculan automáticamente al consultar el endpoint `GET /api/v1/admin/reports/global/production`. El campo `weekly_metrics` del response contiene un arreglo de `ProductionWeeklyMetric` con: semana (`week`), tareas completadas, pares fabricados, pedidos creados y pares pedidos. Las semanas se calculan usando `isocalendar()`. No existe un endpoint dedicado exclusivamente a métricas semanales; este dato está embebido en el reporte de producción global. No hay corte automático semanal programado, ni envío automático por correo, ni generación de consolidados históricos persistentes. El administrador accede a estas métricas filtrando por rango de fechas en el frontend. No se calcula conciliación automática de totales (pares fabricados = pares inventariados + pares cuarentena + pares pérdida).

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador consulta el reporte de producción global y las métricas semanales muestran la cantidad de pares fabricados, pares pedidos, tareas completadas y pedidos creados por semana. Cuando no hay producción en una semana, los valores son cero. Las métricas se reflejan en tiempo real. No implementado: corte automático semanal, envío por correo, conciliación automática de totales, ni reporte semanal como funcionalidad independiente.

---

# RF-035 — Reporte de Pedidos por Cliente

| Campo | Valor |
|-------|-------|
| **ID** | RF-035 |
| **Nombre** | Reporte de Pedidos por Cliente |
| **Módulo** | Reportes y Analítica |
| **Prioridad** | Media |
| **Estado** | Implementado (parcialmente) |

**Descripción:**

Este requerimiento permite al administrador generar reportes del historial de pedidos de un cliente específico o de todos los clientes, filtrando por rango de fechas, estado del pedido y categoría. El cliente también puede consultar sus propios pedidos desde su panel. Los reportes muestran el detalle de cada pedido con sus items, cantidades y estados.

**Controles y Restricciones:**

Solo el administrador puede acceder al reporte consolidado de clientes desde el panel admin. El cliente accede a sus propios pedidos desde su panel. Los endpoints son `GET /api/v1/admin/reports/customer/{user_id}` para un cliente específico y `GET /api/v1/admin/reports/customer/all/orders` para todos los clientes. El cliente consulta sus pedidos con los endpoints del módulo client. El frontend ofrece filtros por rango de fechas (incluyendo preset "Este Mes"), estado del pedido y categoría. No existe un endpoint dedicado de aggregación mensual automática; la vista mensual se logra seleccionando "Este Mes" como filtro de fecha. No hay corte automático mensual programado, ni envío automático por correo, ni cálculo automático de porcentaje de cumplimiento de entrega. Los reportes se exportan a PDF con `exportCustomerPDF` (admin) y `exportMyOrdersPDF` (cliente). El cliente puede también ver un resumen de estadísticas por estado en la pestaña "Resumen" de su panel de reportes.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede seleccionar un cliente específico o "ver todos", aplicar filtros de fecha, estado y categoría, generar el reporte y consultar los resultados. Cuando se selecciona un cliente y se filtra por un mes, el reporte muestra solo los pedidos de ese cliente en ese período con su detalle de items. El cliente puede ver sus propios pedidos desde su panel. Si un cliente no tiene pedidos en el período seleccionado, el reporte muestra mensaje vacío. No implementado: corte automático mensual, porcentaje de cumplimiento de entrega, ni envío automático por correo.
