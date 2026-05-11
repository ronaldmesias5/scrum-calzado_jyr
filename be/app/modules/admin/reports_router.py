from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, cast, String, text
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from uuid import UUID, uuid4

from app.core.dependencies import get_current_user, get_db, _require_admin_or_jefe
from app.models.user import User
from app.models.order import Order, OrderStatus, OrderDetail
from app.models.tasks import Task, TaskStatus
from app.models.product import Product
from app.models.category import Category
from typing import List as TypingList
from app.modules.admin.reports_schemas import (
    DashboardReportResponse,
    KPIResponse,
    CategorySalesResponse,
    TopProductResponse,
    EmployeeReportResponse,
    TaskBreakdown,
    TaskDetail,
    TaskPriceDetail,
    CustomerReportResponse,
    OrderSummary,
    OrderItemSummary,
    TopCustomerResponse,
    TopEmployeeResponse,
    ProductionGlobalReport,
    ProductionWeeklyMetric,
    SalesGlobalReport,
    SalesWeeklyMetric,
)

router = APIRouter(
    prefix="/api/v1/admin/reports",
    tags=["admin-reports"],
)


@router.get("/dashboard", response_model=DashboardReportResponse)
def get_dashboard_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30, description="Número de días hacia atrás para el reporte"),
):
    """
    Obtiene los KPIs y gráficos principales para el dashboard de reportes.
    Filtra por los últimos X días.
    """
    _require_admin_or_jefe(current_user)
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # 1. KPIs
    # Pedidos totales en el periodo
    total_orders = db.scalar(
        select(func.count(Order.id))
        .where(Order.created_at >= start_date)
    ) or 0
    
    # Pares Vendidos (en pedidos completados o entregados)
    total_pairs_sold = db.scalar(
        select(func.sum(Order.total_pairs))
        .where(
            (Order.created_at >= start_date) & 
            (Order.state.in_([OrderStatus.completado, OrderStatus.entregado]))
        )
    ) or 0
    
    # Tareas completadas en el periodo
    total_tasks_completed = db.scalar(
        select(func.count(Task.id))
        .where(
            (Task.created_at >= start_date) & 
            (Task.status == 'completado')
        )
    ) or 0
    
    # Pares en Producción (órdenes en progreso)
    pairs_in_production = db.scalar(
        select(func.sum(Order.total_pairs))
        .where(Order.state == OrderStatus.en_progreso)
    ) or 0
    
    kpis = KPIResponse(
        total_orders=total_orders,
        total_pairs_sold=int(total_pairs_sold),
        total_tasks_completed=total_tasks_completed,
        pairs_in_production=int(pairs_in_production),
    )
    
    # 2. Ventas por categoría
    # Agrupar OrderDetail por categoría del producto para pedidos completados/entregados
    category_query = (
        select(
            Category.name_category,
            func.sum(OrderDetail.amount).label("total_sold")
        )
        .join(Product, OrderDetail.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .join(Order, OrderDetail.order_id == Order.id)
        .where(
            (Order.created_at >= start_date) &
            (Order.state.in_([OrderStatus.completado, OrderStatus.entregado])) &
            (OrderDetail.deleted_at == None)
        )
        .group_by(Category.name_category)
    )
    category_results = db.execute(category_query).all()
    
    total_category_sales = sum(row.total_sold for row in category_results) or 1 # Evitar div/0
    
    sales_by_category = [
        CategorySalesResponse(
            category_name=row.name_category,
            pairs_sold=int(row.total_sold),
            percentage=round((int(row.total_sold) / total_category_sales) * 100, 1)
        )
        for row in category_results
    ]
    
    # 3. Productos más vendidos
    top_products_query = (
        select(
            Product.id,
            Product.name_product,
            Product.image_url,
            func.sum(OrderDetail.amount).label("total_sold")
        )
        .join(OrderDetail, Product.id == OrderDetail.product_id)
        .join(Order, OrderDetail.order_id == Order.id)
        .where(
            (Order.created_at >= start_date) &
            (Order.state.in_([OrderStatus.completado, OrderStatus.entregado])) &
            (OrderDetail.deleted_at == None)
        )
        .group_by(Product.id)
        .order_by(desc("total_sold"))
        .limit(5)
    )
    top_products_results = db.execute(top_products_query).all()
    
    top_products = [
        TopProductResponse(
            product_id=row.id,
            product_name=row.name_product,
            sales=int(row.total_sold),
            image_url=row.image_url
        )
        for row in top_products_results
    ]
    
    # 4. Top Clientes
    # Clientes con mayor número de pares pedidos en el periodo
    top_customers_query = (
        select(
            User.id,
            User.name_user,
            User.last_name,
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total_pairs).label("total_pairs")
        )
        .join(Order, User.id == Order.customer_id)
        .where(
            (Order.created_at >= start_date) &
            (Order.state.in_([OrderStatus.completado, OrderStatus.entregado]))
        )
        .group_by(User.id)
        .order_by(desc("total_pairs"))
        .limit(5)
    )
    top_customers_results = db.execute(top_customers_query).all()
    top_customers = [
        TopCustomerResponse(
            user_id=row.id,
            name=f"{row.name_user} {row.last_name}",
            total_orders=int(row.total_orders),
            total_pairs=int(row.total_pairs)
        )
        for row in top_customers_results
    ]

    # 5. Top Empleados (Eficiencia por cargo)
    # Tareas completadas por empleado
    top_employees_query = (
        select(
            User.id,
            User.name_user,
            User.last_name,
            User.occupation,
            func.count(Task.id).label("completed_tasks")
        )
        .join(Task, User.id == Task.assigned_to)
        .where(
            (Task.created_at >= start_date) &
            (Task.status == 'completado')
        )
        .group_by(User.id)
        .order_by(desc("completed_tasks"))
    )
    top_employees_results = db.execute(top_employees_query).all()
    
    # Agrupar al mejor por cargo
    best_by_role = {}
    for row in top_employees_results:
        role = row.occupation or "Desconocido"
        if role not in best_by_role:
            best_by_role[role] = TopEmployeeResponse(
                user_id=row.id,
                name=f"{row.name_user} {row.last_name}",
                occupation=role,
                completed_tasks=int(row.completed_tasks)
            )
            
    top_employees = list(best_by_role.values())
    
    return DashboardReportResponse(
        kpis=kpis,
        sales_by_category=sales_by_category,
        top_products=top_products,
        top_customers=top_customers,
        top_employees=top_employees
    )

