from sqlalchemy import text, create_engine

db_url = "postgresql://jyr_user:cambia_esta_contrasena_segura@localhost:5432/calzado_jyr_db"

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;"))
        conn.commit()
    print("Migration successful: Added 'amount' column to 'tasks' table.")
except Exception as e:
    print(f"Migration failed: {e}")
