# Casos de Uso — Fichas Técnicas

# CU001: Crear Cuentas de Acceso

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU001: Crear Cuentas de Acceso |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador del Sistema. **Secundarios:** Usuario destinatario (cliente mayorista o empleado). |
| **3. Propósito / Descripción** | Permitir al administrador crear cuentas de acceso para clientes mayoristas y empleados, generando credenciales temporales y notificando a los usuarios para su primer acceso. |
| **4. Precondiciones** | 1. El administrador ha iniciado sesión con privilegios de administrador. 2. El módulo de gestión de usuarios está disponible y operativo. |
| **5. Disparador (Trigger)** | El administrador navega al módulo "Gestión de Usuarios" y selecciona la opción "Crear Nueva Cuenta". |
| **6. Flujo Principal (Paso a Paso)** | 1. El administrador navega al módulo "Gestión de Usuarios" y selecciona "Crear Nueva Cuenta". 2. El sistema presenta un formulario con campos organizados en secciones: *Datos Personales* (nombre completo, documento de identidad, teléfono, dirección, ciudad) y *Datos de Cuenta* (correo electrónico, tipo de usuario). 3. El administrador completa todos los campos obligatorios. 4. El administrador hace clic en "Validar y Crear Cuenta". 5. El sistema ejecuta validaciones en tiempo real: formato de correo, formato de documento y consulta de duplicados. 6. Si no hay duplicados, el sistema genera una contraseña temporal (≥10 caracteres, mayúscula, minúscula, número y símbolo). 7. El sistema crea la cuenta con estado "Pendiente de Activación" y registra fecha/hora, administrador y contraseña temporal encriptada. 8. El sistema envía correo automático con credenciales, enlace de activación (válido 24 h) e instrucciones. 9. El sistema muestra: "Cuenta creada exitosamente. Se han enviado las credenciales al correo del usuario." |
| **7. Flujos Alternativos** | **Correo Duplicado:** muestra "El correo electrónico ya está registrado en el sistema. Utilice otro correo o recupere la cuenta existente." **Documento Duplicado:** muestra "El documento de identidad ya existe en el sistema. Verifique la información." |
| **8. Flujos de Excepción / Errores** | **Formato Inválido:** muestra "Formato de correo electrónico inválido" o "Formato de documento incorrecto". **Campos Obligatorios Vacíos:** el sistema resalta los campos faltantes y no permite continuar. |
| **9. Postcondiciones** | 1. La cuenta queda registrada con estado "Pendiente de Activación". 2. Las credenciales temporales se envían al correo del usuario. 3. Se genera registro de auditoría con timestamp, administrador creador, tipo de usuario y datos de la cuenta. 4. El contador de cuentas pendientes de activación se incrementa en el dashboard del administrador. |
| **10. Requisitos No Funcionales Relacionados** | Seguridad: encriptación de contraseñas (Bcrypt); validación de formato en tiempo real; auditoría completa de la acción; disponibilidad del servicio de correo (Mailpit en dev). |

---

# CU002: Inicio de Sesión en el Sistema

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU002: Inicio de Sesión en el Sistema |
| **2. Actor(es) Involucrado(s)** | **Principal:** Usuario Registrado (Cliente Mayorista, Empleado o Administrador). |
| **3. Propósito / Descripción** | Permitir a los usuarios autenticarse en el sistema con sus credenciales, aplicando mecanismos de seguridad contra accesos no autorizados (bloqueo temporal y control de intentos). |
| **4. Precondiciones** | 1. El usuario tiene una cuenta creada en el sistema. 2. La cuenta no está bloqueada permanentemente. 3. El servicio de autenticación está operativo. |
| **5. Disparador (Trigger)** | El usuario accede a la página de inicio de sesión e introduce sus credenciales. |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a la página de login. 2. El sistema presenta el formulario con correo, contraseña, enlace "¿Olvidó su contraseña?" y checkbox "Recordar mis datos". 3. El usuario ingresa su correo y contraseña. 4. El usuario hace clic en "Iniciar Sesión". 5. El sistema valida campos no vacíos, formato de correo y compara el hash de la contraseña. 6. Si son correctas, verifica cuenta activa, registra acceso en bitácora, genera token de sesión (válido 20 min) y redirige al dashboard según rol (Administrador: panel completo; Cliente Mayorista: catálogo y pedidos; Empleado: tareas asignadas). 7. El sistema inicia temporizador de inactividad de 20 minutos. |
| **7. Flujos Alternativos** | **Primer Acceso:** si el usuario tiene contraseña temporal, el sistema fuerza el cambio de contraseña antes de permitir el acceso al dashboard. **Campos Vacíos:** muestra "Todos los campos marcados con * son obligatorios" y resalta los faltantes en rojo. |
| **8. Flujos de Excepción / Errores** | **Credenciales Incorrectas:** muestra "Correo electrónico o contraseña incorrectos"; incrementa contador de intentos; al tercer intento fallido en 5 min bloquea la cuenta por 30 min. **Cuenta Bloqueada:** "Cuenta bloqueada temporalmente por seguridad. Intente nuevamente en 30 minutos." **Cuenta Inactiva/Suspendida:** "Su cuenta no está activa. Contacte al administrador del sistema." |
| **9. Postcondiciones** | 1. El usuario tiene sesión activa con token válido. 2. Se registra el acceso en bitácora (timestamp, IP, usuario, tipo de acceso). 3. El contador de intentos fallidos se reinicia en accesos exitosos. 4. El usuario navega según su rol. |
| **10. Requisitos No Funcionales Relacionados** | Seguridad: hash de contraseñas (Bcrypt), JWT con expiración de 20 min, bloqueo por intentos; auditoría de accesos; tiempo de respuesta de autenticación < 2s. |

---

# CU003: Recuperación de Contraseña Olvidada

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU003: Recuperación de Contraseña Olvidada |
| **2. Actor(es) Involucrado(s)** | **Principal:** Usuario Registrado. |
| **3. Propósito / Descripción** | Permitir a los usuarios recuperar el acceso a sus cuentas cuando olvidan su contraseña, mediante un proceso seguro con enlaces temporales y expiración controlada. |
| **4. Precondiciones** | 1. El usuario tiene una cuenta activa en el sistema. 2. El servicio de correo electrónico está operativo. |
| **5. Disparador (Trigger)** | El usuario hace clic en "¿Olvidó su contraseña?" en la pantalla de login. |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario hace clic en "¿Olvidó su contraseña?". 2. El sistema redirige al formulario que solicita el correo electrónico. 3. El usuario ingresa su correo y hace clic en "Enviar Enlace de Recuperación". 4. El sistema valida que el correo exista en usuarios activos. 5. El sistema genera token único con hash seguro y expiración de 60 minutos, registrando la solicitud en bitácora. 6. El sistema envía correo con enlace de recuperación, instrucciones y advertencia de expiración. 7. El usuario hace clic en el enlace. 8. El sistema valida que el token exista, no haya expirado y no haya sido usado. 9. El sistema presenta el formulario de nueva contraseña con indicador de fortaleza. 10. El usuario ingresa y confirma la nueva contraseña. 11. El sistema valida requisitos (≥10 caracteres, mayúscula, minúscula, número, símbolo; no igual a las últimas 5). 12. El sistema actualiza la contraseña. 13. El sistema invalida la contraseña anterior, el token y las sesiones activas. 14. El sistema muestra: "Su contraseña ha sido actualizada exitosamente." |
| **7. Flujos Alternativos** | **Correo No Registrado:** por seguridad no se muestra mensaje específico, pero se registra en auditoría el intento. |
| **8. Flujos de Excepción / Errores** | **Enlace Expirado:** "El enlace de recuperación ha expirado." **Token Ya Utilizado:** "Este enlace de recuperación ya fue utilizado." **Contraseña No Cumple Requisitos:** muestra el mensaje específico de requisitos. |
| **9. Postcondiciones** | 1. La contraseña del usuario queda actualizada. 2. Todas las sesiones activas previas se invalidan. 3. El token de recuperación se marca como utilizado. 4. El proceso queda registrado en bitácora de seguridad con timestamp e IP. |
| **10. Requisitos No Funcionales Relacionados** | Seguridad: token con hash y expiración (60 min), invalidación de sesiones; políticas de contraseña; registro en bitácora de seguridad. |

---

# CU004: Solicitud de Reactivación de Cuenta Suspendida

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU004: Solicitud de Reactivación de Cuenta Suspendida |
| **2. Actor(es) Involucrado(s)** | **Principal:** Usuario con cuenta suspendida. **Secundario:** Administrador (revisa la solicitud). |
| **3. Propósito / Descripción** | Permitir a usuarios con cuentas suspendidas solicitar su reactivación mediante un formulario detallado que genera un ticket de seguimiento para el administrador. |
| **4. Precondiciones** | 1. El usuario tiene una cuenta en estado "Suspendida". 2. El usuario conoce sus credenciales de correo registrado. |
| **5. Disparador (Trigger)** | El usuario intenta iniciar sesión con credenciales correctas y el sistema detecta que la cuenta está suspendida. |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario intenta iniciar sesión con credenciales correctas. 2. El sistema detecta cuenta "Suspendida" y redirige al formulario de reactivación. 3. El sistema presenta el formulario con: identificación (correo pre-llenado no editable, documento), motivo de suspensión (solo lectura), motivo detallado (mín. 200 caracteres) y contacto (teléfono, evidencia opcional PDF/JPG/PNG hasta 10MB). 4. El usuario completa los campos y adjunta evidencia si está disponible. 5. El usuario hace clic en "Enviar Solicitud de Reactivación". 6. El sistema valida cuenta suspendida, coincidencia de documento y motivo ≥200 caracteres. 7. El sistema genera ticket único (REACT-YYYYMMDD-XXXXX), registro con timestamp y notificación prioritaria al panel de administración. 8. El sistema muestra confirmación con el número de ticket. |
| **7. Flujos Alternativos** | **Cuenta No Suspendida:** "Su cuenta no requiere reactivación. Será redirigido al inicio de sesión en 5 segundos." **Documento No Coincide:** "El documento de identidad no coincide con nuestros registros." |
| **8. Flujos de Excepción / Errores** | **Motivo Insuficiente:** "Debe proporcionar un motivo detallado de al menos 200 caracteres." **Evidencia Inválida:** rechaza archivos con formato o tamaño no permitidos. |
| **9. Postcondiciones** | 1. Se crea solicitud con estado "Pendiente de Revisión". 2. Se genera ticket único de seguimiento. 3. El administrador recibe notificación de alta prioridad. 4. La solicitud queda en historial de auditoría. 5. El usuario recibe correo de confirmación con el número de ticket. |
| **10. Requisitos No Funcionales Relacionados** | Seguridad: validación de identidad por documento; límites de tamaño/formatos de archivos (10MB, PDF/JPG/PNG); auditoría completa; notificación en tiempo real. |

