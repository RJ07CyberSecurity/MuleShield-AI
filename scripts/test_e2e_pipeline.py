"""
MuleShield AI - End-to-End Pipeline Integration Test
Tests the complete flow:
  1. Upload statement (CSV)
  2. Fetch summary (staged)
  3. Confirm ingestion
  4. Fetch summary (confirmed)
  5. Fetch flagged accounts (with manual detection trigger if needed)
  6. Generate SAR report
"""
import urllib.request
import json
import sys
import time

BASE = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json", "Accept": "application/json"}

# Unique run ID so each test run doesn't create duplicate transactions
RUN_ID = str(int(time.time()))[-6:]  # last 6 digits of epoch


def get(path):
    req = urllib.request.Request(f"{BASE}{path}", headers=HEADERS, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def post_json(path, data=None):
    body = json.dumps(data or {}).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=body,
        headers={**HEADERS, "Content-Length": str(len(body))}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def post_multipart(path, filename, file_bytes, mime="text/csv"):
    boundary = b"----FormBoundaryTEST"
    crlf = b"\r\n"
    body = (
        b"--" + boundary + crlf +
        f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode() + crlf +
        f"Content-Type: {mime}".encode() + crlf + crlf +
        file_bytes + crlf +
        b"--" + boundary + b"--" + crlf
    )
    req = urllib.request.Request(f"{BASE}{path}", data=body,
        headers={"Content-Type": "multipart/form-data; boundary=----FormBoundaryTEST"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def ok(label, status, body, check_key=None):
    success = body.get("success", False)
    if status not in (200, 201) or not success:
        print(f"  FAIL  [{status}] {label}")
        print(f"         {json.dumps(body, indent=2)[:500]}")
        return False
    data = body.get("data")
    if check_key and data:
        val = data.get(check_key) if isinstance(data, dict) else None
        print(f"  PASS  {label} -> {check_key}={val}")
    else:
        print(f"  PASS  {label} [{status}]")
    return True

print("\n" + "="*60)
print("  MuleShield AI -- End-to-End Pipeline Test")
print("="*60)

# STEP 1: UPLOAD CSV
print("\n[1/6] Upload CSV Statement")
from datetime import datetime, timezone

# Generate current timestamp strings so each run has unique fingerprints
now = datetime.now(timezone.utc)
ts = lambda m: now.replace(minute=now.minute + m if now.minute + m < 60 else (now.minute + m) % 60).strftime("%Y-%m-%dT%H:%M:%SZ")
t0 = now.strftime("%Y-%m-%dT%H:%M:%SZ")
t1 = now.replace(second=(now.second + 5) % 60).strftime("%Y-%m-%dT%H:%M:%SZ")
t2 = now.replace(second=(now.second + 10) % 60).strftime("%Y-%m-%dT%H:%M:%SZ")
t3 = now.replace(second=(now.second + 15) % 60).strftime("%Y-%m-%dT%H:%M:%SZ")
t4 = now.replace(second=(now.second + 20) % 60).strftime("%Y-%m-%dT%H:%M:%SZ")

csv = (
    "sender_account,receiver_account,amount,currency,timestamp,transaction_type,payment_channel,transaction_id\n"
    f"MULE-ACC-001,RECV-ACC-001,12500.00,USD,{t0},TRANSFER,ACH,E2E-{RUN_ID}-001\n"
    f"MULE-ACC-001,RECV-ACC-002,14200.00,USD,{t1},TRANSFER,SWIFT,E2E-{RUN_ID}-002\n"
    f"MULE-ACC-001,RECV-ACC-003,9800.00,USD,{t2},TRANSFER,ACH,E2E-{RUN_ID}-003\n"
    f"MULE-ACC-002,MULE-ACC-001,36500.00,USD,{t3},TRANSFER,WIRE,E2E-{RUN_ID}-004\n"
    f"MULE-ACC-003,MULE-ACC-002,37000.00,USD,{t4},TRANSFER,WIRE,E2E-{RUN_ID}-005\n"
)
status, body = post_multipart("/api/v1/ingestion/upload", "e2e_test.csv", csv.encode())
if not ok("Upload Statement", status, body, "ingestion_id"):
    sys.exit(1)
ingestion_id = body["data"]["ingestion_id"]
valid_count = body["data"]["valid_count"]
print(f"         ingestion_id={ingestion_id}, valid_count={valid_count}")

# STEP 2: FETCH SUMMARY (STAGED)
print("\n[2/6] Fetch Summary (Staged)")
status, body = get(f"/api/v1/ingestion/{ingestion_id}/summary")
ok("Summary (Staged)", status, body, "total_transactions")

# STEP 3: CONFIRM INGESTION
print("\n[3/6] Confirm Ingestion -> triggers detection")
status, body = post_json(f"/api/v1/ingestion/{ingestion_id}/confirm")
if not ok("Confirm Ingestion", status, body, "confirmed_count"):
    sys.exit(1)
confirmed = body["data"]["confirmed_count"]
detection_triggered = body["data"]["detection_triggered"]
print(f"         confirmed={confirmed}, detection_triggered={detection_triggered}")

# STEP 4: FETCH SUMMARY (CONFIRMED)
print("\n[4/6] Fetch Summary (Confirmed)")
status, body = get(f"/api/v1/ingestion/{ingestion_id}/summary")
if not ok("Summary (Confirmed)", status, body, "total_transactions"):
    sys.exit(1)
d = body["data"]
print(f"         transactions={d.get('total_transactions')}, volume={d.get('total_volume')}, accounts={d.get('total_accounts')}")

# STEP 5: FLAGGED ACCOUNTS
print("\n[5/6] Fetch Flagged Accounts")
if not detection_triggered:
    print("  WARNING: Detection engine not triggered automatically -- running manually")
    status, body = post_json("/api/v1/detection/run", {"ingestion_id": ingestion_id})
    ok("Run Detection Manually", status, body)
    time.sleep(2)

status, body = get(f"/api/v1/detection/flagged?ingestion_id={ingestion_id}")
if not ok("Flagged Accounts", status, body):
    sys.exit(1)
flagged = body.get("data", [])
if flagged:
    acct_id = flagged[0]["account_id"]
    print(f"         {len(flagged)} flagged -- top account_id={acct_id}, score={flagged[0]['risk_score']}, severity={flagged[0]['severity']}")
else:
    print("         No accounts flagged (scores below threshold)")
    acct_id = None

# STEP 6: GENERATE REPORT
print("\n[6/6] Generate SAR Report")
status, body = post_json("/api/v1/reports/generate", {
    "account_id": acct_id or "00000000-0000-0000-0000-000000000000",
    "ingestion_id": ingestion_id
})
ok("Generate Report", status, body, "report_id")

print("\n" + "="*60)
print("  Pipeline Test Complete")
print("="*60 + "\n")
