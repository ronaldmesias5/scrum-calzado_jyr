# HISTORIAS DE USUARIO
## Sistema de Gestión y Producción de Calzado

---

## HU-001: CREACIÓN DE CUENTAS DE ACCESO
**Prioridad:** Alta

Como cliente potencial,
Quiero crear mi cuenta de acceso de forma autónoma,
Para acceder al sistema y realizar pedidos de calzado.

**Criterios de Aceptación:**
- Puedo acceder al formulario de registro desde la página principal sin autenticarme
- El formulario solicita: nombres, apellidos, correo, teléfono, tipo y número de documento, nombre comercial (opcional), contraseña y aceptación de términos
- El sistema valida que el correo no esté registrado ("El email ya está registrado")
- Mi cuenta queda activa y validada inmediatamente, sin aprobación del jefe
- Recibo un correo de verificación de email (token válido 24 horas, no bloquea el acceso)
- Las cuentas de empleados no se crean por aquí: las crea el jefe con contraseña temporal
- Los eventos de autenticación quedan registrados en el archivo de log de auditoría (audit.log)

---

## HU-002: VALIDACIÓN Y ACTIVACIÓN DE CUENTAS POR JEFE
**Prioridad:** Alta

Como jefe del sistema,
Quiero revisar y activar las cuentas pendientes de validación (casos excepcionales),
Para controlar quién accede al sistema y garantizar la seguridad.

**Criterios de Aceptación:**
- Veo la lista de cuentas pendientes con todos los datos del cliente
- Puedo aprobar o rechazar cada cuenta pendiente
- Si rechazo, debo ingresar un comentario obligatorio
- Al aprobar solo se activan los indicadores de cuenta; no se genera contraseña temporal
- El cliente recibe un correo de cuenta aprobada
- Nota: el auto-registro público (HU-001) no genera cuentas pendientes; este flujo aplica a casos excepcionales
- Todos los eventos quedan registrados en el archivo de log de auditoría (audit.log)

---

## HU-003: INICIO DE SESIÓN
**Prioridad:** Alta

Como usuario registrado,
Quiero acceder al sistema con mis credenciales,
Para ingresar a mi panel y realizar mis actividades.

**Criterios de Aceptación:**
- Puedo iniciar sesión con correo y contraseña
- Si son incorrectos, recibo mensaje de error
- Tras 5 intentos fallidos la cuenta se bloquea 15 minutos (HTTP 429)
- El token de acceso dura 15 minutos y el de refresco 10 minutos (el frontend los renueva en silencio mientras hay actividad)
- Soy redirigido al panel correspondiente a mi rol
- Puedo cerrar sesión en todos los dispositivos desde Ajustes
- Todos los intentos (exitosos y fallidos) quedan registrados en el archivo de log de auditoría (audit.log)

---

## HU-004: RECUPERACIÓN DE CUENTAS
**Prioridad:** Alta

Como usuario registrado,
Quiero recuperar mi acceso si olvido mi contraseña,
Para poder ingresar nuevamente al sistema de forma segura.

**Criterios de Aceptación:**
- Puedo iniciar el proceso de recuperación ingresando mi correo
- La respuesta es genérica (no revela si el correo existe) por seguridad
- Recibo un enlace seguro válido por 60 minutos
- Puedo establecer una nueva contraseña con requisitos: 8+ caracteres, mayúscula, minúscula y número
- Mi contraseña anterior queda invalidada
- Recibo confirmación de restablecimiento exitoso
- Todos los eventos quedan registrados en el archivo de log de auditoría (audit.log)

---

## HU-005: SOLICITUD DE REACTIVACIÓN DE CUENTAS
**Prioridad:** Alta

Como usuario con cuenta suspendida,
Quiero solicitar la reactivación de mi cuenta,
Para volver a acceder al sistema.

