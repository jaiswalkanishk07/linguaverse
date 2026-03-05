from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"
    id                  = Column(Integer, primary_key=True, index=True)
    shop_id             = Column(String, nullable=False, index=True)
    name                = Column(String, nullable=False)
    sku                 = Column(String, unique=True, index=True, nullable=False)
    quantity            = Column(Integer, default=0)
    unit_price          = Column(Float, default=0)
    category            = Column(String, default="General")
    low_stock_threshold = Column(Integer, default=10)
    created_at          = Column(DateTime, server_default=func.now())

    # The Relationship bridge
    sales = relationship("Sale", back_populates="product")

class Sale(Base):
    __tablename__ = "sales"
    id         = Column(Integer, primary_key=True, index=True)
    shop_id    = Column(String, nullable=False, index=True)
    
    # UPGRADE: Foreign Key mapping
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    qty_sold   = Column(Integer, nullable=False)
    amount     = Column(Float, nullable=False)
    created_by = Column(String, default="manual")
    created_at = Column(DateTime, server_default=func.now())

    # The Relationship bridge
    product = relationship("Product", back_populates="sales")

class Khata(Base):
    __tablename__ = "khata"
    id                  = Column(Integer, primary_key=True, index=True)
    shop_id             = Column(String, nullable=False, index=True)
    customer_name       = Column(String, nullable=False)
    phone               = Column(String)
    outstanding_balance = Column(Float, default=0)
    last_payment_date   = Column(DateTime)
    days_overdue        = Column(Integer, default=0)

class Supplier(Base):
    __tablename__ = "suppliers"
    id            = Column(Integer, primary_key=True, index=True)
    shop_id       = Column(String, nullable=False, index=True)
    name          = Column(String, nullable=False)
    contact       = Column(String)
    language_pref = Column(String, default="Hindi")

    # The Relationship bridge
    orders = relationship("PurchaseOrder", back_populates="supplier")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id            = Column(Integer, primary_key=True, index=True)
    shop_id       = Column(String, nullable=False, index=True)
    
    # UPGRADE: Foreign Key mapping
    supplier_id   = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    
    item_count    = Column(Integer, default=1)
    total_value   = Column(Float, default=0)
    status        = Column(String, default="confirmed")
    expected_date = Column(DateTime)

    # The Relationship bridge
    supplier = relationship("Supplier", back_populates="orders")