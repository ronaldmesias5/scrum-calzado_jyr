# HISTORIAS DE USUARIO
## Sistema de Gestión y Producción de Calzado

---

## HU-001: CREACIÓN DE CUENTAS DE ACCESO
**Prioridad:** Alta

Como cliente potencial,
Quiero crear una solicitud de cuenta de acceso de forma autónoma,
Para acceder al sistema y realizar pedidos de calzado.

**Criterios de Aceptación:**
- Puedo acceder al formulario de registro desde la página principal sin autenticarme
- El formulario solicita: nombre completo, correo, documento, teléfono, razón social y NIT
- El sistema valida que el correo, documento y NIT sean únicos en tiempo real
- Si algún dato está duplicado, se bloquea el registro con mensaje de error
- Puedo ver un acuse de recibo visual y recibir confirmación por correo
- Mi solicitud queda con estado "pendiente de validación"
- El jefe recibe una notificación en menos de 30 segundos
- Se registra toda la actividad en el historial de auditoría

---

## HU-002: VALIDACIÓN Y ACTIVACIÓN DE CUENTAS POR JEFE
**Prioridad:** Alta

Como jefe del sistema,
Quiero revisar y activar las solicitudes de cuentas pendientes,
Para controlar quién accede al sistema y garantizar la seguridad.

**Criterios de Aceptación:**
- Veo una lista de solicitudes pendientes con todos los datos del cliente
- Puedo aprobar o rechazar cada solicitud
- Si rechazo, debo ingresar un comentario obligatorio
- Al aprobar, se genera una contraseña temporal segura (10+ caracteres con mayúscula, minúscula, número y símbolo)
- El cliente recibe un correo con sus credenciales y un enlace válido por 24 horas
- La cuenta cambia a estado "activa"
- Todos los eventos quedan registrados en auditoría

---

## HU-003: INICIO DE SESIÓN
**Prioridad:** Alta

Como usuario registrado,
Quiero acceder al sistema con mis credenciales,
Para ingresar a mi panel y realizar mis actividades.

**Criterios de Aceptación:**
- Puedo iniciar sesión con correo y contraseña
- Si son incorrectos, recibo mensaje específico de error
- Tras 3 intentos fallidos la cuenta se bloquea 30 minutos
- Mi sesión caduca tras 20 minutos de inactividad
- Soy redirigido al panel correspondiente a mi rol
- Todos los intentos (exitosos y fallidos) quedan registrados en auditoría

---

## HU-004: RECUPERACIÓN DE CUENTAS
**Prioridad:** Alta

Como usuario registrado,
Quiero recuperar mi acceso si olvido mi contraseña,
Para poder ingresar nuevamente al sistema de forma segura.

**Criterios de Aceptación:**
- Puedo iniciar el proceso de recuperación ingresando mi correo
- Recibo un enlace seguro válido por 60 minutos
- Puedo establecer una nueva contraseña con requisitos: 10+ caracteres, mayúscula, minúscula, número y símbolo
- Mi contraseña anterior queda invalidada
- Recibo confirmación: "Su contraseña ha sido actualizada exitosamente"
- Todos los eventos quedan registrados en auditoría

---

## HU-005: SOLICITUD DE REACTIVACIÓN DE CUENTAS
**Prioridad:** Alta

Como usuario con cuenta suspendida,
Quiero solicitar la reactivación de mi cuenta,
Para volver a acceder al sistema.

**Criterios de Aceptación:**
- Solo puedo acceder al formulario si mi cuenta está suspendida o inactiva
- El formulario solicita: correo, motivo detallado, documento, teléfono y evidencia opcional
- El sistema genera un ticket con ID único para el jefe
- El jefe puede aprobar o rechazar con comentario obligatorio
- Si se aprueba, mi cuenta cambia a "activa" y recibo notificación
- Si se rechaza, recibo el motivo de la decisión
- Todos los eventos quedan registrados en auditoría

---

## HU-006: CREACIÓN DE CATÁLOGO
**Prioridad:** Alta

Como jefe o diseñador de producto,
Quiero registrar productos en el catálogo,
Para ofertar calzado a clientes y empleados.

**Criterios de Aceptación:**
- Puedo acceder al módulo de creación de catálogo
- El formulario solicita: nombre, referencia (única), descripción, imagen, estado, tallas, colores, material, categoría y marca
- La imagen debe ser JPG o PNG y no superar 2MB
- Si la referencia está duplicada, se bloquea el registro
- Si todo es correcto, se registra el producto con mensaje "Producto registrado exitosamente"
- Los productos con estado "inactivo" quedan ocultos
- No puedo eliminar productos con historial de pedidos, solo desactivarlos
- Todos los eventos quedan registrados en auditoría

