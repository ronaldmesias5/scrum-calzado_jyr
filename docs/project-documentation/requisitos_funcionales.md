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
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite a los usuarios potenciales (clientes mayoristas) crear una solicitud de cuenta de acceso de manera autónoma desde la página principal del sistema, sin intervención del administrador en la fase inicial. Los empleados no podrán crear cuentas; el administrador les asigna su cuenta con sus credenciales directamente. La funcionalidad establece un punto de entrada controlado y autogestionado exclusivo para clientes, donde el usuario proporciona sus datos personales y comerciales para solicitar acceso al sistema. El proceso valida que los datos ingresados sean válidos, completos y únicos, crea un registro en estado "pendiente de validación administrativa" y notifica automáticamente al administrador para su revisión y aprobación final. Esto descentraliza la carga administrativa inicial para clientes y agiliza el proceso de incorporación, manteniendo el control de seguridad y la trazabilidad, mientras que la creación de cuentas de empleados permanece centralizada en el administrador.

**Controles y Restricciones:**

Cualquier cliente potencial puede acceder al formulario de registro desde la página principal sin necesidad de autenticación, mientras que los empleados no tienen acceso al formulario de registro público ya que sus cuentas son creadas exclusivamente por el administrador. Los campos obligatorios para clientes son: nombre completo, correo electrónico, tipo de usuario (cliente mayorista), número de documento de identidad, número de teléfono, razón social y NIT. El sistema debe validar en tiempo real que el correo electrónico, el documento de identidad y el NIT no estén ya registrados en la base de datos, impidiendo duplicidades. El correo electrónico debe tener formato válido. Una vez enviado el formulario, el sistema debe crear un registro de usuario con estado "pendiente de validación", asignar un identificador único de solicitud, y generar una notificación automática e inmediata al panel del administrador. El cliente recibirá un acuse de recibo en pantalla y un correo automático confirmando la recepción de su solicitud. No se generan credenciales de acceso en este punto. Todo el proceso debe quedar registrado en el historial de auditoría con marca de tiempo, IP del solicitante y datos suministrados.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando un cliente potencial puede acceder al formulario desde la página principal, diligenciar todos los campos obligatorios con información válida y única, enviar la solicitud y recibir confirmación visual y por correo electrónico de que su solicitud está en revisión. El sistema debe validar en el momento los datos, impedir el registro si el correo, documento o NIT ya existen, y crear el registro en estado "pendiente". Si el formulario está incompleto o con errores de formato debe impedir el envío y mostrar mensajes específicos. Tras el envío exitoso, el administrador debe recibir una notificación en su panel en menos de 30 segundos. Si el cliente intenta registrarse nuevamente con el mismo correo, el sistema debe redirigirlo a una página de estado de su solicitud. Todos los eventos, exitosos o fallidos, deben quedar registrados en el historial de auditoría con los detalles correspondientes, y debe verificarse que los empleados no puedan acceder al formulario de registro en ningún caso.

---

# RF-002 — Validación y Activación de Cuentas por Administrador

| Campo | Valor |
|-------|-------|
| **ID** | RF-002 |
| **Nombre** | Validación y Activación de Cuentas por Administrador |
| **Módulo** | Gestión de Usuarios y Autenticación |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador del sistema revisar, validar y activar las solicitudes de cuentas de acceso registradas por los usuarios en el módulo RF001. La funcionalidad completa el proceso de incorporación garantizando que solo usuarios verificados obtengan acceso, manteniendo el control de seguridad, la trazabilidad y la calidad de los datos del sistema. El administrador evalúa la información proporcionada, puede aprobar o rechazar la solicitud, y al aprobar, el sistema activa técnicamente la cuenta, genera credenciales temporales seguras y las envía automáticamente al usuario, habilitando para ingresar y operar según su rol asignado.

**Controles y Restricciones:**

Solo el administrador tiene acceso al módulo de validación de cuentas. El sistema debe presentar una lista de solicitudes en estado "pendiente de validación" con todos los datos proporcionados por el usuario. El administrador debe poder aprobar o rechazar cada solicitud, siendo obligatorio ingresar un comentario de justificación en caso de rechazo. Al aprobar, el sistema debe validar que el correo electrónico del usuario esté en estado válido (no marcado como rebotado o problemático). Luego, debe generar automáticamente una contraseña temporal que cumpla con la política de seguridad establecida (mínimo 10 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos), encriptarla antes de almacenarla, y enviar un correo electrónico seguro con las credenciales temporales y un enlace de activación válido por 24 horas. La cuenta cambia su estado a "activa" una vez se completa este envío. Cada acción (aprobación, rechazo, envío de correo) debe quedar registrada en el historial de auditoría incluyendo fecha, hora, administrador responsable, ID de la solicitud, decisión tomada, y estado del envío de notificación.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede visualizar las solicitudes pendientes, seleccionar una, revisar la información, y completar el proceso de aprobación o rechazo sin errores. Al aprobar, el sistema debe generar la contraseña temporal, encriptarla, enviar el correo de activación al usuario y mostrar "Cuenta activada y notificada correctamente." Si el correo no puede enviarse, debe informar al administrador y mantener la cuenta en estado "aprobada - pendiente notificación". Al rechazar, debe registrar el motivo y notificar al usuario por correo sobre la decisión, cambiando el estado de la solicitud a "rechazada". Si el administrador intenta aprobar una solicitud con correo duplicado (caso extremo), el sistema debe impedir la acción. Todos los eventos deben quedar registrados de manera inmutable en el historial de auditoría.

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

Solo los usuarios con cuentas activas pueden iniciar sesión. El sistema debe validar que el correo electrónico esté asociado a una cuenta registrada y que la contraseña coincida utilizando algoritmos de hashing seguros. Se debe implementar un bloqueo temporal de 30 minutos tras 3 intentos fallidos consecutivos en un período de 5 minutos. La sesión debe tener una duración máxima de 20 minutos de inactividad, cerrándose automáticamente al superarse este tiempo. El sistema debe impedir el acceso simultáneo desde múltiples dispositivos si la política de seguridad lo requiere. Cada intento de acceso, exitoso o fallido, debe quedar registrado en el historial de auditoría incluyendo fecha, hora, dirección IP, tipo de usuario y resultado del intento.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando un usuario con cuenta activa puede iniciar sesión correctamente y acceder al panel correspondiente a su rol sin errores. El sistema debe validar los datos ingresados, autenticar al usuario y redirigirlo según corresponda. Si el usuario omite campos debe impedir el acceso, si el correo no existe o la contraseña es incorrecta debe mostrar mensajes específicos. Tras tres intentos fallidos la cuenta debe bloquearse temporalmente. Si el usuario permanece inactivo por más de 20 minutos la sesión debe cerrarse automáticamente. Si intenta acceder desde otro dispositivo sin cerrar sesión anterior debe impedirse el acceso. Todos los eventos de autenticación deben quedar registrados en el historial de auditoría.

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

El sistema debe permitir la recuperación únicamente a usuarios con cuenta registrada y activa. El usuario debe ingresar su correo electrónico, y el sistema debe validar que esté asociado a una cuenta existente. Una vez validado, debe generar un token único criptográficamente seguro con vigencia de 60 minutos y enviar un enlace seguro HTTPS mediante correo electrónico. El usuario debe establecer una nueva contraseña que cumpla con la política de seguridad: mínimo 10 caracteres incluyendo mayúscula, minúscula, número y símbolo especial. Una vez establecida, la contraseña anterior debe quedar invalidada, y el sistema debe registrar el evento con fecha, hora, dirección IP y usuario afectado.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el usuario puede iniciar el proceso de recuperación, ingresar un correo válido, recibir el enlace dentro del tiempo establecido, acceder al formulario de restablecimiento, establecer una nueva contraseña válida y recuperar el acceso a su cuenta. Si el correo no está registrado debe impedir el proceso, si el enlace expira debe bloquear el acceso y solicitar nueva solicitud, si la nueva contraseña no cumple requisitos debe impedir el cambio. Una vez completado debe mostrar "Su contraseña ha sido actualizada exitosamente. Ya puede iniciar sesión." Todos los eventos deben quedar registrados en el historial de auditoría.

---

# RF-005 — Solicitud de Reactivación de Cuentas

| Campo | Valor |
|-------|-------|
| **ID** | RF-005 |
| **Nombre** | Solicitud de Reactivación de Cuentas |
| **Módulo** | Gestión de Usuarios y Autenticación |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite a los usuarios cuya cuenta se encuentra suspendida o inactiva solicitar su reactivación mediante un formulario de verificación exhaustivo. La funcionalidad está diseñada para recuperar el acceso legítimo de usuarios que han sido bloqueados por motivos administrativos, inactividad prolongada o errores operativos, generando un ticket de gestión interno que será evaluado por el administrador. El proceso debe garantizar la validación de identidad, la trazabilidad de cada solicitud y la seguridad en el restablecimiento del acceso, incluyendo campos detallados para evitar solicitudes triviales.

**Controles y Restricciones:**

Solo los usuarios con cuentas en estado "suspendida" o "inactiva" pueden acceder al formulario de reactivación. El sistema debe validar que el correo esté vinculado a una cuenta con ese estado. El formulario debe incluir como obligatorios: correo electrónico, motivo detallado de la solicitud, número de documento de identidad, número de teléfono y evidencia opcional. Una vez validada la información, el sistema debe generar un ticket con identificador único y enviarlo al panel del administrador para revisión. Solo el administrador puede aprobar o rechazar la solicitud, debiendo acompañar cada decisión de un comentario obligatorio. Las acciones deben quedar registradas en el historial de auditoría incluyendo fecha, hora, usuario solicitante, administrador responsable y resultado.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando un usuario con cuenta suspendida puede acceder al formulario, completar todos los campos requeridos con información válida, enviar la solicitud y recibir respuesta del administrador. El sistema debe validar que la cuenta esté suspendida, generar el ticket correctamente y permitir al administrador revisar, aprobar o rechazar la solicitud. Si el formulario está incompleto debe impedir el envío, si el correo no está vinculado a cuenta suspendida debe bloquear la acción. Si se aprueba debe actualizar el estado a "activa", enviar notificación y registrar el evento. Si se rechaza debe informar al usuario con el motivo. La funcionalidad debe garantizar validación estricta, trazabilidad completa y control administrativo.

---

# RF-006 — Creación de Catálogo

| Campo | Valor |
|-------|-------|
| **ID** | RF-006 |
| **Nombre** | Creación de Catálogo |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador registrar productos en el catálogo digital del sistema, incluyendo información detallada como nombre, referencia única, descripción técnica, tallas disponibles, colores, materiales, imágenes de alta calidad y estado de visibilidad. Esta funcionalidad es esencial para estructurar la oferta de calzado que será consultada por clientes mayoristas, empleados y visitantes, sirviendo como base para la gestión de pedidos de fabricación, visualización pública y control interno de productos disponibles. Cada producto registrado debe quedar correctamente vinculado a sus atributos operativos, generar un código SKU único por combinación de modelo, color y talla, y reflejarse en los módulos de consulta según su estado de activación.