**Criterios de Aceptación:**
- Solo puedo acceder al formulario si mi cuenta está desactivada (is_active en falso)
- El formulario solicita: correo, teléfono y documento (el motivo va fijo como "Solicitud de reactivación de cuenta")
- El sistema genera un ticket interno de reactivación para el jefe
- El jefe puede aprobar o rechazar con comentario
- Si se aprueba, mi cuenta cambia a "activa" y recibo notificación
- Si se rechaza, recibo el motivo de la decisión
- Todos los eventos quedan registrados en el archivo de log de auditoría (audit.log)

---

## HU-006: CREACIÓN DE CATÁLOGO
**Prioridad:** Alta

Como jefe o diseñador de producto,
Quiero registrar productos en el catálogo,
Para ofertar calzado a clientes y empleados.

**Criterios de Aceptación:**
- Puedo acceder al módulo de creación de catálogo (solo admin/jefe)
- El formulario solicita: nombre, descripción, color, marca, estilo y categoría (sin campo de referencia/SKU)
- La imagen admite JPG, PNG, WEBP, GIF, AVIF, BMP, HEIC y TIFF hasta 5MB
- Si ya existe un producto con el mismo nombre dentro de la misma marca, estilo, categoría y color, se bloquea con error 409
- Si todo es correcto, se registra el producto
- La eliminación es lógica (soft-delete) sin validar historial de pedidos; para ocultar se usa el interruptor de estado
- Los productos con estado "inactivo" quedan ocultos
- Todos los eventos quedan registrados en el archivo de log de auditoría (audit.log)

---

## HU-007: CLASIFICACIÓN POR CATEGORÍAS
**Prioridad:** Alta
**Estado:** No implementado

Como jefe,
Quiero organizar los productos en categorías,
Para facilitar la navegación y búsqueda de clientes.

**Criterios de Aceptación (pendientes de implementar):**
- Puedo crear nuevas categorías con nombres únicos
- Puedo editar categorías existentes
- No puedo eliminar categorías vinculadas a productos activos
- Si intento eliminar una categoría con productos, veo una ventana emergente listando los dependientes
- Si una categoría está inactiva, sus productos no aparecen en el catálogo público
- Los filtros por categoría responden en menos de 2 segundos

**Nota:** hoy solo existe el listado público de categorías (GET /categories); no hay CRUD de administración.

---

## HU-008: GESTIÓN DE MARCAS Y ESTILOS
**Prioridad:** Alta

Como jefe,
Quiero registrar marcas y estilos de calzado,
Para organizarlos de forma jerárquica en el catálogo.

**Criterios de Aceptación:**
- Puedo crear marcas con nombre único y obligatorio
- Dentro de cada marca puedo crear estilos con nombre único
- No puedo eliminar marcas con estilos vinculados ni estilos con productos vinculados (error 409 con mensaje claro)
- Puedo editar atributos de marcas y estilos existentes
- Nota: el listado público filtra por eliminación lógica; el ocultamiento por estado "inactivo" no está verificado
- Todos los cambios quedan registrados en el archivo de log de auditoría (audit.log)

---

## HU-009: VISUALIZACIÓN DE CATÁLOGO COMO VISITANTE
**Prioridad:** Alta

Como visitante sin registrar,
Quiero ver el catálogo público de productos,
Para conocer la oferta de calzado sin necesidad de login.

**Criterios de Aceptación:**
- Puedo acceder al catálogo desde la página principal sin autenticarme
- Veo solo productos con estado "activo"
- Cada producto muestra: imagen, nombre, marca, estilo, color y disponibilidad agregada (el API expone disponibilidad e inventario por talla)
- No veo precios ni costos
- Puedo aplicar filtros básicos por categoría, marca, estilo, talla y color, con búsqueda por texto y botón para limpiar filtros
- Si no hay productos o no hay coincidencias, veo un mensaje de lista vacía
- Las funciones restringidas (pedir, carrito) requieren iniciar sesión

---