---

## HU-007: CLASIFICACIÓN POR CATEGORÍAS
**Prioridad:** Alta

Como jefe,
Quiero organizar los productos en categorías,
Para facilitar la navegación y búsqueda de clientes.

**Criterios de Aceptación:**
- Puedo crear nuevas categorías con nombres únicos
- Puedo editar categorías existentes
- No puedo eliminar categorías vinculadas a productos activos
- Si intento eliminar una categoría con productos, veo una ventana emergente listando los dependientes
- Si una categoría está inactiva, sus productos no aparecen en el catálogo público
- Los filtros por categoría responden en menos de 2 segundos
- Todos los cambios quedan registrados en auditoría

---

## HU-008: GESTIÓN DE MARCAS Y ESTILOS
**Prioridad:** Alta

Como jefe,
Quiero registrar marcas y estilos de calzado,
Para organizarlos de forma jerárquica en el catálogo.

**Criterios de Aceptación:**
- Puedo crear marcas con nombre único y obligatorio
- Dentro de cada marca puedo crear estilos con nombre único
- No puedo eliminar marcas o estilos vinculados a productos activos
- Los estilos inactivos no aparecen en catálogo público
- Puedo editar atributos de marcas y estilos existentes
- Si intento eliminar con dependencias, recibo mensaje claro de error
- Todos los cambios quedan registrados en auditoría

---

## HU-009: VISUALIZACIÓN DE CATÁLOGO COMO VISITANTE
**Prioridad:** Alta

Como visitante sin registrar,
Quiero ver el catálogo público de productos,
Para conocer la oferta de calzado sin necesidad de login.

**Criterios de Aceptación:**
- Puedo acceder al catálogo desde la página principal sin autenticarme
- Veo solo productos con estado "activo" y públicos
- Cada producto muestra: imagen, nombre, referencia, tallas, colores, material, marca y estilo
- No veo precios, costos ni información de inventario
- Puedo aplicar filtros básicos por categoría, marca, estilo, talla y color
- El tiempo de carga y filtros es menor a 3 segundos
- Si no hay productos muestro "No hay productos disponibles en este momento"
- Si intento acceder a funciones restringidas, me redirigen al registro

---

## HU-010: CONSULTA DE CATÁLOGO POR CLIENTE MAYORISTA
**Prioridad:** Alta

Como cliente mayorista autenticado,
Quiero consultar el catálogo completo de productos,
Para preparar mis pedidos basándome en la oferta disponible.

**Criterios de Aceptación:**
- Solo accedo tras iniciar sesión exitosamente
- Veo todos los productos activos con información detallada
- Si una combinación está agotada, aparece deshabilitada
- Puedo guardar productos como favoritos y persistir al cerrar sesión
- Puedo iniciar un proceso de pedido seleccionando modelos
- Las combinaciones disponibles se transfieren automáticamente al formulario de pedido
- Si intento acceder sin autenticación, me redirigen a login
- Todos los eventos de visualización quedan registrados

---

## HU-011: SISTEMA DE FILTRADO DE BÚSQUEDA
**Prioridad:** Alta

Como usuario de cualquier rol,
Quiero filtrar productos por múltiples atributos,
Para encontrar rápidamente lo que busco en el catálogo.

**Criterios de Aceptación:**
- Puedo aplicar filtros compuestos simultáneamente (categoría, marca, estilo, talla, color)
- Los resultados se actualizan en tiempo real sin recargar la página
- El tiempo de respuesta es menor a 2 segundos incluso con 5,000+ modelos
- Puedo buscar por texto libre con coincidencias parciales
- Hay un botón para limpiar todos los filtros y restaurar la vista general
- Si no hay coincidencias muestro "No se encontraron productos"
- Si los filtros son incompatibles, se impide la búsqueda
- Todos los eventos se registran para análisis

---

## HU-012: REALIZACIÓN DE PEDIDOS POR CLIENTE MAYORISTA
**Prioridad:** Alta

Como cliente mayorista,
Quiero registrar un pedido seleccionando productos,
Para solicitar fabricación o entrega inmediata de calzado.

