from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Supplier, PurchaseOrder

router = APIRouter()

@router.get("/")
def get_suppliers(shop_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns the list of active B2B suppliers for the shop.
    """
    try:
        suppliers = db.query(Supplier).filter(Supplier.shop_id == shop_id).offset(skip).limit(limit).all()
        return {
            "shop_id": shop_id,
            "count": len(suppliers),
            "skip": skip,
            "limit": limit,
            "suppliers": suppliers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching suppliers")

@router.get("/orders")
def get_purchase_orders(shop_id: str, status: str = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns purchase orders. You can optionally filter by status (e.g., ?status=pending).
    """
    try:
        query = db.query(PurchaseOrder).filter(PurchaseOrder.shop_id == shop_id)
        
        if status:
            query = query.filter(PurchaseOrder.status == status)
            
        orders = query.order_by(PurchaseOrder.expected_date.asc()).offset(skip).limit(limit).all()
        
        return {
            "shop_id": shop_id,
            "count": len(orders),
            "skip": skip,
            "limit": limit,
            "orders": orders
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching purchase orders")