from typing import List, Optional
import calendar
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.models import Transaction

router = APIRouter(prefix="/api/gst", tags=["GST Engine"])

CATEGORY_GST_MAP = {
    "Grocery": 0,
    "Dairy": 0,
    "Snacks": 12,
    "Beverages": 18,
    "Tobacco": 28,
    "General": 18,
    "Transport": 5,
    "Rent": 18
}

class CalculateRequest(BaseModel):
    amount: float
    type: str # 'sale' | 'expense'
    category: Optional[str] = "General"
    gst_rate: Optional[float] = None

class CalculateResponse(BaseModel):
    base_amount: float
    gst_amount: float
    total: float
    itc_claimable: Optional[float] = None

@router.post("/calculate", response_model=CalculateResponse)
async def calculate_gst(req: CalculateRequest):
    # Auto-assign GST rate based on category if not provided
    rate = req.gst_rate
    if rate is None:
        rate = CATEGORY_GST_MAP.get(req.category, 18) # Default to 18% if unknown
        
    # Treat 'amount' as inclusive of GST
    # Formula: Base = Total / (1 + Rate/100)
    base_amount = req.amount / (1 + (rate / 100))
    gst_amount = req.amount - base_amount
    
    response = CalculateResponse(
        base_amount=round(base_amount, 2),
        gst_amount=round(gst_amount, 2),
        total=round(req.amount, 2)
    )
    
    # ITC is only claimable on expenses (purchases)
    if req.type == "expense" and rate > 0:
        response.itc_claimable = round(gst_amount, 2)
        
    return response

@router.get("/summary")
async def get_gst_summary(user_id: int, month: int, year: int, db: AsyncSession = Depends(get_db)):
    try:
        # Construct date range for the month
        num_days = calendar.monthrange(year, month)[1]
        start_date = date(year, month, 1)
        end_date = date(year, month, num_days)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month or year")
        
    # 1. Calculate GST Collected (from Sales)
    sales_query = select(func.sum(Transaction.gst_amount).label('collected'))\
        .where(Transaction.user_id == user_id)\
        .where(Transaction.type == 'sale')\
        .where(Transaction.gst_applicable == True)\
        .where(Transaction.date >= start_date)\
        .where(Transaction.date <= end_date)
        
    sales_res = await db.execute(sales_query)
    gst_collected = float(sales_res.first().collected or 0)
    
    # 2. Calculate GST Paid / ITC Available (from Expenses)
    expense_query = select(func.sum(Transaction.gst_amount).label('paid'))\
        .where(Transaction.user_id == user_id)\
        .where(Transaction.type == 'expense')\
        .where(Transaction.gst_applicable == True)\
        .where(Transaction.date >= start_date)\
        .where(Transaction.date <= end_date)
        
    expense_res = await db.execute(expense_query)
    gst_paid = float(expense_res.first().paid or 0)
    
    # 3. Compute Net Liability
    net_liability = max(0, gst_collected - gst_paid)
    
    # 4. Fetch Raw Transactions for Report
    tx_query = select(Transaction)\
        .where(Transaction.user_id == user_id)\
        .where(Transaction.gst_applicable == True)\
        .where(Transaction.date >= start_date)\
        .where(Transaction.date <= end_date)\
        .order_by(Transaction.date.asc())
        
    tx_res = await db.execute(tx_query)
    transactions = tx_res.scalars().all()
    
    formatted_transactions = []
    for tx in transactions:
        formatted_transactions.append({
            "date": tx.date.isoformat(),
            "type": tx.type,
            "amount": float(tx.amount),
            "gst_rate": float(tx.gst_rate) if tx.gst_rate else 0.0,
            "gst_amount": float(tx.gst_amount) if tx.gst_amount else 0.0,
            "itc_claimable": float(tx.gst_amount) if tx.type == "expense" and tx.gst_amount else 0.0
        })
        
    month_name = calendar.month_name[month]
    
    return {
        "month": f"{month_name} {year}",
        "gst_collected": round(gst_collected, 2),
        "gst_paid": round(gst_paid, 2),
        "net_liability": round(net_liability, 2),
        "itc_available": round(gst_paid, 2),
        "transactions": formatted_transactions
    }

@router.get("/itc")
async def get_itc_transactions(user_id: int, month: int, year: int, db: AsyncSession = Depends(get_db)):
    try:
        num_days = calendar.monthrange(year, month)[1]
        start_date = date(year, month, 1)
        end_date = date(year, month, num_days)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month or year")
        
    tx_query = select(Transaction)\
        .where(Transaction.user_id == user_id)\
        .where(Transaction.type == 'expense')\
        .where(Transaction.gst_applicable == True)\
        .where(Transaction.date >= start_date)\
        .where(Transaction.date <= end_date)\
        .order_by(Transaction.date.desc())
        
    tx_res = await db.execute(tx_query)
    transactions = tx_res.scalars().all()
    
    result = []
    for tx in transactions:
        result.append({
            "id": str(tx.id),
            "date": tx.date.isoformat(),
            "vendor": tx.vendor or "Unknown",
            "category": tx.category,
            "total_amount": float(tx.amount),
            "gst_rate": float(tx.gst_rate) if tx.gst_rate else 0.0,
            "itc_claimable": float(tx.gst_amount) if tx.gst_amount else 0.0
        })
        
    return result
