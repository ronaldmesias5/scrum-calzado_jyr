"""
Script: seed_full_flow.py
Descripción: Crea datos de prueba completos para verificar analytics:
  - 1 jefe (ya existe)
  - 4 empleados (cortador, guarnecedor, solador, emplantillador)
  - 2 clientes
  - Actualiza task_prices de productos existentes
  - Crea 6 pedidos con detalles
  - Crea tareas de producción
  - Avanza estados de tareas para generar datos de analytics
Uso: docker compose exec be python scripts/seed_full_flow.py
"""

import requests
import json
import uuid
from datetime import datetime, timedelta, timezone

BASE_URL = "http://localhost:8000/api/v1"

# ── Session global para manejar cookies CSRF ──
session = requests.Session()

# ── Login como admin ──────────────────────────
def login(email, password):
    # Primero hacer un GET para obtener la cookie CSRF
    session.get(f"{BASE_URL}/catalog/products")
    r = session.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    data = r.json()
    return data["access_token"]

# ── Headers con token + CSRF ──────────────────
def headers(token):
    h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    csrf = session.cookies.get("csrf_token")
    if csrf:
        h["X-CSRF-Token"] = csrf
    return h

# ── Crear empleado ────────────────────────────
def create_employee(token, email, name, last_name, occupation, phone=None, doc=None):
    payload = {
        "email": email,
        "name": name,
        "last_name": last_name,
        "occupation": occupation,
        "password": "Test123456!",
    }
    if phone:
        payload["phone"] = phone
    if doc:
        payload["identity_document"] = doc
    r = session.post(f"{BASE_URL}/admin/users/create-employee", headers=headers(token), json=payload)
    if r.status_code == 400 and "Ya existe" in r.text:
        print(f"  ⚠ Empleado {email} ya existe, buscando ID...")
        r2 = session.get(f"{BASE_URL}/admin/users", headers=headers(token))
        if r2.ok:
            for u in r2.json():
                if u["email"] == email:
                    return u["id"]
        return None
    r.raise_for_status()
    data = r.json()
    print(f"  ✅ Empleado creado: {name} {last_name} ({occupation}) — ID: {data['id']}")
    return data["id"]

# ── Crear cliente ─────────────────────────────
def create_client(token, email, name, last_name, phone=None, biz=None):
    payload = {
        "email": email,
        "name": name,
        "last_name": last_name,
        "password": "Test123456!",
    }
    if phone:
        payload["phone"] = phone
    if biz:
        payload["business_name"] = biz
    r = session.post(f"{BASE_URL}/admin/users/create-client", headers=headers(token), json=payload)
    if r.status_code == 400 and "Ya existe" in r.text:
        print(f"  ⚠ Cliente {email} ya existe, buscando ID...")
        r2 = session.get(f"{BASE_URL}/admin/users", headers=headers(token))
        if r2.ok:
            for u in r2.json():
                if u["email"] == email:
                    return u["id"]
        return None
    r.raise_for_status()
    data = r.json()
    print(f"  ✅ Cliente creado: {name} {last_name} — ID: {data['id']}")
    return data["id"]

# ── Actualizar task_prices de producto ─────────
def update_product_prices(token, product_id, prices):
    r = session.put(f"{BASE_URL}/admin/catalog/products/{product_id}", headers=headers(token), json={"task_prices": prices})
    if r.ok:
        print(f"  ✅ Precios actualizados para producto {product_id}")
    else:
        print(f"  ⚠ Error actualizando precios: {r.status_code} — {r.text[:200]}")

# ── Crear orden ───────────────────────────────
def create_order(token, customer_id, total_pairs, details, delivery_days=14):
    delivery = (datetime.now(timezone.utc) + timedelta(days=delivery_days)).isoformat()
    payload = {
        "customer_id": customer_id,
        "total_pairs": total_pairs,
        "delivery_date": delivery,
        "details": details,
    }
    r = session.post(f"{BASE_URL}/admin/orders", headers=headers(token), json=payload)
    r.raise_for_status()
    data = r.json()
    print(f"  ✅ Orden creada: {data['id']} — {total_pairs} pares, estado: {data['state']}")
    return data["id"]

# ── Crear tareas de producción ─────────────────
def create_tasks(token, order_id, tasks_list):
    payload = {"tasks": tasks_list}
    r = session.post(f"{BASE_URL}/admin/orders/{order_id}/tasks", headers=headers(token), json=payload)
    r.raise_for_status()
    data = r.json()
    print(f"  ✅ {len(data)} tareas creadas para orden {order_id}")
    return [t["id"] for t in data]

