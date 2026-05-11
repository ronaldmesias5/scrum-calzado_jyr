import os
from sqlalchemy import text, create_engine

# Leer .env manualmente usando utf-8-sig para ignorar el BOM
db_url = None
try:
    with open(".env", "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip()
                break
except Exception as e:
    print(f"Error reading .env: {e}")

if not db_url:
    print("Migration failed: DATABASE_URL not found in .env (checked with utf-8-sig)")
    exit(1)

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;"))
        conn.commit()
    print("Migration successful: Added 'amount' column to 'tasks' table.")
except Exception as e:
    print(f"Migration failed: {e}")