@router.get("/employee/{user_id}", response_model=EmployeeReportResponse)
def get_employee_report(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
):
    """Obtiene el reporte de rendimiento de un empleado"""
    _require_admin_or_jefe(current_user)
    
    employee = db.query(User).filter(User.id == user_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
        
    # Subconsulta para obtener el total de pares por (orden, producto)
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
            Task.product_id, Category.name_category, Product.image_url, Task.vale_number
        )
        .outerjoin(order_pairs_sub, (Task.order_id == order_pairs_sub.c.order_id) & (Task.product_id == order_pairs_sub.c.product_id))
        .join(Product, Task.product_id == Product.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .where(Task.assigned_to == user_id, Task.status.in_(['completado', 'pagado']), Task.deleted_at == None)
    )
    
    if start_date:
        tasks_detail_query = tasks_detail_query.where(func.coalesce(Task.completed_at, Task.created_at) >= start_date)
    if end_date:
        tasks_detail_query = tasks_detail_query.where(func.coalesce(Task.completed_at, Task.created_at) <= end_date)
        
    task_detail_rows = db.execute(tasks_detail_query).all()
    
    # Obtener el desglose por tipo de tarea
    breakdown_query = (
        select(Task.type, func.count(Task.id).label("count"))
        .where(Task.assigned_to == user_id, Task.status.in_(['completado', 'pagado']), Task.deleted_at == None)
        .group_by(Task.type)
    )
    if start_date:
        breakdown_query = breakdown_query.where(func.coalesce(Task.completed_at, Task.created_at) >= start_date)
    if end_date:
        breakdown_query = breakdown_query.where(func.coalesce(Task.completed_at, Task.created_at) <= end_date)
        
    breakdown_results = db.execute(breakdown_query).all()
    
    tasks_breakdown = [
        TaskBreakdown(
            process_name=str(row._mapping['type'].value) if hasattr(row._mapping['type'], 'value') else str(row._mapping['type']), 
            count=row._mapping['count']
        )
        for row in breakdown_results
    ]

    total_earnings = 0.0
    tasks_list = []
    for row_obj in task_detail_rows:
        row = row_obj._mapping
        pairs = int(row['task_amount'] if (row['task_amount'] and row['task_amount'] > 0) else (row['total_pairs'] or 0))
        prices = row['task_prices'] or {}
        task_type = str(row['type'].value) if hasattr(row['type'], 'value') else str(row['type'])
        price_per_dozen = float(prices.get(task_type, 0) or 0)
        task_price = round((pairs / 12) * price_per_dozen, 2) if pairs > 0 else 0.0
        total_earnings += task_price
        
        product_details = [
            TaskPriceDetail(
                product_id=row['product_id'],
                product_name=row['name_product'],
                pairs=pairs,
                price_per_dozen=price_per_dozen,
                total_price=task_price,
            )
        ]
        
        status_str = str(row['status'].value) if hasattr(row['status'], 'value') else str(row['status'])
        
        tasks_list.append(
            TaskDetail(
                id=row['id'],
                order_id=row['order_id'],
                product_name=row['name_product'],
                process_name=task_type,
                amount=pairs,
                status=status_str,
                vale_number=row['vale_number'],
                created_at=row['completed_at'] or row['created_at'],
                price_per_dozen=price_per_dozen,
                task_total_price=task_price,
                product_details=product_details,
                product_category=row['name_category'],
                product_image=row['image_url'],
            )
        )
    
    return EmployeeReportResponse(
        user_id=employee.id,
        name=f"{employee.name_user} {employee.last_name}",
        total_tasks_completed=len(tasks_list),
        total_pairs_produced=sum(t.amount for t in tasks_list),
        total_earnings=round(total_earnings, 2),
        tasks_breakdown=tasks_breakdown,
        tasks_list=tasks_list
    )

