from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Product
from schemas import StockUpdate
from tools import update_stock

# Set up the router
router = APIRouter()

@router.get("/")
def get_inventory(shop_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns products filtered by shop_id with pagination.
    """
    products = db.query(Product).filter(Product.shop_id == shop_id).offset(skip).limit(limit).all()
    total = db.query(Product).filter(Product.shop_id == shop_id).count()
    
    return {
        "shop_id": shop_id,
        "total_items": total,
        "showing": len(products),
        "skip": skip,
        "limit": limit,
        "products": products
    }

@router.post("/update")
def update_inventory(payload: StockUpdate, db: Session = Depends(get_db)):
    """
    Calls update_stock() from tools.py using the strict StockUpdate schema.
    """
    try:
        # payload.update_type.value extracts the string from the Enum we created
        result = update_stock(
            sku=payload.sku,
            quantity=payload.quantity,
            update_type=payload.update_type.value, 
            shop_id=payload.shop_id,
            db=db
        )
        return {"status": "success", "message": "Inventory updated safely", "data": result}
    
    except ValueError as e:
        # Catches our custom errors (e.g., "Insufficient stock") and returns a 400 Bad Request
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Catches database connection drops or unexpected crashes
        raise HTTPException(status_code=500, detail="Internal server error while updating stock")