---

# CU005: Registro de Productos en el Catálogo

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU005: Registro de Productos en el Catálogo |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. |
| **3. Propósito / Descripción** | Registrar nuevos productos en el catálogo digital con validación de referencia única y gestión de imágenes, asegurando la integridad de la información del producto. |
| **4. Precondiciones** | 1. El administrador inició sesión con privilegios completos. 2. Existen categorías y marcas configuradas. 3. El módulo de catálogo está disponible. |
| **5. Disparador (Trigger)** | El administrador navega a "Catálogo" y selecciona "Registrar Nuevo Producto". |
| **6. Flujo Principal (Paso a Paso)** | 1. El administrador navega a "Catálogo" y selecciona "Registrar Nuevo Producto". 2. El sistema presenta un formulario multipaso: Paso 1 (nombre, referencia única con botón "Verificar Disponibilidad", descripción, categoría, marca, estado); Paso 2 (tallas 35-45, colores, material, tipo de calzado); Paso 3 (imagen principal JPG/PNG máx. 5MB, hasta 4 imágenes secundarias). 3. El administrador completa cada paso y hace clic en "Siguiente". 4. En referencia, hace clic en "Verificar Disponibilidad". 5. El sistema consulta en tiempo real y muestra "✓ Referencia disponible" en verde o "✗ Referencia ya existe" en rojo. 6. El administrador completa los campos y sube las imágenes. 7. El sistema valida referencia única, formatos JPG/PNG, tamaños y al menos una talla y un color. 8. El administrador hace clic en "Guardar Producto". 9. El sistema almacena el producto (estado "Activo" por defecto), procesa y optimiza imágenes, genera URLs únicas y crea auditoría. 10. El sistema muestra confirmación. |
| **7. Flujos Alternativos** | **Referencia Duplicada:** bloquea el guardado y muestra "La referencia [referencia] ya está registrada en el sistema." **Campos Obligatorios Faltantes:** muestra mensaje específico por campo. |
| **8. Flujos de Excepción / Errores** | **Imagen Inválida:** "Formato de imagen no válido. Solo se aceptan JPG y PNG." **Tamaño de Imagen Excedido:** "La imagen [archivo] excede el tamaño máximo de 5MB." |
| **9. Postcondiciones** | 1. El producto queda registrado con todos sus atributos. 2. Las imágenes se procesan y almacenan en el servidor. 3. El producto está disponible si su estado es "Activo". 4. Se genera auditoría completa. 5. El contador de productos activos se actualiza en el dashboard. |
| **10. Requisitos No Funcionales Relacionados** | Rendimiento: validación de referencia en tiempo real; límites de archivos (5MB, JPG/PNG); optimización de imágenes; auditoría; disponibilidad del módulo. |

---

# CU006: Clasificación de Productos por Categorías

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU006: Clasificación de Productos por Categorías |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. |
| **3. Propósito / Descripción** | Organizar el catálogo mediante un sistema de categorías jerárquicas, con validaciones que mantienen la integridad de los datos y las relaciones entre productos y categorías. |
| **4. Precondiciones** | 1. El administrador inició sesión con privilegios completos. 2. El módulo de categorías está disponible. |
| **5. Disparador (Trigger)** | El administrador navega a "Catálogo" > "Gestión de Categorías". |
| **6. Flujo Principal (Paso a Paso)** | 1. El administrador navega a "Catálogo" > "Gestión de Categorías". 2. El sistema presenta árbol jerárquico, botones Nueva/Editar/Eliminar, contador de productos y estado. 3. **Crear:** hace clic en "Nueva Categoría"; el sistema muestra formulario (nombre, categoría padre, descripción, estado, imagen); el administrador ingresa nombre y valida; el sistema verifica unicidad en el nivel; el administrador guarda. 4. **Editar:** selecciona categoría y hace clic en "Editar"; modifica campos; el sistema valida que no haya duplicados; guarda. 5. **Eliminar:** selecciona y hace clic en "Eliminar"; el sistema verifica dependencias (productos activos y subcategorías); si no hay, elimina; si hay, ofrece reasignación. 6. El sistema actualiza el árbol en tiempo real. |
| **7. Flujos Alternativos** | **Nombre Duplicado:** "Ya existe una categoría con el nombre '[nombre]' en este nivel." **Reasignación de Productos:** el sistema muestra un asistente para seleccionar la categoría destino. |
| **8. Flujos de Excepción / Errores** | **Eliminar con Productos:** "No se puede eliminar la categoría '[nombre]' porque tiene [n] productos activos asociados." **Eliminar con Subcategorías:** "No se puede eliminar la categoría '[nombre]' porque tiene [n] subcategorías." |
| **9. Postcondiciones** | 1. La estructura de categorías queda actualizada. 2. Los productos mantienen su categorización. 3. El catálogo refleja los cambios en filtros y navegación. 4. Se genera auditoría. 5. El menú de navegación se actualiza automáticamente. |
| **10. Requisitos No Funcionales Relacionados** | Integridad referencial; actualización en tiempo real del árbol; auditoría de operaciones; validación de unicidad por nivel. |

---

# CU007: Gestión de Marcas y Estilos de Productos

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU007: Gestión de Marcas y Estilos de Productos |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. |
| **3. Propósito / Descripción** | Administrar el portafolio de marcas y sus estilos asociados, manteniendo la identidad corporativa y organizando las líneas de diseño del calzado. |
| **4. Precondiciones** | 1. El administrador inició sesión con privilegios completos. 2. El módulo de marcas y estilos está disponible. |
| **5. Disparador (Trigger)** | El administrador navega a "Catálogo" > "Marcas y Estilos". |
| **6. Flujo Principal (Paso a Paso)** | 1. El administrador navega a "Catálogo" > "Marcas y Estilos". 2. El sistema presenta pestañas separadas de Marcas y Estilos. 3. **Crear Marca:** hace clic en "Nueva Marca"; el sistema muestra formulario (nombre único, descripción, logo opcional ≤2MB, estado, contacto proveedor); valida unicidad; guarda. 4. **Ver Estilos:** selecciona marca y hace clic en "Ver Estilos"; el sistema lista los estilos asociados. 5. **Crear Estilo:** hace clic en "Nuevo Estilo"; el sistema muestra formulario (nombre único en la marca, descripción, características, año de colección, estado, imágenes); guarda. 6. **Vincular a Productos:** al crear/editar producto, el sistema muestra dropdown de estilos filtrado por marca. |
| **7. Flujos Alternativos** | **Nombre de Marca Duplicado:** "Ya existe una marca con el nombre '[nombre]'." **Nombre de Estilo Duplicado:** "Ya existe un estilo con el nombre '[nombre]' en esta marca." |
| **8. Flujos de Excepción / Errores** | **Marca con Productos Activos:** "No se puede eliminar la marca '[nombre]' porque tiene [n] productos activos asociados." **Estilo con Productos Activos:** mensaje análogo para estilos. |
| **9. Postcondiciones** | 1. El portafolio de marcas y estilos queda actualizado. 2. Los productos se asocian correctamente a marcas y estilos. 3. Los filtros del catálogo se actualizan. 4. Se genera auditoría. 5. La navegación refleja los cambios. |
| **10. Requisitos No Funcionales Relacionados** | Unicidad de nombres; límites de logo (2MB, PNG/JPG); filtrado de estilos por marca; auditoría; integridad referencial. |

---

# CU008: Visualización Pública del Catálogo

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU008: Visualización Pública del Catálogo |
| **2. Actor(es) Involucrado(s)** | **Principal:** Visitante (sin cuenta). |
| **3. Propósito / Descripción** | Permitir a cualquier usuario sin registro explorar el catálogo completo de productos disponibles, con filtrado y visualización limitada a información pública. |
| **4. Precondiciones** | 1. El visitante accede a la URL pública del sistema. 2. El servicio web está operativo. 3. Existen productos "Activos" y "Públicos". |
| **5. Disparador (Trigger)** | El visitante ingresa al sitio web o hace clic en "Ver Catálogo Completo". |
| **6. Flujo Principal (Paso a Paso)** | 1. El visitante ingresa al sitio; el sistema carga la página principal (header, hero con CTA "Ver Catálogo", preview de destacados). 2. El visitante hace clic en "Ver Catálogo Completo". 3. El sistema carga el catálogo público con barra lateral de filtros (categoría, marca, estilo, talla 35-45, color) y grid responsivo (imagen, referencia, nombre, marca, estilo, badge "Nuevo", iconos de tallas/colores). 4. El visitante aplica múltiples filtros simultáneos. 5. El sistema procesa los filtros en tiempo real (AJAX), actualiza contador de resultados y mantiene URL compartible. 6. El visitante hace clic en un producto. 7. El sistema muestra detalle con galería (máx. 5 vistas), información técnica (sin precios ni stock) y botón "Ver tallas y colores disponibles". 8. El visitante puede compartir, guardar favoritos (redirige a registro) o ver relacionados. |
| **7. Flujos Alternativos** | **Sin Productos Disponibles:** muestra estado vacío con opción de limpiar filtros. **Acceso a Funciones Premium:** modal educativa que invita a registrarse o iniciar sesión. |
| **8. Flujos de Excepción / Errores** | **Catálogo Vacío:** "Nuestro catálogo se está actualizando." **Error de Carga:** "Estamos experimentando dificultades técnicas. Intente nuevamente." |
| **9. Postcondiciones** | 1. El visitante exploró el catálogo. 2. Los filtros quedan registrados en analytics. 3. Las impresiones se registran. 4. Se mantiene performance con lazy loading. 5. La experiencia es responsive. |
| **10. Requisitos No Funcionales Relacionados** | Rendimiento: filtrado en tiempo real (AJAX), lazy loading de imágenes; responsive; analytics de comportamiento. |

