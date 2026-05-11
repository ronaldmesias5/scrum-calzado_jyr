import psycopg2
try:
    dsn = b"host=127.0.0.1 dbname=calzado_jyr_db user=jyr_user password=cambia_esta_contrasena_segura port=5432"
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    cur.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;")
    conn.commit()
    print("Migration successful")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
