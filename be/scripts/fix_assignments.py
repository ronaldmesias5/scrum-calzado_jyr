"""Assign employees to tasks directly via SQL."""
from sqlalchemy import text
from app.database import engine

conn = engine.connect()

# Map occupation → task_type
OCC_TO_TASK = {
    "cortador": "corte",
    "guarnecedor": "guarnicion",
    "solador": "soladura",
    "emplantillador": "emplantillado",
}

# Get employee IDs by occupation
r = conn.execute(text("SELECT id, occupation FROM users WHERE occupation IN ('cortador','guarnecedor','solador','emplantillador')"))
emp_map = {}
for row in r:
    emp_map[row[1]] = str(row[0])
print("Employees:", {k: v[:8] for k, v in emp_map.items()})

# Assign tasks by task_type
for occ, eid in emp_map.items():
    task_type = OCC_TO_TASK[occ]
    result = conn.execute(
        text("UPDATE tasks SET assigned_to = :eid, status = CASE WHEN status = 'pendiente' THEN 'en_progreso' ELSE status END WHERE type = :tt AND assigned_to IS NULL AND deleted_at IS NULL"),
        {"eid": eid, "tt": task_type}
    )
    print(f"  {occ} -> {task_type}: assigned {result.rowcount} tasks")

conn.commit()

# Verify
r = conn.execute(text("SELECT status, count(*) FROM tasks WHERE deleted_at IS NULL GROUP BY status"))
for row in r:
    print(f"  {row[0]}: {row[1]}")

r = conn.execute(text("SELECT count(*) FROM tasks WHERE assigned_to IS NOT NULL AND deleted_at IS NULL"))
print(f"Total assigned: {r.scalar()}")

conn.close()
