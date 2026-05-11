import sys
import os
# Añadir el path del proyecto para importar los módulos de la app
sys.path.append(os.getcwd())

from app.core.database import engine
from sqlalchemy import text

def run_migration():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;"))
            conn.commit()
            print("SUCCESS: La columna 'amount' fue añadida correctamente.")
    except Exception as e:
        print(f"ERROR: No se pudo ejecutar el comando: {e}")

if __name__ == "__main__":
    run_migration()
