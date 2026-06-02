import os
import json
from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, case, desc
from pydantic import BaseModel

try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

from app.database import get_db
from app.models import Transaction

router = APIRouter(prefix="/api/summary", tags=["Summary"])

class AIGenerateRequest(BaseModel):
    user_id: int
    period: str # "weekly" | "monthly"

class AIGenerateResponse(BaseModel):
    hindi: str
    english: str
    metrics: dict
    generated_at: str

@router.post("/ai-generate", response_model=AIGenerateResponse)
async def generate_ai_summary(request: AIGenerateRequest, db: AsyncSession = Depends(get_db)):
    if request.period not in ["weekly", "monthly"]:
        raise HTTPException(status_code=400, detail="Period must be weekly or monthly")
        
    days = 7 if request.period == "weekly" else 30
    start_date = date.today() - timedelta(days=days)
    
    # 1. Fetch Aggregated Metrics
    query = select(
        func.sum(case((Transaction.type == 'sale', Transaction.amount), else_=0)).label('total_sales'),
        func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('total_expenses'),
        func.sum(case((Transaction.gst_applicable == True, Transaction.gst_amount), else_=0)).label('total_itc'),
        func.count(Transaction.id).label('tx_count')
    ).where(Transaction.user_id == request.user_id).where(Transaction.date >= start_date)
    
    result = await db.execute(query)
    row = result.first()
    
    sales = float(row.total_sales or 0)
    expenses = float(row.total_expenses or 0)
    profit = sales - expenses
    itc = float(row.total_itc or 0)
    count = int(row.tx_count or 0)
    
    # 2. Top Expense Category
    expense_cat_query = select(Transaction.category, func.sum(Transaction.amount).label('cat_amount'))\
        .where(Transaction.user_id == request.user_id)\
        .where(Transaction.type == 'expense')\
        .where(Transaction.date >= start_date)\
        .group_by(Transaction.category)\
        .order_by(desc('cat_amount'))\
        .limit(1)
        
    cat_result = await db.execute(expense_cat_query)
    top_cat_row = cat_result.first()
    top_expense_category = top_cat_row.category if top_cat_row else "None"
    top_expense_amount = float(top_cat_row.cat_amount) if top_cat_row else 0
    
    # 3. Best Sales Day
    best_day_query = select(Transaction.date, func.sum(Transaction.amount).label('day_sales'))\
        .where(Transaction.user_id == request.user_id)\
        .where(Transaction.type == 'sale')\
        .where(Transaction.date >= start_date)\
        .group_by(Transaction.date)\
        .order_by(desc('day_sales'))\
        .limit(1)
        
    day_result = await db.execute(best_day_query)
    best_day_row = day_result.first()
    best_day = best_day_row.date.isoformat() if best_day_row else date.today().isoformat()
    best_day_sales = float(best_day_row.day_sales) if best_day_row else 0
    
    metrics = {
        "sales": sales,
        "expenses": expenses,
        "profit": profit,
        "itc": itc,
        "best_day": best_day
    }
    
    # 4. Generate AI Summary using Groq
    api_key = os.getenv("GROQ_API_KEY")
    
    if not GROQ_AVAILABLE or not api_key:
        return AIGenerateResponse(
            hindi=f"इस {request.period} आपका कुल मुनाफा INR {profit:,.0f} रहा। सबसे ज्यादा खर्च {top_expense_category} में हुआ (INR {top_expense_amount:,.0f})।",
            english=f"This {request.period} your net profit was INR {profit:,.0f}. The highest expense was in {top_expense_category} (INR {top_expense_amount:,.0f}).",
            metrics=metrics,
            generated_at=datetime.now().isoformat()
        )
        
    try:
        client = AsyncGroq(api_key=api_key)
        
        system_prompt = """You are a highly analytical and empathetic business advisor for an Indian small shop owner (kirana, electronics, or clothing store). 
Generate a very detailed, in-depth business summary in BOTH Hindi and English. 
Your analysis MUST be extremely clear so the vendor is never confused about what to do next.
Include:
1. A clear breakdown of their financial health based on the numbers.
2. Deep insights into why their profit/loss is what it is (e.g., highlighting ratio of expenses to sales).
3. 2-3 specific, highly actionable steps they must take tomorrow to improve their margins, reduce specific expenses, or boost sales.
Use Indian context (INR, local market dynamics, festivals, stock replenishment, negotiating with distributors).
Return ONLY valid JSON with exactly two keys: 'hindi' and 'english'. 
CRITICAL: The values for these keys MUST be a single formatted markdown string. DO NOT use nested JSON objects."""
        
        user_prompt = f"""Here is the business data for the {request.period}:
- Total Sales: INR {sales}
- Total Expenses: INR {expenses}  
- Net Profit: INR {profit}
- Top expense category: {top_expense_category} (INR {top_expense_amount})
- Best performing day: {best_day} (INR {best_day_sales})
- Number of transactions: {count}
- GST input tax credit available: INR {itc}

Please analyze this data deeply and tell me exactly what my situation is and what specific steps I should take next."""

        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        response_text = response.choices[0].message.content
        
        try:
            parsed = json.loads(response_text)
            hindi_text = parsed.get("hindi", "Hindi summary unavailable.")
            english_text = parsed.get("english", "English summary unavailable.")
        except json.JSONDecodeError:
            hindi_text = "AI output formatting error."
            english_text = response_text
            
        return AIGenerateResponse(
            hindi=hindi_text,
            english=english_text,
            metrics=metrics,
            generated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"Groq API Error: {e}")
        return AIGenerateResponse(
            hindi=f"इस {request.period} आपका कुल मुनाफा INR {profit:,.0f} रहा।",
            english=f"This {request.period} your net profit was INR {profit:,.0f}.",
            metrics=metrics,
            generated_at=datetime.now().isoformat()
        )

