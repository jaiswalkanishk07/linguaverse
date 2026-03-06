from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Product
from schemas import StockUpdate, ProductCreate
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

@router.post("/create")
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    """
    Adds a brand new product to the inventory.
    """
    # Check if SKU already exists for this shop
    existing = db.query(Product).filter(
        Product.sku == payload.sku,
        Product.shop_id == payload.shop_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{payload.sku}' already exists")
    
    product = Product(
        shop_id=payload.shop_id,
        name=payload.name,
        sku=payload.sku,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        category=payload.category
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return {"status": "success", "message": f"Product '{payload.name}' created", "data": {
        "id": product.id, "name": product.name, "sku": product.sku,
        "quantity": product.quantity, "unit_price": product.unit_price, "category": product.category
    }}

@router.post("/update")
def update_inventory(payload: StockUpdate, db: Session = Depends(get_db)):
    """
    Calls update_stock() from tools.py using the strict StockUpdate schema.
    """
    try:
        result = update_stock(
            sku=payload.sku,
            quantity=payload.quantity,
            update_type=payload.update_type.value, 
            shop_id=payload.shop_id,
            db=db
        )
        return {"status": "success", "message": "Inventory updated safely", "data": result}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error while updating stock")

@router.delete("/{product_id}")
def delete_product(product_id: int, shop_id: str, db: Session = Depends(get_db)):
    """
    Deletes a product from the inventory by its ID.
    """
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == shop_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    
    return {"status": "success", "message": f"Product '{product.name}' deleted"}