# ── Avanzar estado de tarea ────────────────────
def update_task_status(token, task_id, status):
    payload = {"status": status}
    r = session.patch(f"{BASE_URL}/admin/orders/tasks/{task_id}/status", headers=headers(token), json=payload)
    if r.ok:
        return True
    else:
        print(f"  ⚠ Error actualizando tarea {task_id}: {r.status_code} — {r.text[:100]}")
        return False

# ══════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 60)
    print("🌱 SEED COMPLETO — CALZADO J&R")
    print("=" * 60)

    # 1. Login
    print("\n1️⃣  Login como admin...")
    token = login("ronald.jefe@gmail.com", "Test123456!")
    print("  ✅ Token obtenido")

    # 2. Crear empleados (4 ocupaciones)
    print("\n2️⃣  Creando empleados...")
    employees = {}
    emp_data = [
        ("cortador1@jyr.com", "Carlos", "Rodriguez", "cortador", "3101234567"),
        ("guarnecedor1@jyr.com", "Ana", "Martinez", "guarnecedor", "3112345678"),
        ("solador1@jyr.com", "Pedro", "Lopez", "solador", "3123456789"),
        ("emplantillador1@jyr.com", "Laura", "Garcia", "emplantillador", "3134567890"),
    ]
    for email, name, last, occ, phone in emp_data:
        eid = create_employee(token, email, name, last, occ, phone)
        if eid:
            employees[occ] = eid

    # 3. Crear clientes
    print("\n3️⃣  Creando clientes...")
    clients = {}
    client_data = [
        ("cliente1@jyr.com", "Maria", "Fernandez", "3145678901", "Distribuidora Norte"),
        ("cliente2@jyr.com", "Juan", "Perez", "3156789012", "Calzado Express"),
    ]
    for email, name, last, phone, biz in client_data:
        cid = create_client(token, email, name, last, phone, biz)
        if cid:
            clients[email] = cid

    # 4. Actualizar task_prices de productos
    print("\n4️⃣  Actualizando precios de productos...")
    product_prices = {
        "c4c47082-fcfa-4b2e-801a-3902e841e98a": {"corte": 3500, "guarnicion": 4200, "soladura": 3800, "emplantillado": 4500},
        "c1d5d879-1173-45da-b084-adba48c3e574": {"corte": 4000, "guarnicion": 4800, "soladura": 4200, "emplantillado": 5000},
        "581e5891-74e1-4e58-ba63-4109b65a2f87": {"corte": 3200, "guarnicion": 3900, "soladura": 3500, "emplantillado": 4200},
    }
    for pid, prices in product_prices.items():
        update_product_prices(token, pid, prices)

    # 5. Crear pedidos (6 pedidos variados)
    print("\n5️⃣  Creando pedidos...")

    client_ids = list(clients.values())
    product_ids = list(product_prices.keys())

    orders_created = []

    # Pedido 1: Cliente1, 24 pares, 1 producto
    details1 = [
        {"product_id": product_ids[0], "size": "35", "colour": "Negro", "amount": 12, "line_group": 1},
        {"product_id": product_ids[0], "size": "36", "colour": "Negro", "amount": 12, "line_group": 1},
    ]
    oid = create_order(token, client_ids[0], 24, details1, delivery_days=7)
    orders_created.append(oid)

    # Pedido 2: Cliente2, 36 pares, 1 producto
    details2 = [
        {"product_id": product_ids[1], "size": "38", "colour": "Blanco", "amount": 18, "line_group": 1},
        {"product_id": product_ids[1], "size": "39", "colour": "Blanco", "amount": 18, "line_group": 1},
    ]
    oid = create_order(token, client_ids[1], 36, details2, delivery_days=10)
    orders_created.append(oid)

    # Pedido 3: Cliente1, 48 pares, 2 productos
    details3 = [
        {"product_id": product_ids[0], "size": "34", "colour": "Azul", "amount": 24, "line_group": 1},
        {"product_id": product_ids[2], "size": "28", "colour": "Rojo", "amount": 24, "line_group": 1},
    ]
    oid = create_order(token, client_ids[0], 48, details3, delivery_days=14)
    orders_created.append(oid)

    # Pedido 4: Cliente2, 60 pares, 1 producto
    details4 = [
        {"product_id": product_ids[1], "size": "40", "colour": "Verde", "amount": 30, "line_group": 1},
        {"product_id": product_ids[1], "size": "41", "colour": "Verde", "amount": 30, "line_group": 1},
    ]
    oid = create_order(token, client_ids[1], 60, details4, delivery_days=21)
    orders_created.append(oid)

    # Pedido 5: Cliente1, 24 pares, 1 producto
    details5 = [
        {"product_id": product_ids[2], "size": "30", "colour": "Rosa", "amount": 12, "line_group": 1},
        {"product_id": product_ids[2], "size": "31", "colour": "Rosa", "amount": 12, "line_group": 1},
    ]
    oid = create_order(token, client_ids[0], 24, details5, delivery_days=5)
    orders_created.append(oid)

    # Pedido 6: Cliente2, 36 pares, 1 producto
    details6 = [
        {"product_id": product_ids[0], "size": "37", "colour": "Gris", "amount": 18, "line_group": 1},
        {"product_id": product_ids[0], "size": "38", "colour": "Gris", "amount": 18, "line_group": 1},
    ]
    oid = create_order(token, client_ids[1], 36, details6, delivery_days=12)
    orders_created.append(oid)

    # 6. Crear tareas de producción (4 etapas por orden)
    print("\n6️⃣  Creando tareas de producción...")
    all_task_ids = []
    stages = ["corte", "guarnicion", "soladura", "emplantillado"]

    for i, oid in enumerate(orders_created):
        # Usar el primer producto de cada pedido para las tareas
        pid = product_ids[i % len(product_ids)]
        total_pairs = [24, 36, 48, 60, 24, 36][i]

        tasks_list = []
        for stage in stages:
            tasks_list.append({
                "product_id": pid,
                "type": stage,
                "amount": total_pairs,
                "line_group": 1,
                "priority": "baja",
                "description": f"Tarea de {stage} para pedido {i+1}",
            })

        task_ids = create_tasks(token, oid, tasks_list)
        all_task_ids.extend(task_ids)

    # 7. Avanzar estados de tareas para generar datos de analytics
    print("\n7️⃣  Avanzando estados de tareas...")

    # Pedidos 1-2: todas las tareas completadas (pagado)
    for oid_idx in [0, 1]:
        start = oid_idx * 4
        for tid in all_task_ids[start:start+4]:
            update_task_status(token, tid, "en_progreso")
            update_task_status(token, tid, "completado")
            update_task_status(token, tid, "pagado")

    # Pedido 3: 2 etapas completadas, 2 en progreso
    start = 8
    for tid in all_task_ids[start:start+2]:
        update_task_status(token, tid, "en_progreso")
        update_task_status(token, tid, "completado")
    for tid in all_task_ids[start+2:start+4]:
        update_task_status(token, tid, "en_progreso")

    # Pedido 4: 1 etapa completada, 3 pendientes
    start = 12
    update_task_status(token, all_task_ids[start], "en_progreso")
    update_task_status(token, all_task_ids[start], "completado")

    # Pedido 5: todas en progreso
    start = 16
    for tid in all_task_ids[start:start+4]:
        update_task_status(token, tid, "en_progreso")

    # Pedido 6: 3 completadas, 1 en progreso
    start = 20
    for tid in all_task_ids[start:start+3]:
        update_task_status(token, tid, "en_progreso")
        update_task_status(token, tid, "completado")
    update_task_status(token, all_task_ids[start+3], "en_progreso")

    # 8. Avanzar estado de algunos pedidos
    print("\n8️⃣  Avanzando estados de pedidos...")
    for oid in orders_created[:2]:
        r = session.patch(
            f"{BASE_URL}/admin/orders/{oid}/status",
            headers=headers(token),
            json={"state": "completado"}
        )
        if r.ok:
            print(f"  ✅ Orden {oid[:8]}... → completado")
        else:
            print(f"  ⚠ Error orden {oid[:8]}: {r.status_code}")

    for oid in orders_created[2:4]:
        r = session.patch(
            f"{BASE_URL}/admin/orders/{oid}/status",
            headers=headers(token),
            json={"state": "en_progreso"}
        )
        if r.ok:
            print(f"  ✅ Orden {oid[:8]}... → en_progreso")

    print("\n" + "=" * 60)
    print("🎉 SEED COMPLETADO")
    print("=" * 60)
    print(f"\n📊 Resumen:")
    print(f"  • Empleados creados: {len(employees)}")
    print(f"  • Clientes creados: {len(clients)}")
    print(f"  • Pedidos creados: {len(orders_created)}")
    print(f"  • Tareas creadas: {len(all_task_ids)}")
    print(f"\n🔑 Credenciales de prueba:")
    print(f"  Admin: ronald.jefe@gmail.com / Test123456!")
    print(f"  Empleados: [nombre]@jyr.com / Test123456!")
    print(f"  Clientes: [nombre]@jyr.com / Test123456!")
    print(f"\n📈 Analytics ahora debería mostrar datos en:")
    print(f"  • Admin: 3 gráficas (pedidos, producción, ingresos por semana)")
    print(f"  • Empleado: 2 gráficas (tareas, ganancias por semana)")
    print(f"  • Cliente: 2 gráficas (pedidos, pares por mes)")