@router.get("/today")
async def get_today_summary(user_id: int, db: AsyncSession = Depends(get_db)):
    query = select(
        func.sum(case((Transaction.type == 'sale', Transaction.amount), else_=0)).label('total_sales'),
        func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('total_expenses')
    ).where(Transaction.user_id == user_id).where(Transaction.date == date.today())
    
    result = await db.execute(query)
    row = result.first()
    sales = float(row.total_sales or 0)
    expenses = float(row.total_expenses or 0)
    profit = sales - expenses

    # Yesterday's data
    yesterday = date.today() - timedelta(days=1)
    y_query = select(
        func.sum(case((Transaction.type == 'sale', Transaction.amount), else_=0)).label('total_sales'),
        func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('total_expenses')
    ).where(Transaction.user_id == user_id).where(Transaction.date == yesterday)
    
    y_result = await db.execute(y_query)
    y_row = y_result.first()
    y_sales = float(y_row.total_sales or 0)
    y_expenses = float(y_row.total_expenses or 0)
    y_profit = y_sales - y_expenses

    sales_change = ((sales - y_sales) / y_sales * 100) if y_sales > 0 else (100 if sales > 0 else 0)
    expenses_change = ((expenses - y_expenses) / y_expenses * 100) if y_expenses > 0 else (100 if expenses > 0 else 0)
    profit_change = ((profit - y_profit) / abs(y_profit) * 100) if y_profit != 0 else (100 if profit > 0 else (0 if profit == 0 else -100))

    return {
        "total_sales": sales, 
        "total_expenses": expenses, 
        "profit": profit,
        "sales_change": round(sales_change, 2),
        "expenses_change": round(expenses_change, 2),
        "profit_change": round(profit_change, 2),
        "y_sales": y_sales,
        "y_expenses": y_expenses,
        "y_profit": y_profit
    }

@router.get("/monthly")
async def get_monthly_summary(user_id: int, db: AsyncSession = Depends(get_db)):
    start_date = date.today().replace(day=1)
    
    itc_query = select(func.sum(Transaction.gst_amount).label('total_gst'))\
        .where(Transaction.user_id == user_id)\
        .where(Transaction.gst_applicable == True)\
        .where(Transaction.date >= start_date)
    itc_res = await db.execute(itc_query)
    itc = float(itc_res.first().total_gst or 0)
    
    # Last month ITC
    last_month_end = start_date - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    y_itc_query = select(func.sum(Transaction.gst_amount).label('total_gst'))\
        .where(Transaction.user_id == user_id)\
        .where(Transaction.gst_applicable == True)\
        .where(Transaction.date >= last_month_start)\
        .where(Transaction.date <= last_month_end)
    y_itc_res = await db.execute(y_itc_query)
    y_itc = float(y_itc_res.first().total_gst or 0)

    itc_change = ((itc - y_itc) / y_itc * 100) if y_itc > 0 else (100 if itc > 0 else 0)

    cat_query = select(Transaction.category, func.sum(Transaction.amount).label('amount'))\
        .where(Transaction.user_id == user_id)\
        .where(Transaction.type == 'expense')\
        .where(Transaction.date >= start_date)\
        .group_by(Transaction.category)
    cat_res = await db.execute(cat_query)
    categories = [{"category": row.category, "amount": float(row.amount)} for row in cat_res.all()]
    
    return {
        "gst_summary": {
            "total_gst_paid": itc,
            "gst_change": round(itc_change, 2),
            "y_itc": y_itc
        },
        "category_breakdown": categories
    }

@router.get("/weekly")
async def get_weekly_summary(user_id: int, db: AsyncSession = Depends(get_db)):
    start_date = date.today() - timedelta(days=7)
    query = select(
        Transaction.date,
        func.sum(case((Transaction.type == 'sale', Transaction.amount), else_=0)).label('sales'),
        func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('expenses')
    ).where(Transaction.user_id == user_id).where(Transaction.date >= start_date)\
    .group_by(Transaction.date).order_by(Transaction.date)
    
    result = await db.execute(query)
    breakdown = [{"date": row.date.isoformat(), "sales": float(row.sales), "expenses": float(row.expenses)} for row in result.all()]
    return {"daily_breakdown": breakdown}