**Controles y Restricciones:**

Solo el administrador y usuarios con rol de "diseñador de producto" tienen acceso al módulo de creación de catálogo. El sistema debe validar que la referencia del producto sea única e impedir registros duplicados. El formulario debe exigir como obligatorios: nombre del producto, referencia, descripción, imagen principal, estado activo/inactivo, tallas disponibles, colores disponibles, material, categoría y marca. Las imágenes deben estar en formato JPG o PNG y no superar 2 MB de tamaño. El sistema debe permitir que cada producto esté vinculado a categorías y marcas previamente registradas. El estado del producto determina si será visible en el catálogo público y en los módulos de consulta interna. El sistema debe impedir la eliminación de productos con historial de pedidos asociados, permitiendo solo la desactivación. Cada acción debe quedar registrada en el historial de auditoría.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede acceder al módulo de catálogo, diligenciar todos los campos obligatorios con datos válidos y registrar el producto sin errores. El sistema debe validar la unicidad de la referencia, el formato y tamaño de imágenes, la consistencia de atributos y la vinculación con categorías y marcas activas. Si todo es correcto debe registrar el producto y mostrar "Producto registrado exitosamente." Si hay errores debe impedir el registro y mostrar mensajes correspondientes, si el archivo de imagen no cumple requisitos debe bloquear la carga. Si el producto se registra como inactivo debe quedar oculto para usuarios. Si se intenta eliminar un producto con pedidos asociados debe mostrar "El modelo no puede eliminarse. Cambie su estado a inactivo." Todos los eventos deben quedar registrados en auditoría.

---

# RF-007 — Clasificación por Categorías

| Campo | Valor |
|-------|-------|
| **ID** | RF-007 |
| **Nombre** | Clasificación por Categorías |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador organizar los productos del catálogo digital en categorías definidas, facilitando la navegación, segmentación comercial y búsqueda eficiente por parte de los usuarios. La clasificación por categorías es fundamental para estructurar la oferta de calzado según criterios operativos o comerciales como tipo de producto, línea de fabricación, temporada o uso. Esta funcionalidad impacta directamente en la experiencia de consulta de usuarios, determinando cómo se agrupan y presentan los productos en la interfaz, y sirve como filtro primario en todas las vistas de catálogo y reportes comerciales.

**Controles y Restricciones:**

Solo el administrador tiene acceso al módulo de gestión de categorías. El sistema debe permitir crear, editar y eliminar categorías, validando que el nombre sea único y no contenga caracteres especiales. No se puede eliminar una categoría vinculada a productos activos, debiendo el administrador reasignar los productos a otra categoría o desactivarlos antes de eliminarla. Al crear una nueva categoría, el campo nombre es obligatorio. Cada categoría puede tener una descripción opcional y un estado activo o inactivo. Si una categoría está inactiva, los productos asociados no deben aparecer en el catálogo público ni en módulos de consulta interna. Todas las acciones de creación, edición, eliminación y cambio de estado deben quedar registradas en el historial de auditoría.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede crear nuevas categorías con nombres válidos y únicos, editar categorías existentes que no estén asociadas a productos activos, y eliminar aquellas que no tengan vínculos registrados. El sistema debe validar campos obligatorios, impedir duplicidades y mostrar mensajes claros ante errores. Si se intenta registrar una categoría sin nombre debe impedir la acción, si se intenta eliminar una categoría con modelos activos debe mostrar una ventana emergente listando los modelos dependientes e impedir la eliminación. Cuando un cliente filtra por categoría debe mostrar solo los productos correspondientes con tiempo de respuesta menor a 2 segundos. El sistema debe permitir cambiar el estado de una categoría a "inactiva" y reflejar ese cambio en la visualización del catálogo.

---

# RF-008 — Gestión de Marcas y Estilos

| Campo | Valor |
|-------|-------|
| **ID** | RF-008 |
| **Nombre** | Gestión de Marcas y Estilos |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador registrar, editar y eliminar marcas comerciales asociadas a los productos del catálogo, así como definir los estilos que pertenecen a cada marca. La funcionalidad es esencial para organizar el portafolio de calzado según identidad corporativa, línea de diseño o enfoque comercial, y para facilitar la clasificación precisa de productos en la interfaz de consulta. Cada marca puede contener uno o varios estilos, entendidos como agrupaciones internas que representan modelos, colecciones o variantes estéticas como oxford, derby o mocasín. Esta estructura jerárquica permite segmentar la oferta de manera precisa, mantener coherencia visual y operativa del catálogo, y generar reportes detallados de productos.

**Controles y Restricciones:**

Solo el administrador tiene acceso al módulo de gestión de marcas y estilos. Al registrar una nueva marca o estilo, el sistema debe validar que no existan duplicados en el nombre. El campo nombre es obligatorio tanto para marcas como estilos. No se puede eliminar marca o estilo si está asociado a un modelo activo, forzando la opción de deshabilitar en su lugar. Cada marca y estilo puede tener descripción opcional y estado activo/inactivo. Los estilos deben tener nombre único dentro de su marca. Si un estilo está inactivo, los productos asociados no deben aparecer en catálogo público ni en módulos de consulta interna. Cualquier modificación o desactivación debe generar registro de auditoría inmutable documentando fecha y usuario responsable.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede registrar marcas y estilos nuevos con nombres válidos y únicos, editar los existentes que no estén asociados a productos activos, y eliminar aquellos que no tengan vínculos registrados. Si se intenta registrar sin nombre debe impedir la acción, si se intenta eliminar marca o estilo vinculado a productos debe mostrar mensaje de error justificando la imposibilidad por existencia de modelos dependientes. Cuando un usuario busca por marca específica debe aparecer solo los modelos correspondientes. El sistema debe permitir crear estilos dentro de cada marca, validar su unicidad, editar atributos y eliminarlos si no están en uso. Todas las operaciones deben quedar registradas en el historial de auditoría.

---

# RF-009 — Visualización de Catálogo como Visitante

| Campo | Valor |
|-------|-------|
| **ID** | RF-009 |
| **Nombre** | Visualización de Catálogo como Visitante |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite a cualquier usuario visitante, sin necesidad de estar registrado o autenticado, consultar el catálogo público de productos disponibles desde la página principal del sistema. La funcionalidad está diseñada para mostrar la oferta de calzado registrada por el administrador, organizada por categorías, marcas y estilos, con sus respectivas combinaciones de talla y color, funcionando como herramienta de marketing digital y showcase. Aunque el visitante no puede realizar pedidos ni acceder a funciones internas, esta vista pública cumple un rol comercial clave permitiendo explorar el portafolio de productos terminados, incentivar el registro de nuevos clientes mayoristas y facilitar la difusión de las líneas de calzado disponibles.

**Controles y Restricciones:**

El acceso al catálogo público debe estar habilitado desde la página principal sin requerir inicio de sesión. El sistema debe mostrar únicamente productos con estado "activo" y marcados como "visibles públicamente", siendo de solo lectura sin exponer precios, costos o información de inventario. Los modelos con estado "inactivo" o "en desarrollo" no deben aparecer en la vista pública. Cada producto debe incluir imagen principal optimizada para carga rápida, nombre, referencia, tallas disponibles, colores disponibles, material, marca y estilo. El sistema debe permitir aplicar filtros básicos por categoría, marca, estilo, talla y color. El tiempo de carga total del catálogo y aplicación de filtros debe ser inferior a 3 segundos. Si el visitante intenta acceder a funciones reservadas debe redirigir al módulo de registro. Toda la navegación debe quedar registrada para análisis de comportamiento.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando cualquier visitante puede acceder al catálogo desde la página principal, visualizar únicamente productos activos y públicos, y consultar información básica sin errores. Si no hay productos debe mostrar "No hay productos disponibles en este momento" en lugar de pantalla en blanco. Si el visitante aplica filtros debe responder con resultados adecuados o mensaje de sin coincidencias. Al inspeccionar código fuente no deben encontrarse precios ni cantidades de stock. Si intenta acceder a funciones restringidas debe redirigir al registro y mostrar "Debe crear una cuenta para acceder a esta funcionalidad." Si el catálogo no tiene modelos en una categoría debe mostrar mensaje apropiado. El tiempo de respuesta debe ser menor a 3 segundos.

---

# RF-010 — Consulta de Catálogo por Cliente Mayorista

| Campo | Valor |
|-------|-------|
| **ID** | RF-010 |
| **Nombre** | Consulta de Catálogo por Cliente Mayorista |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | No Implementado |

**Descripción:**

Este requerimiento permite al cliente mayorista, una vez autenticado en el sistema, consultar el catálogo completo de productos disponibles para solicitud de fabricación o entrega inmediata. La funcionalidad está diseñada para ofrecer una experiencia de navegación clara, segmentada y operativamente útil, permitiendo al cliente visualizar productos activos con información detallada incluyendo referencias, tallas, colores, materiales, marcas, estilos y estado de disponibilidad en bodega. Esta consulta es fundamental para que el cliente pueda preparar sus pedidos con base en la oferta actual, identificar combinaciones disponibles, tomar decisiones comerciales informadas y guardar modelos de interés como favoritos para futuras consultas.

**Controles y Restricciones:**

Solo usuarios con rol de cliente mayorista que hayan iniciado sesión correctamente pueden acceder al módulo de catálogo interno. El sistema debe validar la sesión activa antes de mostrar productos y mostrar únicamente aquellos con estado "activo" y habilitados para consulta interna. La funcionalidad de guardar como favorito está disponible solo para usuarios autenticados, siendo los datos persistentes a través de las sesiones. Cada producto debe mostrar imagen principal, nombre, referencia, tallas y colores disponibles, material, marca, estilo y estado de disponibilidad en bodega. Si una combinación específica está agotada debe aparecer deshabilitada. El sistema debe permitir aplicar filtros avanzados y debe garantizar que la información esté actualizada en tiempo real con el inventario. El cliente debe poder iniciar proceso de pedido seleccionando modelos con transferencia automática al formulario de pedido.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el cliente mayorista puede acceder al catálogo tras iniciar sesión, visualizar únicamente productos activos y disponibles, y consultar toda la información relevante sin errores. Si marca modelos como favoritos y cierra sesión, al volver a iniciar la lista debe mantenerse. Si selecciona modelos de favoritos e inicia proceso de pedido, el sistema debe crear un pedido en estado "borrador" sin finalizarlo. Si una combinación está agotada debe aparecer deshabilitada o con mensaje correspondiente. Si intenta acceder sin autenticación debe impedir el acceso y redirigir al inicio de sesión. Todos los eventos de visualización deben quedar registrados en el historial del sistema.

---

# RF-011 — Sistema de Filtrado de Búsqueda

