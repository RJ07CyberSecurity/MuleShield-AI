import sys
sys.path.insert(0, "E:/MuleShieldAI/backend/shared")
sys.path.insert(0, "E:/MuleShieldAI/backend/services/ingestion-service")

with open("E:/MuleShieldAI/fixtures/sample_statement.pdf", "rb") as f:
    pdf_bytes = f.read()

from app.api.v1.ingestion import parse_pdf
valid, invalid = parse_pdf(pdf_bytes)
print(f"Valid rows: {len(valid)}")
print(f"Invalid rows: {len(invalid)}")
if valid:
    print("Sample row:", valid[0])
if invalid:
    print("First invalid:", invalid[0])