## HU-010: CONSULTA DE CATÁLOGO POR CLIENTE MAYORISTA
**Prioridad:** Alta

Como cliente mayorista autenticado,
Quiero consultar el catálogo completo de productos,
Para preparar mis pedidos basándome en la oferta disponible.

**Criterios de Aceptación:**
- Solo accedo tras iniciar sesión exitosamente
- Veo todos los productos activos con su información (imagen, marca, estilo, tallas, colores y precios al por mayor), sin ver el stock de bodega
- Puedo armar mi pedido en el carrito seleccionando modelos, tallas y cantidades
- Si intento acceder sin autenticación, me redirigen a login
- Nota: no existe función de favoritos ni estado "borrador" de pedido

---

## HU-011: SISTEMA DE FILTRADO DE BÚSQUEDA
**Prioridad:** Alta

Como usuario de cualquier rol,
Quiero filtrar productos por múltiples atributos,
Para encontrar rápidamente lo que busco en el catálogo.

**Criterios de Aceptación:**
- Puedo aplicar filtros compuestos simultáneamente (categoría, marca, estilo, talla, color)
- Los resultados se actualizan sin recargar la página
- Puedo buscar por texto libre con coincidencias parciales
- Hay un botón para limpiar todos los filtros y restaurar la vista general
- Si no hay coincidencias veo un mensaje de lista vacía
- Nota: sin garantía de tiempo de respuesta con grandes volúmenes ni registro de eventos de filtrado

---

## HU-012: REALIZACIÓN DE PEDIDOS POR CLIENTE MAYORISTA
**Prioridad:** Alta

Como cliente mayorista,
Quiero registrar un pedido seleccionando productos,
Para solicitar fabricación o entrega inmediata de calzado.

**Criterios de Aceptación:**
- Puedo seleccionar uno o más productos del catálogo
- Para cada producto defino talla, color y cantidad (mayor a cero)
- Mi pedido se crea en estado "pendiente" con identificador único (UUID) y total de pares recalculado en el servidor
- Recibo notificación de registro exitoso
- Nota: no hay cantidad mínima configurable, ni clasificación "aprobado para entrega / pendiente de fabricación", ni número de pedido legible

---

## HU-013: NOTIFICACIÓN DE NUEVOS PEDIDOS
**Prioridad:** Alta

Como jefe, gerente comercial o planificador de producción,
Quiero recibir notificaciones automáticas cuando se registran pedidos,
Para actuar rápidamente en la gestión de entrega o producción.

**Criterios de Aceptación:**
- Recibo una notificación en el panel tras un nuevo pedido (registro en BD + WebSocket + correo, sin garantía de latencia)
- La notificación incluye: cliente, total de pares y datos del pedido
- El enlace de la notificación me lleva al listado de pedidos
- Recibo un correo de aviso del nuevo pedido
- Nota: sin deduplicación de notificaciones ni indicación de entrega-directa vs producción

---

## HU-014: CONSULTA DE ESTADO DE PEDIDOS POR CLIENTE
**Prioridad:** Alta

Como cliente mayorista,
Quiero consultar el estado de mis pedidos,
Para hacer seguimiento y conocer el progreso de mis solicitudes.

**Criterios de Aceptación:**
- Solo puedo ver mis propios pedidos tras iniciar sesión (lista paginada + detalle)
- Veo número, fecha, estado, productos, tallas, colores y cantidades
- Si intento acceder a pedidos de otro cliente, recibo error 404
- Nota: sin filtros por estado/fecha en el servidor, sin porcentaje de avance ni alertas de retraso

---

## HU-015: ACTUALIZACIÓN DE ESTADO DE PEDIDOS
**Prioridad:** Alta

Como jefe,
Quiero modificar el estado de los pedidos con transiciones válidas,
Para mantener informados a los clientes sobre el progreso y coordinar la logística de entrega.