**Criterios de Aceptación:**
- Puedo seleccionar uno o más productos del catálogo
- Para cada producto defino talla, color y cantidad
- Si la cantidad es menor a la mínima configurable, se bloquea con mensaje
- El sistema verifica automáticamente disponibilidad en bodega
- Si hay stock, se marca como "aprobado para entrega"
- Si no hay stock, se marca como "pendiente de fabricación"
- Se genera un número de pedido único
- Mi pedido queda en estado "pendiente de revisión administrativa"
- Recibo notificación de registro exitoso

---

## HU-013: NOTIFICACIÓN DE NUEVOS PEDIDOS
**Prioridad:** Alta

Como jefe, gerente comercial o planificador de producción,
Quiero recibir notificaciones automáticas cuando se registran pedidos,
Para actuar rápidamente en la gestión de entrega o producción.

**Criterios de Aceptación:**
- Recibo una notificación en panel en menos de 5 segundos tras un nuevo pedido
- La notificación incluye: ID del pedido, nombre del cliente, fecha/hora, cantidad, combinaciones y estado
- Puedo ver si será atendido por entrega directa o requiere producción
- Recibo un correo de prioridad alta si está habilitado
- El enlace de la notificación me lleva directamente a la ficha del pedido
- Se evita duplicidad de notificaciones
- Todas las notificaciones quedan trazadas en el historial

---

## HU-014: CONSULTA DE ESTADO DE PEDIDOS POR CLIENTE
**Prioridad:** Alta

Como cliente mayorista,
Quiero consultar el estado de mis pedidos,
Para hacer seguimiento y conocer el progreso de mis solicitudes.

**Criterios de Aceptación:**
- Solo puedo ver mis propios pedidos tras iniciar sesión
- Veo número, fecha, estado, productos, tallas, colores, cantidades y ruta
- Puedo aplicar filtros por estado, fecha o referencia
- El porcentaje de avance de producción se actualiza con latencia máxima de 5 minutos
- Se muestran alertas automáticas de retraso si aplica
- Si intento acceder a pedidos de otro cliente, veo "acceso no autorizado" y se registra

---

## HU-015: ACTUALIZACIÓN DE ESTADO DE PEDIDOS
**Prioridad:** Alta

Como jefe,
Quiero modificar el estado de los pedidos con transiciones válidas,
Para mantener informados a los clientes sobre el progreso y coordinar la logística de entrega.

**Criterios de Aceptación:**
- Puedo cambiar el estado de un pedido entre los valores válidos: pendiente → aprobado → en_producción → completado → cancelado → entregado
- Cada cambio de estado registra automáticamente el usuario responsable, la fecha y el motivo
- Al aprobar un pedido se genera automáticamente una orden de producción vinculada
- El sistema bloquea transiciones de estado no válidas con mensaje de error
- Las transiciones inválidas quedan registradas en auditoría como intentos fallidos
- El cliente recibe notificación automática en cada cambio de estado

---

## HU-016: GESTIÓN DE INVENTARIO DE CALZADO FABRICADO
**Prioridad:** Alta

Como jefe,
Quiero registrar, consultar, actualizar y controlar el inventario de calzado fabricado,
Para garantizar disponibilidad precisa de stock por modelo, talla y color, y validar pedidos entrantes.

**Criterios de Aceptación:**
- Puedo registrar entradas de inventario con producto, talla, color, cantidad, fecha y origen
- El sistema bloquea cualquier operación que genere stock negativo
- Recibo una alerta automática cuando el stock de un producto cae por debajo del umbral mínimo configurado
- Puedo consultar el inventario filtrado por producto, talla, color y rango de fechas
- Todos los movimientos de inventario quedan trazados con usuario, fecha, tipo y cantidad
- El tiempo de respuesta de consultas de inventario es menor a 2 segundos

---

## HU-017: ACTUALIZACIÓN AUTOMÁTICA DEL INGRESO DE PRODUCTOS AL INVENTARIO
**Prioridad:** Alta

Como jefe,
Quiero que el sistema actualice automáticamente el inventario cuando una orden de producción se marca como "fabricado",
Para mantener la integridad del inventario sin intervención manual.

**Criterios de Aceptación:**
- La actualización automática solo se activa cuando la orden está marcada como "fabricado" y cuenta con aprobación de control de calidad
- La cantidad ingresada al inventario coincide exactamente con la cantidad registrada en la orden de producción
- El sistema bloquea el ingreso duplicado si la misma orden ya fue procesada
- Si la cantidad producida difiere en más del 2% de la solicitada, se genera una alerta automática
- Se registra un movimiento de inventario tipo "ingreso por producción" con trazabilidad a la orden
- Todos los eventos del proceso automático quedan registrados en auditoría