---

# CU009: Consulta de Catálogo como Cliente Mayorista

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU009: Consulta de Catálogo como Cliente Mayorista |
| **2. Actor(es) Involucrado(s)** | **Principal:** Cliente Mayorista autenticado. |
| **3. Propósito / Descripción** | Proporcionar al cliente mayorista acceso al catálogo completo con disponibilidad en tiempo real, favoritos y herramientas para preparar pedidos. |
| **4. Precondiciones** | 1. El cliente mayorista inició sesión con credenciales válidas. 2. La cuenta está "Activa" con permisos de compra. 3. El servicio de inventario en tiempo real está operativo. |
| **5. Disparador (Trigger)** | El cliente hace clic en "Catálogo Interno" en su dashboard. |
| **6. Flujo Principal (Paso a Paso)** | 1. El cliente accede a su dashboard y hace clic en "Catálogo Interno". 2. El sistema carga la interfaz avanzada (header con buscador, filtros rápidos, selector grid/lista; panel izquierdo con filtros de stock y tiempo de entrega; área principal con stock, precio mayorista, tiempo de entrega y botones). 3. El cliente gestiona favoritos (persisten entre sesiones). 4. El cliente aplica filtros y ordena. 5. El sistema actualiza la vista en tiempo real. 6. El cliente selecciona productos: hace clic en "+", el sistema muestra modal (talla, color, cantidad), valida stock en tiempo real y agrega al carrito. 7. El cliente alterna entre vista catálogo y vista pedido. |
| **7. Flujos Alternativos** | **Stock Insuficiente:** "Stock insuficiente. Máximo disponible: [X] unidades." **Producto Descontinuado:** "Este producto ya no está disponible." **Límite de Crédito Excedido:** muestra advertencia con montos. |
| **8. Flujos de Excepción / Errores** | **Sin Conexión en Tiempo Real:** "Información de disponibilidad temporalmente no disponible. Los pedidos estarán sujetos a confirmación de stock." |
| **9. Postcondiciones** | 1. El cliente consultó el catálogo con disponibilidad y precios actualizados. 2. Los favoritos quedaron guardados. 3. El pedido en progreso contiene productos validados. 4. Las búsquedas quedan registradas para análisis. 5. El stock se mantuvo actualizado en tiempo real. |
| **10. Requisitos No Funcionales Relacionados** | Tiempo real de stock; persistencia de favoritos; validación de crédito; rendimiento del grid; responsive. |

---

# CU010: Filtrado y Búsqueda Avanzada de Productos

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU010: Filtrado y Búsqueda Avanzada de Productos |
| **2. Actor(es) Involucrado(s)** | **Principal:** Usuario del catálogo (Visitante o Cliente Mayorista). |
| **3. Propósito / Descripción** | Ofrecer capacidades avanzadas de filtrado y búsqueda semántica para localizar productos mediante múltiples criterios combinables y texto libre con coincidencias parciales. |
| **4. Precondiciones** | 1. El usuario tiene acceso al catálogo según su rol. 2. El servicio de búsqueda e indexación está operativo. |
| **5. Disparador (Trigger)** | El usuario accede al catálogo e interactúa con la barra de búsqueda o el panel de filtros avanzados. |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede al catálogo; el sistema presenta barra de búsqueda, botón de búsqueda avanzada y filtros rápidos. 2. **Búsqueda por texto libre:** el usuario ingresa un término; el sistema activa autocompletado; al ejecutar, busca en nombre, referencia, descripción, marca, estilo y características; ordena por relevancia. 3. **Filtrado avanzado:** el usuario expande el panel y aplica múltiples filtros (precio, categorías, marcas, tallas, colores, disponibilidad) con operador AND. 4. **Combinación:** el usuario combina búsqueda textual con filtros; el sistema intersecta resultados. 5. **Gestión:** el sistema ofrece "Limpiar todos los filtros", breadcrumb de filtros y opciones de ordenamiento. |
| **7. Flujos Alternativos** | **Resultados Amplios:** si hay más de 100 resultados, sugiere usar filtros adicionales. |
| **8. Flujos de Excepción / Errores** | **Sin Coincidencias:** muestra estado vacío con sugerencias. **Error de Búsqueda:** "Nuestra búsqueda no está disponible temporalmente." **Filtros en Conflicto:** "Los filtros seleccionados no generan resultados." |
| **9. Postcondiciones** | 1. El usuario localizó productos mediante búsqueda avanzada. 2. Los criterios quedan registrados en analytics. 3. Alto rendimiento con combinaciones complejas. 4. Experiencia responsive. 5. Resultados consistentes con el rol. |
| **10. Requisitos No Funcionales Relacionados** | Rendimiento: autocompletado en tiempo real, búsqueda semántica; alto rendimiento con filtros complejos; responsive; analytics. |

---

# CU011: Creación de Pedidos de Fabricación

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU011: Creación de Pedidos de Fabricación |
| **2. Actor(es) Involucrado(s)** | **Principal:** Cliente Mayorista. **Secundario:** Sistema (notificaciones). |
| **3. Propósito / Descripción** | Permitir al cliente mayorista crear pedidos de fabricación seleccionando productos del catálogo, especificando tallas, colores y cantidades, con validaciones de cantidades mínimas y disponibilidad. |
| **4. Precondiciones** | 1. El cliente inició sesión con cuenta activa. 2. Existen productos activos con disponibilidad. 3. El cliente tiene límite de crédito vigente. |
| **5. Disparador (Trigger)** | El cliente navega a "Nuevo Pedido" desde su dashboard. |
| **6. Flujo Principal (Paso a Paso)** | 1. El cliente navega a "Nuevo Pedido". 2. El sistema presenta panel izquierdo (catálogo), panel derecho (resumen en tiempo real) y barra de estado de cantidad mínima. 3. El cliente navega y hace clic en "Agregar al Pedido"; el sistema muestra modal (talla, color, cantidad, stock actual). 4. El cliente selecciona y confirma; el sistema valida stock en tiempo real. 5. El sistema actualiza contadores, cantidad total y progreso. 6. El cliente hace clic en "Revisar y Enviar Pedido"; el sistema valida cantidad mínima (100 unidades), items válidos y disponibilidad. 7. El cliente hace clic en "Confirmar Pedido". 8. El sistema genera número único (PED-YYYYMMDD-XXXX), determina estado, registra el pedido y ejecuta notificaciones. |
| **7. Flujos Alternativos** | **Cantidad Mínima No Alcanzada:** "No puede enviar el pedido. Cantidad mínima requerida: 100 unidades. Su pedido actual: 85." **Stock Cambiado Durante Validación:** "El stock para [Producto] ha cambiado. Máximo disponible ahora: [Y]." |
| **8. Flujos de Excepción / Errores** | **Límite de Crédito Excedido:** "Pedido excede su límite de crédito por [$X]." **Pedido Vacío:** "Su pedido está vacío. Agregue al menos un producto." |
| **9. Postcondiciones** | 1. Se crea pedido con estado "Pendiente de revisión". 2. Se asigna número único y se notifica al cliente. 3. El stock reservado se actualiza. 4. Se envían notificaciones al equipo comercial. 5. El pedido queda en auditoría. 6. El cliente lo ve en "Mis Pedidos". |
| **10. Requisitos No Funcionales Relacionados** | Validación de stock en tiempo real; generación de número secuencial; notificaciones; auditoría; rendimiento del resumen en tiempo real. |

---

# CU012: Notificación Automática de Nuevos Pedidos

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU012: Notificación Automática de Nuevos Pedidos |
| **2. Actor(es) Involucrado(s)** | **Principal:** Sistema. **Secundarios:** Administradores, gerente comercial, planificador, jefe de bodega (destinatarios). |
| **3. Propósito / Descripción** | Generar y distribuir notificaciones automáticas e inmediatas cuando un cliente registra un nuevo pedido, asegurando que el equipo interno pueda procesarlo rápidamente. |
| **4. Precondiciones** | 1. Un cliente confirmó un nuevo pedido. 2. Existen destinatarios con notificaciones activas. 3. Los servicios de notificación y correo están operativos. |
| **5. Disparador (Trigger)** | El sistema detecta que un pedido cambió a estado "Confirmado". |
| **6. Flujo Principal (Paso a Paso)** | 1. El sistema detecta el estado "Confirmado". 2. El sistema recopila la información del pedido (ID, fecha, cliente, resumen, detalle de combinaciones, estado asignado, tiempo estimado). 3. El sistema identifica destinatarios por reglas (administradores siempre; gerente comercial; planificador si requiere fabricación; jefe de bodega si hay entrega inmediata). 4. El sistema genera notificación in-app (badge rojo, botón "Ver Detalles") y correo (asunto y tabla resumen). 5. El sistema actualiza el tablero de pedidos pendientes. 6. Los destinatarios actúan. |
| **7. Flujos Alternativos** | **Destinatarios No Disponibles:** escala al reemplazo designado o al supervisor. **Pedido de Prueba:** omite notificaciones o las marca "[TEST]". |
| **8. Flujos de Excepción / Errores** | **Pedido No Confirmado:** no genera notificaciones y registra el error. **Servicio de Email Caído:** mantiene notificaciones in-app y reintenta el email cada 5 min hasta 30 min. |
| **9. Postcondiciones** | 1. Las notificaciones se entregan a todos los destinatarios. 2. El pedido destaca en "Pedidos Recientes". 3. Se registra el envío en auditoría. 4. El equipo interno tiene visibilidad inmediata. 5. No hay duplicados. |
| **10. Requisitos No Funcionales Relacionados** | Tiempo real de notificaciones (WebSocket); reintentos de email; auditoría de envíos; deduplicación de notificaciones. |