**Criterios de Aceptación:**
- Puedo cambiar el estado de un pedido entre los valores válidos: pendiente → en_progreso → completado → entregado (más cancelado)
- Al completar un pedido con cliente se suma a pares fabricados (reserved); al entregar se descuenta de fabricados
- Los pedidos para stock (sin cliente) terminan en completado y suman al stock de bodega
- Puedo completar líneas consumiendo inventario de bodega ("Completar desde bodega", solo pedidos con cliente)
- Nota: sin matriz de transiciones (cualquier salto permitido), sin motivo obligatorio, sin orden de producción automática y sin notificación al cliente

---

## HU-016: GESTIÓN DE INVENTARIO DE CALZADO FABRICADO
**Prioridad:** Alta

Como jefe,
Quiero registrar, consultar, actualizar y controlar el inventario de calzado fabricado,
Para garantizar disponibilidad precisa de stock por modelo, talla y color, y validar pedidos entrantes.

**Criterios de Aceptación:**
- Puedo registrar entradas de inventario con producto, talla, color y cantidad (individual y bulk por tallas)
- Puedo registrar movimientos de entrada/salida con motivo; las salidas se bloquean sin stock ("Stock insuficiente")
- Las cantidades registradas no admiten valores negativos
- Puedo ajustar pares fabricados por producto y ver el inventario por talla
- Todos los movimientos quedan trazados con usuario, fecha, tipo y cantidad
- Nota: sin alerta automática al caer bajo el umbral mínimo y con filtros limitados a producto

---

## HU-017: ACTUALIZACIÓN AUTOMÁTICA DEL INGRESO DE PRODUCTOS AL INVENTARIO
**Prioridad:** Alta

Como jefe,
Quiero que el sistema actualice automáticamente el inventario cuando se completa la etapa de emplantillado,
Para mantener la integridad del inventario sin intervención manual.

**Criterios de Aceptación:**
- La actualización automática se activa al completar la tarea de emplantillado del vale
- Si el pedido es para stock (sin cliente), los pares suman al stock de bodega (amount)
- Si el pedido tiene cliente, los pares suman a pares fabricados (reserved)
- Se registra un movimiento de inventario tipo "entrada" con trazabilidad a la orden
- Nota: sin aprobación de control de calidad como requisito, sin tolerancia del 2% y sin bloqueo de ingreso duplicado

---

## HU-018: REGISTRO DE VENTAS Y DESCUENTO EN INVENTARIO
**Prioridad:** Alta
**Estado:** Pendiente de implementar (se implementará al terminar el ajuste documental)

Como jefe,
Quiero registrar ventas manualmente con descuento automático del inventario,
Para reflejar ventas externas no gestionadas a través del módulo de pedidos.

**Criterios de Aceptación:**
- Puedo registrar una venta indicando cliente, referencia, cantidad, producto, talla y color
- El sistema valida en tiempo real la disponibilidad de stock antes de confirmar la venta
- Si el stock es insuficiente, la venta se bloquea con mensaje indicando el faltante
- Al confirmar la venta, el inventario se descuenta automáticamente
- Se genera un registro de auditoría inmutable con todos los datos de la venta
- No se puede modificar ni eliminar un registro de venta una vez confirmado

---

## HU-019: REGISTRO DE PÉRDIDAS POR CALZADO DEFECTUOSO
**Prioridad:** Alta

Como jefe,
Quiero registrar pérdidas de inventario por calzado defectuoso,
Para mantener un stock exacto y mover las unidades defectuosas a un inventario de scrap separado.

**Criterios de Aceptación:**
- Puedo registrar una pérdida seleccionando un código de defecto de una lista predefinida
- El registro directo descuenta de inmediato: valida que la combinación producto-talla-color existe y que la cantidad no excede el stock disponible
- La aprobación previa de calidad solo aplica al flujo empleado/cliente → incidencia pendiente → aprobación del jefe (no al registro directo del jefe)
- Al confirmar, las unidades se descuentan del inventario principal y se registran en el inventario de scrap
- Se registra el código de defecto, la cantidad, la fecha y el responsable
- El movimiento queda trazado en el historial de movimientos de inventario
- **Estado:** Parcial (sin aprobación previa en registro directo, sin anti-duplicados)

