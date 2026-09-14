"""Advance task statuses to populate analytics data."""
import requests
import secrets

BASE_URL = "http://localhost:8000/api/v1"
session = requests.Session()

# Login
session.get(f"{BASE_URL}/catalog/products")
r = session.post(f"{BASE_URL}/auth/login", json={"email": "ronald.jefe@gmail.com", "password": "Test123456!"})
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
csrf = session.cookies.get("csrf_token")
if csrf:
    h["X-CSRF-Token"] = csrf

# Get all tasks
r = session.get(f"{BASE_URL}/admin/orders/tasks/all", headers=h)
tasks = r.json()
print(f"Total tasks: {len(tasks)}")

# Get employees
r = session.get(f"{BASE_URL}/admin/users", headers=h)
users = r.json()
employees = {u["occupation"]: u["id"] for u in users if u.get("occupation") in ("cortador", "guarnecedor", "solador", "emplantillador")}
print(f"Employees: {employees}")

# Assign employees to tasks and advance statuses
stages = ["corte", "guarnicion", "soladura", "emplantillado"]
for i, task in enumerate(tasks):
    tid = task["id"]
    ttype = task["type"]
    current = task["status"]

    # Assign employee if not assigned
    if not task.get("assigned_to") and ttype in employees:
        r = session.patch(
            f"{BASE_URL}/admin/orders/tasks/{tid}/assign",
            headers=h,
            json={"assigned_to": employees[ttype]}
        )
        if r.ok:
            print(f"  Assigned {ttype} → {employees[ttype][:8]}...")

    # Advance: en_progreso → completado → pagado (for first 2 orders worth of tasks)
    order_idx = i // 4
    if order_idx < 2:
        # Complete all tasks for first 2 orders
        if current == "en_progreso":
            r = session.patch(f"{BASE_URL}/admin/orders/tasks/{tid}/status", headers=h, json={"status": "completado"})
            if r.ok:
                print(f"  Task {tid[:8]}... → completado")
                current = "completado"
        if current == "completado":
            r = session.patch(f"{BASE_URL}/admin/orders/tasks/{tid}/status", headers=h, json={"status": "pagado"})
            if r.ok:
                print(f"  Task {tid[:8]}... → pagado")
    elif order_idx < 4:
        # Half complete for orders 3-4
        stage_idx = stages.index(ttype) if ttype in stages else 0
        if stage_idx < 2:
            if current == "en_progreso":
                r = session.patch(f"{BASE_URL}/admin/orders/tasks/{tid}/status", headers=h, json={"status": "completado"})
                if r.ok:
                    print(f"  Task {tid[:8]}... → completado")

print("\nDone! Task statuses advanced.")
