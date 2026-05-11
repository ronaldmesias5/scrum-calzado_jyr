import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.tasks import Task

def cleanup():
    db = SessionLocal()
    try:
        # 1. Corregir Vale 19
        task_19_id = uuid.UUID("902b3bed-f638-49a9-8e36-453d849fbfab")
        task_19 = db.query(Task).filter(Task.id == task_19_id).first()
        if task_19:
            print(f"Corrigiendo Vale 19: de {task_19.amount} a 20")
            task_19.amount = 20
        
        # 2. Eliminar duplicados de Vale 21
        to_delete = [
            uuid.UUID("1849f44f-4245-489b-bfac-62740d5faf46"),
            uuid.UUID("691185fe-5905-447f-8d24-5cfb593f4356")
        ]
        for tid in to_delete:
            t = db.query(Task).filter(Task.id == tid).first()
            if t:
                print(f"Eliminando duplicado Vale 21: {tid}")
                db.delete(t)
        
        db.commit()
        print("✅ Limpieza completada con éxito.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