---

## HU-018: REGISTRO DE VENTAS Y DESCUENTO EN INVENTARIO
**Prioridad:** Alta

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
- La operación requiere aprobación de control de calidad antes de ejecutarse
- El sistema valida que la combinación producto-talla-color existe y que la cantidad no excede el stock disponible
- Al confirmar, las unidades se descuentan del inventario principal y se registran en el inventario de scrap
- Se registra el código de defecto, la cantidad, la fecha y el responsable
- Todos los eventos quedan registrados en auditoría

---

## HU-020: PROCESO DE RESTAURACIÓN DE CALZADO DEFECTUOSO
**Prioridad:** Alta

Como jefe,
Quiero gestionar la restauración de calzado defectuoso previamente descartado,
Para recuperar unidades reparables y reincorporarlas al inventario.

**Criterios de Aceptación:**
- Puedo seleccionar unidades del inventario de scrap para iniciar un proceso de restauración
- El proceso sigue las etapas: reportado → en_reparación → revisión → restaurado
- Solo el jefe de calidad puede aprobar el paso a "restaurado"
- Se registra el costo de reparación asociado al proceso
- Al completar la restauración, las unidades se reincorporan automáticamente al inventario principal
- Todas las transiciones de etapa quedan registradas con usuario, fecha y observaciones

---

## HU-021: CREACIÓN DE TAREAS
**Prioridad:** Alta

Como jefe,
Quiero crear tareas operativas vinculadas a órdenes de producción,
Para organizar el trabajo interno, distribuir responsabilidades y documentar todas las actividades.

**Criterios de Aceptación:**
- Puedo crear una tarea con título, descripción, tipo de tarea, prioridad, fecha límite y orden de producción vinculada
- El sistema valida que el tiempo estándar de la tarea coincida con las especificaciones del modelo
- No se permite crear tareas duplicadas para la misma orden y tipo
- La tarea creada aparece inmediatamente en el panel del empleado asignado
- Recibo confirmación visual de creación exitosa
- Todos los eventos de creación quedan registrados en auditoría

---

## HU-022: ASIGNACIÓN DE TAREAS A EMPLEADOS
**Prioridad:** Alta

Como jefe,
Quiero asignar tareas registradas a empleados activos,
Para distribuir el trabajo eficientemente y establecer responsabilidades operativas claras.

**Criterios de Aceptación:**
- Puedo seleccionar tareas pendientes y asignarlas a empleados activos
- Puedo definir una fecha límite específica para cada asignación
- El sistema valida la capacidad de carga de trabajo del empleado antes de asignar
- Al asignar, se genera una notificación en la aplicación y un correo electrónico al empleado
- No se puede reasignar una tarea que ya está completada
- Todas las asignaciones quedan registradas con usuario, fecha y empleado asignado

---

## HU-023: CONSULTA DE TAREAS ASIGNADAS POR EL EMPLEADO
**Prioridad:** Alta

Como empleado,
Quiero consultar todas mis tareas asignadas con detalles, estado y fechas límite,
Para organizar mi trabajo diario y hacer seguimiento de tareas pendientes, en progreso y completadas.

**Criterios de Aceptación:**
- Solo puedo ver mis propias tareas después de iniciar sesión
- Puedo filtrar mis tareas por estado, prioridad y fecha límite
- Cada tarea muestra un indicador de tiempo restante hasta la fecha límite
- Las tareas completadas permanecen visibles en mi historial
- No puedo ver tareas asignadas a otros empleados
- Si intento acceder a tareas de otro empleado, veo "acceso no autorizado"

---

## HU-024: REPORTE DE AVANCES E INCIDENCIAS EN TAREAS
**Prioridad:** Alta

Como empleado,
Quiero registrar avances, observaciones técnicas e incidencias críticas durante la ejecución de tareas,
Para mantener al jefe informado del progreso real, documentar obstáculos y permitir decisiones correctivas oportunas.

**Criterios de Aceptación:**
- Puedo registrar entrada y salida en cada tarea con marca de tiempo del servidor
- No puedo iniciar dos tareas simultáneamente; debo finalizar o pausar la anterior
- Las incidencias críticas notifican automáticamente a mantenimiento o compras en menos de 60 segundos
- Si una pausa excede el 10% del tiempo estándar, debo justificar el motivo
- Al alcanzar el 100% de avance, el sistema solicita confirmación de finalización
- Todos los registros de avance e incidencias quedan trazados

---

## HU-025: CONFIRMACIÓN DE FINALIZACIÓN DE TAREAS
**Prioridad:** Media

