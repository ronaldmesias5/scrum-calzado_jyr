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
    print("Migration successful")
    cur.close()
    conn.close()
except Exception as e:
    import traceback
    print("MIGRATION_FAILED_RAW_START")
    print(traceback.format_exc().encode('ascii', 'replace'))
    print("MIGRATION_FAILED_RAW_END")
