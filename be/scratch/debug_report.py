import os
import sys
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta

# Mocking database and models for local testing if needed, 
# but better to try to import them and run a small query.
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.user import User
from app.models.tasks import Task
from app.models.order import Order, OrderDetail
from app.models.product import Product
from sqlalchemy import select, func, cast, String

def test_role_report():
    db = SessionLocal()
    try:
        role_name = "guarnecedor"
        print(f"Testing role: {role_name}")
        
        # 1. Get user ids
        user_ids = [u.id for u in db.query(User).filter(cast(User.occupation, String) == role_name.lower()).all()]
        print(f"Found {len(user_ids)} users")
        
        if not user_ids:
            print("No users found for this role.")
            return

        # 2. Test main query
        query = select(Task).where(Task.assigned_to.in_(user_ids))
        tasks = db.execute(query).scalars().all()
        print(f"Found {len(tasks)} tasks")
        
        # 3. Test pairs query
        task_pairs_query = select(func.sum(OrderDetail.amount)).join(Task, (Task.order_id == OrderDetail.order_id) & (Task.product_id == OrderDetail.product_id)).where(Task.assigned_to.in_(user_ids))
        total_pairs = db.execute(task_pairs_query).scalar() or 0
        print(f"Total pairs: {total_pairs}")
        
        # 4. Test breakdown
        breakdown_query = select(Task.type, func.count(Task.id)).where(Task.assigned_to.in_(user_ids)).group_by(Task.type)
        breakdown_rows = db.execute(breakdown_query).all()
        print(f"Breakdown rows: {len(breakdown_rows)}")
        
        # 5. Test detail list
        task_detail_query = (
            select(Task, Order.id, Product.name_product, OrderDetail.amount)
            .join(Order, Task.order_id == Order.id)
            .join(Product, Task.product_id == Product.id)
            .join(OrderDetail, (Task.order_id == OrderDetail.order_id) & (Task.product_id == OrderDetail.product_id))
            .where(Task.assigned_to.in_(user_ids))
        )
        detail_rows = db.execute(task_detail_query).all()
        print(f"Detail rows: {len(detail_rows)}")
        
        print("Success! No 500 error in queries.")
        
    except Exception as e:
        print(f"FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_role_report()