| Campo | Valor |
|-------|-------|
| **ID** | RF-011 |
| **Nombre** | Sistema de Filtrado de Búsqueda |
| **Módulo** | Gestión de Catálogo |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite implementar un motor de búsqueda y filtrado de alto rendimiento que facilite la localización de productos dentro del catálogo digital, tanto en la vista pública como en los módulos internos de consulta. La funcionalidad está diseñada para mejorar la experiencia de navegación, reducir el tiempo de búsqueda y permitir la localización precisa de productos según atributos operativos como categoría, marca, estilo, talla, color y estado de disponibilidad en bodega. El sistema debe soportar filtros compuestos anidados, búsqueda por texto libre con coincidencias parciales, y utilizar mecanismos de indexación y paginación eficiente para garantizar rendimiento óptimo incluso con grandes volúmenes de productos.

**Controles y Restricciones:**

El sistema de filtrado debe estar disponible en todos los módulos de visualización de catálogo incluyendo página principal para visitantes, panel de clientes mayoristas y entorno de empleados. Los filtros deben poder combinarse entre sí permitiendo búsquedas específicas simultáneas por múltiples atributos. El sistema debe utilizar mecanismos de indexación y paginación eficiente para garantizar que el rendimiento del filtro compuesto no degrade el tiempo de respuesta a más de 2 segundos incluso con más de 5,000 modelos. Los resultados deben actualizarse en tiempo real sin necesidad de recargar la página. El sistema debe permitir limpiar los filtros aplicados mediante un botón visible que restablezca la vista general del catálogo. Todos los eventos de filtrado deben quedar registrados para análisis de comportamiento y optimización futura.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el sistema permite aplicar filtros de búsqueda mostrando únicamente productos que cumplen con criterios seleccionados en menos de 2 segundos. Cuando un usuario aplica 3 filtros compuestos simultáneamente debe retornar el conjunto exacto de resultados en tiempo óptimo. Si no hay coincidencias debe mostrar "No se encontraron productos que coincidan con los criterios seleccionados." Si se busca texto sin resultados debe mostrar "No se encontraron coincidencias. Intente con otros criterios." Si los filtros son incompatibles debe impedir la búsqueda. El botón para limpiar filtros debe funcionar correctamente y restaurar la vista general. Todos los eventos deben quedar registrados para auditoría y análisis.

---

# RF-012 — Realización de Pedidos por Cliente Mayorista

| Campo | Valor |
|-------|-------|
| **ID** | RF-012 |
| **Nombre** | Realización de Pedidos por Cliente Mayorista |
| **Módulo** | Gestión de Pedidos |
| **Prioridad** | Alta |
| **Estado** | No Implementado |

**Descripción:**

Este requerimiento permite al cliente mayorista, una vez autenticado en el sistema, registrar pedidos de fabricación de calzado según las combinaciones disponibles en el catálogo digital. La funcionalidad está diseñada para que el cliente seleccione productos específicos, defina tallas, colores y cantidades requeridas, y envíe una solicitud formal que será procesada por el área administrativa. El formulario debe capturar detalles clave incluyendo los modelos, desagregación de cantidades por talla y color, cantidad total, y fecha de entrega requerida. El sistema debe validar que la cantidad total sea mayor o igual a la cantidad mínima configurable por pedido, verificar si los productos están disponibles en bodega como producto terminado para derivación directa a entrega, o clasificar como "pendiente de fabricación" para remisión al área de producción.

**Controles y Restricciones:**

Solo clientes mayoristas verificados y activos pueden enviar pedidos. El sistema debe validar la sesión activa antes de permitir la operación y que la cantidad total de pares solicitados sea mayor o igual a la cantidad mínima por pedido configurable por el administrador. Al iniciar el proceso, el cliente debe seleccionar uno o más productos del catálogo activo, permitiendo la selección de talla, color y cantidad, validando que la combinación exista en el catálogo y que la cantidad sea un valor numérico positivo. Una vez completado, el sistema debe verificar disponibilidad en bodega, marcando como "aprobado para entrega" si hay stock o como "pendiente de fabricación" si no hay disponibilidad. Debe generar número de pedido único, registrar fecha y hora de solicitud, y al enviarse generar un número de pedido de cliente único con estado inicial "pendiente de revisión administrativa".

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el cliente mayorista puede acceder al módulo de pedidos, seleccionar productos válidos con combinaciones registradas, establecer cantidades, confirmar el pedido y recibir notificación de registro exitoso. Si un cliente intenta enviar pedido menor a la cantidad mínima debe bloquear la acción y mostrar "La cantidad mínima de pedido es X pares." Si el cliente envía pedido válido debe generar ID único y notificar al área comercial. Si incluye productos disponibles en bodega debe marcarse como "aprobado para entrega", si no hay disponibilidad debe marcarse como "pendiente de fabricación." Si intenta registrar pedido sin productos debe mostrar mensaje de error, si la cantidad es inválida debe impedirlo. Todos los eventos deben quedar trazados en auditoría.

---

# RF-013 — Notificación de Nuevos Pedidos

| Campo | Valor |
|-------|-------|
| **ID** | RF-013 |
| **Nombre** | Notificación de Nuevos Pedidos |
| **Módulo** | Gestión de Pedidos |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al sistema generar notificaciones automáticas dirigidas al administrador, gerente comercial y planificador de producción cada vez que un cliente mayorista registra un nuevo pedido de fabricación. La funcionalidad está diseñada para garantizar inmediatez en la notificación de recepción, asegurando que el equipo operativo esté informado en tiempo real sobre las solicitudes entrantes con latencia menor a 5 segundos, permitiendo una respuesta rápida en la gestión de entrega o producción según disponibilidad en bodega. La notificación debe incluir datos esenciales del pedido, reflejar su ruta de procesamiento y quedar registrada para trazabilidad operativa.

**Controles y Restricciones:**

Las notificaciones deben generarse automáticamente y en tiempo real tras la creación exitosa del pedido por parte de un cliente mayorista autenticado. El sistema debe validar que el pedido esté completo con productos seleccionados, combinaciones válidas de talla y color, y cantidades definidas. La notificación debe incluir: ID de pedido, nombre del cliente, fecha y hora de registro, cantidad total de ítems, combinaciones solicitadas, estado inicial y enlace directo autenticado al detalle del pedido. Esta información debe aparecer en tiempo real en el panel del administrador, gerente comercial y planificador de producción, y enviarse por correo electrónico de prioridad alta si está habilitado. El sistema debe evitar duplicidad de alertas y todas las notificaciones deben quedar registradas en el historial del sistema.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando tras el registro exitoso de un pedido, el sistema genera notificación automática que aparece en el panel de usuarios autorizados con todos los datos relevantes y enlace directo al detalle. El cuerpo del correo debe incluir al menos nombre del cliente, ID del pedido y cantidad total. La notificación debe indicar si será atendido por entrega directa o procesado por producción. Si el pedido no se registra correctamente no debe emitirse alerta. Si el correo falla debe registrar el evento. Si el pedido ya fue notificado debe evitar duplicidades. El enlace de la notificación debe llevar directamente a la ficha del pedido. Todas las notificaciones deben quedar trazadas en el historial.

---

# RF-014 — Consulta de Estado de Pedidos por Cliente

| Campo | Valor |
|-------|-------|
| **ID** | RF-014 |
| **Nombre** | Consulta de Estado de Pedidos por Cliente |
| **Módulo** | Gestión de Pedidos |
| **Prioridad** | Alta |
| **Estado** | No Implementado |

**Descripción:**

Este requerimiento permite al cliente mayorista consultar el historial de pedidos que ha registrado en el sistema, incluyendo el estado actual de cada solicitud, las combinaciones de productos solicitadas, las cantidades, la ruta de procesamiento y los eventos asociados. Esta funcionalidad es clave para que el cliente pueda hacer seguimiento a sus órdenes, verificar si fueron aprobadas, si están en proceso de entrega o si están pendientes por producción. El módulo debe ofrecer una vista clara, ordenada y actualizada de todos los pedidos realizados, mostrando una línea de tiempo con cambios de estado y fechas, porcentaje de avance de producción sincronizado con latencia máxima de 5 minutos, y alertas automáticas de retraso si la fecha prometida es menor a la actual y el estado no es completado.

**Controles y Restricciones:**

Solo usuarios con rol de cliente mayorista que hayan iniciado sesión correctamente pueden acceder al módulo de consulta de pedidos. El cliente solo puede visualizar sus propios pedidos, estando el acceso a pedidos de otros clientes estrictamente prohibido. La información de costos o márgenes está oculta. Una vez dentro, el sistema debe mostrar todos los pedidos organizados cronológicamente con: número de pedido, fecha de registro, estado actual, productos solicitados, tallas, colores, cantidades y ruta de procesamiento. El sistema debe permitir aplicar filtros por estado, fecha o referencia, y debe mostrar automáticamente alertas de retraso cuando corresponda. El porcentaje de avance debe sincronizarse con el módulo de producción con latencia máxima de 5 minutos. Todos los eventos de consulta deben quedar registrados para fines de trazabilidad.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el cliente mayorista puede acceder al módulo tras iniciar sesión, visualizar todos sus pedidos con información completa y actualizada, y aplicar filtros sin errores. Cuando el pedido está al porcentaje específico de avance en producción, debe mostrarse el estado correspondiente y porcentaje correcto. Si el cliente cambia URL para consultar pedido de otro cliente debe mostrar página de "acceso no autorizado" y registrar la acción en bitácora de seguridad. Si no tiene pedidos debe mostrar mensaje apropiado. Si aplica filtros sin coincidencias debe responder con mensaje adecuado. El sistema debe diferenciar entre pedidos aprobados con disponibilidad en bodega y aquellos que requieren fabricación. Todos los eventos de visualización deben quedar registrados en el historial del sistema.

---

# RF-015 — Actualización de Estado de Pedidos por Administrador

| Campo | Valor |
|-------|-------|
| **ID** | RF-015 |
| **Nombre** | Actualización de Estado de Pedidos por Administrador |
| **Módulo** | Gestión de Pedidos |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador y gerente comercial modificar el estado de los pedidos registrados por los clientes mayoristas, según su disponibilidad en bodega o su avance en el proceso de fabricación. La funcionalidad es esencial para mantener informados a los clientes sobre el progreso de sus solicitudes, coordinar las acciones logísticas o productivas necesarias, y garantizar la trazabilidad operativa. El sistema debe permitir mover pedidos entre estados válidos como pendiente, aprobado, en producción, completado, cancelado y entregado, con transiciones lógicas que reflejen el flujo real de trabajo en la fábrica, registrando obligatoriamente el motivo del cambio, usuario responsable y fecha de la acción.

**Controles y Restricciones:**

