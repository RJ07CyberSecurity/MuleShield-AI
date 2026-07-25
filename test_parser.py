import sys
import os

sys.path.append(r"e:\MuleShieldAI\backend\services\ingestion-service")

from app.api.v1.ingestion import parse_pdf
import json
from decimal import Decimal
import datetime
import pdfplumber

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return super().default(obj)

file_path = r"C:\Users\rudra\.gemini\antigravity-ide\brain\454d1641-3b3e-43ca-a7cd-45b6996c4ffd\media__1784789338362.pdf"

with open(file_path, "rb") as f:
    valid, invalid = parse_pdf(f.read())
    
print("VALID TRANSACTIONS:", len(valid))
for v in valid[:5]:
    print(json.dumps(v, cls=CustomEncoder, indent=2))