Como empleado,
Quiero confirmar la finalización de tareas registrando la cantidad exacta procesada, con evidencia fotográfica opcional,
Para cerrar formalmente el ciclo operativo, actualizar el estado de la tarea y notificar al supervisor para revisión.

**Criterios de Aceptación:**
- Solo el empleado asignado a la tarea puede confirmar su finalización
- La cantidad procesada debe coincidir con la asignada dentro de una tolerancia del 1%
- Si hay discrepancia mayor al 1%, se requiere una clave de autorización del supervisor
- Puedo adjuntar evidencia fotográfica de la tarea completada
- Si la tarea es la última de la orden de producción, se dispara una alerta de inspección de control de calidad
- La confirmación registra fecha, hora, cantidad y empleado de forma inmutable

---

## HU-026: NOTIFICACIÓN AL JEFE DE TAREAS FINALIZADAS
**Prioridad:** Alta

Como jefe,
Quiero recibir notificación automática cuando un empleado marca una tarea como completada,
Para recibir en tiempo real el reporte de cierre con resumen de desempeño, y aprobar o rechazar con retroalimentación.

**Criterios de Aceptación:**
- La notificación incluye número de tarea, título, prioridad, empleado, fecha, resumen y eficiencia
- Puedo aprobar o rechazar la tarea completada desde la notificación
- Si rechazo, la tarea se reabre automáticamente y se registra el tiempo de retrabajo
- El sistema evita notificaciones duplicadas para la misma finalización
- Recibo la notificación en el panel en menos de 5 segundos tras la confirmación del empleado
- Todas las aprobaciones y rechazos quedan registrados en auditoría

---

## HU-027: MODIFICACIÓN Y ELIMINACIÓN DE TAREAS
**Prioridad:** Alta

Como jefe,
Quiero editar o eliminar tareas previamente registradas que no estén completadas ni canceladas,
Para corregir errores de planificación, reasignar responsabilidades y ajustar fechas límite.

**Criterios de Aceptación:**
- Puedo editar título, descripción, tipo, prioridad, fecha límite y empleado asignado de una tarea
- No puedo eliminar una tarea si tiene tiempo registrado mayor a cero minutos
- En lugar de eliminar una tarea con tiempo registrado, solo puedo cancelarla con un motivo obligatorio
- Todos los cambios generan un registro de auditoría con los valores anteriores y nuevos
- Las tareas completadas o canceladas no pueden modificarse ni eliminarse
- Recibo confirmación visual de cada modificación o cancelación exitosa

---

## HU-028: REGISTRO DE INCIDENCIAS DE MAQUINARIA E INSUMOS
**Prioridad:** Alta

Como empleado,
Quiero registrar incidencias relacionadas con fallas de maquinaria o escasez de insumos,
Para disponer de un canal rápido para reportar fallas y generar tickets de mantenimiento o compras.

**Criterios de Aceptación:**
- Puedo registrar una incidencia indicando tipo, descripción detallada, foto y área afectada
- La incidencia se vincula automáticamente a mi tarea activa
- Si la incidencia representa un impacto total, la tarea se bloquea automáticamente
- Una incidencia tipo "insumo crítico" genera un ticket urgente al área de compras
- El sistema previene duplicados de incidencias en un lapso de 30 minutos para la misma tarea
- Todas las incidencias quedan registradas con trazabilidad completa

---

## HU-029: MÓDULO DE NOTIFICACIONES
**Prioridad:** Alta

Como usuario del sistema,
Quiero disponer de un centro de notificaciones consolidado que reúna alertas de pedidos, tareas, incidencias e inventario,
Para recibir información oportuna y relevante según mi rol.

**Criterios de Aceptación:**
- Las notificaciones se generan automáticamente a partir de eventos del sistema
- Cada notificación incluye título, descripción, tipo, prioridad, fecha y enlace directo
- Las notificaciones permanecen visibles hasta que las marco como leídas
- Puedo filtrar mis notificaciones por tipo y prioridad
- El sistema evita notificaciones duplicadas para el mismo evento
- Solo veo notificaciones relevantes a mi rol

---

## HU-030: ALERTAS AL JEFE SOBRE PEDIDOS, TAREAS E INVENTARIO
**Prioridad:** Alta

Como jefe,
Quiero recibir alertas críticas automáticas sobre eventos de pedidos, tareas e inventario que requieran intervención,
Para tener información inmediata sobre bloqueos, agotamiento de stock, incidentes técnicos y validaciones pendientes.

