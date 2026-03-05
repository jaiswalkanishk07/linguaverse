from database import engine, Base
from models import Product, Sale, Khata, Supplier, PurchaseOrder

Base.metadata.create_all(bind=engine)
print("All tables created successfully")