Solo el administrador y gerente comercial pueden modificar el estado de los pedidos. El sistema debe validar que el pedido exista y que el cambio de estado sea coherente con su situación actual, bloqueando transiciones no permitidas. Es obligatorio que cada cambio de estado registre el ID del usuario, fecha y hora, y motivo del cambio. Si el estado cambia a "aprobado", el sistema debe generar automáticamente la orden de producción asociada y reservar los insumos en inventario. Al cambiar a "aprobado para entrega" debe verificar disponibilidad en bodega, al seleccionar "pendiente de fabricación" debe registrar fecha de inicio de producción. Al marcar como "fabricado" debe validar que haya sido procesado por producción, y al marcar como "entregado" debe verificar que haya pasado por "aprobado para entrega". Cada cambio debe quedar registrado en el historial del pedido.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede acceder al módulo de pedidos, seleccionar un pedido válido, aplicar un cambio de estado coherente y el sistema actualiza correctamente la información. Cuando el administrador cambia estado de pedido a "aprobado" debe generarse automáticamente orden de producción con mismo ID en estado "iniciada" y los insumos requeridos quedan marcados como "reservados" en inventario. Si hay disponibilidad en bodega puede marcarse como "aprobado para entrega", si no hay disponibilidad se marca como "pendiente de fabricación" registrando fecha de inicio. Si el administrador intenta aplicar transición inválida debe impedir la acción y mostrar mensaje correspondiente. Al revisar historial del pedido debe mostrar estado anterior, nuevo estado, fecha y nombre del administrador. Todos los cambios deben quedar trazados en el historial.

---

# RF-016 — Gestión de Inventario de Calzado Fabricado

| Campo | Valor |
|-------|-------|
| **ID** | RF-016 |
| **Nombre** | Gestión de Inventario de Calzado Fabricado |
| **Módulo** | Gestión de Inventario |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador y jefe de bodega registrar, consultar, actualizar y controlar el inventario de calzado ya fabricado que se encuentra almacenado en bodega. La funcionalidad es esencial para garantizar que el sistema refleje con precisión la disponibilidad real de productos terminados, incluyendo todas las variaciones por modelo, talla y color, permitiendo validar pedidos entrantes, coordinar entregas y evitar duplicidad en la fabricación. El inventario debe soportar entradas por producción, salidas por ventas, ajustes por conteo físico, devoluciones y gestión de stock de seguridad, organizándose por referencia, talla, color, marca, estilo y cantidad disponible, actualizándose automáticamente según movimientos de entrada y salida con alertas cuando se alcancen umbrales mínimos.

**Controles y Restricciones:**

Solo el administrador y jefe de bodega tienen acceso al módulo de gestión de inventario. El sistema debe aplicar validación estricta que impide que cualquier SKU tenga cantidad negativa. Al registrar nuevos ingresos debe especificar referencia del producto, talla, color, cantidad, fecha de ingreso y origen, verificando que la referencia exista en el catálogo. Cada movimiento de entrada, salida, ajuste o devolución requiere motivo obligatorio, cantidad, fecha y responsable. Para cada combinación de talla y color debe consolidar la cantidad disponible y reflejarla en tiempo real. Cuando se aprueba un pedido para entrega debe descontar automáticamente las cantidades del inventario. El sistema debe generar alerta de prioridad media al jefe de compras si la cantidad disponible baja del umbral de stock mínimo configurado. Debe permitir consultar por filtros y realizar ajustes manuales registrando el motivo.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede registrar ingresos válidos de calzado fabricado, consultar el inventario por atributos específicos, aplicar filtros sin errores, realizar ajustes controlados y validar disponibilidad para pedidos. Cuando el stock de un SKU es específico y se intenta registrar salida mayor debe mostrar "El stock es insuficiente para esta salida" y el saldo debe permanecer sin cambios. Al registrar movimiento, cuando se consulta historial del SKU debe mostrar saldo inicial, saldo final, tipo de movimiento, motivo y ID del empleado. El sistema debe reflejar en tiempo real las cantidades disponibles por combinación, impedir aprobación de pedidos que excedan stock, y registrar automáticamente movimientos de salida. Si se realiza ajuste manual debe exigir motivo y registrar el evento. Todos los movimientos deben quedar trazados en el historial.

---

# RF-017 — Actualización Automática del Ingreso de Productos al Inventario

| Campo | Valor |
|-------|-------|
| **ID** | RF-017 |
| **Nombre** | Actualización Automática del Ingreso de Productos al Inventario |
| **Módulo** | Gestión de Inventario |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite que el sistema actualice automáticamente el inventario de calzado fabricado en bodega cada vez que se registra la finalización de un proceso de producción. Una vez que una orden de producción es marcada como "finalizada" y "aprobada por control de calidad", el sistema debe generar entrada automática de la cantidad final producida al inventario de productos terminados. Esta automatización es clave para mantener la integridad del inventario, facilitar la validación de pedidos entrantes, asegurar que las combinaciones de talla y color estén correctamente disponibles para entrega, y vincular el producto con la orden de producción que lo originó para trazabilidad completa.

**Controles y Restricciones:**

La actualización automática debe activarse únicamente cuando el área de producción marca un pedido como "fabricado" en el sistema. El proceso es automático y no debe permitir intervención manual en la cantidad de entrada, la cual debe coincidir con la cantidad aprobada por calidad. El sistema debe validar que el pedido esté en estado "en fabricación" y que todas las combinaciones solicitadas hayan sido completadas. Una vez validado debe identificar cada combinación de producto incluida en el pedido y sumar la cantidad correspondiente al inventario de bodega. Si la combinación ya existe debe incrementar la cantidad disponible, si no existe debe crear nuevo registro con estado "disponible". Si la cantidad ingresada automáticamente difiere de la cantidad esperada por más del 2% de tolerancia debe generar incidencia de prioridad alta para el administrador. Debe impedir duplicidad de ingreso y registrar automáticamente fecha de ingreso, número de pedido que originó el ingreso y origen como "producción interna".

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando al marcar un pedido como "fabricado", el sistema actualiza automáticamente el inventario de bodega con las combinaciones solicitadas sin necesidad de intervención manual. Cuando una orden de producción para cantidad específica se aprueba por calidad y el estado cambia a "finalizada", entonces el sistema aumenta el stock en la cantidad correspondiente y la entrada de inventario queda etiquetada con el ID de la orden de producción. Si la orden finalizó con diferencia mayor al 2% debe generar alerta al administrador y etiquetar el registro con motivo de la discrepancia. El sistema debe validar que el pedido esté en estado "en fabricación", que no haya sido procesado previamente, y que las cantidades estén completas. Si el pedido ya fue procesado debe evitar duplicidad. Todos los eventos deben quedar trazados en el historial del sistema.

---

# RF-018 — Registro de Ventas y Descuento en Inventario

| Campo | Valor |
|-------|-------|
| **ID** | RF-018 |
| **Nombre** | Registro de Ventas y Descuento en Inventario |
| **Módulo** | Gestión de Inventario |
| **Prioridad** | Alta |
| **Estado** | Implementado |

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
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador y personal de control de calidad registrar manualmente las pérdidas de inventario ocasionadas por calzado defectuoso, con el fin de mantener actualizado el stock real en bodega y garantizar la trazabilidad de las unidades descartadas. La funcionalidad está diseñada para reflejar las salidas no comerciales del inventario, generadas por defectos de fabricación, daños durante almacenamiento, errores de producción o devoluciones no recuperables. El registro de defecto es obligatorio antes de que un par pueda ser considerado como pérdida, requiriendo código de defecto de una lista predefinida y aprobación del jefe de calidad, moviendo el stock defectuoso a inventario separado de "scrap stock" en lugar de simplemente restarlo.

**Controles y Restricciones:**

Solo el administrador y personal de control de calidad pueden registrar pérdidas. El formulario exige código de defecto de lista predefinida y aprobación del rol de jefe de calidad. El sistema debe permitir seleccionar referencia del producto, talla, color, cantidad descartada, fecha del evento, motivo de la pérdida y observaciones opcionales como campos obligatorios excepto las observaciones. Antes de confirmar debe validar que la combinación de producto exista en el inventario y que la cantidad a descontar no exceda el stock disponible. Una vez validado debe descontar automáticamente las unidades afectadas del inventario de bodega y mover el stock defectuoso a ubicación de inventario separada "scrap stock" con referencia al motivo del defecto. Debe impedir duplicidad de registro y todas las operaciones deben quedar registradas en el historial incluyendo fecha, hora, tipo de operación, cantidad descontada, motivo, referencia del producto y usuario responsable.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede registrar una pérdida de calzado fabricado, especificar todos los atributos requeridos, validar disponibilidad en bodega, y descontar automáticamente las unidades correspondientes del inventario. Cuando se detectan productos defectuosos y el supervisor de calidad registra la pérdida, entonces el inventario de "productos terminados" se reduce en la cantidad correspondiente, y el inventario de "scrap stock" aumenta en la misma cantidad, con referencia al motivo del defecto. Si un operario registra una pérdida, el estado queda como "pendiente de aprobación de calidad" y no se mueve el inventario hasta la aprobación. El sistema debe impedir el registro si los datos están incompletos, si la combinación no existe o si la cantidad excede el stock disponible. Si se intenta duplicar una pérdida debe bloquear la acción. Todos los eventos deben quedar trazados en el historial.

---

# RF-020 — Proceso de Restauración de Calzado Defectuoso

| Campo | Valor |
|-------|-------|
| **ID** | RF-020 |
| **Nombre** | Proceso de Restauración de Calzado Defectuoso |
| **Módulo** | Gestión de Inventario |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al administrador y jefe de calidad registrar y gestionar el proceso de restauración de calzado defectuoso que ha sido previamente descartado del inventario de bodega. La funcionalidad está diseñada para recuperar unidades que, tras una evaluación técnica, pueden ser reparadas y reincorporadas al inventario como producto disponible, implementando un flujo de trabajo que rastrea el producto a través de etapas como "reportado", "en reparación", "revisión final" y "restaurado". El proceso debe garantizar trazabilidad completa desde la identificación del defecto, pasando por la intervención correctiva, hasta la validación final que autoriza su reintegración, registrando el costo de reparación en mano de obra y materiales para análisis contable.

**Controles y Restricciones:**

Solo el administrador y jefe de calidad tienen acceso al módulo de restauración. El sistema debe permitir seleccionar productos previamente registrados como defectuosos en el historial de pérdidas, especificando referencia, talla, color, cantidad a restaurar, tipo de defecto, tipo de intervención aplicada, fecha de inicio, fecha de finalización y resultado de evaluación final. Debe validar que la cantidad a restaurar no exceda la cantidad previamente descartada. Durante el proceso debe marcar las unidades como "en restauración" y bloquear su visualización en inventario disponible. Solo el jefe de calidad puede autorizar el cambio final de estado a "restaurado". Una vez finalizado debe permitir marcar como "restauradas y aprobadas" para reincorporación automática al inventario o "restauradas y rechazadas" para mantener como pérdida definitiva. Debe registrar el costo de reparación y actualizar el costo unitario para reflejar el costo de reparación si es aprobada.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede seleccionar productos defectuosos previamente registrados, iniciar un proceso de restauración con datos válidos, marcar el resultado final, y reincorporar automáticamente las unidades aprobadas al inventario. Cuando un par se encuentra en "cuarentena" y pasa por el proceso y el jefe de calidad lo aprueba, entonces el par se mueve a "productos terminados" y el costo de reparación se asocia al ID del producto en el historial. Si la restauración es rechazada y el jefe de calidad lo marca como "no recuperable", entonces el par se da de baja del inventario total y se contabiliza como pérdida. El sistema debe validar que la cantidad no exceda el total descartado, bloquear visualización de unidades en restauración, y permitir marcar resultado como aprobado o rechazado. Todos los eventos deben quedar trazados en el historial de restauración.