---

## HU-020: PROCESO DE RESTAURACIÓN DE CALZADO DEFECTUOSO
**Prioridad:** Alta

Como jefe,
Quiero gestionar la restauración de calzado defectuoso previamente descartado,
Para recuperar unidades reparables y reincorporarlas al inventario.

**Criterios de Aceptación:**
- Puedo seleccionar unidades del inventario de scrap para iniciar un proceso de restauración
- El proceso sigue las etapas reales: en_reparación/devuelto → reparado (o rechazado)
- La aprobación la realiza el jefe o admin (sin rol exclusivo de jefe de calidad)
- Al completar la restauración, las unidades se reincorporan al inventario principal y se da de baja el scrap
- Todas las transiciones de etapa quedan registradas con usuario, fecha y observaciones
- **Estado:** Parcial (sin etapas reportado/revisión/restaurado, sin costo de reparación, sin cuarentena)

---

## HU-021: CREACIÓN DE TAREAS
**Prioridad:** Alta

Como jefe,
Quiero crear tareas operativas vinculadas a órdenes de producción,
Para organizar el trabajo interno, distribuir responsabilidades y documentar todas las actividades.

**Criterios de Aceptación:**
- Puedo crear tareas en lote por orden (etapas corte/guarnición/soladura/emplantillado) con descripción, prioridad, fecha límite y cantidad de pares
- No se permite crear tareas duplicadas para la misma orden, producto, grupo de línea y tipo (salvo canceladas)
- Al completar una etapa, el sistema auto-crea la siguiente etapa como pendiente con el mismo vale
- Sin campo de tiempo estándar en la tarea (no se valida contra ficha del modelo)
- La notificación al empleado se genera al asignar la tarea, no al crearla
- Recibo confirmación visual de creación exitosa
- **Estado:** Parcial (sin tiempo estándar, sin notificación al crear, sin registro de auditoría)
- Todos los eventos de creación quedan registrados en auditoría

---

## HU-022: ASIGNACIÓN DE TAREAS A EMPLEADOS
**Prioridad:** Alta

Como jefe,
Quiero asignar tareas registradas a empleados activos,
Para distribuir el trabajo eficientemente y establecer responsabilidades operativas claras.

**Criterios de Aceptación:**
- Puedo seleccionar tareas pendientes y asignarlas a empleados existentes
- Solo el jefe puede asignar (403 en otro caso)
- Al asignar, la tarea pendiente pasa automáticamente a en_progreso
- Al asignar, se genera una notificación en la aplicación al empleado (sin correo electrónico)
- La fecha límite de la tarea viene de la fecha de entrega de la orden (no se define por asignación)
- No hay validación de capacidad de carga del empleado antes de asignar
- El sistema permite reasignar incluso tareas completadas (sin bloqueo)
- **Estado:** Parcial (sin correo al asignar, sin control de capacidad, sin bloqueo de reasignación en completadas)

---

## HU-023: CONSULTA DE TAREAS ASIGNADAS POR EL EMPLEADO
**Prioridad:** Alta

Como empleado,
Quiero consultar todas mis tareas asignadas con detalles, estado y fechas límite,
Para organizar mi trabajo diario y hacer seguimiento de tareas pendientes, en progreso y completadas.

**Criterios de Aceptación:**
- Solo puedo ver mis propias tareas después de iniciar sesión (el backend filtra por mi usuario)
- Puedo filtrar mis tareas por estado y tipo (la prioridad y fecha límite se filtran en el frontend)
- Cada tarea entrega su fecha límite (deadline); el indicador de tiempo restante lo calcula el frontend
- Las tareas completadas permanecen visibles en mi historial
- No puedo ver tareas asignadas a otros empleados (aislamiento por consulta, sin mensaje de "acceso no autorizado" en el listado)
- **Estado:** Implementado (con matices: sin mensaje de acceso no autorizado en listado, sin registro de consultas)

