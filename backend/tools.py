from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Product, Sale, Khata, PurchaseOrder, Supplier
from datetime import date, datetime, time

def update_stock(sku: str, quantity: int, update_type: str, 
                 shop_id: str, db: Session) -> dict:
    try:
        # UPGRADE 1: .with_for_update() locks the row so no one else can touch it 
        # until this transaction is completely finished (prevents race conditions).
        product = db.query(Product).filter(
            Product.sku == sku,
            Product.shop_id == shop_id
        ).with_for_update().first()

        if not product:
            raise ValueError(f"Product with SKU '{sku}' not found")

        old_qty = product.quantity

        if update_type == "incoming":
            product.quantity += quantity
        elif update_type == "outgoing":
            if product.quantity < quantity:
                raise ValueError(f"Insufficient stock. Available: {product.quantity}")
            product.quantity -= quantity
        else:
            raise ValueError("Invalid update_type. Must be 'incoming' or 'outgoing'.")

        db.commit()
        db.refresh(product)

        return {
            "sku": sku,
            "name": product.name,
            "old_quantity": old_qty,
            "new_quantity": product.quantity,
            "low_stock": product.quantity <= product.low_stock_threshold
        }
    except Exception as e:
        # UPGRADE 2: Rollback prevents the database from getting stuck if an error occurs
        db.rollback()
        raise e

def record_sale(sku: str, qty_sold: int, amount: float, 
                shop_id: str, created_by: str, db: Session) -> dict:
    try:
        # Lock the row for the transaction
        product = db.query(Product).filter(
            Product.sku == sku,
            Product.shop_id == shop_id
        ).with_for_update().first()

        if not product:
            raise ValueError(f"Product '{sku}' not found")

        if product.quantity < qty_sold:
            raise ValueError(f"Insufficient stock. Only {product.quantity} left.")

        product.quantity -= qty_sold

        # UPGRADE 3: Synced with our new models.py! 
        # We use product_id instead of sku for strict foreign key mapping.
        sale = Sale(
            shop_id=shop_id,
            product_id=product.id, 
            qty_sold=qty_sold,
            amount=amount,
            created_by=created_by
        )
        db.add(sale)
        db.commit()
        db.refresh(product)

        return {
            "sku": sku,
            "name": product.name,
            "qty_sold": qty_sold,
            "amount": amount,
            "remaining_stock": product.quantity
        }
    except Exception as e:
        db.rollback()
        raise e

def get_sales_summary(shop_id: str, db: Session) -> dict:
    # PostgreSQL safe date handling
    today_start = datetime.combine(date.today(), time.min)

    # UPGRADE 4: Single-trip query. Fetches both sum and count at the same time.
    result = db.query(
        func.sum(Sale.amount).label("total_amount"),
        func.count(Sale.id).label("total_count")
    ).filter(
        Sale.shop_id == shop_id,
        Sale.created_at >= today_start
    ).first()

    return {
        "today_total": result.total_amount or 0.0,
        "today_count": result.total_count or 0
    }