from sqlalchemy import text
from app.database import SessionLocal

db = SessionLocal()
try:
    prices1 = '{"corte": 3500, "guarnicion": 4200, "soladura": 3800, "emplantillado": 4500}'
    prices2 = '{"corte": 4000, "guarnicion": 4800, "soladura": 4200, "emplantillado": 5000}'
    prices3 = '{"corte": 3200, "guarnicion": 3900, "soladura": 3500, "emplantillado": 4200}'

    db.execute(text("UPDATE products SET task_prices = :p WHERE name_product = 'fgedbfd'"), {"p": prices1})
    db.execute(text("UPDATE products SET task_prices = :p WHERE name_product = 'bdfdf'"), {"p": prices2})
    db.execute(text("UPDATE products SET task_prices = :p WHERE name_product = 'dfbdfbsd'"), {"p": prices3})
    db.commit()

    result = db.execute(text("SELECT name_product, task_prices FROM products WHERE deleted_at IS NULL"))
    for row in result:
        print(f"  {row[0]}: {row[1]}")
    print("Done")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
