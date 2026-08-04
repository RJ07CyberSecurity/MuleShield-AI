import sqlite3

cols_to_add = [
    ("balance", "NUMERIC"),
    ("sender_account_raw", "VARCHAR"),
    ("receiver_account_raw", "VARCHAR"),
    ("amount_raw", "VARCHAR"),
    ("balance_raw", "VARCHAR"),
    ("timestamp_raw", "VARCHAR"),
    ("transaction_id_raw", "VARCHAR"),
    ("upi_id_raw", "VARCHAR"),
    ("narration_raw", "VARCHAR"),
]

conn = sqlite3.connect('muleshield.db')
cursor = conn.cursor()

# Get existing columns of transactions
cursor.execute("PRAGMA table_info(transactions)")
existing_cols = {row[1] for row in cursor.fetchall()}

for col_name, col_type in cols_to_add:
    if col_name not in existing_cols:
        try:
            sql = f"ALTER TABLE transactions ADD COLUMN {col_name} {col_type};"
            cursor.execute(sql)
            print(f"Added column {col_name} ({col_type}) to transactions table.")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")

conn.commit()
conn.close()
print("Migration completed successfully.")