---

# RF-021 — Creación de Tareas por el Administrador

| Campo | Valor |
|-------|-------|
| **ID** | RF-021 |
| **Nombre** | Creación de Tareas por el Administrador |
| **Módulo** | Gestión de Producción y Tareas |
| **Prioridad** | Alta |
| **Estado** | Implemetado |

**Descripción:**

Este requerimiento permite al administrador y planificador de producción registrar tareas operativas dentro del sistema, asignarlas a empleados específicos y establecer parámetros de seguimiento para su ejecución. Las tareas deben estar obligatoriamente vinculadas a una orden de producción, requiriendo definir descripción, tipo de proceso, tiempo estándar en horas-hombre y cantidad a procesar. La funcionalidad está diseñada para organizar el trabajo interno, distribuir responsabilidades, y garantizar que cada actividad relacionada con producción, inventario, logística o gestión comercial quede formalmente documentada y trazada, validando que el tiempo estándar para el proceso sea un valor predefinido que coincida con el tiempo definido en la ficha del modelo.

**Controles y Restricciones:**

Solo el administrador y planificador de producción tienen acceso al módulo de creación de tareas. Los campos obligatorios son: título, descripción, tipo de tarea, prioridad, fecha límite estimada y referencia a la orden de producción. El sistema debe validar que el tiempo estándar para el proceso sea un valor predefinido y no pueda ser alterado libremente, coincidiendo con el tiempo definido en la ficha del modelo. Debe impedir la creación de tareas duplicadas que ya existan para la misma orden de producción y el mismo proceso. El sistema debe permitir que cada tarea esté vinculada a pedidos, productos, procesos de restauración, ajustes de inventario o cualquier operación interna que requiera intervención humana. Una vez registrada debe aparecer en el panel del empleado asignado con estado "pendiente de inicio" y generar notificación inmediata. Cada acción debe quedar registrada en el historial de operaciones incluyendo fecha, hora, usuario responsable y cambios realizados.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede acceder al módulo de tareas, registrar una nueva tarea con todos los campos obligatorios, asignarla a un empleado válido, y visualizarla en el panel correspondiente. Cuando se crea una tarea vinculada a la orden de producción específica y se confirma la creación, entonces el estado inicial de la tarea es "pendiente de inicio" y el empleado asignado recibe una notificación. Al revisar la tarea, cuando se verifica el campo tiempo estándar, entonces el valor debe coincidir con el tiempo definido en la ficha del modelo. El sistema debe validar los datos ingresados, impedir asignaciones a usuarios inactivos, y mostrar mensajes claros ante errores. Si la tarea está correctamente registrada debe aparecer en el panel del empleado con estado "pendiente" y todos los detalles visibles. Todos los eventos deben quedar trazados en el historial del sistema.

---

# RF-022 — Asignación de Tareas a Empleados

| Campo | Valor |
|-------|-------|
| **ID** | RF-022 |
| **Nombre** | Asignación de Tareas a Empleados |
| **Módulo** | Gestión de Producción y Tareas |
| **Prioridad** | Alta |
| **Estado** | Implememtado |

**Descripción:**

Este requerimiento permite al administrador y planificador de producción asignar tareas previamente registradas a empleados activos dentro del sistema, estableciendo responsabilidades operativas claras y garantizando el seguimiento de actividades internas. La funcionalidad está diseñada para distribuir eficientemente el trabajo relacionado con producción, inventario, restauración, entregas o ajustes técnicos, especificando fecha límite de ejecución, prioridad y notas de instrucción. La asignación debe generar notificación inmediata in-app y por correo electrónico, actualizar el dashboard del empleado, y incluir validación de carga de trabajo que muestre si la asignación excede el 110% de la capacidad del empleado basada en tiempo estándar de tareas ya asignadas.

**Controles y Restricciones:**

Solo el administrador y planificador de producción pueden asignar tareas. El sistema debe permitir seleccionar una tarea previamente registrada en estado "pendiente" y vincularla a un empleado con cuenta activa y rol autorizado. Debe realizar validación de carga de trabajo mostrando advertencia si la asignación excede el 110% de capacidad del empleado para ese día, pero permitiendo la asignación. Al momento de la asignación debe registrar fecha de asignación, nombre del empleado, y activar visualización inmediata en su panel personal. Debe permitir establecer fecha límite obligatoria para la ejecución. Una vez asignada la tarea debe cambiar su estado a "asignada" y quedar bloqueada para edición por otros usuarios excepto el administrador. Si se requiere reasignar debe permitirlo solo si el estado es "asignada" o "en progreso", impidiendo reasignación si está "completada" o "cancelada". Todas las asignaciones deben quedar registradas en el historial incluyendo fecha, hora, usuario responsable, empleado asignado y observaciones opcionales.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede seleccionar una tarea válida en estado "pendiente", asignarla a un empleado activo con rol autorizado, establecer una fecha límite, y visualizar la tarea en el panel del empleado con estado "asignada". Cuando se asigna una tarea, entonces la tarea aparece en la lista del empleado con el estado "pendiente de inicio" y el empleado recibe notificación in-app y correo electrónico con detalles completos. Si la capacidad del empleado está al 105%, cuando el administrador intenta asignar otra tarea, entonces el sistema debe mostrar advertencia sobre sobrecarga de trabajo pero permitir la asignación. El sistema debe validar que la tarea no esté previamente asignada, que el empleado esté habilitado, y que los datos ingresados sean correctos. Si se intenta reasignar una tarea finalizada debe bloquear la operación. Todos los eventos deben quedar trazados en el historial del sistema.

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

Este requerimiento permite al empleado autenticado consultar las tareas que le han sido asignadas por el administrador, incluyendo detalles operativos, estado actual, fechas clave y vínculos con procesos internos. Cada empleado tendrá un panel de control personal donde podrá consultar todas las tareas asignadas, filtradas por estado, prioridad y fecha límite, con el objetivo de proveer una herramienta clara de organización del trabajo diario. La funcionalidad está diseñada para que cada empleado tenga visibilidad clara sobre sus responsabilidades, pueda organizar su carga de trabajo, dar seguimiento a actividades pendientes, en progreso o finalizadas, y mostrar un indicador de tiempo restante hasta la fecha límite.

**Controles y Restricciones:**

Solo los usuarios con rol de empleado que hayan iniciado sesión correctamente pueden acceder al módulo de consulta de tareas. El empleado solo puede visualizar sus tareas y tiene acceso prohibido a las tareas y rendimiento de otros compañeros. El sistema debe validar la sesión activa antes de mostrar la información. Una vez dentro debe mostrar todas las tareas asignadas al empleado organizadas cronológicamente y clasificadas por estado: "pendiente", "en progreso", "completada" o "cancelada". Cada tarea debe incluir: título, descripción, tipo de tarea, prioridad, fecha de asignación, fecha límite, estado actual, observaciones del administrador y vínculo con pedidos, productos o procesos internos si aplica. La interfaz debe permitir ordenación por prioridad o fecha límite, y mostrar indicador de tiempo restante hasta la fecha límite. Las tareas marcadas como "completadas" deben permanecer visibles para consulta histórica pero no permitir edición ni reactivación. Todos los eventos de consulta deben quedar registrados incluyendo fecha, hora, usuario responsable y filtros aplicados.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el empleado puede acceder al módulo de tareas tras iniciar sesión, visualizar todas las tareas que le han sido asignadas, aplicar filtros sin errores, y consultar los detalles completos de cada tarea. Cuando un empleado ingresa a su panel y utiliza el filtro "prioridad alta", entonces solo ve las tareas marcadas como alta y no tiene acceso a la vista de tareas de otros compañeros. Al abrir el detalle de una tarea debe mostrar la descripción completa y la orden de producción vinculada. El sistema debe validar el acceso, mostrar únicamente las tareas del usuario autenticado, y reflejar correctamente el estado y atributos operativos. Si el empleado no tiene tareas debe mostrar mensaje correspondiente. Si aplica filtros sin coincidencias debe responder con mensaje adecuado. Todas las tareas deben estar organizadas y actualizadas en tiempo real.

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

Este requerimiento permite al empleado asignado a una tarea registrar avances parciales, observaciones técnicas e incidencias operativas durante su ejecución. El empleado registrará el inicio con check-in, pausa y cálculo del tiempo real invertido en una tarea, además de permitir reportar incidencias críticas como rotura de maquinaria o falta de insumos que impidan el avance, generando ticket automático. La funcionalidad está diseñada para mantener informado al administrador sobre el progreso real de cada tarea, documentar obstáculos o desviaciones, y facilitar la toma de decisiones correctivas en tiempo oportuno, registrando las marcas de tiempo del servidor para inicio, pausa y fin, con obligación de justificar tiempo de pausa si supera el 10% del tiempo estándar.

**Controles y Restricciones:**

Solo el empleado asignado a la tarea puede registrar avances o incidencias. El sistema debe validar que la sesión esté activa y que el usuario tenga asignada la tarea en estado "asignada" o "en progreso". Debe registrar las marcas de tiempo del servidor para inicio, pausa y fin, y un empleado no puede iniciar dos tareas simultáneamente. El módulo de reporte debe permitir registrar: porcentaje de avance, descripción del progreso, tipo de incidencia, observaciones, fecha del evento y archivos adjuntos opcionales. Es obligatorio que el registro de una incidencia crítica dispare notificación de emergencia al rol "mantenimiento" o "comprador" con latencia inferior a 60 segundos. Si el porcentaje de avance es 100% debe solicitar confirmación adicional antes de marcar la tarea como "completada". Si se reporta incidencia crítica debe cambiar automáticamente el estado a "bloqueada" y notificar al administrador. El empleado debe justificar el tiempo de pausa si supera el 10% del tiempo estándar. Cada reporte debe quedar vinculado a la tarea y registrado en el historial de ejecución.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el empleado puede acceder al módulo de reporte, seleccionar una tarea válida en estado activo, registrar avances o incidencias con datos completos, y visualizar el impacto del reporte en el estado de la tarea. Cuando un empleado marca "inicio" y luego "fin" en una tarea, entonces el sistema calcula el tiempo de ejecución real y la eficiencia como tiempo estándar dividido tiempo real. Cuando el empleado reporta una "rotura de máquina", al registrar la incidencia el sistema genera ticket de mantenimiento y el jefe de mantenimiento recibe notificación inmediata. El sistema debe validar que el usuario tenga permisos, que los campos estén correctamente diligenciados, y que los eventos queden trazados en el historial. Si se reporta incidencia crítica debe bloquear la tarea y notificar al administrador. Si se alcanza el 100% de avance debe solicitar confirmación antes de marcar como completada. Todos los reportes deben quedar disponibles para consulta por parte del administrador.

