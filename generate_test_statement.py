import os
import random
from datetime import datetime, timedelta

try:
    from fpdf import FPDF
except ImportError:
    import subprocess
    subprocess.check_call(["pip", "install", "fpdf2"])
    from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 15)
        self.cell(0, 10, "Bank Statement", 0, 1, "C")
        self.set_font("helvetica", "", 12)
        self.cell(0, 10, "Account Holder: John Doe", 0, 1, "L")
        self.cell(0, 10, "Account Number: 1234567890", 0, 1, "L")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", 0, 0, "C")

def generate_transactions():
    transactions = []
    start_date = datetime(2025, 7, 20)
    end_date = datetime(2026, 7, 20)
    
    current_date = start_date
    balance = 5000.0

    # Normal transactions (monthly salary, groceries, rent, etc.)
    while current_date <= end_date:
        # Salary
        transactions.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "description": "Salary Deposit",
            "type": "Credit",
            "amount": 4000.00
        })
        # Rent
        rent_date = current_date + timedelta(days=2)
        if rent_date <= end_date:
            transactions.append({
                "date": rent_date.strftime("%Y-%m-%d"),
                "description": "Rent Payment",
                "type": "Debit",
                "amount": 1500.00
            })
        
        # Groceries
        groc_date = current_date + timedelta(days=10)
        if groc_date <= end_date:
            transactions.append({
                "date": groc_date.strftime("%Y-%m-%d"),
                "description": "Grocery Store",
                "type": "Debit",
                "amount": round(random.uniform(100, 300), 2)
            })

        current_date += timedelta(days=30)

    # Inject 10 Mule Account Transactions (rapid large inflows/outflows)
    mule_dates = [datetime(2026, 2, i) for i in range(1, 11)]
    mule_accounts = [f"SUSP_ACCT_{random.randint(1000, 9999)}" for _ in range(5)]
    
    for i, m_date in enumerate(mule_dates):
        # Inflow
        in_amount = round(random.uniform(5000, 10000), 2)
        transactions.append({
            "date": m_date.strftime("%Y-%m-%d"),
            "description": f"Transfer In {random.choice(mule_accounts)}",
            "type": "Credit",
            "amount": in_amount
        })
        # Immediate Outflow (almost the same amount)
        transactions.append({
            "date": (m_date + timedelta(hours=2)).strftime("%Y-%m-%d"), # same day
            "description": f"Transfer Out {random.choice(mule_accounts)}",
            "type": "Debit",
            "amount": in_amount - round(random.uniform(10, 50), 2)
        })

    # Sort by date
    transactions.sort(key=lambda x: x["date"])

    # Calculate balances
    for t in transactions:
        if t["type"] == "Credit":
            balance += t["amount"]
        else:
            balance -= t["amount"]
        t["balance"] = round(balance, 2)

    return transactions

def create_pdf(transactions, output_filename="test_bank_statement.pdf"):
    pdf = PDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 10)

    # Table Header
    col_widths = [30, 80, 25, 25, 30]
    headers = ["Date", "Description", "Type", "Amount", "Balance"]
    
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 10, header, 1, 0, "C")
    pdf.ln()

    pdf.set_font("helvetica", "", 9)
    for t in transactions:
        pdf.cell(col_widths[0], 10, t["date"], 1, 0, "C")
        pdf.cell(col_widths[1], 10, t["description"][:45], 1, 0, "L")
        pdf.cell(col_widths[2], 10, t["type"], 1, 0, "C")
        pdf.cell(col_widths[3], 10, f"${t['amount']:,.2f}", 1, 0, "R")
        pdf.cell(col_widths[4], 10, f"${t['balance']:,.2f}", 1, 1, "R")

    pdf.output(output_filename)
    print(f"Statement generated: {output_filename}")

if __name__ == "__main__":
    txns = generate_transactions()
    create_pdf(txns, r"e:\MuleShieldAI\test_bank_statement.pdf")
