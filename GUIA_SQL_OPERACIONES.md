# 📊 Guía de Operaciones SQL — Calzado J&R

Este documento contiene scripts y consultas SQL útiles para la gestión manual de la base de datos `calzado_jyr_db`.

> [!IMPORTANT]
> Antes de ejecutar scripts de eliminación (`DELETE`), se recomienda siempre realizar un `SELECT` con los mismos filtros para verificar qué datos serán afectados.

---

## 👤 Gestión de Usuarios (`users`)

### 1. Eliminar un usuario (Solo si no tiene pedidos)
Si el usuario es nuevo y no tiene actividad:
```sql
DELETE FROM users WHERE email = 'usuario@ejemplo.com';
```

### 1.1 Eliminar un usuario con TODO lo relacionado (Borrado en Cascada)
Si el usuario ya tiene pedidos, la base de datos no dejará borrarlo por seguridad (error de llave foránea). Debes borrar sus registros en este orden:

```sql
-- Ejecuta este bloque reemplazando el email
DO $$ 
DECLARE 
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM users WHERE email = 'andrey_diaz.9316@hotmail.com';

    IF target_user_id IS NOT NULL THEN
        -- 1. Borrar detalles de sus pedidos
        DELETE FROM order_details WHERE order_id IN (SELECT id FROM orders WHERE customer_id = target_user_id);
        -- 2. Borrar sus pedidos
        DELETE FROM orders WHERE customer_id = target_user_id;
        -- 3. Borrar el usuario
        DELETE FROM users WHERE id = target_user_id;
    END IF;
END $$;
```

### 2. Eliminar usuarios inactivos
```sql
DELETE FROM users 
WHERE is_active = false 
AND created_at < NOW() - INTERVAL '30 days';
```

### 3. Borrado Lógico (Soft Delete)
```sql
UPDATE users 
SET deleted_at = NOW(), is_active = false 
WHERE email = 'usuario@ejemplo.com';
```

---

## 📦 Gestión de Pedidos (`orders`)

### 4. Eliminar un pedido específico y sus detalles
```sql
-- Primero los detalles
DELETE FROM order_details WHERE order_id = 'UUID_DEL_PEDIDO';
-- Luego el pedido
DELETE FROM orders WHERE id = 'UUID_DEL_PEDIDO';
```

### 5. Limpiar pedidos de un cliente específico
```sql
DELETE FROM order_details WHERE order_id IN (SELECT id FROM orders WHERE customer_id = (SELECT id FROM users WHERE email = 'cliente@correo.com'));
DELETE FROM orders WHERE customer_id = (SELECT id FROM users WHERE email = 'cliente@correo.com');
```

---

## 🗑️ Limpieza Masiva (Borrar TODO)

### 6. Eliminar TODOS los pedidos (Limpiar historial)
```sql
-- Opción rápida (Limpia detalles y pedidos automáticamente)
TRUNCATE TABLE orders CASCADE;
```

---

## 🔍 Consultas de Reportes (Queries)

### 7. Listado de usuarios con sus roles
```sql
SELECT u.name_user, u.last_name, u.email, r.name as rol, u.occupation
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY r.name;
```

### 8. Resumen de productos más pedidos
```sql
SELECT p.name_product, SUM(od.amount) as total_vendido
FROM order_details od
JOIN products p ON od.product_id = p.id
GROUP BY p.name_product
ORDER BY total_vendido DESC;
```