@router.get("/role/{role_name}", response_model=EmployeeReportResponse)
def get_role_report(
    role_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    status: Optional[str] = Query(None)
):
    """Obtiene el reporte consolidado de todos los empleados con un cargo específico"""
    _require_admin_or_jefe(current_user)
    
    # Obtener IDs de usuarios con ese cargo (usando el campo correcto 'occupation' y casting para evitar errores de Enum)
    user_ids = [u.id for u in db.query(User).filter(cast(User.occupation, String) == role_name.lower()).all()]
    if not user_ids:
        return EmployeeReportResponse(
            user_id=uuid4(),
            name=f"Todo el personal de {role_name}",
            total_tasks_completed=0,
            total_pairs_produced=0,
            tasks_breakdown=[],
            tasks_list=[]
        )

    query = select(Task).where(Task.assigned_to.in_(user_ids))
    if start_date:
        query = query.where(Task.created_at >= start_date)
    if end_date:
        query = query.where(Task.created_at <= end_date)
    if status:
        query = query.where(Task.status == status)
    else:
        query = query.where(Task.status.in_(['completado', 'pagado']))
        
    tasks = db.execute(query).scalars().all()
    
    total_tasks_completed = len(tasks)
    
    # Calcular pares totales por tareas (usando Task.amount como fuente de verdad)
    task_pairs_query = (
        select(func.sum(func.coalesce(Task.amount, 0)))
        .where(Task.assigned_to.in_(user_ids))
    )
    if start_date:
        task_pairs_query = task_pairs_query.where(Task.created_at >= start_date)
    if end_date:
        task_pairs_query = task_pairs_query.where(Task.created_at <= end_date)
    if status:
        task_pairs_query = task_pairs_query.where(Task.status == status)
    else:
        task_pairs_query = task_pairs_query.where(Task.status.in_(['completado', 'pagado']))
        
    total_pairs_produced = db.execute(task_pairs_query).scalar() or 0
    
    # Desglose por tipo de proceso
    breakdown_query = select(Task.type, func.count(Task.id).label("count")).where(Task.assigned_to.in_(user_ids))
    if start_date:
        breakdown_query = breakdown_query.where(Task.created_at >= start_date)
    if end_date:
        breakdown_query = breakdown_query.where(Task.created_at <= end_date)
    if status:
        breakdown_query = breakdown_query.where(Task.status == status)
    else:
        breakdown_query = breakdown_query.where(Task.status.in_(['completado', 'pagado']))
    
    breakdown_query = breakdown_query.group_by(Task.type)
    breakdown_rows = db.execute(breakdown_query).all()
    tasks_breakdown = [
        TaskBreakdown(
            process_name=str(row._mapping['type'].value) if hasattr(row._mapping['type'], 'value') else str(row._mapping['type']), 
            count=row._mapping['count']
        ) 
        for row in breakdown_rows
    ]
    
    # Reutilizar o definir la subconsulta de pares para este ámbito
    pairs_sub = (
        select(OrderDetail.order_id, OrderDetail.product_id, func.sum(OrderDetail.amount).label("total"))
        .where(OrderDetail.deleted_at == None)
        .group_by(OrderDetail.order_id, OrderDetail.product_id)
        .subquery()
    )

    task_detail_query = (
        select(
            Task, Order.id, Product.name_product, pairs_sub.c.total,
            Category.name_category, Product.image_url, Product.task_prices,
            Task.amount.label("task_amount")
        )
        .outerjoin(Order, Task.order_id == Order.id)
        .outerjoin(Product, Task.product_id == Product.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .outerjoin(pairs_sub, (Task.order_id == pairs_sub.c.order_id) & (Task.product_id == pairs_sub.c.product_id))
        .where(Task.assigned_to.in_(user_ids))
    )
    if start_date:
        task_detail_query = task_detail_query.where(Task.created_at >= start_date)
    if end_date:
        task_detail_query = task_detail_query.where(Task.created_at <= end_date)
    if status:
        task_detail_query = task_detail_query.where(Task.status == status)
    else:
        task_detail_query = task_detail_query.where(Task.status.in_(['completado', 'pagado']))
        
    task_detail_query = task_detail_query.order_by(desc(Task.created_at))
    task_detail_rows = db.execute(task_detail_query).all()
    
    tasks_list = []
    total_earnings = 0.0
    for row_obj in task_detail_rows:
        row = row_obj._mapping
        task_obj = row['Task']
        # Prioridad a task_amount (guardado al crear la tarea), fallback a suma de OrderDetail
        pairs = int(row['task_amount'] if (row['task_amount'] and row['task_amount'] > 0) else (row['total'] or 0))

        prices = row['task_prices'] or {}
        task_type_str = str(task_obj.type.value) if hasattr(task_obj.type, 'value') else str(task_obj.type)
        price_per_dozen = float(prices.get(task_type_str, 0) or 0)
        task_total_price = round((pairs / 12) * price_per_dozen, 2) if pairs > 0 else 0.0
        total_earnings += task_total_price
        
        tasks_list.append(
            TaskDetail(
                id=task_obj.id,
                order_id=row['id'], # Order.id
                product_name=row['name_product'] or "Producto Desconocido",
                process_name=task_type_str,
                amount=pairs,
                status=str(task_obj.status.value) if hasattr(task_obj.status, 'value') else str(task_obj.status),
                vale_number=task_obj.vale_number,
                created_at=task_obj.created_at,
                price_per_dozen=price_per_dozen,
                task_total_price=task_total_price,
                product_category=row['name_category'],
                product_image=row['image_url'],
                product_details=[
                    TaskPriceDetail(
                        product_id=task_obj.product_id,
                        product_name=row['name_product'] or "Producto Desconocido",
                        pairs=pairs,
                        price_per_dozen=price_per_dozen,
                        total_price=task_total_price
                    )
                ]
            )
        )
    
    return EmployeeReportResponse(
        user_id=uuid4(),
        name=f"Todo el personal de {role_name}",
        total_tasks_completed=len(tasks_list),
        total_pairs_produced=sum(t.amount for t in tasks_list),
        total_earnings=round(total_earnings, 2),
        tasks_breakdown=tasks_breakdown,
        tasks_list=tasks_list
    )


@router.get("/customer/all/orders", response_model=CustomerReportResponse)
def get_all_customers_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    state: Optional[str] = Query(None)
):
    """Obtiene el reporte de todos los pedidos de todos los clientes"""
    _require_admin_or_jefe(current_user)
    
    query = select(Order)
    
    if start_date:
        query = query.where(Order.created_at >= start_date)
    if end_date:
        query = query.where(Order.created_at <= end_date)
    if state:
        query = query.where(Order.state == state)
        
    query = query.order_by(desc(Order.created_at))
    orders = db.execute(query).scalars().all()
    
    total_orders = len(orders)
    total_pairs = sum((o.total_pairs or 0) for o in orders)
    total_spent = sum(getattr(o, 'total_price', 0.0) or 0.0 for o in orders)
    
    orders_list = []
    for o in orders:
        # Agrupar items por product_id para evitar duplicados en la vista (por tallas/colores)
        product_map = {}
        for item in (o.details or []):
            pid = item.product_id
            if pid not in product_map:
                p_name = "Producto Desconocido"
                p_img = None
                if item.product:
                    p_name = getattr(item.product, 'name_product', "Producto Desconocido")
                    p_img = getattr(item.product, 'image_url', None)
                product_map[pid] = OrderItemSummary(
                    product_id=pid,
                    product_name=p_name,
                    image_url=p_img,
                    amount=0
                )
            product_map[pid].amount += (item.amount or 0)
        
        orders_list.append(OrderSummary(
            id=o.id,
            total_pairs=o.total_pairs or 0,
            total_price=float(o.total_price) if hasattr(o, 'total_price') else 0.0,
            state=str(o.state.value) if hasattr(o.state, 'value') else str(o.state),
            created_at=o.created_at,
            items=list(product_map.values())
        ))
    
    return CustomerReportResponse(
        user_id=uuid4(),
        name="Todos los Clientes",
        total_orders=total_orders,
        total_pairs=int(total_pairs),
        total_spent=float(total_spent),
        orders=orders_list
    )