---

# RF-025 — Confirmación de Finalización de Tareas

| Campo | Valor |
|-------|-------|
| **ID** | RF-025 |
| **Nombre** | Confirmación de Finalización de Tareas |
| **Módulo** | Gestión de Producción y Tareas |
| **Prioridad** | Media |
| **Estado** | Implemetado |

**Descripción:**

Este requerimiento permite al empleado asignado a una tarea confirmar su finalización una vez completadas todas las actividades requeridas. El empleado podrá marcar una tarea como finalizada registrando la cantidad exacta de pares procesados, con opción de adjuntar evidencia fotográfica o informe final para procesos críticos, cambiando automáticamente el estado del flujo de producción. La funcionalidad está diseñada para cerrar formalmente el ciclo operativo de cada tarea, actualizar su estado en el sistema, y notificar al administrador para revisión o validación. La confirmación debe incluir un resumen del trabajo realizado, evidencias opcionales, observaciones técnicas y fecha efectiva de cierre, con obligación de que la cantidad reportada coincida con la asignada dentro del 1% de tolerancia.

**Controles y Restricciones:**

Solo el empleado asignado a la tarea puede confirmar su finalización. El sistema debe validar que la sesión esté activa, que la tarea esté en estado "asignada" o "en progreso", y que no haya sido previamente marcada como "completada" o "cancelada". Es obligatorio que la cantidad reportada coincida con la cantidad asignada; si existe discrepancia mayor al 1% se debe solicitar clave de supervisor para forzar la finalización, registrando la diferencia como "desperdicio" o "falta". El módulo de confirmación debe exigir: resumen del trabajo realizado, fecha de finalización, observaciones técnicas si aplica, y archivos adjuntos opcionales. Una vez confirmada debe cambiar el estado a "completada", registrar el evento en el historial, y notificar al administrador. La finalización de la última tarea de la orden de producción debe generar automáticamente alerta al control de calidad para inspección final. El sistema debe impedir que una tarea completada sea modificada por el empleado, bloqueando cualquier intento de edición posterior.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el empleado puede acceder al módulo de tareas, seleccionar una tarea válida en estado activo, completar los campos requeridos, confirmar la finalización sin errores, y generar la notificación correspondiente al administrador. Cuando un empleado finaliza una tarea de cantidad específica y reporta cantidad menor con más del 1% de diferencia, entonces el sistema solicita clave de supervisor para justificar la pérdida y etiqueta la diferencia como "desperdicio". Cuando la tarea finalizada es la última del proceso, al confirmarse el estado de la orden de producción cambia a "pendiente de inspección de calidad." El sistema debe validar que el usuario tenga permisos, que los datos estén completos, y que el estado de la tarea se actualice correctamente. Una vez finalizada la tarea debe quedar bloqueada para edición y disponible para consulta histórica. Todos los eventos deben quedar trazados en el historial del sistema.

---

# RF-026 — Notificación al Administrador de Tareas Finalizadas

| Campo | Valor |
|-------|-------|
| **ID** | RF-026 |
| **Nombre** | Notificación al Administrador de Tareas Finalizadas |
| **Módulo** | Gestión de Tareas y Producción |
| **Prioridad** | Alta |
| **Estado** | No Implementado |

**Descripción:**

Este requerimiento permite al sistema generar una notificación automática dirigida al administrador y supervisor de línea cada vez que un empleado marca una tarea como finalizada. La funcionalidad está diseñada para garantizar que el administrador reciba en tiempo real el reporte de cierre con resumen de desempeño incluyendo tiempo real invertido y eficiencia, pueda validar el cumplimiento, y tomar decisiones de aprobación, retroalimentación o reapertura según corresponda. La notificación debe incluir datos esenciales de la tarea, resumen del trabajo realizado, nombre del empleado responsable, momento de finalización, eficiencia calculada y enlace directo a la evidencia si se adjuntó, permitiendo al supervisor proceso de aprobación o rechazo donde el rechazo obliga al operario a reabrir la tarea y registrar tiempo de retrabajo.

**Controles y Restricciones:**

La notificación debe activarse únicamente cuando una tarea asignada a un empleado sea marcada como "completada" desde el módulo de confirmación de tareas. Solo el supervisor o administrador de la orden de producción recibe la notificación. El sistema debe validar que el cierre haya sido registrado correctamente, que los campos obligatorios estén completos, y que el estado de la tarea haya sido actualizado. La notificación debe incluir: número de tarea, título, tipo de tarea, prioridad, fecha de asignación, fecha de finalización, nombre del empleado, resumen del trabajo realizado, eficiencia calculada y observaciones técnicas. Esta información debe aparecer en tiempo real en el panel del administrador, y si está habilitado, también enviarse por correo electrónico. El contenido debe incluir la eficiencia calculada y enlace directo a la evidencia si se adjuntó. El sistema debe permitir al supervisor proceso de aprobación o rechazo de la tarea, donde el rechazo obliga al operario a reabrir la tarea y registrar tiempo de retrabajo. Debe evitar duplicidad de alertas y todas las notificaciones deben quedar registradas en el historial.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando tras la confirmación de finalización de una tarea por parte del empleado, el sistema genera notificación automática que aparece en el panel del administrador con todos los datos relevantes. Cuando una tarea es finalizada y el supervisor recibe la notificación, entonces la notificación contiene la eficiencia calculada y botón de "aprobar" o "rechazar." Cuando el supervisor rechaza la tarea con motivo específico como "mala calidad en costura" y confirma, entonces la tarea pasa al estado "reabierta", el operario es notificado, y el tiempo de retrabajo se inicia en cero. La notificación debe reflejar el estado actualizado de la tarea, incluir el resumen del trabajo realizado, y permitir acceso directo al historial. Si el cierre es incompleto debe impedir la notificación. Si el correo falla debe registrar el evento. Si la tarea ya fue notificada debe evitar duplicidad. Todos los eventos deben quedar trazados en el historial del sistema.

---

# RF-027 — Modificación y Eliminación de Tareas por el Administrador

| Campo | Valor |
|-------|-------|
| **ID** | RF-027 |
| **Nombre** | Modificación y Eliminación de Tareas por el Administrador |
| **Módulo** | Gestión de Tareas y Producción |
| **Prioridad** | Alta |
| **Estado** | Implememtado |

**Descripción:**

Este requerimiento permite al administrador y planificador de producción editar o eliminar tareas previamente registradas en el sistema, siempre que no hayan sido completadas o canceladas por el empleado asignado. La funcionalidad está diseñada para corregir errores en la planificación, reasignar responsabilidades, ajustar fechas o retirar tareas que ya no son necesarias, proporcionando flexibilidad operativa ante cambios de prioridades. Toda modificación o eliminación debe estar sujeta a validaciones estrictas, garantizar trazabilidad operativa y evitar alteraciones en tareas que ya han sido ejecutadas, no permitiendo eliminación de tareas que tengan registro de tiempo mayor a cero minutos, en cuyo caso solo se permitirá la opción de "cancelar" registrando el motivo.

**Controles y Restricciones:**

Solo el administrador y planificador de producción tienen acceso al módulo de modificación y eliminación de tareas. El sistema debe permitir editar tareas en estado "pendiente" o "asignada", siempre que no hayan sido marcadas como "completadas" o "canceladas". Al editar una tarea debe permitir actualizar: título, descripción, tipo de tarea, prioridad, fecha límite, empleado asignado y observaciones, validando que los nuevos datos sean válidos y que el empleado seleccionado esté activo y autorizado. Para eliminar una tarea debe validar que esté en estado "pendiente" y que no tenga reportes de avance registrados. El sistema no debe permitir eliminación de tareas que ya tengan registro de tiempo, en ese caso solo se permitirá opción de "cancelar" registrando el motivo. Si la tarea cumple condiciones debe solicitar confirmación explícita antes de eliminarla. Una vez eliminada debe desaparecer del panel del empleado y quedar registrada como "eliminada por el administrador." Toda modificación o cancelación debe generar registro de auditoría con valor anterior, nuevo valor y responsable de la modificación.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede acceder al módulo de tareas, seleccionar una tarea válida en estado editable, modificar sus atributos sin errores, y guardar los cambios con trazabilidad completa. Cuando una tarea con registro de tiempo se intenta eliminar y el administrador confirma, entonces el sistema bloquea la eliminación y obliga a usar el estado "cancelado" con registro del motivo. Cuando el administrador edita la fecha límite de una tarea y la acción se guarda, entonces el historial muestra el cambio de fecha anterior a nueva fecha con ID del administrador. El sistema debe validar todos los campos, impedir asignaciones inválidas, y bloquear ediciones sobre tareas cerradas. Si se intenta eliminar tarea con actividad registrada debe impedir la acción. Si cumple condiciones debe permitir eliminación tras confirmación explícita, retirar la tarea del panel del empleado y registrar el evento. Todos los cambios deben quedar disponibles para consulta y auditoría.

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

Este requerimiento permite al empleado registrar incidencias relacionadas con el funcionamiento de maquinaria o el estado de insumos durante la ejecución de tareas operativas. El empleado de planta debe tener un canal rápido para reportar fallas en la maquinaria o escasez de insumos, con formulario que exige campos obligatorios como tipo de incidencia, descripción detallada, foto de la prueba y área afectada. La funcionalidad está diseñada para documentar fallos técnicos, agotamiento de materiales, condiciones inseguras o cualquier evento que afecte la continuidad del trabajo, generando ticket de gestión de mantenimiento o compras con detalle necesario para acción correctiva, donde una incidencia de tipo "falta de insumo crítico" genera ticket de prioridad "urgente" al jefe de compras.

**Controles y Restricciones:**

Solo los empleados con tareas activas asignadas pueden acceder al módulo de registro de incidencias. El sistema debe validar que la sesión esté activa y que el usuario tenga al menos una tarea en estado "asignada" o "en progreso". El formulario debe incluir como obligatorios: tipo de incidencia, descripción detallada del problema, código o nombre del equipo o insumo afectado, foto de la prueba, área afectada, fecha y hora del evento, impacto sobre la tarea, y evidencia opcional. Una vez registrada debe vincularla a la tarea activa del empleado, cambiar su estado a "bloqueada" si el impacto es total, y generar notificación inmediata al administrador. Una incidencia de tipo "falta de insumo crítico" debe generar ticket de prioridad "urgente" al rol de "jefe de compras." Debe impedir registro de incidencias duplicadas en intervalo menor a 30 minutos. Todas las incidencias deben quedar trazadas en el historial técnico incluyendo fecha, hora, tipo de evento, equipo o insumo afectado, impacto operativo, evidencia adjunta y usuario responsable.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el empleado puede acceder al módulo de incidencias desde una tarea activa, completar el formulario con datos válidos, registrar el evento sin errores, y generar la notificación correspondiente al administrador. Cuando un empleado reporta un fallo de maquinaria y lo reporta, entonces se genera ticket con ID único y el jefe de mantenimiento recibe notificación de prioridad "alta" con descripción y enlace al detalle. Cuando se reporta falta de un insumo y el jefe de compras resuelve el ticket, entonces el estado de la incidencia cambia a "resuelto" y el empleado que reportó es notificado. El sistema debe validar que el usuario tenga permisos, que los datos estén completos, y que el evento quede vinculado a la tarea. Si el impacto es total la tarea debe cambiar automáticamente a estado "bloqueada." Si se intenta registrar incidencia duplicada debe impedir la acción. Todas las incidencias deben quedar disponibles para consulta por parte del administrador.

