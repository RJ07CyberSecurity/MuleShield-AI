import sqlite3

conn = sqlite3.connect('muleshield.db')
c = conn.cursor()

print("=== ACCOUNTS ===")
c.execute("SELECT account_number, balance, status FROM accounts LIMIT 10")
for row in c.fetchall():
    print(" ", row)

print("\n=== TRANSACTIONS (confirmed, last 10) ===")
c.execute("SELECT ingestion_id, sender_account, receiver_account, amount, status FROM transactions WHERE status='CONFIRMED' LIMIT 10")
for row in c.fetchall():
    print(" ", row)

print("\n=== RISK SCORES (top 10) ===")
c.execute("SELECT account_id, final_score, risk_band FROM risk_scores ORDER BY final_score DESC LIMIT 10")
for row in c.fetchall():
    print(" ", row)

print("\n=== ALERTS ===")
c.execute("SELECT account_id, severity, score, status FROM alerts LIMIT 10")
for row in c.fetchall():
    print(" ", row)

print("\n=== INGESTION BATCHES ===")
c.execute("SELECT ingestion_id, status, COUNT(*) as cnt FROM transactions GROUP BY ingestion_id, status ORDER BY rowid DESC LIMIT 5")
for row in c.fetchall():
    print(" ", row)

conn.close()