---

# CU013: Consulta de Estado de Mis Pedidos

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU013: Consulta de Estado de Mis Pedidos |
| **2. Actor(es) Involucrado(s)** | **Principal:** Cliente Mayorista. |
| **3. Propósito / Descripción** | Proporcionar al cliente mayorista una vista completa del historial y estado actual de todos sus pedidos, con líneas de tiempo detalladas y alertas proactivas sobre retrasos. |
| **4. Precondiciones** | 1. El cliente inició sesión con credenciales válidas. 2. El cliente tiene al menos un pedido registrado. |
| **5. Disparador (Trigger)** | El cliente accede a la sección "Mis Pedidos" desde su menú principal. |
| **6. Flujo Principal (Paso a Paso)** | 1. El cliente accede a "Mis Pedidos". 2. El sistema carga la vista maestra con filtros por estado y fecha, barra de búsqueda y tarjetas de contadores. 3. El sistema muestra el grid con columnas (Número, Fecha, Estado, Total Unidades, Progreso) y estados con codificación de colores. 4. El cliente hace clic en "Ver Detalles". 5. El sistema muestra la vista con pestañas: Resumen General, Items del Pedido, Línea de Tiempo y Documentos. 6. El cliente monitorea pedidos en producción con porcentaje de avance y etapa actual (Corte, Ensamblaje, Acabado). 7. El sistema muestra alertas automáticas de retraso ("En riesgo de retraso", "Retrasado X días"). |
| **7. Flujos Alternativos** | **Pedido con Discrepancias:** "Nota: Este pedido fue entregado parcialmente." **Información de Producción Confidencial:** el sistema oculta información interna de producción. |
| **8. Flujos de Excepción / Errores** | **Sin Pedidos:** "Aún no tiene pedidos registrados." **Acceso a Pedido de Otro Cliente:** "No tiene permisos para ver este pedido." (se valida rigurosamente la segregación). |
| **9. Postcondiciones** | 1. El cliente tiene visibilidad completa del estado de sus pedidos. 2. Las líneas de tiempo dan transparencia. 3. Las alertas proactivas anticipan problemas. 4. Se mantiene la segregación de datos. 5. Consulta rápida y responsive. |
| **10. Requisitos No Funcionales Relacionados** | Seguridad: segregación de datos entre clientes; rendimiento con historial extenso; responsive; alertas en tiempo real. |

---

# CU014: Actualización de Estado de Pedidos

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU014: Actualización de Estado de Pedidos |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador / Gerente Comercial. |
| **3. Propósito / Descripción** | Permitir al equipo interno modificar el estado de los pedidos según su disponibilidad o avance de fabricación, manteniendo transiciones lógicas y registro completo de cambios. |
| **4. Precondiciones** | 1. El usuario inició sesión con permisos de administrador o gerente comercial. 2. Existe al menos un pedido con estado modificable. 3. El usuario tiene permisos sobre el módulo de pedidos. |
| **5. Disparador (Trigger)** | El usuario accede a "Gestión de Pedidos" y hace clic en "Gestionar Estado" sobre un pedido. |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a "Gestión de Pedidos". 2. El sistema muestra lista con filtros avanzados. 3. El usuario selecciona un pedido y hace clic en "Gestionar Estado". 4. El sistema presenta estado actual, transiciones disponibles e historial. 5. El usuario selecciona el nuevo estado; el sistema valida la transición lógica (Pendiente→Aprobado/Cancelado; Aprobado→En Producción/Cancelado; En Producción→Completado; Completado→Entregado). 6. El sistema solicita motivo obligatorio; el usuario lo ingresa y confirma. 7. El sistema ejecuta acciones automáticas por estado (orden de producción, verificación de bodega, notificaciones a planta/calidad). 8. El sistema notifica al cliente y actualiza dashboards y reportes. |
| **7. Flujos Alternativos** | **Cambio Masivo de Estados:** permite cambiar estado a múltiples pedidos simultáneamente si cumplen criterios comunes. |
| **8. Flujos de Excepción / Errores** | **Transición Inválida:** bloquea y lista las transiciones válidas. **Motivo Insuficiente:** "Proporcione un motivo más detallado (mínimo 20 caracteres)." **Precondición Fallida:** "No puede cambiar a este estado porque [razón]." |
| **9. Postcondiciones** | 1. El estado del pedido queda actualizado. 2. El motivo queda en el historial. 3. Las acciones automáticas se ejecutan. 4. El cliente es notificado. 5. La auditoría registra usuario, timestamp, estados y motivo. 6. Dashboards y reportes reflejan el cambio. |
| **10. Requisitos No Funcionales Relacionados** | Validación de transiciones de estado; motivo obligatorio; auditoría con IP; notificaciones; actualización en tiempo real de dashboards. |

---

# CU015: Control de Inventario de Calzado Fabricado

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU015: Control de Inventario de Calzado Fabricado |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador / Jefe de Bodega. |
| **3. Propósito / Descripción** | Registrar y controlar el inventario de calzado terminado, gestionando ingresos, salidas y ajustes con validaciones en tiempo real y alertas de stock bajo. |
| **4. Precondiciones** | 1. El usuario inició sesión con permisos de inventario. 2. Las referencias existen en el catálogo. 3. El módulo de inventario está operativo. |
| **5. Disparador (Trigger)** | El usuario accede a "Inventario" > "Gestión de Stock". |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a "Inventario" > "Gestión de Stock". 2. El sistema presenta dashboard con métricas clave, alertas y acciones rápidas. 3. **Registro de Ingresos:** hace clic en "Registrar Ingreso"; el sistema muestra formulario (referencia autocompletada, talla, color, cantidad, origen, fecha, lote, observaciones); el usuario completa y hace clic en "Validar Ingreso"; el sistema verifica la combinación referencia-talla-color; el usuario confirma. 4. El sistema ejecuta movimientos automáticos (descuento al aprobar pedidos). 5. El sistema monitorea stock bajo y genera alertas. 6. El usuario consulta y genera reportes de movimientos. |
| **7. Flujos Alternativos** | **Movimiento Duplicado:** "Ya existe un movimiento similar registrado hoy." |
| **8. Flujos de Excepción / Errores** | **Referencia No Existente:** "La referencia '[referencia]' no existe en el catálogo." **Salida Mayor al Stock:** "Stock insuficiente. Máximo disponible: [X]." **Combinación Inválida:** "Esta combinación no está definida en el catálogo." |
| **9. Postcondiciones** | 1. El inventario refleja el movimiento. 2. Los niveles de stock se recalculan. 3. Se generan alertas de stock bajo si aplica. 4. El movimiento queda en historial. 5. Los reportes reflejan los cambios. 6. La trazabilidad se mantiene. |
| **10. Requisitos No Funcionales Relacionados** | Validación en tiempo real; alertas de stock bajo; trazabilidad completa; auditoría de movimientos; rendimiento en consultas. |

---

# CU016: Actualización Automática de Inventario desde Producción

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU016: Actualización Automática de Inventario desde Producción |
| **2. Actor(es) Involucrado(s)** | **Principal:** Sistema. |
| **3. Propósito / Descripción** | Actualizar automáticamente el inventario de calzado terminado cuando un pedido completado es aprobado por control de calidad, manteniendo la integridad sin intervención manual. |
| **4. Precondiciones** | 1. Un pedido está en estado "Fabricado". 2. El pedido fue aprobado por control de calidad. 3. Las cantidades fabricadas fueron validadas. 4. El servicio de inventario está operativo. |
| **5. Disparador (Trigger)** | El sistema detecta el cambio de estado a "Fabricado" con aprobación de calidad. |
| **6. Flujo Principal (Paso a Paso)** | 1. El sistema detecta el estado "Fabricado" con aprobación. 2. El sistema verifica que el pedido no se haya procesado antes. 3. El sistema recupera todas las combinaciones (referencia, talla, color, cantidad aprobada, número de pedido). 4. Para cada combinación, consulta si existe en inventario: si existe, incrementa; si no, crea registro con estado "Disponible". 5. El sistema registra cada movimiento (fecha, pedido origen, origen "Producción Interna", cantidad, usuario sistema). 6. El sistema valida integridad (suma de cantidades = total del pedido, sin duplicidad). 7. El sistema marca el pedido como "Procesado en Inventario". 8. El sistema genera evento de auditoría. |
| **7. Flujos Alternativos** | **Discrepancia en Cantidades:** usa las cantidades aprobadas por calidad y registra advertencia. **Error en Combinación:** suspende el procesamiento de esa combinación, notifica al administrador y continúa con las válidas. |
| **8. Flujos de Excepción / Errores** | **Pedido Ya Procesado:** omite el procesamiento y registra la condición. **Fallo en Actualización:** hace rollback de toda la transacción y programa reintento en 5 minutos. |
| **9. Postcondiciones** | 1. El inventario refleja las nuevas unidades. 2. Todas las combinaciones están en stock. 3. El pedido queda marcado como procesado. 4. Se genera auditoría completa. 5. Los reportes reflejan los nuevos niveles. 6. El sistema queda listo para el siguiente pedido. |
| **10. Requisitos No Funcionales Relacionados** | Atomicidad (transacciones con rollback); integridad de datos; reintentos automáticos; auditoría completa; sin duplicidad. |

---

