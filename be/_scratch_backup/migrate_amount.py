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
    print("Migration successful: Added 'amount' column to 'tasks' table.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