class MarkTasksPaidRequest(BaseModel):
    task_ids: TypingList[UUID]

@router.patch("/tasks/mark-paid")
def mark_tasks_as_paid(
    body: MarkTasksPaidRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca una lista de tareas completadas como pagadas"""
    _require_admin_or_jefe(current_user)
    
    if not body.task_ids:
        raise HTTPException(status_code=400, detail="No se proporcionaron IDs de tareas")
    
    tasks = db.query(Task).filter(
        Task.id.in_(body.task_ids),
        Task.status == 'completado'
    ).all()
    
    if not tasks:
        raise HTTPException(status_code=404, detail="No se encontraron tareas completadas con esos IDs")
    
    for task in tasks:
        task.status = 'pagado'
        task.updated_by = current_user.id
    
    db.commit()
    
    return {"message": f"{len(tasks)} tarea(s) marcadas como pagadas", "updated_count": len(tasks)}


@router.get("/customer/{user_id}", response_model=CustomerReportResponse)
def get_customer_report(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
):
    """Obtiene el reporte de compras de un cliente"""
    _require_admin_or_jefe(current_user)
    
    customer = db.query(User).filter(User.id == user_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    query = select(Order).where(Order.customer_id == user_id)
    
    if start_date:
        query = query.where(Order.created_at >= start_date)
    if end_date:
        query = query.where(Order.created_at <= end_date)
        
    query = query.order_by(desc(Order.created_at))
    orders = db.execute(query).scalars().all()
    
    total_orders = len(orders)
    total_pairs = sum((o.total_pairs or 0) for o in orders)
    total_spent = sum(getattr(o, 'total_price', 0.0) or 0.0 for o in orders)
    
    orders_metric = []
    for o in orders:
        # Agrupar items por product_id
        product_map = {}
        order_details = o.details if o.details else []
        for detail in order_details:
            pid = detail.product_id
            if pid not in product_map:
                p_name = "Producto Desconocido"
                p_img = None
                if detail.product:
                    p_name = getattr(detail.product, 'name_product', "Producto Desconocido")
                    p_img = getattr(detail.product, 'image_url', None)
                
                product_map[pid] = OrderItemSummary(
                    product_id=pid,
                    product_name=p_name,
                    image_url=p_img,
                    amount=0
                )
            product_map[pid].amount += (detail.amount or 0)
            
        orders_metric.append(OrderSummary(
            id=o.id,
            total_pairs=o.total_pairs or 0,
            total_price=float(o.total_price) if hasattr(o, 'total_price') else 0.0,
            state=str(o.state.value) if hasattr(o.state, 'value') else str(o.state),
            created_at=o.created_at,
            items=list(product_map.values())
        ))
        
    return CustomerReportResponse(
        user_id=customer.id,
        name=f"{customer.name_user} {customer.last_name}",
        total_orders=total_orders,
        total_pairs=int(total_pairs),
        total_spent=float(total_spent),
        orders=orders_metric
    )

@router.get("/global/production", response_model=ProductionGlobalReport)
def get_global_production(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    state: Optional[OrderStatus] = Query(None)
):
    """Obtiene el reporte general de producción y ventas por semana"""
    _require_admin_or_jefe(current_user)
    
    if not start_date:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
    if not end_date:
        end_date = datetime.now(timezone.utc)
    
    # 1. Métricas de Ventas (Pedidos creados)
    sales_query = db.query(Order).filter(Order.created_at >= start_date, Order.created_at <= end_date)
    if state:
        sales_query = sales_query.filter(Order.state == state)
    
    orders = sales_query.all()
    total_orders_created = len(orders)
    total_pairs_ordered = sum(o.total_pairs for o in orders)

    # 2. Métricas de Producción (Tareas completadas)
    tasks_query = db.query(Task).filter(Task.created_at >= start_date, Task.created_at <= end_date, Task.status == 'completado')
    if state:
        # Si hay filtro de estado, solo tareas de pedidos en ese estado
        tasks_query = tasks_query.join(Order, Task.order_id == Order.id).filter(Order.state == state)
    
    tasks = tasks_query.all()
    total_tasks_period = len(tasks)
    
    pairs_query = (
        select(Task.id, func.coalesce(Task.amount, 0).label("amount"), Task.created_at)
        .where(Task.created_at >= start_date, Task.created_at <= end_date, Task.status == 'completado')
    )
    if state:
        pairs_query = pairs_query.join(Order, Task.order_id == Order.id).where(Order.state == state)
        
    pairs_results = db.execute(pairs_query).all()
    # sumamos amount (que es el segundo elemento del tuple debido al distinct)
    total_pairs_period = sum(row[1] for row in pairs_results)
    
    # Contar pedidos únicos que tuvieron tareas completadas en este periodo
    orders_prod_query = select(func.count(func.distinct(Task.order_id))).where(Task.created_at >= start_date, Task.created_at <= end_date, Task.status == 'completado')
    if state:
        orders_prod_query = orders_prod_query.join(Order, Task.order_id == Order.id).where(Order.state == state)
    total_orders_period = db.scalar(orders_prod_query) or 0

    weeks = {}
    
    # Procesar ventas por semana
    for o in orders:
        year, week, _ = o.created_at.isocalendar()
        week_str = f"{year}-W{week:02d}"
        if week_str not in weeks:
            weeks[week_str] = {"pairs_manufactured": 0, "tasks_completed": 0, "orders_created": 0, "pairs_ordered": 0}
        weeks[week_str]["orders_created"] += 1
        weeks[week_str]["pairs_ordered"] += o.total_pairs

    # Procesar producción por semana
    for task in tasks:
        year, week, _ = task.created_at.isocalendar()
        week_str = f"{year}-W{week:02d}"
        if week_str not in weeks:
            weeks[week_str] = {"pairs_manufactured": 0, "tasks_completed": 0, "orders_created": 0, "pairs_ordered": 0}
        weeks[week_str]["tasks_completed"] += 1
        
    for row in pairs_results:
        year, week, _ = row.created_at.isocalendar()
        week_str = f"{year}-W{week:02d}"
        if week_str not in weeks:
            weeks[week_str] = {"pairs_manufactured": 0, "tasks_completed": 0, "orders_created": 0, "pairs_ordered": 0}
        weeks[week_str]["pairs_manufactured"] += row.amount
        
    # 3. Listado de Pedidos Detallado
    orders_data = []
    for o in orders:
        # Agrupar items por product_id
        product_map = {}
        for item in (o.details or []):
            pid = item.product_id
            if pid not in product_map:
                p_name = "Producto Desconocido"
                p_img = None
                if item.product:
                    p_name = getattr(item.product, 'name_product', "Producto Desconocido")
                    p_img = getattr(item.product, 'image_url', None)
                product_map[pid] = OrderItemSummary(
                    product_id=pid,
                    product_name=p_name,
                    image_url=p_img,
                    amount=0
                )
            product_map[pid].amount += (item.amount or 0)

        orders_data.append(OrderSummary(
            id=o.id,
            total_pairs=o.total_pairs or 0,
            total_price=float(o.total_price) if hasattr(o, 'total_price') else 0.0,
            state=str(o.state.value) if hasattr(o.state, 'value') else str(o.state),
            created_at=o.created_at,
            items=list(product_map.values())
        ))

    metrics = [
        ProductionWeeklyMetric(
            week=w,
            tasks_completed=data["tasks_completed"],
            pairs_manufactured=data["pairs_manufactured"],
            orders_created=data["orders_created"],
            pairs_ordered=data["pairs_ordered"]
        )
        for w, data in sorted(weeks.items(), reverse=True)
    ]
    
    return ProductionGlobalReport(
        total_pairs_period=total_pairs_period,
        total_tasks_period=total_tasks_period,
        total_orders_period=total_orders_period,
        total_orders_created=total_orders_created,
        total_pairs_ordered=total_pairs_ordered,
        weekly_metrics=metrics,
        orders=orders_data
    )

@router.get("/global/sales", response_model=SalesGlobalReport)
def get_global_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """Obtiene el reporte general de ventas por semana"""
    _require_admin_or_jefe(current_user)
    
    if not start_date:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
    if not end_date:
        end_date = datetime.now(timezone.utc)
    
    orders = db.query(Order).filter(
        Order.created_at >= start_date,
        Order.created_at <= end_date,
        Order.state.in_([OrderStatus.completado, OrderStatus.entregado])
    ).all()
    
    total_orders_period = len(orders)
    total_pairs_period = sum(o.total_pairs for o in orders)
    
    weeks = {}
    for o in orders:
        year, week, _ = o.created_at.isocalendar()
        week_str = f"{year}-W{week:02d}"
        if week_str not in weeks:
            weeks[week_str] = {"orders": 0, "pairs": 0}
        weeks[week_str]["orders"] += 1
        weeks[week_str]["pairs"] += o.total_pairs
        
    weekly_metrics = [
        SalesWeeklyMetric(week=w, orders_created=data["orders"], pairs_ordered=data["pairs"])
        for w, data in sorted(weeks.items())
    ]
    
    return SalesGlobalReport(
        total_orders_period=total_orders_period,
        total_pairs_period=total_pairs_period,
        weekly_metrics=weekly_metrics
    )

