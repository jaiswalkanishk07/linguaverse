from sqlalchemy.orm import Session
from models import Product, Khata

def build_context(shop_id: str, db: Session) -> str:
    """
    Pulls live data from PostgreSQL and formats it into a text block 
    so the Gemini LLM has perfect context of the shop's current state.
    """
    # 1. Fetch live inventory (capped to prevent token overflow)
    products = db.query(Product).filter(Product.shop_id == shop_id).limit(100).all()
    
    # 2. Fetch pending Khata (credit) accounts (capped)
    khatas = db.query(Khata).filter(
        Khata.shop_id == shop_id, 
        Khata.outstanding_balance > 0
    ).limit(50).all()

    # 3. Build the text context string
    context_lines = ["--- LIVE SHOP CONTEXT ---"]
    
    context_lines.append("\nAVAILABLE INVENTORY:")
    if not products:
        context_lines.append("No products in inventory.")
    else:
        for p in products:
            context_lines.append(f"- Product: {p.name} | SKU: {p.sku} | Price: ₹{p.unit_price} | Current Stock: {p.quantity}")

    context_lines.append("\nPENDING KHATA (CREDIT) ACCOUNTS:")
    if not khatas:
        context_lines.append("No customers currently owe money.")
    else:
        for k in khatas:
            context_lines.append(f"- Customer: {k.customer_name} | Owes: ₹{k.outstanding_balance}")

    context_lines.append("-------------------------")
    
    return "\n".join(context_lines)