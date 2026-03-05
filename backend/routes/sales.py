from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Sale
from schemas import SaleRecord
from tools import record_sale, get_sales_summary

# Set up the router
router = APIRouter()

@router.get("/")
def get_recent_sales(shop_id: str, limit: int = 10, db: Session = Depends(get_db)):
    """
    Returns the most recent sales for a specific shop.
    """
    # joinedload eliminates N+1 queries by loading product in a single JOIN
    sales = db.query(Sale).options(joinedload(Sale.product)).filter(Sale.shop_id == shop_id).order_by(Sale.created_at.desc()).limit(limit).all()
    
    # We leverage the SQLAlchemy relationship (sale.product) to pull the SKU and Name 
    # without needing a complex manual SQL JOIN!
    formatted_sales = []
    for sale in sales:
        formatted_sales.append({
            "id": sale.id,
            "product_name": sale.product.name,
            "sku": sale.product.sku,
            "qty_sold": sale.qty_sold,
            "amount": sale.amount,
            "created_by": sale.created_by,
            "created_at": sale.created_at
        })
        
    return {
        "shop_id": shop_id,
        "count": len(formatted_sales),
        "sales": formatted_sales
    }

@router.post("/record")
def create_sale(payload: SaleRecord, db: Session = Depends(get_db)):
    """
    Records a sale and triggers the inventory deduction in tools.py.
    """
    try:
        # Calls the robust tool we wrote earlier
        result = record_sale(
            sku=payload.sku,
            qty_sold=payload.qty_sold,
            amount=payload.amount,
            shop_id=payload.shop_id,
            created_by=payload.created_by,
            db=db
        )
        return {"status": "success", "message": "Sale recorded successfully", "data": result}
        
    except ValueError as e:
        # Catches "Insufficient stock" or "Product not found"
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error while recording sale")

@router.get("/summary")
def sales_summary(shop_id: str, db: Session = Depends(get_db)):
    """
    Returns today's total revenue and item count for the dashboard.
    """
    summary = get_sales_summary(shop_id=shop_id, db=db)
    return {
        "shop_id": shop_id,
        "data": summary
    }