---

## HU-024: REPORTE DE AVANCES E INCIDENCIAS EN TAREAS
**Prioridad:** Alta

Como empleado,
Quiero registrar avances, observaciones técnicas e incidencias críticas durante la ejecución de tareas,
Para mantener al jefe informado del progreso real, documentar obstáculos y permitir decisiones correctivas oportunas.

**Criterios de Aceptación:**
- Puedo registrar observaciones técnicas y cambiar el estado de mi tarea (pendiente/en_progreso/completado)
- Puedo reportar incidencias de producto sobre mis tareas con foto de evidencia (quedan pendientes de fallo del jefe)
- Puedo reportar incidencias generales de maquinaria o insumo con observaciones
- Sin registro de entrada/salida con marca de tiempo del servidor (solo fechas de asignación y completado)
- Sin bloqueo de tareas simultáneas, sin pausas justificadas, sin confirmación al 100% ni cálculo de eficiencia
- Las incidencias críticas no generan ticket automático ni notificación en menos de 60 segundos
- **Estado:** No implementado según lo descrito (solo existen observación + cambio de estado simple + incidencias pendientes)

---

## HU-025: CONFIRMACIÓN DE FINALIZACIÓN DE TAREAS
**Prioridad:** Media

Como empleado,
Quiero confirmar la finalización de tareas registrando la cantidad exacta procesada, con evidencia fotográfica opcional,
Para cerrar formalmente el ciclo operativo, actualizar el estado de la tarea y notificar al supervisor para revisión.

**Criterios de Aceptación:**
- Solo el empleado asignado a la tarea (o el jefe) puede cambiar su estado a completado
- El cierre no solicita cantidad procesada, no aplica tolerancia del 1% ni clave de supervisor
- Sin evidencia fotográfica en el cierre (la foto solo existe en incidencias) y sin alerta de inspección de calidad en la última tarea
- La tarea completada puede revertirse a en_progreso (no es inmutable)
- Al completar, se registra la fecha de completado y se notifica a los jefes (solo vía admin; la vía empleado no notifica)
- **Estado:** No implementado según lo descrito (el cierre real es un simple cambio de estado)

---

## HU-026: NOTIFICACIÓN AL JEFE DE TAREAS FINALIZADAS
**Prioridad:** Alta

Como jefe,
Quiero recibir notificación automática cuando un empleado marca una tarea como completada,
Para recibir en tiempo real el reporte de cierre con resumen de desempeño, y aprobar o rechazar con retroalimentación.

**Criterios de Aceptación:**
- La notificación incluye tipo de tarea, producto, número de vale y empleado que completó
- La notificación solo se genera en la vía admin; completar por la vía empleado no notifica a los jefes
- La notificación es informativa: sin aprobar/rechazar desde ella, sin reapertura ni registro de retrabajo
- Sin resumen de eficiencia ni garantía de no-duplicados
- **Estado:** Parcial (notificación simple solo en vía admin)
- Recibo la notificación en el panel en menos de 5 segundos tras la confirmación del empleado
- Todas las aprobaciones y rechazos quedan registrados en auditoría

---

## HU-027: MODIFICACIÓN Y ELIMINACIÓN DE TAREAS
**Prioridad:** Alta
**Estado:** No implementado según lo descrito

Como jefe,
Quiero editar o eliminar tareas previamente registradas que no estén completadas ni canceladas,
Para corregir errores de planificación, reasignar responsabilidades y ajustar fechas límite.

**Criterios de Aceptación:**
- Solo existen PATCH de asignación, estado y prioridad; no existen PUT ni DELETE de tareas
- Puedo reasignar y cambiar prioridad/estado, incluso en tareas completadas (el completado es reversible a en_progreso)
- No hay cancelación con motivo obligatorio ni bloqueo por tiempo registrado mayor a cero
- No hay registro de auditoría con valores anteriores/nuevos
- Recibo confirmación visual de cada modificación exitosa

