import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf():
    # Resolve directory
    fixtures_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fixtures"))
    os.makedirs(fixtures_dir, exist_ok=True)
    pdf_path = os.path.join(fixtures_dir, "sample_statement.pdf")
    
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor("#DC2626"),
        spaceAfter=15
    )
    
    story.append(Paragraph("MULESHIELD BANK FORENSIC STATEMENT LOG", title_style))
    story.append(Spacer(1, 10))
    
    headers = ["Sender", "Receiver", "Amount", "Currency", "Timestamp", "Channel"]
    
    txs = [
        ["ACC-MULE-R1", "ACC-RECEIVER-A", "15000.00", "USD", "2026-07-17 10:00:00", "SWIFT"],
        ["ACC-MULE-R1", "ACC-RECEIVER-B", "18000.00", "USD", "2026-07-17 11:30:00", "SWIFT"],
        ["ACC-MULE-R2", "ACC-RECEIVER-A", "150.00", "USD", "2026-03-01 08:00:00", "ACH"],
        ["ACC-MULE-R2", "ACC-RECEIVER-B", "500.00", "USD", "2026-07-17 09:00:00", "ACH"],
        ["ACC-MULE-R2", "ACC-RECEIVER-C", "1000.00", "USD", "2026-07-17 10:15:00", "ACH"],
        ["ACC-MULE-R2", "ACC-RECEIVER-D", "200.00", "USD", "2026-07-17 12:00:00", "ACH"],
        ["ACC-MULE-R2", "ACC-RECEIVER-E", "350.00", "USD", "2026-07-17 13:45:00", "ACH"],
        ["ACC-MULE-R2", "ACC-RECEIVER-F", "1200.00", "USD", "2026-07-17 15:20:00", "ACH"],
        ["ACC-MULE-R2", "ACC-RECEIVER-G", "900.00", "USD", "2026-07-17 16:10:00", "ACH"],
        ["ACC-MULE-R3", "ACC-FAN-OUT-1", "100.00", "USD", "2026-07-17 08:00:00", "P2P"],
        ["ACC-MULE-R3", "ACC-FAN-OUT-2", "150.00", "USD", "2026-07-17 08:15:00", "P2P"],
        ["ACC-MULE-R3", "ACC-FAN-OUT-3", "200.00", "USD", "2026-07-17 08:30:00", "P2P"],
        ["ACC-MULE-R3", "ACC-FAN-OUT-4", "100.00", "USD", "2026-07-17 08:45:00", "P2P"],
        ["ACC-MULE-R3", "ACC-FAN-OUT-5", "300.00", "USD", "2026-07-17 09:00:00", "P2P"],
        ["ACC-MULE-R3", "ACC-FAN-OUT-6", "120.00", "USD", "2026-07-17 09:15:00", "P2P"],
        ["ACC-NODE-A", "ACC-NODE-B", "4500.00", "USD", "2026-07-17 12:00:00", "SWIFT"],
        ["ACC-NODE-B", "ACC-NODE-C", "4500.00", "USD", "2026-07-17 14:00:00", "SWIFT"],
        ["ACC-NODE-C", "ACC-NODE-A", "4500.00", "USD", "2026-07-17 16:00:00", "SWIFT"],
    ]
    
    table_data = [headers] + txs
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F5F5F5")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(table)
    doc.build(story)
    print(f"Generated sample PDF statement in: {pdf_path}")

if __name__ == "__main__":
    generate_pdf()
