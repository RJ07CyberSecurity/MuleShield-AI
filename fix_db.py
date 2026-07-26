import sqlite3

conn = sqlite3.connect('muleshield.db')
print("Schema:", conn.execute("SELECT sql FROM sqlite_master WHERE name='model_feedback'").fetchone()[0])
try:
    conn.execute("ALTER TABLE model_feedback ADD COLUMN updated_at DATETIME;")
    conn.commit()
    print("Added updated_at")
except Exception as e:
    print("Error adding column:", e)