---

## HU-028: REGISTRO DE INCIDENCIAS DE MAQUINARIA E INSUMOS
**Prioridad:** Alta
**Estado:** Parcial (registro simple; sin vínculo a tarea, bloqueo, tickets ni anti-duplicados)

Como empleado,
Quiero registrar incidencias relacionadas con fallas de maquinaria o escasez de insumos,
Para disponer de un canal rápido para reportar fallas y generar tickets de mantenimiento o compras.

**Criterios de Aceptación:**
- Puedo registrar una incidencia general (maquinaria/insumo) en JSON simple, sin foto ni vínculo a tarea
- La evidencia fotográfica solo existe en incidencias de producto
- La incidencia no se vincula automáticamente a mi tarea activa ni la bloquea
- No se generan tickets urgentes al área de compras ni se previenen duplicados en 30 minutos
- Todas las incidencias quedan registradas con trazabilidad en movimientos

---

## HU-029: MÓDULO DE NOTIFICACIONES
**Prioridad:** Alta
**Estado:** Parcial (centro funcional sin prioridad, filtros, archivo ni anti-duplicados)

Como usuario del sistema,
Quiero disponer de un centro de notificaciones consolidado que reúna alertas de pedidos, tareas, incidencias e inventario,
Para recibir información oportuna y relevante según mi rol.

**Criterios de Aceptación:**
- Las notificaciones se generan automáticamente a partir de eventos del sistema (BD + WebSocket con JWT)
- Cada notificación incluye título, descripción, tipo, fecha y enlace directo; sin campo de prioridad
- Las notificaciones permanecen visibles hasta que las marco como leídas (leer individual o todas)
- Eliminar una notificación hace borrado lógico; no existe estado "archivada" ni filtros por tipo/prioridad
- Sin anti-duplicados para el mismo evento ni panel global admin con filtros
- Solo veo notificaciones relevantes a mi rol

---

## HU-030: ALERTAS AL JEFE SOBRE PEDIDOS, TAREAS E INVENTARIO
**Prioridad:** Alta
**Estado:** Parcial (lista básica de incidencias abiertas; sin umbrales, correo, acuse ni tiempos)

Como jefe,
Quiero recibir alertas críticas automáticas sobre eventos de pedidos, tareas e inventario que requieran intervención,
Para tener información inmediata sobre bloqueos, agotamiento de stock, incidentes técnicos y validaciones pendientes.

**Criterios de Aceptación:**
- El panel muestra una lista básica de incidencias abiertas con tipo "error" fijo
- Sin umbrales configurables por tipo de alerta ni enlace directo a la entidad afectada
- Sin correo urgente, banner con acuse obligatorio ni confirmación de lectura para seguir navegando
- Sin registro de tiempo de respuesta a alertas

---

## HU-031: REPORTES DE PEDIDOS E INVENTARIO
**Prioridad:** Media
**Estado:** Parcial (filtros de fecha/estado/categoría y PDF con jsPDF; Excel solo en inventario, sin programados ni métricas de valor/rotación)

Como jefe,
Quiero generar reportes consolidados sobre el estado de pedidos y el inventario,
Para tener una visión operativa clara para la toma de decisiones y planificación de producción.

**Criterios de Aceptación:**
- Puedo filtrar los reportes por fecha, estado y categoría
- Puedo exportar los reportes a PDF (jsPDF); Excel solo existe en la página de inventario, no en el módulo de reportes
- Los datos reflejan el estado en tiempo real al momento de la generación
- Sin generación garantizada en menos de 60 segundos, sin métricas de valor del stock / rotación / cumplimiento, y sin programación de reportes periódicos (no hay scheduler)

---