---

# RF-029 — Módulo de Notificaciones

| Campo | Valor |
|-------|-------|
| **ID** | RF-029 |
| **Nombre** | Módulo de Notificaciones |
| **Módulo** | Notificaciones y Alertas |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al sistema generar, gestionar y distribuir notificaciones internas dirigidas a los distintos roles de usuario en función de eventos operativos relevantes. Un centro de notificaciones centralizado consolida todos los mensajes relevantes como pedidos, tareas, incidencias y alertas de inventario para cada usuario, proporcionando visión jerárquica con posibilidad de personalización de preferencias. La funcionalidad está diseñada para garantizar que cada actor reciba información oportuna sobre tareas, pedidos, incidencias, actualizaciones de estado, bloqueos, validaciones o cualquier evento que requiera atención inmediata, siendo las notificaciones visibles desde el panel principal del usuario, organizadas cronológicamente y clasificadas por tipo y prioridad con persistencia hasta que el usuario las marque como leídas.

**Controles y Restricciones:**

Las notificaciones deben generarse automáticamente en respuesta a eventos definidos por el sistema como registro de nuevos pedidos, finalización de tareas, reporte de incidencias, asignación de tareas, cambio de estado en pedidos o tareas, restauración de productos defectuosos, o recepción de solicitudes administrativas. El usuario solo recibirá notificaciones relevantes a su rol, siendo persistentes hasta que el usuario las marque como leídas. Cada notificación debe incluir título descriptivo, breve descripción del evento, tipo de operación que la originó, prioridad asignada, fecha y hora de generación, estado y vínculo directo al módulo relacionado. Estas notificaciones deben mostrarse en tiempo real en el panel del usuario correspondiente, con contador visible que indique cuántas están pendientes de revisión. Al acceder a una notificación debe marcarla como "leída"; si el usuario decide archivarla debe cambiar su estado a "archivada" y ocultarse del panel principal. El sistema debe permitir filtrado por tipo de notificación y prioridad, evitar duplicidad de notificaciones, y en caso de error durante la generación debe registrar el evento. El administrador debe contar con panel de control donde pueda consultar todas las notificaciones generadas, filtrarlas por tipo, estado, fecha y destinatario.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el sistema genera notificaciones automáticas en respuesta a eventos definidos, las muestra en tiempo real en el panel del usuario correspondiente, permite marcar como leídas o archivadas, y garantiza trazabilidad completa. Cuando el planificador de producción recibe 3 notificaciones y marca una como leída, entonces el contador de notificaciones pendientes se reduce de 3 a 2. Cuando un nuevo pedido es creado y se notifica, entonces el administrador y gerente comercial son notificados, pero el operario de planta no recibe la notificación. El sistema debe impedir duplicidades, validar que los datos estén completos, y registrar cada evento en el historial. Si el usuario accede a la notificación debe actualizar su estado. Si el administrador consulta el panel de control debe poder filtrar y revisar todas las notificaciones generadas. La funcionalidad debe garantizar distribución oportuna, validación estricta, trazabilidad operativa y experiencia de gestión clara.

---

# RF-030 — Alertas al Administrador sobre Pedidos, Tareas e Inventario

| Campo | Valor |
|-------|-------|
| **ID** | RF-030 |
| **Nombre** | Alertas al Administrador sobre Pedidos, Tareas e Inventario |
| **Módulo** | Notificaciones y Alertas |
| **Prioridad** | Alta |
| **Estado** | implemetado |

**Descripción:**

Este requerimiento permite al sistema generar alertas automáticas dirigidas al administrador y gerente de fábrica en respuesta a eventos críticos relacionados con pedidos, tareas e inventario. La funcionalidad está diseñada para garantizar que el administrador reciba información inmediata sobre situaciones que requieren intervención como bloqueos operativos, agotamiento de stock, incidencias técnicas, tareas finalizadas o pedidos pendientes de validación, con alertas de prioridad alta visibles en el panel principal que permiten acceso directo al módulo afectado para toma de decisiones rápida. El sistema debe permitir configuración del umbral de alerta y las alertas de prioridad "urgente" deben enviarse por correo electrónico y mostrarse en banner prominente con botón de "acuse de recibo" obligatorio.

**Controles y Restricciones:**

Solo el administrador y gerente de fábrica recibirán estas alertas. Las alertas se activan automáticamente cuando se registran pedidos que no pueden ser aprobados por falta de inventario, cuando un empleado finaliza una tarea, cuando se reportan incidencias críticas en maquinaria o insumos, cuando se detecta agotamiento de combinaciones específicas en inventario, cuando se restauran productos defectuosos que requieren validación, en caso de solicitudes de reactivación de cuentas pendientes de aprobación, o si fallan envíos de notificaciones automáticas. El sistema debe permitir configuración del umbral de alerta como alerta por retraso si fecha de promesa es menor a días específicos, o si inventario de insumo baja del porcentaje configurado. Cada alerta debe incluir título descriptivo, tipo de evento que la originó, prioridad asignada siempre alta, fecha y hora de generación, descripción breve del problema, módulo afectado y vínculo directo para revisión. Estas alertas deben mostrarse en tiempo real con contador visible, permitiendo al administrador registrar respuesta como validar, rechazar, reabrir o escalar el evento. Debe evitar duplicidad de alertas y el administrador debe contar con panel de control específico para alertas.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el sistema genera alertas automáticas en respuesta a eventos críticos, las muestra en tiempo real en el panel del administrador, permite su revisión, y registra todas las acciones tomadas. Cuando un insumo configurado con porcentaje específico de stock mínimo baja al nivel crítico y se registra la transacción, entonces el administrador recibe alerta de prioridad "media." Cuando el administrador hace clic en "acuse de recibo" de una alerta y confirma, entonces la alerta desaparece del banner y el evento queda registrado en la bitácora de alertas. El sistema debe impedir duplicidades, validar que los datos estén completos, y garantizar trazabilidad operativa. Si el administrador accede a la alerta debe actualizar su estado. Si se toma una decisión debe quedar registrada. El panel de control debe permitir filtrar y consultar todas las alertas generadas.

---

# RF-031 — Reportes de Pedidos e Inventario

| Campo | Valor |
|-------|-------|
| **ID** | RF-031 |
| **Nombre** | Reportes de Pedidos e Inventario |
| **Módulo** | Reportes y Analítica |
| **Prioridad** | Media |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al sistema generar reportes consolidados sobre el estado de los pedidos registrados y el inventario de calzado fabricado disponible en bodega. La funcionalidad está diseñada para ofrecer al administrador y gerente una visión operativa clara, estructurada y actualizada que facilite la toma de decisiones, el análisis de desempeño, la planificación de producción y el control logístico. Los reportes deben ser accesibles desde el panel administrativo, organizados por fecha, estado, referencia, cliente, combinaciones de producto y movimientos de entrada o salida, con capacidad de exportación a PDF y Excel garantizando tiempo de ejecución no superior a 60 segundos para período de un año de datos.

**Controles y Restricciones:**

La generación de reportes sensibles está restringida al rol de administrador y gerente. El sistema debe permitir al administrador generar reportes en tiempo real sobre pedidos y sobre inventario, de forma separada o combinada, con filtros por rango de fechas, estado, referencia, cliente, tipo de movimiento o combinación específica. Para pedidos debe incluir: número de pedido, cliente mayorista, fecha de registro, estado actual, productos solicitados, cantidades, combinaciones de talla y color, y ruta de procesamiento. Para inventario debe mostrar: referencia del producto, marca, estilo, talla, color, cantidad disponible, cantidad reservada, cantidad en restauración y movimientos recientes. Los reportes deben reflejar únicamente datos consolidados y validados, incluyendo métricas clave como valor de stock, tasa de rotación de pedidos y valor histórico de ventas. El sistema debe garantizar que el reporte se genere en tiempo de ejecución no superior a 60 segundos para período de un año de datos, ser exportables a PDF y Excel, y los datos deben ser inmutables y consistentes con registros de auditoría. Debe impedir la edición de reportes ya generados pero permitir su consulta histórica. Cada reporte debe incluir fecha de generación, usuario responsable, parámetros aplicados y totalizadores por categoría.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede acceder al módulo de reportes, seleccionar el tipo de reporte deseado, aplicar filtros válidos, generar el reporte sin errores, y consultar los resultados con información completa, organizada y actualizada. Cuando el administrador filtra un reporte por el último trimestre y cliente específico y el reporte se genera, entonces el reporte muestra la cantidad de pedidos y la métrica de tasa de cumplimiento en menos de 60 segundos. Cuando el reporte se genera y se descarga el archivo Excel, entonces los datos tabulares son correctos y el formato es legible. El sistema debe validar que los datos estén consolidados, impedir la generación si hay inconsistencias, y registrar cada evento en el historial. Si el reporte no arroja resultados debe mostrar mensaje correspondiente. Si se genera correctamente debe incluir todos los campos requeridos y permitir su consulta posterior.

---

# RF-032 — Reportes sobre Tareas Asignadas a Empleados

| Campo | Valor |
|-------|-------|
| **ID** | RF-032 |
| **Nombre** | Reportes sobre Tareas Asignadas a Empleados |
| **Módulo** | Reportes y Analítica |
| **Prioridad** | Media |
| **Estado** | Implemetado |

**Descripción:**

Este requerimiento permite al sistema generar reportes consolidados sobre las tareas operativas asignadas a los empleados, incluyendo su estado, tipo, prioridad, fechas clave, avances registrados e incidencias reportadas. La funcionalidad está diseñada para ofrecer al administrador y recursos humanos una visión estructurada del cumplimiento operativo, facilitar el análisis de desempeño individual y colectivo, y apoyar la toma de decisiones en la gestión de recursos humanos y planificación interna. Los reportes deben incluir eficiencia por empleado, tiempo de retrabajo registrado y desviación en horas-hombre respecto al tiempo estándar, siendo accesibles desde el panel administrativo, organizados por empleado, estado de ejecución, tipo de tarea y rango de fechas.

**Controles y Restricciones:**

