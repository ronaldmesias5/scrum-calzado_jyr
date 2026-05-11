import os
from sqlalchemy import text, create_engine

# Leer .env como binario para evitar problemas de codec
db_url = None
try:
    with open(".env", "rb") as f:
        content = f.read()
        # Eliminar BOM si existe
        if content.startswith(b'\xef\xbb\xbf'):
            content = content[3:]
        
        lines = content.decode('utf-8', errors='ignore').splitlines()
        for line in lines:
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip()
                break
except Exception as e:
    print(f"Error reading .env: {e}")

if not db_url:
    print("Migration failed: DATABASE_URL not found in .env")
    exit(1)

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;"))
        conn.commit()
    print("Migration successful: Added 'amount' column to 'tasks' table.")
except Exception as e:
    print(f"Migration failed: {e}")
