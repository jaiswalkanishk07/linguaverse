from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from enum import Enum

# ==========================================
# ENUMS (Prevents Typos and Invalid Inputs)
# ==========================================
class UpdateType(str, Enum):
    INCOMING = "incoming"
    OUTGOING = "outgoing"

class AgentAction(str, Enum):
    UPDATE_STOCK = "update_stock"
    ADD_PRODUCT = "add_product"
    RECORD_SALE = "record_sale"
    KHATA_PAYMENT = "khata_payment"
    GET_STOCK = "get_stock"
    GET_KHATA = "get_khata"
    GET_REPORT = "get_report"
    CLARIFY = "clarify"
    UNKNOWN = "unknown"

# ==========================================
# SCHEMAS (With Strict Validation)
# ==========================================

# --- Inventory ---
class StockUpdate(BaseModel):
    shop_id: str = Field(..., min_length=1, description="Shop ID cannot be empty")
    sku: str = Field(..., min_length=1, description="SKU cannot be empty")
    quantity: int = Field(..., gt=0, description="Quantity must be strictly greater than 0")
    update_type: UpdateType

class ProductCreate(BaseModel):
    shop_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1, description="Product name")
    sku: str = Field(..., min_length=1, description="Unique SKU code")
    quantity: int = Field(default=0, ge=0)
    unit_price: float = Field(..., ge=0, description="Unit price")
    category: str = Field(default="General")

# --- Sales ---
class SaleRecord(BaseModel):
    shop_id: str = Field(..., min_length=1)
    sku: str = Field(..., min_length=1)
    qty_sold: int = Field(..., gt=0, description="Must sell at least 1 item")
    amount: float = Field(..., ge=0, description="Amount cannot be negative")
    created_by: str = Field(default="manual")

# --- Khata ---
class KhataPayment(BaseModel):
    shop_id: str = Field(..., min_length=1)
    customer_name: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0, description="Payment must be greater than 0")

# --- Agent (AI Parsing) ---
class AgentRequest(BaseModel):
    shop_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=2, description="The raw text from the user")

class AgentResponse(BaseModel):
    action: AgentAction
    sku: str
    quantity: int
    amount: float
    customer_name: str
    confidence: float
    response_text: str
    detected_language: str = "en"

    # This allows Pydantic to read directly from SQLAlchemy models later if needed
    model_config = ConfigDict(from_attributes=True)