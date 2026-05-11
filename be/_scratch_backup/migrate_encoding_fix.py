import psycopg2
try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        database="calzado_jyr_db",
        user="jyr_user",
        password="cambia_esta_contrasena_segura",
        port=5432,
        client_encoding='utf8'
    )
    cur = conn.cursor()
    cur.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;")
    conn.commit()
    print("Migration successful")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