## HU-032: REPORTES SOBRE TAREAS ASIGNADAS A EMPLEADOS
**Prioridad:** Media
**Estado:** Parcial (filtros empleado/estado/tipo/fecha y métricas pares/tareas/earnings; sin eficiencia, calificación, retrabajo ni Excel)

Como jefe,
Quiero generar reportes consolidados sobre el desempeño de empleados en tareas,
Para analizar el rendimiento individual y colectivo, apoyando decisiones de recursos humanos.

**Criterios de Aceptación:**
- Puedo filtrar los reportes por empleado, estado, tipo de tarea y rango de fechas
- El reporte incluye pares producidos, tareas completadas, earnings y desglose por tipo; sin eficiencia, calificación individual, retrabajo ni desviación vs tiempo estándar
- Exportación a PDF; sin Excel en este módulo
- Los empleados no tienen acceso a estos reportes (bloqueo por rol admin/jefe)
- Los datos del reporte son de solo lectura y no pueden ser manipulados

---

## HU-033: CONTABILIDAD DE PRODUCCIÓN POR EMPLEADO
**Prioridad:** Alta
**Estado:** Parcial (consulta bajo demanda desde tareas completadas/pagadas; sin defectuosos separados, sin ledger inmutable, sin talla/color)

Como jefe,
Quiero que el sistema registre automáticamente las unidades procesadas por cada empleado vinculadas a tareas completadas,
Para tener una visión cuantitativa del desempeño individual para evaluación y planificación.

**Criterios de Aceptación:**
- La consulta se calcula bajo demanda desde tareas completadas/pagadas (pares, earnings, desglose por tipo), con filtros de fecha y categoría
- Sin conteo de defectuosas separadas, sin desglose obligatorio talla/color, y sin tabla contable inmutable (derivado de tareas, no de asientos)
- Sin garantía anti-duplicados a nivel de asiento (idempotente por consulta, no por registro)
- Puedo consultar la contabilidad por empleado filtrando por rango de fechas

---

## HU-034: CONTABILIDAD DE PARES FABRICADOS SEMANALMENTE
**Prioridad:** Media
**Estado:** No implementado según lo descrito (solo agregación semanal bajo demanda; sin corte automático, sin conciliación, sin cuarentena)

Como jefe,
Quiero que el sistema consolide automáticamente los totales semanales de pares fabricados por referencia, talla, color, estilo y marca,
Para disponer de análisis periódico de producción y planificación de capacidad.

**Criterios de Aceptación:**
- Solo existe agregación semanal bajo demanda (agrupación por semana ISO, sin persistir corte)
- Sin activación automática los domingos 23:59 (no hay scheduler), sin validación de tareas cerradas, sin exclusión de inconsistencias
- Sin conciliación producido = inventario + cuarentena + pérdida (no existe estado cuarentena)
- Sin exportación del corte a PDF/Excel ni correo, y sin reporte de valor cero garantizado

---

## HU-035: CONTABILIDAD DE PARES TOTALES PEDIDOS POR CLIENTE MENSUALMENTE
**Prioridad:** Media
**Estado:** No implementado según lo descrito (solo reporte por cliente bajo demanda; sin corte automático, sin métricas de cumplimiento/puntualidad)

Como jefe,
Quiero que el sistema consolide automáticamente los totales mensuales de pares pedidos por cliente,
Para analizar el comportamiento comercial, planificar la demanda y diseñar estrategias de fidelización.

**Criterios de Aceptación:**
- Solo existe reporte por cliente bajo demanda con filtros (sin consolidación automática el último día del mes 23:59, no hay scheduler)
- Sin exclusión automática de cancelados/borrador (filtro de estado opcional), sin porcentaje de cumplimiento ni de entregas a tiempo
- Puedo filtrar el reporte por cliente, mes, estado y referencia
- Exportación a PDF; sin Excel en este módulo
- El reporte está disponible para consulta histórica sin límite de antigüedad
