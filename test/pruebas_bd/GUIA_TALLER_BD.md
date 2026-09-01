# Guia de Pruebas de Base de Datos — CALZADO J&R


## Test #01 — Registro de cliente nuevo

**Postman:**
- Metodo: POST
- URL: http://localhost:8000/api/v1/auth/register
- Headers: Content-Type: application/json
- Body: {"email":"qa.cliente.nuevo@test.com","name":"Cliente","last_name":"QA Nuevo","phone":"3009990001","business_name":"Tienda QA","password":"QaTest123!"}
- Esperado: 201 Created

**DBeaver — 01_registro_cliente.sql:**
SELECT u.email, u.name_user, u.is_active, r.name_role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = 'qa.cliente.nuevo@test.com' AND r.name_role = 'client';
- Esperado: email=qa.cliente.nuevo@test.com, is_active=true, name_role=client

---

## Test #02 — Login JWT

**Postman:**
- Metodo: POST
- URL: http://localhost:8000/api/v1/auth/login
- Headers: Content-Type: application/json
- Body: {"email":"ronald.jefe@gmail.com","password":"Test123456!"}
- Esperado: 200 OK con access_token

**DBeaver — 02_login_jwt.sql:**
SELECT email, session_version, is_active FROM users WHERE email = 'ronald.jefe@gmail.com';
- Esperado: is_active=true

---

## Test #03 — Crear empleado

**Postman:**
- Metodo: POST
- URL: http://localhost:8000/api/v1/admin/users/create-employee
- Headers: Authorization: Bearer token + Content-Type: application/json
- Body: {"email":"qa.empleado.nuevo@test.com","name":"Empleado","last_name":"QA Nuevo","phone":"3009990002","occupation":"cortador","password":"EmpTest123!"}
- Esperado: 201 Created

**DBeaver — 03_crear_empleado_temp_password.sql:**
SELECT email, name_user, occupation, is_active, is_validated FROM users WHERE email = 'qa.empleado.nuevo@test.com';
- Esperado: occupation=cortador, is_active=true

---

## Test #04 — Validar cuenta de empleado

**Postman:**
- Metodo: PATCH
- URL: http://localhost:8000/api/v1/admin/users/{id_empleado}/validate
- Headers: Authorization: Bearer token
- Body: (vacio)
- Esperado: 200 OK

**DBeaver — 04_validar_cuenta_empleado.sql:**
SELECT u.email, u.is_validated, u.validated_by FROM users u WHERE u.email = 'qa.empleado.nuevo@test.com';
- Esperado: is_validated=true

---

## Test #05 — Login invitacion expirada (bloqueado)

**Postman:**
- Metodo: POST
- URL: http://localhost:8000/api/v1/auth/login
- Body: {"email":"invitacion.expirada@test.com","password":"Test123456!"}
- Esperado: 403 Forbidden

**DBeaver — 05_login_invitacion_expirada.sql:**
SELECT email, is_active, CASE WHEN invitation_expires_at < NOW() THEN 'BLOQUEADO' ELSE 'PERMITIDO' END AS estado FROM users WHERE email = 'invitacion.expirada@test.com';
- Esperado: estado=BLOQUEADO

---

## Test #06 — Crear marca

**Postman:** POST http://localhost:8000/api/v1/admin/catalog/brands
- Body: {"name":"Marca QA Taller BD","description":"Marca creada para prueba de BD"}
- Esperado: 200 OK o 201 Created

**DBeaver — 06_crear_marca.sql:** SELECT de unicidad (0 duplicados)

---

## Test #07 — Producto duplicado (rechazado)

**Postman:** POST http://localhost:8000/api/v1/admin/catalog/products
- Body: {"name":"Tenis Running","description":"Duplicado","color":"Negro","brand_id":"e0000000-0000-0000-0000-000000000001","style_id":"f0000000-0000-0000-0000-000000000001","category_id":"d0000000-0000-0000-0000-000000000001"}
- Esperado: 409 Conflict

**DBeaver — 07_producto_duplicado_rechazado.sql:** SELECT de duplicados (0 filas)

---

## Test #08 — Eliminar marca con estilos (bloqueado)

**Postman:** DELETE http://localhost:8000/api/v1/admin/catalog/brands/e0000000-0000-0000-0000-000000000002
- Esperado: 409 Conflict (FK RESTRICT)

**DBeaver — 08_eliminar_marca_con_estilos.sql:** SELECT marca sigue existiendo

---

## Test #09 — Crear inventario

**Postman:** POST http://localhost:8000/api/v1/admin/catalog/inventory
- Body: {"product_id":"10000000-0000-0000-0000-000000000001","size":"39","colour":"Negro","amount":25}
- Esperado: 200 OK

**DBeaver — 09_crear_inventario.sql:** SELECT inventario creado

---

## Test #10 — Salida stock insuficiente (rechazada)

**Postman:** POST http://localhost:8000/api/v1/admin/catalog/inventory/movements
- Body: {"product_id":"10000000-0000-0000-0000-000000000001","size":"40","movement_type":"salida","quantity":999,"reason":"Prueba"}
- Esperado: 400 Bad Request

