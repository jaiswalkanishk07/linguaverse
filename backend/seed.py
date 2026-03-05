import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Product, Supplier, Khata, Sale, PurchaseOrder
from datetime import datetime, timedelta

# Load variables from .env
load_dotenv()

# Fetch SHOP_ID dynamically. Defaults to "shop_01" if missing from .env
SHOP_ID = os.getenv("SHOP_ID", "shop_01")

def seed_database():
    # Ensure tables exist based on models.py
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        print(f"Initializing seed for Shop ID: {SHOP_ID}")
        print("Cleaning existing data for this shop...")
        
        # Delete child tables first to respect Foreign Key constraints
        db.query(Sale).filter(Sale.shop_id == SHOP_ID).delete()
        db.query(PurchaseOrder).filter(PurchaseOrder.shop_id == SHOP_ID).delete()
        
        # Delete parent tables next
        db.query(Product).filter(Product.shop_id == SHOP_ID).delete()
        db.query(Supplier).filter(Supplier.shop_id == SHOP_ID).delete()
        db.query(Khata).filter(Khata.shop_id == SHOP_ID).delete()
        db.commit()

        print("Seeding B2B Suppliers...")
        suppliers = [
            Supplier(shop_id=SHOP_ID, name="Prime Industrial Electronics", contact="+91-9876543210", language_pref="English"),
            Supplier(shop_id=SHOP_ID, name="BuildWell Hardware Wholesalers", contact="+91-9988776655", language_pref="Hindi"),
            Supplier(shop_id=SHOP_ID, name="Apex Cables & Wires Ltd.", contact="+91-9123456789", language_pref="English")
        ]
        db.add_all(suppliers)
        db.commit()

        # Fetch inserted suppliers to get their auto-generated primary keys
        sup_prime = db.query(Supplier).filter_by(name="Prime Industrial Electronics", shop_id=SHOP_ID).first()
        sup_build = db.query(Supplier).filter_by(name="BuildWell Hardware Wholesalers", shop_id=SHOP_ID).first()

        print("Seeding MSME Products (Industrial/Hardware)...")
        products = [
            Product(shop_id=SHOP_ID, name="NEMA 17 Stepper Motor", sku="MOT-N17-001", quantity=45, unit_price=850.0, category="Motors", low_stock_threshold=10),
            Product(shop_id=SHOP_ID, name="Omron 24V DC Relay", sku="ELE-OMR-24V", quantity=350, unit_price=180.0, category="Electronics", low_stock_threshold=50),
            Product(shop_id=SHOP_ID, name="CAT6 Ethernet Cable (305m Roll)", sku="CBL-CAT6-305", quantity=12, unit_price=3200.0, category="Networking", low_stock_threshold=5),
            Product(shop_id=SHOP_ID, name="Industrial Epoxy Resin (5kg Set)", sku="CHM-EPX-05K", quantity=8, unit_price=4500.0, category="Chemicals", low_stock_threshold=10),
            Product(shop_id=SHOP_ID, name="M8 Galvanized Hex Bolts (Box of 500)", sku="HDW-M8-500", quantity=120, unit_price=650.0, category="Fasteners", low_stock_threshold=20)
        ]
        db.add_all(products)
        db.commit()

        print("Seeding B2B Khata (Corporate Clients)...")
        khatas = [
            Khata(shop_id=SHOP_ID, customer_name="Pioneer Automation Systems", phone="044-2345678", outstanding_balance=14500.0, days_overdue=15, last_payment_date=datetime.now() - timedelta(days=20)),
            Khata(shop_id=SHOP_ID, customer_name="TechNova Engineering Works", phone="044-8765432", outstanding_balance=45000.0, days_overdue=42, last_payment_date=datetime.now() - timedelta(days=60)),
            Khata(shop_id=SHOP_ID, customer_name="City Builders Consortium", phone="044-1122334", outstanding_balance=8200.0, days_overdue=0, last_payment_date=datetime.now() - timedelta(days=5))
        ]
        db.add_all(khatas)
        db.commit()

        print("Seeding Recent Sales...")
        # Fetch products to get their auto-generated primary keys for the Sale table
        p_motor = db.query(Product).filter_by(sku="MOT-N17-001", shop_id=SHOP_ID).first()
        p_relay = db.query(Product).filter_by(sku="ELE-OMR-24V", shop_id=SHOP_ID).first()
        p_resin = db.query(Product).filter_by(sku="CHM-EPX-05K", shop_id=SHOP_ID).first()

        # strictly uses product_id (ForeignKey) instead of sku
        sales = [
            Sale(shop_id=SHOP_ID, product_id=p_motor.id, qty_sold=5, amount=4250.0, created_by="admin"),
            Sale(shop_id=SHOP_ID, product_id=p_relay.id, qty_sold=50, amount=9000.0, created_by="admin"),
            Sale(shop_id=SHOP_ID, product_id=p_resin.id, qty_sold=2, amount=9000.0, created_by="agent")
        ]
        db.add_all(sales)
        db.commit()

        print("Seeding Pending Purchase Orders...")
        # strictly uses supplier_id (ForeignKey) and drops supplier_name to respect normalization
        pos = [
            PurchaseOrder(shop_id=SHOP_ID, supplier_id=sup_prime.id, item_count=200, total_value=36000.0, status="pending", expected_date=datetime.now() + timedelta(days=3)),
            PurchaseOrder(shop_id=SHOP_ID, supplier_id=sup_build.id, item_count=50, total_value=32500.0, status="confirmed", expected_date=datetime.now() + timedelta(days=7))
        ]
        db.add_all(pos)
        db.commit()

        print(f"Database successfully seeded for shop: {SHOP_ID}!")

    except Exception as e:
        print(f"\nCRITICAL ERROR during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()