# CU017: Registro de Ventas Directas

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU017: Registro de Ventas Directas |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. |
| **3. Propósito / Descripción** | Registrar ventas directas de calzado descontando automáticamente las unidades del inventario, con validaciones de stock en tiempo real y registro inmutable de transacciones. |
| **4. Precondiciones** | 1. El administrador inició sesión con permisos de ventas. 2. Existe stock disponible de los productos a vender. 3. El módulo de ventas está operativo. |
| **5. Disparador (Trigger)** | El administrador accede a "Ventas" > "Registro de Venta Directa". |
| **6. Flujo Principal (Paso a Paso)** | 1. El administrador accede a "Ventas" > "Registro de Venta Directa". 2. El sistema presenta el formulario (información de la venta, destino, motivo). 3. El administrador hace clic en "Agregar Producto"; el sistema muestra búsqueda con autocompletado y selectores de talla/color. 4. El administrador ingresa cantidad; el sistema valida stock en tiempo real. 5. El sistema valida stock por producto y calcula total de unidades. 6. El administrador revisa el resumen y hace clic en "Procesar Venta". 7. El sistema ejecuta validaciones finales. 8. El sistema descuenta del inventario, genera número único de transacción, crea registro inmutable y actualiza contadores. 9. El sistema muestra confirmación y opciones (imprimir, nueva venta, volver). |
| **7. Flujos Alternativos** | **Stock Insuficiente:** bloquea el procesamiento y muestra el detalle de disponibilidad. |
| **8. Flujos de Excepción / Errores** | **Producto No Encontrado:** "Producto no encontrado en catálogo." **Validación de Datos Fallida:** mensajes por campo. **Error en Descuento de Inventario:** revierte toda la transacción y muestra error. |
| **9. Postcondiciones** | 1. Las unidades vendidas se descuentan del inventario. 2. Se crea registro inmutable de la venta. 3. Se genera número único de transacción. 4. Los contadores se actualizan. 5. La auditoría registra usuario, timestamp, productos y destino. 6. El stock refleja la reducción. |
| **10. Requisitos No Funcionales Relacionados** | Atomicidad (transacción con rollback); registro inmutable; validación de stock en tiempo real; auditoría completa. |

---

# CU018: Registro de Pérdidas por Producto Defectuoso

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU018: Registro de Pérdidas por Producto Defectuoso |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador / Control de Calidad. |
| **3. Propósito / Descripción** | Registrar pérdidas de calzado identificado como defectuoso, moviendo unidades desde el inventario principal al stock defectuoso con trazabilidad completa. |
| **4. Precondiciones** | 1. El usuario inició sesión con permisos de control de calidad o administrador. 2. Los productos existen en el inventario principal. 3. Existen códigos de defecto predefinidos. |
| **5. Disparador (Trigger)** | El usuario accede a "Calidad" > "Registro de Pérdidas". |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a "Calidad" > "Registro de Pérdidas". 2. El sistema presenta el formulario (producto defectuoso, información de la pérdida, clasificación del defecto, evidencia y análisis). 3. El usuario ingresa referencia; el sistema autocompleta tallas y colores y valida la combinación y la cantidad. 4. El usuario completa los campos y hace clic en "Registrar Pérdida". 5. El sistema ejecuta validaciones (combinación existe, cantidad ≤ stock, código de defecto válido, observaciones mínimas). 6. El sistema descuenta del inventario principal, transfiere al stock defectuoso, registra el motivo y actualiza métricas de calidad. 7. Si un operario registra, marca como "Pendiente de Aprobación" y notifica al supervisor. |
| **7. Flujos Alternativos** | **Aprobación Requerida:** para registros de operarios, queda pendiente de revisión por supervisor. |
| **8. Flujos de Excepción / Errores** | **Cantidad Excede Stock:** "Cantidad excede stock disponible. Máximo: [X]." **Combinación No Existente:** "Esta combinación no existe en inventario." **Datos Incompletos:** "Complete todos los campos obligatorios." |
| **9. Postcondiciones** | 1. Las unidades defectuosas se mueven al stock defectuoso. 2. El registro incluye clasificación del defecto. 3. Las métricas de calidad se actualizan. 4. El historial de defectos se enriquece. 5. Si aplica, queda pendiente de aprobación. 6. La auditoría captura todo el proceso. |
| **10. Requisitos No Funcionales Relacionados** | Trazabilidad de defectos; validación de stock; flujo de aprobación; auditoría; clasificación por códigos. |

---

# CU019: Proceso de Restauración de Calzado Defectuoso

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU019: Proceso de Restauración de Calzado Defectuoso |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador / Jefe de Calidad. |
| **3. Propósito / Descripción** | Gestionar el proceso de restauración de calzado defectuoso, desde la selección de unidades recuperables hasta su reincorporación al inventario disponible tras reparación exitosa. |
| **4. Precondiciones** | 1. Existen productos en el inventario de defectuosos. 2. El usuario tiene permisos de jefe de calidad o administrador. 3. Los tipos de defecto e intervenciones están predefinidos. |
| **5. Disparador (Trigger)** | El usuario accede a "Calidad" > "Restauración de Productos". |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a "Calidad" > "Restauración de Productos". 2. El sistema muestra productos en inventario defectuoso con filtros. 3. El usuario selecciona productos del historial de pérdidas y especifica referencia, talla, color, cantidad, defecto, intervención, tiempo y costo estimado. 4. El usuario hace clic en "Iniciar Restauración"; el sistema cambia el estado a "En Restauración", bloquea unidades y genera orden de trabajo. 5. Durante la restauración se registran avances, costos reales, observaciones y fotos. 6. El jefe de calidad autoriza el estado final: "Restaurado" (se reincorpora al inventario y se actualiza costo) o "Pérdida Definitiva" (permanece en defectuosos). |
| **7. Flujos Alternativos** | **Restauración No Viable:** el jefe de calidad cancela el proceso y declara pérdida definitiva. |
| **8. Flujos de Excepción / Errores** | **Cantidad Excedida:** "Cantidad excede unidades disponibles en defectuosos. Máximo: [X]." **Cambio en Estado de Defectuosos:** "Las unidades seleccionadas ya no están disponibles para restauración." |
| **9. Postcondiciones** | 1. Las unidades restauradas se reincorporan al inventario. 2. Los costos de reparación se registran. 3. El historial de restauración documenta el proceso. 4. Las métricas de efectividad se actualizan. 5. El inventario defectuoso refleja la reducción. 6. La auditoría captura las decisiones. |
| **10. Requisitos No Funcionales Relacionados** | Autorización por rol (jefe de calidad); trazabilidad de costos; auditoría de decisiones; estado de unidades. |

---

# CU020: Creación y Planificación de Tareas

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU020: Creación y Planificación de Tareas |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. **Secundario:** Empleado (recibe la tarea). |
| **3. Propósito / Descripción** | Crear tareas operativas detalladas asignándolas a empleados específicos, con tiempos estándar predefinidos y vinculación a órdenes de producción, organizando el trabajo interno con trazabilidad. |
| **4. Precondiciones** | 1. El usuario inició sesión con permisos de planificación. 2. Existen empleados activos con roles definidos. 3. Existen órdenes de producción creadas. |
| **5. Disparador (Trigger)** | El usuario accede a "Producción" > "Gestión de Tareas" > "Crear Nueva Tarea". |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a "Crear Nueva Tarea". 2. El sistema presenta el formulario (información básica, clasificación, prioridad y programación, vinculaciones, asignación). 3. El sistema asigna automáticamente el tiempo estándar según tipo de tarea, modelo y complejidad; permite ajuste manual con justificación. 4. El usuario completa los campos. 5. El sistema valida duplicados (misma orden y proceso) y que el empleado esté activo y compatible. 6. El usuario hace clic en "Crear Tarea". 7. El sistema genera la tarea con estado "Pendiente de Inicio", asigna número único y la muestra en el panel del empleado. 8. El sistema envía notificación in-app (push si prioridad alta) y registra en el historial de la orden. |
| **7. Flujos Alternativos** | **Tarea Duplicada:** "Ya existe una tarea activa para este proceso en la orden [número]." |
| **8. Flujos de Excepción / Errores** | **Empleado Inactivo:** "El empleado seleccionado no está activo." **Fecha Límite Inválida:** "La fecha límite no puede ser anterior a la fecha actual." **Sin Órdenes Disponibles:** "No hay órdenes de producción disponibles para vincular." |
| **9. Postcondiciones** | 1. La tarea queda creada con estado "Pendiente de Inicio". 2. El empleado recibe notificación. 3. La tarea aparece en los paneles de seguimiento. 4. El tiempo estándar queda registrado. 5. La auditoría registra el creador, timestamp, empleado y orden. 6. Los contadores de pendientes se actualizan. |
| **10. Requisitos No Funcionales Relacionados** | Cálculo de tiempo estándar; validación de duplicados; notificaciones; auditoría; actualización de contadores. |

---

# CU021: Asignación de Tareas a Empleados

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU021: Asignación de Tareas a Empleados |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. **Secundario:** Empleado (destinatario). |
| **3. Propósito / Descripción** | Asignar tareas pendientes a empleados activos, estableciendo fechas límite obligatorias y gestionando reasignaciones con validaciones de estado y disponibilidad. |
| **4. Precondiciones** | 1. El usuario inició sesión con permisos de asignación. 2. Existen tareas en estado "Pendiente" sin asignar. 3. Existen empleados activos con roles autorizados. |
| **5. Disparador (Trigger)** | El usuario accede a "Producción" > "Tareas Pendientes de Asignación". |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a "Tareas Pendientes de Asignación". 2. El sistema muestra lista de tareas no asignadas. 3. El usuario selecciona una tarea y hace clic en "Asignar a Empleado". 4. El sistema muestra empleados disponibles filtrados por rol, estado y carga de trabajo. 5. El usuario selecciona empleado y establece fecha límite obligatoria. 6. El sistema valida capacidad, realismo de la fecha y que la tarea siga asignable. 7. El usuario hace clic en "Confirmar Asignación". 8. El sistema cambia el estado a "Asignada", bloquea la tarea y registra la asignación. 9. El sistema notifica al empleado y aparece en su panel. |
| **7. Flujos Alternativos** | **Reasignación de Tarea:** si la tarea está "Asignada" o "En Progreso", solicita motivo obligatorio, notifica al empleado anterior y asigna al nuevo. |
| **8. Flujos de Excepción / Errores** | **Tarea Ya Asignada:** "Esta tarea ya está asignada a [nombre]." **Empleado No Disponible:** "El empleado seleccionado tiene [X] tareas pendientes." **Fecha Límite No Realista:** "La fecha límite no permite el tiempo estándar de [X] horas." |
| **9. Postcondiciones** | 1. La tarea queda asignada al empleado. 2. El estado cambia a "Asignada". 3. El empleado recibe notificación. 4. La tarea queda bloqueada. 5. La asignación queda registrada. 6. Los paneles reflejan el nuevo estado. |
| **10. Requisitos No Funcionales Relacionados** | Filtrado por rol y carga de trabajo; validación de fechas; bloqueo de tareas; notificaciones; auditoría. |

