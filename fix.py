import sqlite3
import uuid

conn = sqlite3.connect('muleshield.db')
cursor = conn.cursor()

# Check if ACC-MULE-R1 exists
account = cursor.execute('SELECT id, customer_id, account_number FROM accounts WHERE account_number="ACC-MULE-R1"').fetchone()
print(f"Account: {account}")

if account:
    if not account[1]:
        # Need to create customer and link it
        cust_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO customers (id, full_name, dob, mobile, email, pan_number, aadhaar_number_masked, occupation, annual_income, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (cust_id, 'Richard Mule', '1985-05-15 00:00:00.000000', '+41 22 555 1234', 'richard.mule@muleshield.ai', 'MULE9876R1', 'XXXX-XXXX-9999', 'Consultant', 120000.00, '42 Shadow Lane, Geneva'))
        
        cursor.execute('UPDATE accounts SET customer_id = ? WHERE account_number = ?', (cust_id, "ACC-MULE-R1"))
        conn.commit()
        print("Successfully created and linked customer to ACC-MULE-R1")
    else:
        print("Account already has a customer.")
else:
    print("Account not found.")
