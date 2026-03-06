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

        # ============================
        # SUPPLIERS (Realistic Indian B2B Hardware Distributors)
        # ============================
        print("Seeding B2B Suppliers...")
        suppliers = [
            Supplier(shop_id=SHOP_ID, name="Havells India Ltd.", contact="+91-9876543210", language_pref="Hindi"),
            Supplier(shop_id=SHOP_ID, name="Finolex Cables", contact="+91-9988776655", language_pref="Hindi"),
            Supplier(shop_id=SHOP_ID, name="Anchor by Panasonic", contact="+91-9123456789", language_pref="English"),
            Supplier(shop_id=SHOP_ID, name="Polycab Wires", contact="+91-9234567890", language_pref="Hindi")
        ]
        db.add_all(suppliers)
        db.commit()

        # Fetch inserted suppliers to get their auto-generated primary keys
        sup_havells = db.query(Supplier).filter_by(name="Havells India Ltd.", shop_id=SHOP_ID).first()
        sup_finolex = db.query(Supplier).filter_by(name="Finolex Cables", shop_id=SHOP_ID).first()
        sup_anchor = db.query(Supplier).filter_by(name="Anchor by Panasonic", shop_id=SHOP_ID).first()
        sup_polycab = db.query(Supplier).filter_by(name="Polycab Wires", shop_id=SHOP_ID).first()

        # ============================
        # PRODUCTS (Realistic Indian Hardware/Electrical Shop Inventory)
        # ============================
        print("Seeding Products (Indian Hardware Store)...")
        products = [
            Product(shop_id=SHOP_ID, name="Havells 16A MCB Switch",       sku="ELE-MCB-16A",  quantity=85,  unit_price=245.0,  category="Switchgear",   low_stock_threshold=20),
            Product(shop_id=SHOP_ID, name="Finolex 1.5mm Wire (90m)",    sku="CBL-FNX-1.5",  quantity=32,  unit_price=1850.0, category="Cables",       low_stock_threshold=10),
            Product(shop_id=SHOP_ID, name="Anchor Roma 6A Socket",       sku="ELE-ROM-6A",   quantity=150, unit_price=68.0,   category="Switches",     low_stock_threshold=30),
            Product(shop_id=SHOP_ID, name="Polycab 4mm Wire (90m)",      sku="CBL-PLY-4MM",  quantity=18,  unit_price=3450.0, category="Cables",       low_stock_threshold=8),
            Product(shop_id=SHOP_ID, name="Havells 40W LED Tube Light",  sku="LGT-LED-40W",  quantity=60,  unit_price=320.0,  category="Lighting",     low_stock_threshold=15),
            Product(shop_id=SHOP_ID, name="PVC Conduit Pipe 25mm (3m)",  sku="PIP-PVC-25",   quantity=200, unit_price=45.0,   category="Pipes",        low_stock_threshold=50),
            Product(shop_id=SHOP_ID, name="Modular Switch Plate 8M",     sku="ELE-PLT-8M",   quantity=7,   unit_price=185.0,  category="Switches",     low_stock_threshold=10),
            Product(shop_id=SHOP_ID, name="Ceiling Fan Capacitor 2.5μF", sku="ELE-CAP-2.5",  quantity=45,  unit_price=55.0,   category="Components",   low_stock_threshold=15),
        ]
        db.add_all(products)
        db.commit()

        # ============================
        # KHATA (Realistic B2B Customers with Credit)
        # ============================
        print("Seeding B2B Khata (Corporate Clients)...")
        khatas = [
            Khata(shop_id=SHOP_ID, customer_name="Sharma Construction Co.",  phone="+91-9871234560", outstanding_balance=28500.0,  days_overdue=22, last_payment_date=datetime.now() - timedelta(days=25)),
            Khata(shop_id=SHOP_ID, customer_name="Gupta Electricals",        phone="+91-9845612378", outstanding_balance=12800.0,  days_overdue=7,  last_payment_date=datetime.now() - timedelta(days=10)),
            Khata(shop_id=SHOP_ID, customer_name="Metro Infra Projects",     phone="+91-9912345670", outstanding_balance=67000.0,  days_overdue=45, last_payment_date=datetime.now() - timedelta(days=50)),
            Khata(shop_id=SHOP_ID, customer_name="Rajesh Wiring Services",   phone="+91-9765432180", outstanding_balance=4200.0,   days_overdue=0,  last_payment_date=datetime.now() - timedelta(days=3)),
        ]
        db.add_all(khatas)
        db.commit()

        # ============================
        # SALES (Spread across last 7 days for realistic trend graph)
        # ============================
        print("Seeding Recent Sales (last 7 days)...")
        p_mcb     = db.query(Product).filter_by(sku="ELE-MCB-16A", shop_id=SHOP_ID).first()
        p_wire15  = db.query(Product).filter_by(sku="CBL-FNX-1.5", shop_id=SHOP_ID).first()
        p_socket  = db.query(Product).filter_by(sku="ELE-ROM-6A",  shop_id=SHOP_ID).first()
        p_wire4   = db.query(Product).filter_by(sku="CBL-PLY-4MM", shop_id=SHOP_ID).first()
        p_led     = db.query(Product).filter_by(sku="LGT-LED-40W", shop_id=SHOP_ID).first()
        p_pipe    = db.query(Product).filter_by(sku="PIP-PVC-25",  shop_id=SHOP_ID).first()

        now = datetime.now()
        sales = [
            # Day 7 (a week ago)
            Sale(shop_id=SHOP_ID, product_id=p_mcb.id,    qty_sold=10, amount=2450.0,  created_by="admin",  created_at=now - timedelta(days=6, hours=14)),
            Sale(shop_id=SHOP_ID, product_id=p_socket.id, qty_sold=25, amount=1700.0,  created_by="admin",  created_at=now - timedelta(days=6, hours=11)),
            # Day 6
            Sale(shop_id=SHOP_ID, product_id=p_wire15.id, qty_sold=3,  amount=5550.0,  created_by="admin",  created_at=now - timedelta(days=5, hours=10)),
            Sale(shop_id=SHOP_ID, product_id=p_pipe.id,   qty_sold=40, amount=1800.0,  created_by="agent",  created_at=now - timedelta(days=5, hours=15)),
            # Day 5
            Sale(shop_id=SHOP_ID, product_id=p_mcb.id,    qty_sold=15, amount=3675.0,  created_by="admin",  created_at=now - timedelta(days=4, hours=9)),
            Sale(shop_id=SHOP_ID, product_id=p_led.id,    qty_sold=8,  amount=2560.0,  created_by="agent",  created_at=now - timedelta(days=4, hours=13)),
            # Day 4
            Sale(shop_id=SHOP_ID, product_id=p_wire4.id,  qty_sold=2,  amount=6900.0,  created_by="admin",  created_at=now - timedelta(days=3, hours=11)),
            Sale(shop_id=SHOP_ID, product_id=p_socket.id, qty_sold=30, amount=2040.0,  created_by="admin",  created_at=now - timedelta(days=3, hours=16)),
            # Day 3
            Sale(shop_id=SHOP_ID, product_id=p_mcb.id,    qty_sold=20, amount=4900.0,  created_by="agent",  created_at=now - timedelta(days=2, hours=10)),
            Sale(shop_id=SHOP_ID, product_id=p_pipe.id,   qty_sold=50, amount=2250.0,  created_by="admin",  created_at=now - timedelta(days=2, hours=14)),
            Sale(shop_id=SHOP_ID, product_id=p_wire15.id, qty_sold=2,  amount=3700.0,  created_by="admin",  created_at=now - timedelta(days=2, hours=17)),
            # Day 2 (yesterday)
            Sale(shop_id=SHOP_ID, product_id=p_led.id,    qty_sold=12, amount=3840.0,  created_by="admin",  created_at=now - timedelta(days=1, hours=9)),
            Sale(shop_id=SHOP_ID, product_id=p_mcb.id,    qty_sold=8,  amount=1960.0,  created_by="agent",  created_at=now - timedelta(days=1, hours=14)),
            # Day 1 (today)
            Sale(shop_id=SHOP_ID, product_id=p_wire4.id,  qty_sold=1,  amount=3450.0,  created_by="admin",  created_at=now - timedelta(hours=3)),
            Sale(shop_id=SHOP_ID, product_id=p_socket.id, qty_sold=20, amount=1360.0,  created_by="agent",  created_at=now - timedelta(hours=1)),
        ]
        db.add_all(sales)
        db.commit()

        # ============================
        # PURCHASE ORDERS (Realistic pending orders)
        # ============================
        print("Seeding Pending Purchase Orders...")
        pos = [
            PurchaseOrder(shop_id=SHOP_ID, supplier_id=sup_havells.id,  item_count=100, total_value=24500.0,  status="pending",   expected_date=now + timedelta(days=2)),
            PurchaseOrder(shop_id=SHOP_ID, supplier_id=sup_finolex.id,  item_count=20,  total_value=37000.0,  status="confirmed", expected_date=now + timedelta(days=5)),
            PurchaseOrder(shop_id=SHOP_ID, supplier_id=sup_polycab.id,  item_count=15,  total_value=51750.0,  status="pending",   expected_date=now + timedelta(days=4)),
            PurchaseOrder(shop_id=SHOP_ID, supplier_id=sup_anchor.id,   item_count=200, total_value=13600.0,  status="confirmed", expected_date=now + timedelta(days=1)),
        ]
        db.add_all(pos)
        db.commit()

        print(f"\n✅ Database successfully seeded for shop: {SHOP_ID}!")
        print(f"   → 8 products, 4 suppliers, 4 khata accounts, 15 sales (7 days), 4 purchase orders")

    except Exception as e:
        print(f"\nCRITICAL ERROR during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()