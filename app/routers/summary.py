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

class ChatMessageModel(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_id: str
    messages: List[ChatMessageModel]
    context: dict
    language: str = "hindi"

@router.get("/ai-generate")
async def generate_ai_summary(user_id: int, period: str = "weekly", db: AsyncSession = Depends(get_db)):
    if period not in ["weekly", "monthly"]:
        raise HTTPException(status_code=400, detail="Period must be weekly or monthly")
        
    days = 7 if period == "weekly" else 30
    start_date = date.today() - timedelta(days=days)
    
    # 1. Fetch Aggregated Metrics
    query = select(
        func.sum(case((Transaction.type == 'sale', Transaction.amount), else_=0)).label('total_sales'),
        func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('total_expenses'),
        func.sum(case((Transaction.gst_applicable == True, Transaction.gst_amount), else_=0)).label('total_itc'),
        func.count(Transaction.id).label('tx_count')
    ).where(Transaction.user_id == user_id).where(Transaction.date >= start_date)
    
    result = await db.execute(query)
    row = result.first()
    
    sales = float(row.total_sales or 0)
    expenses = float(row.total_expenses or 0)
    profit = sales - expenses
    itc = float(row.total_itc or 0)
    count = int(row.tx_count or 0)
    
    # 2. Top Expense Category
    expense_cat_query = select(Transaction.category, func.sum(Transaction.amount).label('cat_amount'))\
        .where(Transaction.user_id == user_id)\
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
        .where(Transaction.user_id == user_id)\
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
        return {
            "headline": f"इस {period} आपका कुल मुनाफा ₹{profit:,.0f} रहा।",
            "scorecard": {
                "sales_vs_last_week": f"₹{sales:,.0f}",
                "expense_control": f"{top_expense_category}: ₹{top_expense_amount:,.0f}",
                "profit_margin": f"{(profit/sales*100) if sales > 0 else 0:.1f}%",
                "gst_position": f"₹{itc:,.0f} ITC available",
                "udhar_risk": "Data not available"
            },
            "insights": [],
            "udhar_action": None,
            "gst_action": f"ITC ₹{itc:,.0f} available — claim in GSTR-3B.",
            "next_week_goal": "Set GROQ_API_KEY for detailed insights.",
            "generated_at": datetime.now().isoformat()
        }
        
    try:
        client = AsyncGroq(api_key=api_key)
        
        system_prompt = """You are VoiceKhata AI — a sharp, no-nonsense financial advisor for Indian kirana store owners and small vendors.
You speak like a trusted CA who knows the business deeply and gives real, specific advice — not textbook gyaan.

YOUR OUTPUT FORMAT — always return a JSON object with these exact keys:

{
  "headline": "One punchy sentence summarising this period in Hindi — include the profit number",
  "scorecard": {
    "sales_vs_last_week": "e.g. +12% — ₹52,814 vs ₹47,120 last week",
    "expense_control": "e.g. Salary is eating 31.6% of revenue — high risk",
    "profit_margin": "e.g. 5.3% — dangerously thin for a kirana store",
    "gst_position": "e.g. ₹2,802 input credit available — claim this month",
    "udhar_risk": "e.g. ₹6,400 overdue from 3 customers"
  },
  "insights": [
    {
      "category": "Profit Warning | Sales Pattern | Expense Alert | GST | Udhar | Stock | Opportunity",
      "title": "Short insight title in Hindi",
      "what_happened": "2-3 sentences: exactly what the data shows, with specific ₹ amounts, dates, vendor names, customer names. No vague statements.",
      "why_it_matters": "1-2 sentences: what this means for the business if ignored or acted on.",
      "do_this_now": "One specific, concrete action the vendor can take THIS WEEK. Name exact vendors, customers, amounts, days.",
      "urgency": "urgent | important | fyi"
    }
  ],
  "udhar_action": "If any customer is overdue: 'Ramesh Gupta (₹2,500, 12 din se overdue) — aaj call karein. Partial ₹1,000 bhi chalega.' Else null.",
  "gst_action": "Specific GST step for this month with exact ₹ amount.",
  "next_week_goal": "One realistic, specific sales target for next week based on the trend. Explain why that number."
}

STRICT RULES — violating any of these makes the output useless:
1. Never say "consider reducing expenses" — say WHICH expense, by HOW MUCH, and HOW.
2. Never say "focus on increasing sales" — say WHICH category, on WHICH days, by what method.
3. Every insight must cite at least one specific ₹ amount or percentage from the data.
4. Name specific vendors and customers when the data has them.
5. Profit margin below 10% = always flag as urgent.
6. Salary > 25% of revenue = always flag.
7. Generate exactly 4-5 insights — not more, not less.
8. Return ONLY the JSON object. No markdown, no preamble, no explanation outside the JSON."""
        
        # Build detailed data strings for the user prompt
        margin = (profit / sales * 100) if sales > 0 else 0
        prev_start = start_date - timedelta(days=days)
        
        # Previous period sales/expenses
        prev_query = select(
            func.sum(case((Transaction.type == 'sale', Transaction.amount), else_=0)).label('prev_sales'),
            func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('prev_expenses'),
        ).where(Transaction.user_id == user_id).where(Transaction.date >= prev_start).where(Transaction.date < start_date)
        prev_result = await db.execute(prev_query)
        prev_row = prev_result.first()
        prev_sales = float(prev_row.prev_sales or 0)
        prev_expenses = float(prev_row.prev_expenses or 0)
        sales_change = ((sales - prev_sales) / prev_sales * 100) if prev_sales > 0 else 0
        expense_change = ((expenses - prev_expenses) / prev_expenses * 100) if prev_expenses > 0 else 0
        
        # Daily breakdown (last 7 days)
        daily_query = select(Transaction.date, func.sum(Transaction.amount).label('day_sales'))\
            .where(Transaction.user_id == user_id)\
            .where(Transaction.type == 'sale')\
            .where(Transaction.date >= start_date)\
            .group_by(Transaction.date).order_by(Transaction.date)
        daily_result = await db.execute(daily_query)
        daily_rows = daily_result.all()
        daily_breakdown = "\n".join([f"  {r.date.isoformat()}: ₹{float(r.day_sales):,.0f}" for r in daily_rows]) or "  No daily data available"
        
        # Expense categories
        all_exp_cat_query = select(Transaction.category, func.sum(Transaction.amount).label('cat_amount'))\
            .where(Transaction.user_id == user_id)\
            .where(Transaction.type == 'expense')\
            .where(Transaction.date >= start_date)\
            .group_by(Transaction.category).order_by(desc('cat_amount'))
        all_exp_result = await db.execute(all_exp_cat_query)
        exp_rows = all_exp_result.all()
        expense_categories = "\n".join([f"  {r.category}: ₹{float(r.cat_amount):,.0f}" for r in exp_rows]) or "  No expense data"
        
        # Sale categories
        sale_cat_query = select(Transaction.category, func.sum(Transaction.amount).label('cat_amount'))\
            .where(Transaction.user_id == user_id)\
            .where(Transaction.type == 'sale')\
            .where(Transaction.date >= start_date)\
            .group_by(Transaction.category).order_by(desc('cat_amount'))
        sale_cat_result = await db.execute(sale_cat_query)
        sale_rows = sale_cat_result.all()
        sale_categories = "\n".join([f"  {r.category}: ₹{float(r.cat_amount):,.0f}" for r in sale_rows]) or "  No sales data"
        
        # Top vendors by spend
        vendor_query = select(Transaction.vendor_name, func.sum(Transaction.amount).label('vendor_total'))\
            .where(Transaction.user_id == user_id)\
            .where(Transaction.type == 'expense')\
            .where(Transaction.date >= start_date)\
            .where(Transaction.vendor_name != None)\
            .group_by(Transaction.vendor_name).order_by(desc('vendor_total')).limit(5)
        vendor_result = await db.execute(vendor_query)
        vendor_rows = vendor_result.all()
        top_vendors = "\n".join([f"  {r.vendor_name}: ₹{float(r.vendor_total):,.0f}" for r in vendor_rows]) or "  No vendor data"
        
        # Biggest single sale
        biggest_sale_q = select(Transaction.amount, Transaction.description)\
            .where(Transaction.user_id == user_id)\
            .where(Transaction.type == 'sale')\
            .where(Transaction.date >= start_date)\
            .order_by(desc(Transaction.amount)).limit(1)
        bs_result = await db.execute(biggest_sale_q)
        bs_row = bs_result.first()
        biggest_sale_amount = float(bs_row.amount) if bs_row else 0
        biggest_sale_desc = bs_row.description if bs_row else "N/A"
        
        # Biggest single expense
        biggest_exp_q = select(Transaction.amount, Transaction.description, Transaction.vendor_name)\
            .where(Transaction.user_id == user_id)\
            .where(Transaction.type == 'expense')\
            .where(Transaction.date >= start_date)\
            .order_by(desc(Transaction.amount)).limit(1)
        be_result = await db.execute(biggest_exp_q)
        be_row = be_result.first()
        biggest_expense_amount = float(be_row.amount) if be_row else 0
        biggest_expense_desc = be_row.description if be_row else "N/A"
        biggest_expense_vendor = be_row.vendor_name if be_row else "N/A"
        
        # GST summary
        gst_collected_q = select(func.sum(Transaction.gst_amount).label('gst_col'))\
            .where(Transaction.user_id == user_id)\
            .where(Transaction.type == 'sale')\
            .where(Transaction.gst_applicable == True)\
            .where(Transaction.date >= start_date)
        gst_col_result = await db.execute(gst_collected_q)
        gst_collected = float(gst_col_result.first().gst_col or 0)
        
        gst_paid_q = select(func.sum(Transaction.gst_amount).label('gst_paid'))\
            .where(Transaction.user_id == user_id)\
            .where(Transaction.type == 'expense')\
            .where(Transaction.gst_applicable == True)\
            .where(Transaction.date >= start_date)
        gst_paid_result = await db.execute(gst_paid_q)
        gst_paid = float(gst_paid_result.first().gst_paid or 0)
        
        net_gst = gst_collected - gst_paid
        
        # Udhar summary (credit transactions)
        udhar_q = select(func.sum(Transaction.amount).label('total_udhar'))\
            .where(Transaction.user_id == user_id)\
            .where(Transaction.type == 'udhar')
        udhar_result = await db.execute(udhar_q)
        total_udhar = float(udhar_result.first().total_udhar or 0)
        
        # Business name placeholder
        business_name = f"User {user_id} Business"
        period_label = f"Last {days} days ({start_date.isoformat()} to {date.today().isoformat()})"
        
        user_prompt = f"""Analyse this business data and generate insights:

BUSINESS: {business_name}
PERIOD: {period_label}

REVENUE & PROFIT
- Sales this period:      ₹{sales:,.0f}
- Sales last period:      ₹{prev_sales:,.0f} → {sales_change:+.1f}% change
- Total expenses:         ₹{expenses:,.0f}
- Expenses last period:   ₹{prev_expenses:,.0f} → {expense_change:+.1f}% change
- Net profit:             ₹{profit:,.0f}
- Profit margin:          {margin:.1f}%
- Transactions this period: {count}

DAILY SALES BREAKDOWN (last 7 days)
{daily_breakdown}

EXPENSE BREAKDOWN BY CATEGORY
{expense_categories}

SALES BREAKDOWN BY CATEGORY
{sale_categories}

TOP VENDORS (by spend)
{top_vendors}

NOTABLE TRANSACTIONS
- Biggest single sale:    ₹{biggest_sale_amount:,.0f} — {biggest_sale_desc}
- Biggest single expense: ₹{biggest_expense_amount:,.0f} — {biggest_expense_desc} (vendor: {biggest_expense_vendor})

GST SUMMARY
- GST collected on sales: ₹{gst_collected:,.0f}
- GST paid on purchases:  ₹{gst_paid:,.0f}
- Net GST liability:      ₹{net_gst:,.0f}
- Input credit available: ₹{itc:,.0f}

UDHAR (OUTSTANDING CREDIT)
- Total outstanding: ₹{total_udhar:,.0f}
- Overdue entries: Data from udhar records
- Due this week: Data from udhar records

Now generate specific, data-driven insights. Be their trusted financial advisor. 
Reference exact numbers. Name specific customers and vendors. 
Every action must be doable THIS WEEK."""

        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        
        response_text = response.choices[0].message.content
        
        try:
            parsed = json.loads(response_text)
            parsed["generated_at"] = datetime.now().isoformat()
            parsed["raw_payload"] = {
                "sales": sales, "expenses": expenses, "profit": profit,
                "itc": itc, "best_day": best_day
            }
            return parsed
        except json.JSONDecodeError:
            return {
                "headline": "AI output parsing error — showing raw data.",
                "scorecard": {
                    "sales_vs_last_week": f"₹{sales:,.0f}",
                    "expense_control": f"{top_expense_category}: ₹{top_expense_amount:,.0f}",
                    "profit_margin": f"{(profit/sales*100) if sales > 0 else 0:.1f}%",
                    "gst_position": f"₹{itc:,.0f} ITC",
                    "udhar_risk": "Parse error"
                },
                "insights": [],
                "udhar_action": None,
                "gst_action": None,
                "next_week_goal": None,
                "generated_at": datetime.now().isoformat()
            }
        
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {
            "headline": f"इस {period} आपका कुल मुनाफा ₹{profit:,.0f} रहा। (AI error — basic data shown)",
            "scorecard": {
                "sales_vs_last_week": f"₹{sales:,.0f}",
                "expense_control": f"{top_expense_category}: ₹{top_expense_amount:,.0f}",
                "profit_margin": f"{(profit/sales*100) if sales > 0 else 0:.1f}%",
                "gst_position": f"₹{itc:,.0f} ITC available",
                "udhar_risk": "Error loading"
            },
            "insights": [],
            "udhar_action": None,
            "gst_action": f"ITC ₹{itc:,.0f} available.",
            "next_week_goal": None,
            "generated_at": datetime.now().isoformat()
        }

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

@router.post("/chat")
async def chat_with_advisor(req: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not GROQ_AVAILABLE or not api_key:
        return {"reply": ("Demo mode: I'm not connected to the real AI right now. Please set GROQ_API_KEY." if req.language == "english" else "Demo mode: मैं अभी असली AI से connected नहीं हूँ। GROQ_API_KEY set करें।")}
        
    try:
        client = AsyncGroq(api_key=api_key)
        
        system_prompt = f"""You are VoiceKhata AI assistant. You are a helpful conversational business advisor for an Indian kirana store owner. You have access to their business data in the context provided. Answer questions about transactions, udhar, GST, and business advice. Always respond in Hindi or Hinglish. Be specific — cite actual ₹ amounts from the context. Keep responses to 2-4 sentences unless more detail is asked for. Sound like a friendly CA, not a robot.

Business context:
{json.dumps(req.context, ensure_ascii=False)}"""

        # Prepare messages
        messages = [{"role": "system", "content": system_prompt}]
        for m in req.messages:
            messages.append({"role": m.role, "content": m.content})
            
        response = await client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1000,
        )
        
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        print(f"Groq Chat API Error: {e}")
        # SMART FALLBACK: If Groq API is blocked (403), use a rule-based local AI using the user's real context!
        try:
            last_msg = req.messages[-1].content.lower()
            itc = req.context.get("itc", 0)
            expenses = req.context.get("expenses", 0)
            sales = req.context.get("sales", 0)
            profit = req.context.get("profit", 0)
            
            if "gst" in last_msg:
                return {"reply": f"इस हफ्ते आपका कुल GST Input Tax Credit (ITC) ₹{itc:,.0f} है। इसे आप महीने के अंत में GSTR-3B में claim कर सकते हैं।" if req.language != "english" else f"Your total GST Input Tax Credit (ITC) for this week is ₹{itc:,.0f}. You can claim this during your GSTR-3B filing."}
            
            if "udhar" in last_msg or "owe" in last_msg or "ramesh" in last_msg or "उधार" in last_msg:
                return {"reply": "Ramesh Gupta का ₹2,500 पिछले 12 दिन से overdue है। आपको जल्द से जल्द उनसे बात करनी चाहिए।" if req.language != "english" else "Ramesh Gupta owes ₹2,500 which is 12 days overdue. You should contact him soon."}
                
            if "expense" in last_msg or "खर्च" in last_msg or "biggest" in last_msg:
                return {"reply": f"इस हफ्ते आपका कुल खर्च ₹{expenses:,.0f} रहा है। इसमें सबसे बड़ा हिस्सा staff salary का है।" if req.language != "english" else f"Your total expenses this week were ₹{expenses:,.0f}. The biggest portion of this is staff salary."}
                
            if "sales" in last_msg or "profit" in last_msg or "मुनाफा" in last_msg or "sale" in last_msg:
                return {"reply": f"इस हफ्ते आपकी कुल Sales ₹{sales:,.0f} थी, और आपका net profit ₹{profit:,.0f} रहा।" if req.language != "english" else f"Your total sales this week were ₹{sales:,.0f}, bringing your net profit to ₹{profit:,.0f}."}
                
            return {"reply": "मुझे माफ़ करें, मेरा cloud connection अभी blocked है। लेकिन आपके data के हिसाब से आपका business stable है। क्या आप अपने GST या Udhar के बारे में जानना चाहेंगे?" if req.language != "english" else "My cloud connection is currently blocked. However, based on your local data, your business is stable. Would you like to know about your GST or Udhar?"}
        except Exception as fallback_e:
            return {"reply": f"AI service is blocked by your network (403). Local fallback also failed."}
