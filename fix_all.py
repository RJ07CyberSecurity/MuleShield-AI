import sqlite3
import uuid
import random

conn = sqlite3.connect('muleshield.db')
cursor = conn.cursor()

# Find all accounts that have no customer_id
accounts = cursor.execute('SELECT id, account_number FROM accounts WHERE customer_id IS NULL').fetchall()
print(f"Found {len(accounts)} accounts with missing customer profiles.")

for acct_id, acct_num in accounts:
    cust_id = str(uuid.uuid4())
    
    # Generate some random fake data based on the account number
    fake_name = f"Synthetic User {acct_num[-4:]}"
    fake_pan = f"PAN{random.randint(1000,9999)}X"
    fake_aadhaar = f"XXXX-XXXX-{random.randint(1000,9999)}"
    
    cursor.execute('''
        INSERT INTO customers (id, full_name, dob, mobile, email, pan_number, aadhaar_number_masked, occupation, annual_income, address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        cust_id, 
        fake_name, 
        '1990-01-01 00:00:00.000000', 
        f"+41 22 555 {random.randint(1000,9999)}", 
        f"{fake_name.replace(' ', '').lower()}_{str(uuid.uuid4())[:8]}@muleshield.ai",
        fake_pan, 
        fake_aadhaar, 
        'Unknown', 
        0.00, 
        'System Generated Address'
    ))
    
    cursor.execute('UPDATE accounts SET customer_id = ? WHERE account_number = ?', (cust_id, acct_num))
    print(f"Created synthetic customer {cust_id} for account {acct_num}")

conn.commit()
print("All missing customer profiles have been patched.")
