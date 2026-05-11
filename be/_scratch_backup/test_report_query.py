import sys, os, traceback
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.modules.admin.reports_router import get_employee_report
from app.models.user import User
from sqlalchemy import select

db = SessionLocal()
try:
    # Buscar un empleado con tareas completadas
    from app.models.tasks import Task
    task = db.execute(select(Task).where(Task.status.in_(['completado', 'pagado'])).limit(1)).scalar()
    if task:
        user_id = task.assigned_to
        print(f"Testing with user_id: {user_id}")
        
        # Simular la llamada
        from sqlalchemy import func
        from app.models.order import OrderDetail
        from app.models.product import Product
        from app.models.category import Category
        
        order_pairs_sub = (
            select(OrderDetail.order_id, OrderDetail.product_id, func.sum(OrderDetail.amount).label("total_pairs"))
            .where(OrderDetail.deleted_at == None)
            .group_by(OrderDetail.order_id, OrderDetail.product_id)
            .subquery()
        )
        
        tasks_detail_query = (
            select(
                Task.id, Task.type, Task.description_task, Task.completed_at, Task.created_at, Task.status, 
                Task.amount.label("task_amount"), order_pairs_sub.c.total_pairs, Product.name_product, Product.task_prices, Task.order_id,
                Category.name_category, Product.image_url, Task.vale_number
            )
            .outerjoin(order_pairs_sub, (Task.order_id == order_pairs_sub.c.order_id) & (Task.product_id == order_pairs_sub.c.product_id))
            .join(Product, Task.product_id == Product.id)
            .outerjoin(Category, Product.category_id == Category.id)
            .where(Task.assigned_to == user_id, Task.status.in_(['completado', 'pagado']))
        )
        
        rows = db.execute(tasks_detail_query).all()
        print(f"Found {len(rows)} rows")
        for r in rows[:3]:
            print(f"  task_amount={r.task_amount}, total_pairs={r.total_pairs}, vale={r.vale_number}")
    else:
        print("No completed tasks found")
except Exception as e:
    traceback.print_exc()
finally:
    db.close()