**DBeaver — 10_salida_stock_insuficiente.sql:** SELECT stock sin cambios

---

## Test #11 — Inventario duplicado

**Postman:** POST http://localhost:8000/api/v1/admin/catalog/inventory (mismo product+size+colour)
- Esperado: 200 OK (upsert) o 409 Conflict

**DBeaver — 11_duplicado_inventory_unique.sql:** SELECT count=1 (sin duplicados)

---

## Test #12 — Crear pedido con detalle

**Postman:** POST http://localhost:8000/api/v1/admin/orders
- Body: {"customer_id":"c0000000-0000-0000-0000-000000000004","total_pairs":10,"details":[{"product_id":"10000000-0000-0000-0000-000000000001","size":"40","colour":"Negro","amount":10}]}
- Esperado: 201 Created

**DBeaver — 12_crear_pedido_con_detalle.sql:** SELECT pedido + coherencia total_pairs=SUM(amount)

---

## Test #13 — Estado completado (reserva stock)

**Postman:** PATCH http://localhost:8000/api/v1/admin/orders/{id}/status
- Body: {"state":"completado"}
- Esperado: 200 OK

**DBeaver — 13_estado_completado_reservar.sql:** SELECT reserved incrementado

---

## Test #14 — Estado entregado (libera reserva)

**Postman:** PATCH http://localhost:8000/api/v1/admin/orders/{id}/status
- Body: {"state":"entregado"}
- Esperado: 200 OK

**DBeaver — 14_estado_entregado_liberar.sql:** SELECT reserved=0

---

## Test #15 — Eliminar pedido no cancelado (bloqueado)

**Postman:** DELETE http://localhost:8000/api/v1/admin/orders/{id}
- Esperado: 400 Bad Request

**DBeaver — 15_eliminar_pedido_no_cancelado.sql:** SELECT pedido sigue existiendo

---

## Test #16 — Tarea corte (deduccion insumos)

**Postman:** POST http://localhost:8000/api/v1/admin/orders/{id}/tasks
- Body: {"tasks":[{"product_id":"10000000-0000-0000-0000-000000000001","type":"corte","amount":10,"priority":"media","line_group":1}]}
- Esperado: 200 OK

**DBeaver — 16_tarea_corte_deduccion_insumos.sql:** SELECT tarea + stock insumos

---

## Test #17 — Auto-crear siguiente etapa

**Postman:** PATCH http://localhost:8000/api/v1/dashboard/employee/tasks/{id}/status
- Body: {"status":"completado","observation":"Corte finalizado"}
- Esperado: 200 OK

**DBeaver — 17_auto_crear_siguiente_etapa.sql:** SELECT corte=completado, guarnicion=pendiente

---

## Test #18 — Reclamo tarea incompatible (bloqueado)

**Postman:** POST http://localhost:8000/api/v1/dashboard/employee/tasks/{id}/claim
- Headers: Authorization: Bearer token_empleado_cortador
- Esperado: 409 Conflict

**DBeaver — 18_reclamo_tarea_incompatible.sql:** SELECT assigned_to=NULL

---

## Test #19 — Crear incidencia

**Postman:** POST http://localhost:8000/api/v1/scrap
- Body: {"task_id":"{id}","defect_code":"DEF-FAB","quantity":2,"description":"Defecto prueba"}
- Esperado: 201 Created

**DBeaver — 19_crear_incidencia_producto.sql:** SELECT status=pending

---

## Test #20 — Aprobar incidencia

**Postman:** PATCH http://localhost:8000/api/v1/scrap/{id}/approve
- Body: {"observation":"Aprobada"}
- Esperado: 200 OK

**DBeaver — 20_aprobar_incidencia_loss_record.sql:** SELECT status=approved + loss_record creado

---

## Test #21 — Transaccion exitosa (COMMIT)

**DBeaver — 21_transaccion_pedido_atomico.sql:** Ejecuta BEGIN/COMMIT con pedido+detalle+stock
- Verificar: todo persiste tras COMMIT

## Test #22 — ROLLBACK por fallo

**DBeaver — 22_rollback_stock_insuficiente.sql:** Ejecuta BEGIN/RAISE EXCEPTION/ROLLBACK
- Verificar: nada persiste (pedido COUNT=0)

## Test #23 — Eliminar producto (soft delete)

**DBeaver — 23_eliminar_producto_exitoso.sql:** Crea producto, lo elimina, verifica deleted_at

## Test #24 — Actualizar producto

**DBeaver — 24_actualizar_producto_directo.sql:** Actualiza nombre/color, verifica, restaura

## Test #25 — Salida valida de stock

**DBeaver — 25_salida_stock_valida.sql:** Decrementa stock, crea movimiento, verifica, restaura

## Test #26 — Cadena de produccion completa

**DBeaver — 26_cadena_produccion_completa.sql:** Crea pedido, tarea, completar, verificar cadena

---

## Verificacion final

Ejecutar: 99_verificacion_final.sql

Total: 28 archivos SQL (cumple los 20+ requeridos)
