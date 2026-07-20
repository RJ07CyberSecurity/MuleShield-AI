import sys, os
sys.path.insert(0, 'E:/MuleShieldAI/backend/shared')
sys.path.insert(0, 'E:/MuleShieldAI/backend/services/ingestion-service')

from app.api.v1.ingestion import parse_pdf
with open('E:/MuleShieldAI/fixtures/last_uploaded.pdf', 'rb') as f:
    pdf_bytes = f.read()

valid, invalid = parse_pdf(pdf_bytes)
for r in valid:
    if r['currency'] == 'INR':
        print(f"{r['timestamp'].strftime('%Y-%m-%d')} | {r['transaction_type']} {r['amount']} | Sender: {r['sender_account']} | Receiver: {r['receiver_account']}")