---

# CU022: Consulta de Tareas Asignadas

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU022: Consulta de Tareas Asignadas |
| **2. Actor(es) Involucrado(s)** | **Principal:** Empleado. |
| **3. Propósito / Descripción** | Proporcionar al empleado una vista completa de todas las tareas asignadas, con herramientas de organización y seguimiento para gestionar su trabajo diario eficientemente. |
| **4. Precondiciones** | 1. El empleado inició sesión con credenciales válidas. 2. El empleado tiene al menos una tarea asignada. |
| **5. Disparador (Trigger)** | El empleado inicia sesión y es redirigido a su dashboard personal. |
| **6. Flujo Principal (Paso a Paso)** | 1. El empleado inicia sesión y es redirigido a su dashboard. 2. El sistema carga "Mis Tareas Asignadas" con tarjetas de contadores, lista cronológica y filtros rápidos. 3. Cada tarea muestra título, descripción, tipo, prioridad, fechas, estado, avance, orden vinculada y observaciones. 4. El empleado ordena por prioridad, fecha límite, tipo o tiempo estimado. 5. El sistema muestra indicadores de tiempo ("Vence en X días", "Vence mañana", "Vence hoy", "Vencida"). 6. Las tareas completadas permanecen visibles en sección separada. |
| **7. Flujos Alternativos** | **Sin Tareas Asignadas:** "No tiene tareas asignadas actualmente." **Filtro Sin Resultados:** ofrece limpiar filtros. |
| **8. Flujos de Excepción / Errores** | **Tarea con Información Incompleta:** "Información incompleta - Contacte a su supervisor." **Acceso a Tareas de Otros:** el sistema valida la segregación y registra incidente de seguridad si se intenta acceder a tarea ajena. |
| **9. Postcondiciones** | 1. El empleado tiene visibilidad de su carga de trabajo. 2. Las tareas se organizan según preferencias. 3. Los indicadores ayudan a priorizar. 4. Se mantiene la segregación de datos. 5. La consulta es rápida. 6. El empleado puede iniciar tareas desde la vista. |
| **10. Requisitos No Funcionales Relacionados** | Seguridad: segregación de datos; rendimiento con muchas tareas; indicadores de tiempo en tiempo real; responsive. |

---

# CU023: Reporte de Avances e Incidencias

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU023: Reporte de Avances e Incidencias |
| **2. Actor(es) Involucrado(s)** | **Principal:** Empleado. **Secundario:** Administrador (supervisa). |
| **3. Propósito / Descripción** | Permitir al empleado registrar detalladamente sus avances, pausas e incidencias durante la ejecución de tareas, proporcionando transparencia real sobre el progreso al administrador. |
| **4. Precondiciones** | 1. El empleado inició sesión. 2. Tiene al menos una tarea en estado "Asignada" o "En Progreso". 3. La tarea está disponible para trabajar. |
| **5. Disparador (Trigger)** | El empleado hace clic en "Iniciar Tarea" o reporta un avance/incidencia. |
| **6. Flujo Principal (Paso a Paso)** | 1. El empleado selecciona una tarea y hace clic en "Iniciar Tarea". 2. El sistema registra marca de tiempo, cambia a "En Progreso", bloquea la tarea y valida que no haya otra en progreso. 3. El empleado registra avances (porcentaje, descripción, tipo) y el sistema actualiza en tiempo real. 4. El empleado pausa la tarea cuando es necesario (motivo de pausa; justificación si supera 10% del tiempo estándar). 5. El empleado reporta incidencias (tipo, descripción, severidad, adjuntos); para críticas genera ticket automático y la tarea pasa a "Bloqueada". 6. Al llegar al 100%, el empleado confirma finalización y el sistema registra todo en el historial. |
| **7. Flujos Alternativos** | **Pausa Prolongada sin Justificación:** el sistema notifica al supervisor. **Avance Inconsistente:** si el avance retrocede, solicita explicación. |
| **8. Flujos de Excepción / Errores** | **Dos Tareas Simultáneas:** "Ya tiene una tarea en progreso ([nombre])." **Incidencia Duplicada:** "Ya existe un reporte similar registrado hace [X tiempo]." |
| **9. Postcondiciones** | 1. Los avances quedan registrados con timestamps. 2. Las incidencias se notifican a los responsables. 3. El estado refleja el progreso real. 4. El historial contiene todas las interacciones. 5. Los supervisores ven el progreso en tiempo real. 6. Las métricas de productividad se actualizan. |
| **10. Requisitos No Funcionales Relacionados** | Timestamps precisos; actualización en tiempo real; notificaciones; auditoría; métricas de productividad. |

---

# CU024: Confirmación de Finalización de Tareas

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU024: Confirmación de Finalización de Tareas |
| **2. Actor(es) Involucrado(s)** | **Principal:** Empleado. **Secundario:** Administrador/Supervisor (notificado). |
| **3. Propósito / Descripción** | Permitir al empleado confirmar formalmente la finalización de una tarea asignada, registrando la cantidad procesada y adjuntando evidencia para notificar al administrador del cierre. |
| **4. Precondiciones** | 1. El empleado inició sesión. 2. Tiene una tarea en estado "Asignada" o "En Progreso". 3. La tarea alcanzó el 100% de avance. 4. El empleado completó todo el trabajo. |
| **5. Disparador (Trigger)** | El empleado hace clic en "Marcar como Finalizada" en una tarea con 100% de avance. |
| **6. Flujo Principal (Paso a Paso)** | 1. El empleado selecciona una tarea con 100% de avance. 2. El sistema verifica el estado válido. 3. El empleado hace clic en "Marcar como Finalizada". 4. El sistema presenta pantalla de confirmación (resumen, cantidad procesada obligatoria, lista de verificación). 5. El empleado adjunta evidencia (fotos máx. 5, informe PDF/DOC, documentos de calidad); el sistema valida formatos y tamaños. 6. El empleado hace clic en "Confirmar Finalización". 7. El sistema valida cantidad positiva y evidencias requeridas. 8. El sistema cambia a "Completada", bloquea la tarea, registra fecha/hora y calcula tiempo real vs estándar. 9. El sistema notifica al administrador y actualiza contadores. |
| **7. Flujos Alternativos** | **Evidencia Obligatoria No Adjuntada:** si el tipo de tarea la requiere, pide adjuntarla. |
| **8. Flujos de Excepción / Errores** | **Avance Insuficiente:** "No puede finalizar la tarea. Avance actual: [X]%." **Cantidad Procesada Inválida:** "La cantidad procesada debe ser mayor a cero." **Tarea Ya Finalizada:** "Esta tarea ya fue finalizada el [fecha]." |
| **9. Postcondiciones** | 1. La tarea queda "Completada" y bloqueada. 2. La cantidad procesada queda registrada. 3. Las evidencias están disponibles. 4. El administrador es notificado. 5. El historial incluye timestamp y empleado. 6. Las métricas de eficiencia se actualizan. |
| **10. Requisitos No Funcionales Relacionados** | Validación de formatos/tamaños de archivos; cálculo de eficiencia; bloqueo de edición; notificaciones; auditoría. |

---

# CU025: Notificación de Tareas Finalizadas

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU025: Notificación de Tareas Finalizadas |
| **2. Actor(es) Involucrado(s)** | **Principal:** Sistema. **Secundarios:** Administradores, supervisores, planificador, jefe de calidad (destinatarios). |
| **3. Propósito / Descripción** | Generar y distribuir notificaciones automáticas cuando un empleado finaliza una tarea, proporcionando a administradores y supervisores información completa para validar el cumplimiento y decidir la aprobación. |
| **4. Precondiciones** | 1. Un empleado marcó una tarea como "Completada". 2. Existen destinatarios con notificaciones habilitadas. 3. Los servicios de notificación están operativos. |
| **5. Disparador (Trigger)** | El sistema detecta que una tarea cambia a estado "Completada". |
| **6. Flujo Principal (Paso a Paso)** | 1. El sistema detecta el estado "Completada". 2. El sistema recopila la información (número, título, tipo, prioridad, fechas, empleado, cantidad, tiempo estándar vs real, eficiencia, observaciones, evidencias, orden). 3. El sistema identifica destinatarios (administrador siempre; supervisor; planificador si hay orden; jefe de calidad si es proceso de calidad). 4. El sistema genera notificación in-app (resumen, botón "Revisar Tarea", acceso a evidencias) y correo con métricas y enlaces de acción. 5. Los destinatarios pueden aprobar, rechazar, ver evidencias o consultar detalles. 6. El sistema actualiza dashboards de supervisión. |
| **7. Flujos Alternativos** | **Tarea de Baja Prioridad:** agrupa notificaciones en lote cada hora. **Destinatario No Disponible:** escala al reemplazo o nivel jerárquico superior. |
| **8. Flujos de Excepción / Errores** | **Notificación Duplicada:** verifica y evita duplicados. **Error en Envío de Email:** mantiene in-app y reintenta cada 10 min hasta 1 hora. |
| **9. Postcondiciones** | 1. Las notificaciones se entregan a todos los destinatarios. 2. Los supervisores ven el trabajo completado. 3. Las métricas de eficiencia están disponibles. 4. El sistema está listo para aprobar/rechazar. 5. La auditoría registra los envíos. 6. No hay duplicados. |
| **10. Requisitos No Funcionales Relacionados** | Tiempo real; cálculo de eficiencia; acciones desde la notificación; reintentos de email; deduplicación; auditoría. |

---