Solo el administrador y recursos humanos pueden acceder a estos reportes. El sistema debe permitir generar reportes en tiempo real sobre tareas asignadas, filtrando por empleado, estado, tipo de tarea, prioridad, y fechas de asignación o finalización. Los reportes deben incluir la tasa de retrabajo como tiempo de retrabajo dividido tiempo total y la calificación de eficiencia del empleado. Cada reporte debe incluir: nombre del empleado, número de tarea, título, descripción, tipo, prioridad, fecha de asignación, fecha límite, estado actual, porcentaje de avance, incidencias registradas y observaciones técnicas si existen. Es obligatorio que el reporte permita filtro por rango de fechas, supervisor y tipo de proceso. Los reportes deben reflejar únicamente tareas registradas y trazadas correctamente, impedir la edición de reportes ya generados pero permitir su consulta histórica. Cada reporte debe incluir fecha de generación, usuario responsable, parámetros aplicados y totalizadores por estado y tipo de tarea. Todos los eventos de generación deben quedar registrados en el historial.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el administrador puede acceder al módulo de reportes, seleccionar los filtros deseados, generar el reporte sin errores, y consultar los resultados con información completa, organizada y actualizada. Cuando se genera el reporte de tareas para el último mes y se consulta el dato de un empleado, entonces el reporte muestra su tiempo real trabajado, la desviación en horas-hombre y su calificación de eficiencia calculada. Cuando un empleado de planta intenta acceder a este módulo y intenta entrar, entonces el sistema deniega el acceso con mensaje de "permiso insuficiente." El sistema debe validar que los datos estén consolidados, impedir la generación si hay inconsistencias, y registrar cada evento en el historial. Si el reporte no arroja resultados debe mostrar mensaje correspondiente. Si se genera correctamente debe incluir todos los campos requeridos y permitir su consulta posterior.

---

# RF-033 — Contabilidad de Producción por Empleado

| Campo | Valor |
|-------|-------|
| **ID** | RF-033 |
| **Nombre** | Contabilidad de Producción por Empleado |
| **Módulo** | Reportes y Análisis |
| **Prioridad** | Alta |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al sistema llevar un registro detallado y consolidado de la producción ejecutada por cada empleado, vinculando las tareas completadas con los productos fabricados, restaurados o ajustados durante su jornada laboral. El sistema acumula datos de producción por empleado, generando métricas clave como pares producidos, eficiencia individual y comparativas por período, calculándose automáticamente a partir de registros de confirmaciones de tareas finalizadas aprobadas. La funcionalidad está diseñada para ofrecer al administrador una visión cuantitativa del rendimiento operativo individual, facilitar el cálculo de métricas internas, y apoyar procesos de evaluación, compensación o planificación de carga de trabajo, reflejando en tiempo real las unidades procesadas por cada empleado clasificadas por tipo de intervención, referencia de producto, fecha y resultado operativo.

**Controles y Restricciones:**

El sistema debe registrar automáticamente cada unidad de calzado fabricada, restaurada o ajustada por un empleado, siempre que esté vinculada a una tarea marcada como "completada." Los datos se calculan automáticamente a partir de registros de confirmaciones de tareas finalizadas aprobadas. Para cada registro debe asociar: número de tarea, nombre del empleado, referencia del producto, combinación de talla y color, tipo de intervención, cantidad procesada, fecha de ejecución y resultado final. Si una tarea no está cerrada o no tiene unidades procesadas registradas no debe contabilizarse. Es control crítico que el sistema no permita manipulación de estos datos de producción. El reporte debe incluir la cantidad de pares defectuosos reportados por ese empleado. Debe impedir duplicidad de registros y si una tarea ya ha sido contabilizada no debe volver a generar el mismo asiento. Debe permitir al administrador consultar la contabilidad por empleado, por fecha, por tipo de intervención o por referencia de producto, aplicando filtros combinados. Cada registro contable debe quedar trazado en el historial incluyendo fecha, hora, tipo de operación, cantidad procesada, empleado responsable y vínculo con la tarea correspondiente.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el sistema registra automáticamente las unidades procesadas por cada empleado al momento de cerrar una tarea, valida que los datos estén completos y consistentes, impide duplicidades, y permite la consulta estructurada por parte del administrador. Cuando un empleado ha finalizado 10 tareas en el mes y se genera el reporte, entonces el sistema muestra la cantidad total de pares producidos por ese empleado, y el tiempo promedio por par calculado correctamente a partir de las horas reales registradas. Si una tarea no tiene unidades registradas o presenta inconsistencias debe impedir su contabilización y mostrar mensaje correspondiente. Si se genera correctamente el registro debe incluir todos los campos requeridos y quedar disponible para consulta y trazabilidad. La funcionalidad debe garantizar precisión operativa, validación estricta, trazabilidad completa y experiencia de gestión clara orientada al análisis del rendimiento individual.

---

# RF-034 — Contabilidad de Pares Fabricados Semanalmente

| Campo | Valor |
|-------|-------|
| **ID** | RF-034 |
| **Nombre** | Contabilidad de Pares Fabricados Semanalmente |
| **Módulo** | Reportes y Analítica |
| **Prioridad** | Media |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al sistema consolidar y registrar semanalmente la cantidad total de pares de calzado fabricados, clasificándolos por referencia, talla, color, estilo, marca y responsable de producción. La funcionalidad está diseñada para ofrecer al administrador una visión periódica del volumen de fabricación, facilitar el análisis de productividad, y apoyar la planificación operativa y el control de cumplimiento por ciclos de trabajo. El sistema debe generar automáticamente el corte semanal, agrupar los datos por semana calendario, mantener trazabilidad completa de cada unidad procesada, y permitir definir el inicio de la semana laboral incluyendo desglose obligatorio por modelo, categoría y estado final asegurando conciliación donde pares producidos igual pares ingresados a inventario más pares en cuarentena más pares pérdida.

**Controles y Restricciones:**

La contabilidad semanal debe activarse automáticamente cada domingo a las 23:59, tomando como referencia todas las tareas de fabricación que hayan sido marcadas como "completadas" durante los siete días anteriores. El sistema debe permitir definir el inicio de la semana laboral y validar que cada tarea esté cerrada correctamente, que las unidades procesadas hayan sido registradas en el inventario, y que no existan inconsistencias entre la cantidad reportada y la cantidad ingresada. Si se detecta alguna discrepancia debe excluir la tarea del corte semanal y mostrar en el historial motivo de exclusión. El reporte debe incluir desglose obligatorio por modelo, categoría y estado final siendo crítico que asegure la conciliación de totales. Cada registro semanal debe incluir: semana calendario, fecha de corte, total de pares fabricados, desglose por referencia, talla, color, estilo, marca, y empleado responsable. Debe impedir la edición manual del consolidado pero permitir su consulta histórica y exportación. Si durante una semana no se registra ninguna tarea de fabricación completada debe generar igualmente el corte con valor cero. El administrador debe poder consultar los cortes semanales aplicando filtros por semana, por referencia o por empleado.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el sistema genera automáticamente el consolidado semanal de pares fabricados, valida que las tareas estén cerradas y que las unidades hayan sido registradas correctamente, excluye aquellas con inconsistencias, y permite la consulta estructurada por parte del administrador. Cuando finaliza la semana y se genera el reporte automático, entonces la suma de los pares ingresados a inventario, los restaurados y los perdidos es igual al total de pares producidos. Cuando la fecha del servidor marca el final de la semana, entonces el reporte se genera automáticamente y se envía por correo al administrador. Si no hay producción registrada en una semana debe generar el corte con valor cero y mostrar mensaje correspondiente. Si se genera correctamente el consolidado debe incluir todos los campos requeridos y quedar disponible para consulta y trazabilidad. La funcionalidad debe garantizar precisión operativa, validación estricta, trazabilidad completa y experiencia de gestión clara orientada al análisis periódico de la producción.

---

# RF-035 — Contabilidad de Pares Totales Pedidos por Cliente Mensualmente

| Campo | Valor |
|-------|-------|
| **ID** | RF-035 |
| **Nombre** | Contabilidad de Pares Totales Pedidos por Cliente Mensualmente |
| **Módulo** | Reportes y Analítica |
| **Prioridad** | Media |
| **Estado** | Implementado |

**Descripción:**

Este requerimiento permite al sistema consolidar mensualmente la cantidad total de pares de calzado solicitados por cada cliente mayorista, agrupando los datos por referencia, talla, color, estilo, marca y estado del pedido. La funcionalidad está diseñada para ofrecer al administrador y gerente comercial una visión comercial clara del comportamiento de compra por cliente, facilitar el análisis de demanda, y apoyar la planificación de producción, inventario y estrategias de fidelización. El sistema debe generar automáticamente el corte mensual, organizar los datos por cliente y mantener trazabilidad completa de cada pedido procesado, calculando y mostrando el porcentaje de cumplimiento de entrega y el porcentaje de entrega a tiempo, con acceso restringido al administrador y gerente comercial.

**Controles y Restricciones:**

La contabilidad mensual debe activarse automáticamente el último día de cada mes a las 23:59, tomando como referencia todos los pedidos registrados por clientes mayoristas durante ese período, sin importar su estado pero excluyendo los pedidos cancelados o en estado "borrador." Los datos deben provenir únicamente de pedidos de cliente registrados y confirmados. El sistema debe validar que cada pedido esté correctamente registrado, que las combinaciones de producto estén definidas, y que las cantidades solicitadas sean numéricamente válidas. Si se detecta alguna inconsistencia en los datos del pedido como combinaciones incompletas o cantidades nulas debe excluirlo del consolidado y registrar en el historial motivo de exclusión. El reporte debe calcular y mostrar el porcentaje de cumplimiento de entrega como pares entregados dividido pares solicitados y el porcentaje de entrega a tiempo. Cada registro mensual debe incluir: mes calendario, fecha de corte, nombre del cliente, total de pares solicitados, desglose por referencia, talla, color, estilo, marca, y estado del pedido. Debe impedir la edición manual del consolidado pero permitir su consulta histórica y exportación. Si durante un mes un cliente no registra ningún pedido debe generar igualmente el corte con valor cero. El administrador debe poder consultar los cortes mensuales aplicando filtros por cliente, por mes, por estado del pedido o por referencia.

**Criterios de Aceptación:**

El requerimiento se considera correctamente implementado cuando el sistema genera automáticamente el consolidado mensual de pares solicitados por cliente, valida que los pedidos estén correctamente registrados, excluye aquellos con inconsistencias, y permite la consulta estructurada por parte del administrador. Cuando finaliza el mes y se genera el reporte, entonces el sistema muestra el total de pares solicitados por cada cliente, el total entregado y la métrica de porcentaje de cumplimiento. Cuando se aplica un filtro por el cliente específico y el modelo específico y se genera el reporte, entonces el resultado incluye solo la información de ese cliente y ese modelo. Si un cliente no registra pedidos en el mes debe generar el corte con valor cero y mostrar mensaje correspondiente. Si se genera correctamente el consolidado debe incluir todos los campos requeridos y quedar disponible para consulta y trazabilidad. La funcionalidad debe garantizar precisión comercial, validación estricta, trazabilidad completa y experiencia de gestión clara orientada al análisis periódico de la demanda por cliente.
