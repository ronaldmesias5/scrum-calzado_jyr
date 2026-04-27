from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class KPIResponse(BaseModel):
    total_orders: int
    total_pairs_sold: int
    total_tasks_completed: int
    pairs_in_production: int

class CategorySalesResponse(BaseModel):
    category_name: str
    pairs_sold: int
    percentage: float

class TopProductResponse(BaseModel):
    product_id: UUID
    product_name: str
    sales: int
    image_url: Optional[str] = None



class TaskDetail(BaseModel):
    id: UUID
    order_id: Optional[UUID] = None
    product_name: str
    process_name: str
    amount: int
    status: str
    created_at: datetime

class TaskBreakdown(BaseModel):
    process_name: str
    count: int

class EmployeeReportResponse(BaseModel):
    user_id: UUID
    name: str
    total_tasks_completed: int
    total_pairs_produced: int
    tasks_breakdown: List[TaskBreakdown]
    tasks_list: List[TaskDetail] = []

class OrderItemSummary(BaseModel):
    product_id: UUID
    product_name: str
    image_url: Optional[str] = None
    amount: int

class OrderSummary(BaseModel):
    id: UUID
    total_pairs: int
    total_price: float = 0.0
    state: str
    created_at: datetime
    items: List[OrderItemSummary] = []

class CustomerReportResponse(BaseModel):
    user_id: UUID
    name: str
    total_orders: int
    total_pairs: int
    total_spent: float
    orders: List[OrderSummary]

class TopCustomerResponse(BaseModel):
    user_id: UUID
    name: str
    total_orders: int
    total_pairs: int

class TopEmployeeResponse(BaseModel):
    user_id: UUID
    name: str
    occupation: str
    completed_tasks: int

class DashboardReportResponse(BaseModel):
    kpis: KPIResponse
    sales_by_category: List[CategorySalesResponse]
    top_products: List[TopProductResponse]
    top_customers: List[TopCustomerResponse]
    top_employees: List[TopEmployeeResponse]

class ProductionWeeklyMetric(BaseModel):
    week: str
    pairs_manufactured: int
    tasks_completed: int
    orders_created: int = 0
    pairs_ordered: int = 0

class ProductionGlobalReport(BaseModel):
    total_pairs_period: int
    total_tasks_period: int
    total_orders_period: int = 0
    total_orders_created: int = 0
    total_pairs_ordered: int = 0
    weekly_metrics: List[ProductionWeeklyMetric]
    orders: List[OrderSummary] = []

class SalesWeeklyMetric(BaseModel):
    week: str
    orders_created: int
    pairs_ordered: int

class SalesGlobalReport(BaseModel):
    total_orders_period: int
    total_pairs_period: int
    weekly_metrics: List[SalesWeeklyMetric]

