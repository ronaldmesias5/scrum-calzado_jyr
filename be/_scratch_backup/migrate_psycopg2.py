import psycopg2
try:
    conn = psycopg2.connect(
        host="localhost",
        database="calzado_jyr_db",
        user="jyr_user",
        password="cambia_esta_contrasena_segura",
        port=5432
    )
    cur = conn.cursor()
    cur.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;")
    conn.commit()
    print("Migration successful: Added 'amount' column to 'tasks' table.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
