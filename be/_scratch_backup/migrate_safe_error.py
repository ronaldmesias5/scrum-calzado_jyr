import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;")
    conn.commit()
    print("Migration successful")
    cur.close()
    conn.close()
except Exception as e:
    try:
        # Intentar imprimir el error con una codificación segura
        print(f"Migration failed: {str(e).encode('ascii', 'replace').decode('ascii')}")
    except:
        print("Migration failed with an unprintable error")
