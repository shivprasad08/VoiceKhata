from typing import List, Optional
import uuid
from datetime import date as dt_date
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.database import get_db
from app.models import Transaction, User
from app.websockets import manager

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

class TransactionCreate(BaseModel):
    user_id: int
    amount: float
    type: str
    category: Optional[str] = None
    description: Optional[str] = None
    vendor_name: Optional[str] = None
    date: Optional[dt_date] = None

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    type: str
    category: Optional[str]
    description: Optional[str]
    vendor_name: Optional[str]
    date: dt_date
    created_at: str

    class Config:
        orm_mode = True

@router.post("")
async def create_transaction(txn: TransactionCreate, db: AsyncSession = Depends(get_db)):
    # Create the transaction
    new_txn = Transaction(
        user_id=txn.user_id,
        amount=txn.amount,
        type=txn.type,
        category=txn.category,
        description=txn.description,
        vendor_name=txn.vendor_name,
        date=txn.date or dt_date.today()
    )
    db.add(new_txn)
    await db.commit()
    await db.refresh(new_txn)

    # Broadcast to websocket
    await manager.broadcast(
        txn.user_id,
        {
            "event": "transaction_created",
            "data": {
                "id": new_txn.id,
                "amount": float(new_txn.amount),
                "type": new_txn.type.value,
                "description": new_txn.description,
                "date": new_txn.date.isoformat(),
                "created_at": new_txn.created_at.isoformat()
            }
        }
    )

    return {"message": "Transaction created successfully", "id": new_txn.id}

@router.get("")
async def get_transactions(user_id: int, limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(desc(Transaction.created_at))
        .limit(limit)
    )
    transactions = result.scalars().all()
    
    return [
        {
            "id": t.id,
            "amount": float(t.amount),
            "type": t.type.value,
            "category": t.category,
            "description": t.description,
            "vendor_name": t.vendor_name,
            "date": t.date.isoformat(),
            "created_at": t.created_at.isoformat()
        }
        for t in transactions
    ]
