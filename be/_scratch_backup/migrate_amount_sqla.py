import os
from sqlalchemy import text, create_engine
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

db_url = os.getenv("DATABASE_URL")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;"))
        conn.commit()
    print("Migration successful: Added 'amount' column to 'tasks' table.")
except Exception as e:
    print(f"Migration failed: {e}")
