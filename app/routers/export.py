import io
import calendar
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    import matplotlib.pyplot as plt
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from app.database import get_db
from app.models import User, Transaction, Udhar

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.get("/pdf")
async def generate_monthly_pdf(user_id: int, month: int, year: int, db: AsyncSession = Depends(get_db)):
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=500, detail="ReportLab not installed. Cannot generate PDF.")
        
    try:
        num_days = calendar.monthrange(year, month)[1]
        start_date = date(year, month, 1)
        end_date = date(year, month, num_days)
        month_name = calendar.month_name[month]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month or year")
        
    # 1. Fetch User Data
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    business_name = user.business_name if user and user.business_name else "My Business"
    gstin = user.gstin if user and user.gstin else "Not Provided"
    
    # 2. Fetch Transactions
    tx_query = select(Transaction).where(Transaction.user_id == user_id)\
        .where(Transaction.date >= start_date).where(Transaction.date <= end_date).order_by(Transaction.date.asc())
    tx_res = await db.execute(tx_query)
    transactions = tx_res.scalars().all()
    
    total_sales = sum(float(tx.amount) for tx in transactions if tx.type == 'sale')
    total_expenses = sum(float(tx.amount) for tx in transactions if tx.type == 'expense')
    net_profit = total_sales - total_expenses
    
    gst_collected = sum(float(tx.gst_amount) for tx in transactions if tx.type == 'sale' and tx.gst_amount)
    gst_paid = sum(float(tx.gst_amount) for tx in transactions if tx.type == 'expense' and tx.gst_amount)
    net_liability = max(0, gst_collected - gst_paid)
    
    # 3. Fetch Udhar Data
    udhar_query = select(Udhar).where(Udhar.user_id == user_id).where(Udhar.status == 'pending')
    udhar_res = await db.execute(udhar_query)
    udhar_records = udhar_res.scalars().all()
    total_udhar = sum(float(u.amount) for u in udhar_records)
    
    # Buffer for PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(name="TitleStyle", parent=styles['Heading1'], fontSize=24, spaceAfter=20, textColor=colors.HexColor('#00B9F1'))
    header_style = ParagraphStyle(name="HeaderStyle", parent=styles['Heading2'], fontSize=18, spaceAfter=10)
    normal_style = styles["Normal"]
    
    elements = []
    
    # ==========================
    # PAGE 1: COVER
    # ==========================
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph(f"<b>{business_name}</b>", title_style))
    elements.append(Paragraph(f"GSTIN: {gstin}", header_style))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(f"<b>Business Summary Report</b>", ParagraphStyle(name="Subtitle", fontSize=20)))
    elements.append(Paragraph(f"For the month of: {month_name} {year}", header_style))
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph(f"Generated on: {date.today().isoformat()}", normal_style))
    elements.append(Paragraph("Powered by VoiceKhata", normal_style))
    elements.append(PageBreak())
    
    # ==========================
    # PAGE 2: EXECUTIVE SUMMARY
    # ==========================
    elements.append(Paragraph("Executive Summary", header_style))
    elements.append(Spacer(1, 10))
    
    kpi_data = [
        ["Total Sales", f"Rs. {total_sales:,.2f}"],
        ["Total Expenses", f"Rs. {total_expenses:,.2f}"],
        ["Net Profit", f"Rs. {net_profit:,.2f}"],
        ["GST Collected", f"Rs. {gst_collected:,.2f}"],
        ["ITC Claimable (GST Paid)", f"Rs. {gst_paid:,.2f}"],
        ["Net GST Liability", f"Rs. {net_liability:,.2f}"],
        ["Total Transactions", str(len(transactions))]
    ]
    kpi_table = Table(kpi_data, colWidths=[3*inch, 3*inch])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.black),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 1, colors.white)
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 30))
    
    # Matplotlib Chart
    plt.figure(figsize=(5, 3))
    categories = ['Sales', 'Expenses']
    values = [total_sales, total_expenses]
    plt.bar(categories, values, color=['#10b981', '#ef4444'])
    plt.title(f'Performance: {month_name} {year}')
    plt.ylabel('Amount (Rs)')
    
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', bbox_inches='tight')
    img_buffer.seek(0)
    plt.close()
    
    img = RLImage(img_buffer, width=4*inch, height=2.4*inch)
    elements.append(img)
    elements.append(PageBreak())
    
    # ==========================
    # PAGE 3: TRANSACTION LEDGER
    # ==========================
    elements.append(Paragraph("Transaction Ledger", header_style))
    elements.append(Spacer(1, 10))
    
    ledger_data = [["Date", "Type", "Description", "Amount", "GST"]]
    row_colors = []
    
    for i, tx in enumerate(transactions):
        ledger_data.append([
            tx.date.isoformat(),
            tx.type.capitalize(),
            (tx.description or "")[:30], # Truncate long descriptions
            f"{float(tx.amount):.2f}",
            f"{float(tx.gst_amount or 0):.2f}"
        ])
        if tx.type == 'sale':
            row_colors.append(('BACKGROUND', (0, i+1), (-1, i+1), colors.HexColor('#d1fae5'))) # Light green
        elif tx.type == 'expense':
            row_colors.append(('BACKGROUND', (0, i+1), (-1, i+1), colors.HexColor('#fee2e2'))) # Light red
            
    ledger_table = Table(ledger_data, colWidths=[1*inch, 1*inch, 2.5*inch, 1*inch, 1*inch])
    base_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#00B9F1')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]
    ledger_table.setStyle(TableStyle(base_style + row_colors))
    elements.append(ledger_table)
    elements.append(PageBreak())
    
    # ==========================
    # PAGE 4: GST SUMMARY
    # ==========================
    elements.append(Paragraph("GST Summary (GSTR Preparation)", header_style))
    elements.append(Spacer(1, 10))
    
    elements.append(Paragraph("1. Outward Supplies (Sales - GST Collected)", normal_style))
    sales_gst_data = [["Date", "Amount", "GST Rate", "GST Collected"]]
    for tx in transactions:
        if tx.type == 'sale' and tx.gst_applicable:
            sales_gst_data.append([tx.date.isoformat(), f"{float(tx.amount):.2f}", f"{tx.gst_rate}%", f"{float(tx.gst_amount):.2f}"])
    
    if len(sales_gst_data) > 1:
        s_table = Table(sales_gst_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        s_table.setStyle(TableStyle(base_style))
        elements.append(s_table)
    else:
        elements.append(Paragraph("No taxable sales recorded.", normal_style))
        
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph("2. Inward Supplies (Purchases - ITC Claimable)", normal_style))
    exp_gst_data = [["Date", "Amount", "GST Rate", "ITC Claimable"]]
    for tx in transactions:
        if tx.type == 'expense' and tx.gst_applicable:
            exp_gst_data.append([tx.date.isoformat(), f"{float(tx.amount):.2f}", f"{tx.gst_rate}%", f"{float(tx.gst_amount):.2f}"])
            
    if len(exp_gst_data) > 1:
        e_table = Table(exp_gst_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        e_table.setStyle(TableStyle(base_style))
        elements.append(e_table)
    else:
        elements.append(Paragraph("No ITC claimable purchases recorded.", normal_style))
        
    elements.append(PageBreak())
    
    # ==========================
    # PAGE 5: UDHAR SUMMARY
    # ==========================
    elements.append(Paragraph("Udhar (Credit) Summary", header_style))
    elements.append(Spacer(1, 10))
    
    udhar_data = [["Customer Name", "Amount Due", "Due Date"]]
    for u in udhar_records:
        udhar_data.append([
            u.customer_name,
            f"{float(u.amount):.2f}",
            u.due_date.isoformat() if u.due_date else "Not set"
        ])
        
    if len(udhar_data) > 1:
        u_table = Table(udhar_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
        u_table.setStyle(TableStyle(base_style))
        elements.append(u_table)
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(f"<b>Total Outstanding: Rs. {total_udhar:,.2f}</b>", normal_style))
    else:
        elements.append(Paragraph("No outstanding udhar records.", normal_style))
        
    # Build Document
    doc.build(elements)
    
    buffer.seek(0)
    filename = f"VoiceKhata_Report_{month_name}_{year}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
