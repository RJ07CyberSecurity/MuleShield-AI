import sqlite3

hash_val = "$2b$12$VD22mTEw.N7ZcCQ4hXRY0uGyShQPUSbi0B8DbH4eX82A3R7KMwsG2"
email = "rudrajoshi2586@gmail.com"

c = sqlite3.connect('muleshield.db')
c.execute("UPDATE users SET hashed_password = ? WHERE email = ?", (hash_val, email))

# Get user id
user_id = c.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
if user_id:
    user_id = user_id[0]
    
    # Get role id for 'administrator'
    role_id = c.execute("SELECT id FROM roles WHERE name = 'administrator'").fetchone()
    if role_id:
        role_id = role_id[0]
        # Insert user role if not exists
        try:
            c.execute("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", (user_id, role_id))
        except sqlite3.IntegrityError:
            pass # Already exists
            
c.commit()
print("Updated password and roles for admin user")
