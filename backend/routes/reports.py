from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models import Sale, PurchaseOrder, Product
from datetime import datetime

router = APIRouter()

@router.get("/summary")
def get_reports_summary(shop_id: str, db: Session = Depends(get_db)):
    """
    Returns dynamic P&L, Top Products, and GST calculations straight from the DB.
    """
    current_month = datetime.now().month
    current_year = datetime.now().year

    # 1. Calculate Dynamic Revenue (Sum of all sales this month)
    revenue_result = db.query(func.sum(Sale.amount)).filter(
        Sale.shop_id == shop_id,
        extract('month', Sale.created_at) == current_month,
        extract('year', Sale.created_at) == current_year
    ).scalar()
    total_revenue = float(revenue_result or 0.0)

    # 2. Calculate Dynamic Expenses (Sum of all purchase orders expected this month)
    expense_result = db.query(func.sum(PurchaseOrder.total_value)).filter(
        PurchaseOrder.shop_id == shop_id,
        extract('month', PurchaseOrder.expected_date) == current_month,
        extract('year', PurchaseOrder.expected_date) == current_year
    ).scalar()
    total_expenses = float(expense_result or 0.0)

    # Calculate Profit Metrics
    net_profit = total_revenue - total_expenses
    profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0.0

    # 3. Calculate Top Products dynamically using a SQL JOIN and GROUP BY
    top_sales_query = db.query(
        Product.sku,
        Product.name,
        func.sum(Sale.qty_sold).label("units_sold"),
        func.sum(Sale.amount).label("revenue")
    ).join(Sale, Product.id == Sale.product_id).filter(
        Sale.shop_id == shop_id,
        extract('month', Sale.created_at) == current_month,
        extract('year', Sale.created_at) == current_year
    ).group_by(Product.id).order_by(func.sum(Sale.amount).desc()).limit(3).all()

    top_products = [
        {
            "sku": item.sku,
            "name": item.name,
            "units_sold": item.units_sold,
            "revenue": float(item.revenue)
        } for item in top_sales_query
    ]

    # 4. Calculate Dynamic GST (Assuming standard 18% MSME bracket -> 9% CGST, 9% SGST)
    total_cgst = total_revenue * 0.09
    total_sgst = total_revenue * 0.09

    return {
        "shop_id": shop_id,
        "period": f"{current_year}-{current_month:02d}",
        "profit_and_loss": {
            "total_revenue": round(total_revenue, 2),
            "total_expenses": round(total_expenses, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_percent": round(profit_margin, 1)
        },
        "top_products": top_products,
        "gst_summary": {
            "total_cgst": round(total_cgst, 2),
            "total_sgst": round(total_sgst, 2),
            "total_igst": 0.0,
            "total_tax_liability": round(total_cgst + total_sgst, 2)
        }
    }
@router.get("/analytics")
def get_detailed_analytics(shop_id: str, db: Session = Depends(get_db)):
    
    # 1. Low Stock Alerts (For a "Critical Actions" Sidebar)
    # Finds products where quantity is below the threshold
    low_stock = db.query(Product).filter(
        Product.shop_id == shop_id,
        Product.quantity <= Product.low_stock_threshold
    ).all()

    # 2. Daily Sales Trend (For a Line Chart)
    # Groups last 7 days of sales to show business growth
    sales_trend = db.query(
        func.date(Sale.created_at).label("date"),
        func.sum(Sale.amount).label("daily_revenue")
    ).filter(Sale.shop_id == shop_id).group_by(func.date(Sale.created_at)).order_by(func.date(Sale.created_at).desc()).limit(7).all()

    return {
        "low_stock_alerts": [
            {"name": p.name, "sku": p.sku, "current": p.quantity, "threshold": p.low_stock_threshold} 
            for p in low_stock
        ],
        "sales_trend": [
            {"date": str(s.date), "revenue": float(s.daily_revenue)} 
            for s in reversed(sales_trend)
        ]
    }