# CU026: Modificación y Eliminación de Tareas

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU026: Modificación y Eliminación de Tareas |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. |
| **3. Propósito / Descripción** | Editar o eliminar tareas que no han sido completadas, facilitando la corrección de errores de planificación o la eliminación de tareas innecesarias con controles de integridad. |
| **4. Precondiciones** | 1. El usuario inició sesión con permisos de administrador o planificador. 2. Existen tareas en estados editables ("Pendiente" o "Asignada"). 3. El usuario tiene permisos sobre el módulo de tareas. |
| **5. Disparador (Trigger)** | El usuario accede a "Producción" > "Gestión de Tareas". |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a "Gestión de Tareas". 2. El sistema muestra lista con filtros. 3. **Edición:** selecciona tarea en estado "Pendiente" o "Asignada", hace clic en "Editar Tarea", modifica campos, el sistema valida y muestra vista previa, el usuario confirma. 4. **Eliminación (sin actividad):** selecciona y hace clic en "Eliminar", el sistema solicita confirmación y elimina permanentemente. 5. **Cancelación (con actividad):** el sistema no permite eliminación directa; ofrece "Cancelar Tarea" con motivo obligatorio, conserva el historial y notifica al empleado. 6. El sistema registra todos los cambios en el historial (valor anterior, nuevo, usuario, timestamp). |
| **7. Flujos Alternativos** | **Cambios Masivos:** permite modificar múltiples tareas simultáneamente si comparten características editables. |
| **8. Flujos de Excepción / Errores** | **Edición de Tarea Completada:** "No puede editar tareas completadas." **Eliminación con Actividad:** "No puede eliminar tareas con actividad registrada. Use la opción 'Cancelar Tarea'." **Reasignación a Empleado No Disponible:** muestra el motivo. |
| **9. Postcondiciones** | 1. Las tareas quedan modificadas o eliminadas. 2. Los empleados afectados son notificados. 3. El historial registra todos los cambios. 4. Los paneles reflejan los nuevos estados. 5. Se preserva la integridad histórica. 6. Los contadores se actualizan. |
| **10. Requisitos No Funcionales Relacionados** | Integridad de datos (preservar historial); motivo obligatorio en cancelación; auditoría de cambios; notificaciones. |

---

# CU027: Registro de Incidencias de Maquinaria e Insumos

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU027: Registro de Incidencias de Maquinaria e Insumos |
| **2. Actor(es) Involucrado(s)** | **Principal:** Empleado de Planta. **Secundarios:** Mantenimiento, compras/almacén, administrador. |
| **3. Propósito / Descripción** | Permitir a los empleados reportar rápidamente fallas en maquinaria o falta de insumos críticos desde una tarea activa, generando tickets automáticos para acciones correctivas oportunas. |
| **4. Precondiciones** | 1. El empleado inició sesión. 2. Tiene una tarea activa en estado "En Progreso". 3. Se detectó una falla operativa o falta de insumo. |
| **5. Disparador (Trigger)** | Desde la tarea activa, el empleado hace clic en "Reportar Incidencia". |
| **6. Flujo Principal (Paso a Paso)** | 1. El empleado hace clic en "Reportar Incidencia". 2. El sistema presenta el formulario (tipo de incidencia, descripción, equipo/insumo, área, fecha/hora). 3. El empleado adjunta al menos una foto obligatoria. 4. El empleado clasifica el impacto (Total, Parcial, Mínimo); el sistema asigna prioridad. 5. El empleado hace clic en "Enviar Reporte"; el sistema valida duplicados y registra con timestamp. 6. El sistema procesa automáticamente: para falla de maquinaria notifica a mantenimiento (prioridad alta, ticket urgente); para falta de insumo crítico notifica a compras/almacén; para impacto total cambia la tarea a "Bloqueada" y notifica a administrador. |
| **7. Flujos Alternativos** | **Insumo No Crítico:** registra el reporte sin alerta urgente y lo procesa en el próximo ciclo de reposición. |
| **8. Flujos de Excepción / Errores** | **Incidencia Duplicada:** "Ya existe un reporte similar hace [X] minutos." **Foto No Adjuntada:** "Debe adjuntar al menos una foto." **Equipo No Identificado:** ofrece reportar equipo nuevo o elegir "Otro". |
| **9. Postcondiciones** | 1. El reporte queda registrado con toda la información. 2. Los departamentos responsables son notificados. 3. Se genera ticket de seguimiento. 4. Si aplica, la tarea pasa a "Bloqueada". 5. Las evidencias están disponibles. 6. La auditoría registra el proceso. |
| **10. Requisitos No Funcionales Relacionados** | Evidencia fotográfica obligatoria; priorización automática por impacto; tickets automáticos; notificaciones; auditoría. |

---

# CU028: Centro de Notificaciones Centralizado

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU028: Centro de Notificaciones Centralizado |
| **2. Actor(es) Involucrado(s)** | **Principal:** Todos los usuarios registrados. |
| **3. Propósito / Descripción** | Proporcionar un centro unificado donde los usuarios reciben, gestionan y organizan todas las notificaciones relevantes a su rol, manteniéndolos informados sin pérdida de información. |
| **4. Precondiciones** | 1. El usuario inició sesión con credenciales válidas. 2. El servicio de notificaciones está operativo. 3. Existen notificaciones pendientes o históricas. |
| **5. Disparador (Trigger)** | El usuario hace clic en el icono de notificaciones de la barra superior. |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede al sistema y observa el icono con contador badge. 2. El usuario hace clic en el icono. 3. El sistema despliega el panel con pestañas (No Leídas, Todas, Archivadas), filtros por tipo/prioridad y búsqueda. 4. Cada notificación muestra icono, título, descripción, tipo, prioridad, fecha/hora, estado y enlace directo. 5. El usuario gestiona (marcar leídas, archivar, acciones masivas). 6. El usuario hace clic en una notificación y es redirigido a la pantalla relacionada. 7. El usuario configura preferencias (tipos, canales, horarios silenciosos). |
| **7. Flujos Alternativos** | **Sin Notificaciones:** muestra estado vacío. **Notificación Caducada:** "Esta notificación ya no está disponible." |
| **8. Flujos de Excepción / Errores** | **Error en Carga de Notificaciones:** "No pudimos cargar sus notificaciones. [Reintentar]." **Notificación Duplicada:** el sistema detecta y elimina duplicados automáticamente. |
| **9. Postcondiciones** | 1. El usuario revisó y gestionó sus notificaciones. 2. El contador refleja el estado. 3. Las notificaciones se organizan según preferencias. 4. El usuario accedió a las funcionalidades mediante enlaces. 5. Las preferencias quedan guardadas. 6. El historial se mantiene. |
| **10. Requisitos No Funcionales Relacionados** | Tiempo real; deduplicación; preferencias personalizables; búsqueda y filtros; rendimiento. |

---

# CU029: Alertas Críticas para Administrador

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU029: Alertas Críticas para Administrador |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. |
| **3. Propósito / Descripción** | Proporcionar un sistema de alertas inmediatas sobre eventos críticos que requieren intervención rápida, con configuración de umbrales y capacidades de respuesta integradas. |
| **4. Precondiciones** | 1. El usuario inició sesión con permisos de administrador o gerente. 2. Existen eventos críticos o condiciones de alerta activas. 3. El módulo de alertas está configurado y operativo. |
| **5. Disparador (Trigger)** | El sistema genera una alerta crítica por bloqueos operativos, agotamiento de stock, incidencias técnicas, retrasos o alertas de seguridad. |
| **6. Flujo Principal (Paso a Paso)** | 1. El administrador observa indicadores visuales de alerta (banner rojo, contador, push). 2. El sistema genera alertas por tipo (bloqueos, stock, incidencias, retrasos, seguridad). 3. El administrador configura umbrales en "Configuración" > "Umbrales de Alerta". 4. Cada alerta muestra título, tipo, prioridad, fecha/hora, descripción, módulo y enlace. 5. El administrador responde (Validar, Rechazar, Reabrir, Escalar). 6. El sistema muestra el panel de control de alertas con filtros, métricas y reportes. |
| **7. Flujos Alternativos** | **Alerta por Umbral Configurado:** genera alerta de prioridad media para insumos bajo nivel. **Alertas Duplicadas:** consolida alertas relacionadas. |
| **8. Flujos de Excepción / Errores** | **Respuesta Tardía:** si una alerta crítica no recibe respuesta, escala automáticamente al siguiente nivel jerárquico. **Configuración de Horarios:** ajusta la urgencia fuera de horario laboral. |
| **9. Postcondiciones** | 1. Las alertas críticas se gestionan. 2. Los umbrales quedan configurados. 3. Las respuestas quedan registradas. 4. Los eventos críticos se atienden oportunamente. 5. El historial permite análisis de tendencias. 6. La configuración refleja las condiciones del negocio. |
| **10. Requisitos No Funcionales Relacionados** | Alertas en tiempo real; escalamiento automático; configuración de umbrales; auditoría de respuestas; métricas de efectividad. |

---

# CU030: Generación de Reportes de Pedidos e Inventario

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU030: Generación de Reportes de Pedidos e Inventario |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. |
| **3. Propósito / Descripción** | Generar reportes consolidados en tiempo real de pedidos e inventario, proporcionando análisis detallado del desempeño operativo para la toma de decisiones informadas. |
| **4. Precondiciones** | 1. El usuario inició sesión con permisos de administrador o gerente. 2. Existen datos históricos de pedidos y movimientos. 3. El servicio de reportes y BD está operativo. |
| **5. Disparador (Trigger)** | El usuario accede a "Reportes" > "Pedidos e Inventario". |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a "Reportes" > "Pedidos e Inventario". 2. El sistema presenta selector de tipo de reporte, panel de filtros avanzados y opciones de formato. 3. El usuario configura el reporte (tipo, rango, estado, cliente, movimiento) y hace clic en "Generar Reporte". 4. El sistema ejecuta consultas optimizadas y calcula métricas (cantidad de pedidos, tasa de cumplimiento, distribución, clientes top). 5. El sistema visualiza tablas y gráficos de tendencia. 6. El usuario exporta a PDF o Excel, con fecha de generación y parámetros. |
| **7. Flujos Alternativos** | **Período Muy Amplio:** "El período seleccionado es muy extenso. ¿Desea continuar?" |
| **8. Flujos de Excepción / Errores** | **Sin Resultados:** "No se encontraron resultados para los criterios seleccionados." **Error en Generación:** "No pudimos generar el reporte. [Reintentar]." **Datos Inconsistentes:** muestra advertencia de verificación. |
| **9. Postcondiciones** | 1. El reporte se genera con los datos solicitados. 2. Las métricas reflejan el estado del período. 3. Los formatos de exportación están disponibles. 4. La auditoría registra la generación. 5. Los datos son consistentes. 6. El usuario tiene información confiable. |
| **10. Requisitos No Funcionales Relacionados** | Rendimiento: consultas optimizadas (<60s para un año); exportación PDF/Excel; auditoría de generación; consistencia de datos. |

