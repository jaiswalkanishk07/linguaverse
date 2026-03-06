from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Khata
from schemas import KhataPayment
from datetime import datetime

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

@router.post("/payment")
def record_khata_payment(payload: KhataPayment, db: Session = Depends(get_db)):
    """
    Records a payment against a customer's outstanding balance.
    Uses row locking to prevent race conditions.
    """
    try:
        # Find the customer by name (case-insensitive partial match)
        account = db.query(Khata).filter(
            Khata.shop_id == payload.shop_id,
            Khata.customer_name.ilike(f"%{payload.customer_name}%")
        ).with_for_update().first()

        if not account:
            raise ValueError(f"Customer '{payload.customer_name}' not found in Khata")

        if payload.amount > account.outstanding_balance:
            raise ValueError(f"Payment ₹{payload.amount} exceeds outstanding balance ₹{account.outstanding_balance}")

        old_balance = account.outstanding_balance
        account.outstanding_balance -= payload.amount
        account.last_payment_date = datetime.now()

        # Reset overdue days if fully paid
        if account.outstanding_balance <= 0:
            account.outstanding_balance = 0
            account.days_overdue = 0

        db.commit()
        db.refresh(account)

        return {
            "status": "success",
            "message": f"Payment of ₹{payload.amount} recorded for {account.customer_name}",
            "data": {
                "customer_name": account.customer_name,
                "old_balance": old_balance,
                "payment": payload.amount,
                "new_balance": account.outstanding_balance
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error while recording payment")