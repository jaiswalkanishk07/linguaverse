from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Khata

router = APIRouter()

@router.get("/")
def get_khata_balances(shop_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns customers who currently owe money (outstanding_balance > 0).
    """
    try:
        pending_accounts = db.query(Khata).filter(
            Khata.shop_id == shop_id,
            Khata.outstanding_balance > 0
        ).order_by(Khata.days_overdue.desc()).offset(skip).limit(limit).all()

        return {
            "shop_id": shop_id,
            "total_pending_accounts": len(pending_accounts),
            "skip": skip,
            "limit": limit,
            "accounts": pending_accounts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching Khata records")