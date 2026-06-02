import asyncio
import random
import uuid
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine
from app.models import User, Transaction, TransactionType, Udhar, UdharStatus, UdharType

CATEGORIES = {
    "sale": ["Groceries", "Beverages", "Snacks", "Personal Care", "Household Items"],
    "expense": ["Rent", "Electricity", "Inventory Restock", "Staff Salary", "Maintenance"]
}

VENDORS = ["Metro Cash & Carry", "Reliance B2B", "Udaan", "Local Distributor", "City Wholesale"]
CUSTOMERS = ["Suresh", "Ramesh", "Priya", "Amit", "Rahul", "Anita", "Vikas"]


async def seed_data():
    async with AsyncSessionLocal() as session:
        # Create Demo User with fixed UUID for frontend integration
        demo_user_id = 1
        user = User(
            id=demo_user_id,
            name="Rajesh Sharma",
            business_name="Kirana Store Pune"
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        print(f"Created user: {user.name} (ID: {user.id})")

        # Generate exactly 30 days of sample data
        transactions = []
        today = date.today()
        
        # Make sure we have data for every single day in the last 30 days
        for days_ago in range(30):
            txn_date = today - timedelta(days=days_ago)
            
            # 2 to 5 transactions per day
            num_txns = random.randint(2, 5)
            for _ in range(num_txns):
                # Decide type (mostly sales, some expenses)
                is_sale = random.random() > 0.3
                
                if is_sale:
                    txn_type = TransactionType.SALE
                    amount = Decimal(random.randint(200, 5000))
                    category = random.choice(CATEGORIES["sale"])
                    vendor = None
                    desc = f"Sold {category.lower()} items"
                    gst_rate = Decimal(random.choice([0, 5, 12, 18])) if random.random() > 0.5 else None
                else:
                    txn_type = TransactionType.EXPENSE
                    amount = Decimal(random.randint(1000, 15000))
                    category = random.choice(CATEGORIES["expense"])
                    vendor = random.choice(VENDORS)
                    desc = f"Paid for {category.lower()}"
                
                # Randomly add GST info
                gst_applicable = random.random() < 0.3
                gst_rate = Decimal(random.choice([5, 12, 18])) if gst_applicable else None
                gst_amount = (amount * (gst_rate / Decimal('100'))).quantize(Decimal('0.01')) if gst_applicable else None
                    
                txn = Transaction(
                    user_id=user.id,
                    type=txn_type,
                    amount=amount,
                    description=desc,
                    vendor_name=vendor,
                    category=category,
                    date=txn_date,
                    gst_applicable=gst_applicable,
                    gst_rate=gst_rate,
                    gst_amount=gst_amount
                )
                transactions.append(txn)
            
        session.add_all(transactions)
        
        # Generate 5-10 Udhar entries
        udhars = []
        num_udhars = random.randint(5, 10)
        
        for _ in range(num_udhars):
            days_ago = random.randint(0, 30)
            udhar_date = today - timedelta(days=days_ago)
            
            amount = Decimal(random.randint(500, 10000))
            customer = random.choice(CUSTOMERS)
            
            # Some are settled, some are pending
            is_settled = random.random() > 0.6
            status = UdharStatus.SETTLED if is_settled else UdharStatus.PENDING
            
            due_date = udhar_date + timedelta(days=15) if status == UdharStatus.PENDING else None
            
            udhar = Udhar(
                user_id=user.id,
                customer_name=customer,
                amount=amount,
                due_date=due_date,
                status=status,
                type=UdharType.GIVEN
            )
            udhars.append(udhar)
            
        session.add_all(udhars)
        await session.commit()
        
        print(f"Inserted {len(transactions)} transactions over 30 days and {len(udhars)} udhar entries.")

async def main():
    print("Starting database seed for new schema...")
    await seed_data()
    print("Database seeding completed.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