---

# CU031: Reportes de Desempeño de Empleados

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU031: Reportes de Desempeño de Empleados |
| **2. Actor(es) Involucrado(s)** | **Principal:** Administrador. |
| **3. Propósito / Descripción** | Generar reportes detallados sobre el desempeño individual y colectivo de los empleados, proporcionando métricas de eficiencia y productividad para procesos de evaluación. |
| **4. Precondiciones** | 1. El usuario inició sesión con permisos de administrador o recursos humanos. 2. Existen tareas completadas y datos de desempeño. 3. El módulo de reportes de personal está activo. |
| **5. Disparador (Trigger)** | El usuario accede a "Reportes" > "Desempeño de Empleados". |
| **6. Flujo Principal (Paso a Paso)** | 1. El usuario accede a "Reportes" > "Desempeño de Empleados". 2. El sistema presenta filtros (empleado/equipo, estado de tareas, tipo, rango, prioridad, supervisor). 3. El usuario configura el análisis y hace clic en "Generar Reporte de Desempeño". 4. El sistema calcula métricas (eficiencia, tiempo de retrabajo, desviación vs estándar, tasa de retrabajo, calificación). 5. El sistema muestra reporte individual (tabla, tendencia, distribución, comparativa) y colectivo (ranking, mejores prácticas, oportunidades). 6. El usuario exporta a PDF/Excel y consulta el histórico. |
| **7. Flujos Alternativos** | **Empleado Sin Tareas en Período:** "El empleado [nombre] no tiene tareas registradas en el período." |
| **8. Flujos de Excepción / Errores** | **Acceso No Autorizado:** "No tiene permisos para acceder a reportes de desempeño." **Datos Insuficientes:** "Se requieren al menos [X] tareas completadas para métricas confiables." |
| **9. Postcondiciones** | 1. El reporte se genera con métricas confiables. 2. Las comparativas están disponibles. 3. Los formatos exportables facilitan la evaluación. 4. La auditoría documenta la generación. 5. La información está disponible para evaluación. 6. Los reportes históricos son consultables pero no editables. |
| **10. Requisitos No Funcionales Relacionados** | Seguridad: restricción por rol de RRHH/administrador; cálculo de métricas; exportación; auditoría; inmutabilidad de históricos. |

---

# CU032: Contabilidad de Producción por Empleado

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU032: Contabilidad de Producción por Empleado |
| **2. Actor(es) Involucrado(s)** | **Principal:** Sistema. **Secundario:** Administrador (consulta). |
| **3. Propósito / Descripción** | Mantener automáticamente un registro detallado de la producción ejecutada por cada empleado, proporcionando datos precisos para análisis de rendimiento operativo individual y facilitando procesos de evaluación. |
| **4. Precondiciones** | 1. Existen tareas "Completadas" y "Aprobadas". 2. Los empleados tienen cuentas activas. 3. El módulo de contabilidad está operativo. |
| **5. Disparador (Trigger)** | El sistema detecta una tarea que cambia a "Completada" y luego a "Aprobada". |
| **6. Flujo Principal (Paso a Paso)** | 1. El sistema monitorea el cambio de estado y detecta tareas aprobadas. 2. El sistema extrae datos (tarea, empleado, referencia, talla, color, cantidad, resultado de calidad, tiempos). 3. El sistema crea un registro de producción por tarea aprobada y valida que no haya duplicados. 4. El sistema calcula métricas (pares procesados, tiempo promedio, tasa de defectos, eficiencia, consistencia). 5. El sistema excluye tareas no contabilizables (no aprobadas, sin unidades, capacitación, canceladas). 6. El administrador consulta la contabilidad por empleado, tipo o referencia. |
| **7. Flujos Alternativos** | **Datos Incompletos en Tarea:** marca como "Pendiente de datos" y notifica al supervisor. **Empleado Sin Producción:** "El empleado no tiene producción contabilizada en el período." |
| **8. Flujos de Excepción / Errores** | **Tarea Ya Contabilizada:** omite el procesamiento y registra la condición. **Ajuste Manual Requerido:** requiere doble aprobación y justificación detallada. |
| **9. Postcondiciones** | 1. La producción de cada empleado queda contabilizada. 2. Los registros son inmutables y trazables. 3. Las métricas están actualizadas. 4. No se permiten manipulaciones de datos base. 5. Los reportes reflejan la realidad. 6. El historial sirve para evaluaciones. |
| **10. Requisitos No Funcionales Relacionados** | Inmutabilidad de registros; trazabilidad hasta la tarea origen; validación de duplicados; auditoría; doble aprobación para ajustes. |

---

# CU033: Contabilidad de Pares Fabricados Semanalmente

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU033: Contabilidad de Pares Fabricados Semanalmente |
| **2. Actor(es) Involucrado(s)** | **Principal:** Sistema. **Secundario:** Administrador (recibe el reporte). |
| **3. Propósito / Descripción** | Consolidar automáticamente cada semana la cantidad total de pares fabricados, validando la integridad de los datos y generando reportes detallados para análisis de productividad periódica. |
| **4. Precondiciones** | 1. Existen tareas de fabricación completadas y aprobadas. 2. El servicio de inventario está sincronizado. 3. La configuración de semana laboral está definida. |
| **5. Disparador (Trigger)** | Ejecución automática programada cada domingo a las 23:59 (configurable). |
| **6. Flujo Principal (Paso a Paso)** | 1. El sistema programa la ejecución semanal. 2. El sistema recolecta tareas de fabricación completadas y aprobadas de los últimos 7 días. 3. El sistema valida la integridad (cierre correcto, unidades en inventario, sin discrepancias). 4. El sistema calcula el total de pares y genera desglose por referencia, categoría y estado. 5. El sistema estructura el reporte (encabezado, desglose por referencia/talla/color/estilo/marca/empleado/turno, métricas adicionales). 6. El sistema distribuye el reporte por correo, lo almacena y actualiza dashboards. |
| **7. Flujos Alternativos** | **Discrepancia en Datos:** excluye la tarea y registra el motivo. **Sin Producción en la Semana:** genera corte con valor cero. **Configuración de Festivos:** ajusta cálculos para semanas con festivos o paradas. |
| **8. Flujos de Excepción / Errores** | **Error en Procesamiento:** reintenta cada hora hasta 6 horas y luego notifica al administrador para procesamiento manual. |
| **9. Postcondiciones** | 1. El consolidado semanal se genera y almacena. 2. La conciliación se valida. 3. El reporte se distribuye. 4. Los datos son inmutables pero consultables. 5. Las métricas semanales se actualizan. 6. El sistema queda listo para el siguiente ciclo. |
| **10. Requisitos No Funcionales Relacionados** | Programación automática (cron); conciliación de datos; inmutabilidad; reintentos; distribución automática. |

---

# CU034: Contabilidad de Pares Totales Pedidos por Cliente Mensualmente

| Campo | Detalle |
| :---- | :------ |
| **1. Identificador y Nombre** | CU034: Contabilidad de Pares Totales Pedidos por Cliente Mensualmente |
| **2. Actor(es) Involucrado(s)** | **Principal:** Sistema. **Secundario:** Administrador / Gerente Comercial (consulta). |
| **3. Propósito / Descripción** | Consolidar mensualmente la cantidad total de pares solicitados por cada cliente mayorista, proporcionando análisis detallado del comportamiento de compra para apoyar estrategias comerciales. |
| **4. Precondiciones** | 1. Existen pedidos de clientes mayoristas registrados. 2. Los clientes tienen perfiles completos y categorías asignadas. 3. El servicio de reportes mensuales está configurado. |
| **5. Disparador (Trigger)** | Ejecución automática el último día de cada mes a las 23:59. |
| **6. Flujo Principal (Paso a Paso)** | 1. El sistema programa la ejecución mensual. 2. El sistema recolecta y filtra pedidos (incluye aprobados/en producción/completados/entregados; excluye cancelados, borrador, incompletos, clientes inactivos). 3. El sistema valida la consistencia de datos. 4. El sistema calcula métricas (total de pares por cliente, % de cumplimiento, % entrega a tiempo, distribución por categoría, tendencia). 5. El sistema genera el reporte mensual (mes, fecha de corte, totales, desglose, métricas comerciales). 6. El administrador accede, filtra y exporta a Excel, consultando el histórico. |
| **7. Flujos Alternativos** | **Cliente Sin Pedidos en el Mes:** genera corte con valor cero. **Filtro por Cliente y Modelo Específicos:** muestra solo la información solicitada. **Cálculo con Cero:** muestra 0% de cumplimiento si no hubo entregas. |
| **8. Flujos de Excepción / Errores** | **Pedido con Inconsistencias:** lo excluye y registra el motivo para corrección por el área comercial. |
| **9. Postcondiciones** | 1. El consolidado mensual se genera. 2. Los porcentajes se calculan. 3. El reporte está disponible para consulta y exportación. 4. Los datos son inmutables pero consultables. 5. La información apoya estrategias comerciales. 6. Se mantiene la confidencialidad. |
| **10. Requisitos No Funcionales Relacionados** | Programación automática; confidencialidad de información comercial; restricción por rol; exportación Excel; inmutabilidad de históricos. |