**Criterios de Aceptación:**
- Las alertas de prioridad alta son visibles de inmediato en el panel principal
- Puedo configurar umbrales personalizados para cada tipo de alerta
- Las alertas tipo "urgente" envían correo electrónico y muestran un banner con acuse obligatorio
- Debo confirmar la lectura de cada alerta urgente antes de continuar navegando
- Las alertas incluyen un enlace directo a la entidad afectada (pedido, tarea o producto)
- El sistema registra el tiempo de respuesta a cada alerta urgente

---

## HU-031: REPORTES DE PEDIDOS E INVENTARIO
**Prioridad:** Media

Como jefe,
Quiero generar reportes consolidados sobre el estado de pedidos y el inventario,
Para tener una visión operativa clara para la toma de decisiones y planificación de producción.

**Criterios de Aceptación:**
- Puedo filtrar los reportes por fecha, estado, referencia y cliente
- Puedo exportar los reportes a formato PDF y Excel
- El tiempo de generación del reporte es menor a 60 segundos para un año de datos
- El reporte incluye métricas clave: valor del stock, tasa de rotación y tasa de cumplimiento
- Los datos del reporte reflejan el estado en tiempo real al momento de la generación
- Puedo programar la generación automática de reportes periódicos

---

## HU-032: REPORTES SOBRE TAREAS ASIGNADAS A EMPLEADOS
**Prioridad:** Media

Como jefe,
Quiero generar reportes consolidados sobre el desempeño de empleados en tareas,
Para analizar el rendimiento individual y colectivo, apoyando decisiones de recursos humanos.

**Criterios de Aceptación:**
- Puedo filtrar los reportes por empleado, estado, tipo de tarea y rango de fechas
- El reporte incluye métricas de eficiencia, calificación individual y tiempo de retrabajo
- El reporte muestra la desviación de tiempo real respecto al tiempo estándar por tarea
- Puedo exportar los reportes a formato PDF y Excel
- Los empleados no tienen acceso a estos reportes
- Los datos del reporte son de solo lectura y no pueden ser manipulados

---

## HU-033: CONTABILIDAD DE PRODUCCIÓN POR EMPLEADO
**Prioridad:** Alta

Como jefe,
Quiero que el sistema registre automáticamente las unidades procesadas por cada empleado vinculadas a tareas completadas,
Para tener una visión cuantitativa del desempeño individual para evaluación y planificación.

**Criterios de Aceptación:**
- El sistema registra automáticamente las unidades a partir de tareas completadas y aprobadas
- Cada registro incluye producto, talla, color, tipo de tarea, cantidad y fecha
- El registro muestra el conteo de unidades defectuosas separado de las correctas
- Los datos registrados no pueden ser manipulados manualmente
- No se generan registros duplicados para la misma tarea
- Puedo consultar la contabilidad por empleado filtrando por rango de fechas

---

## HU-034: CONTABILIDAD DE PARES FABRICADOS SEMANALMENTE
**Prioridad:** Media

Como jefe,
Quiero que el sistema consolide automáticamente los totales semanales de pares fabricados por referencia, talla, color, estilo y marca,
Para disponer de análisis periódico de producción y planificación de capacidad.

**Criterios de Aceptación:**
- La consolidación se activa automáticamente los domingos a las 23:59
- El sistema valida que todas las tareas de la semana estén cerradas y las unidades registradas
- Se excluyen automáticamente las inconsistencias detectadas
- El sistema garantiza la conciliación: producido = inventario + cuarentena + pérdida
- Puedo exportar el reporte semanal a formato PDF y Excel
- Si no hubo producción en la semana, se genera un reporte con valor cero

---

## HU-035: CONTABILIDAD DE PARES TOTALES PEDIDOS POR CLIENTE MENSUALMENTE
**Prioridad:** Media

Como jefe,
Quiero que el sistema consolide automáticamente los totales mensuales de pares pedidos por cliente,
Para analizar el comportamiento comercial, planificar la demanda y diseñar estrategias de fidelización.

**Criterios de Aceptación:**
- La consolidación se activa automáticamente el último día del mes a las 23:59
- Se excluyen automáticamente los pedidos cancelados y en estado borrador
- El reporte incluye el porcentaje de cumplimiento de entrega y el porcentaje de entregas a tiempo
- Puedo filtrar el reporte por cliente, mes, estado y referencia
- Puedo exportar el reporte a formato PDF y Excel
- El reporte está disponible para consulta histórica sin límite de antigüedad
