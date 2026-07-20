import os
import sys
import uuid
import random
import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal

# Configure path imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "shared")))

from shared.config.settings import BaseAppSettings
settings = BaseAppSettings()
from shared.database import db_manager, Base
from shared.database.models import (
    Customer, Account, Transaction, KYCRecord, DeviceSession, ExternalIntel
)
from shared.database.neo4j import neo4j_manager

async def seed_data():
    print("Initializing Database Connection Pool...")
    db_manager.init(
        connection_string=settings.async_postgres_url,
        pool_size=5,
        max_overflow=2
    )
    
    # In SQLite local dev mode, drop and create tables to sync schemas
    if settings.USE_SQLITE:
        async with db_manager._engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
            print("SQLite Database schemas recreated successfully.")
            
    sessionmaker = db_manager.get_sessionmaker()
    async with sessionmaker() as db:
        print("Starting Seeding of Synthetic Compliance Records...")
        
        # 1. Clear existing database elements to ensure clean run
        # Order of deletion is important for foreign keys
        for model in [ExternalIntel, DeviceSession, Transaction, KYCRecord, Account, Customer]:
            try:
                from sqlalchemy import delete
                await db.execute(delete(model))
            except Exception:
                pass
        await db.commit()
        print("Existing database tables flushed.")

        # 2. Generate Customers
        names = [
            "Vasily Kandinsky", "Sarah Chambers", "Rudra Narayan", "Elena Rostova",
            "John Miller", "Aiko Tanaka", "Mateo Silva", "Chloe Dupont", "Amara Diallo", "Li Wei"
        ]
        occupations = ["Art Dealer", "Corporate Consultant", "Cybersecurity Lead", "Software Architect", "Retail Trader", "Financial Analyst", "Student", "Unemployed", "Freelancer", "Executive"]
        
        customers = []
        for i, name in enumerate(names):
            cust_id = uuid.uuid4()
            dob = datetime.now(timezone.utc) - timedelta(days=365 * random.randint(22, 60))
            email = f"{name.lower().replace(' ', '_')}@muleshield.ai"
            mobile = f"+41 22 {random.randint(100, 999)} {random.randint(1000, 9999)}"
            
            cust = Customer(
                id=cust_id,
                full_name=name,
                dob=dob,
                mobile=mobile,
                email=email,
                pan_number=f"ABCDE{random.randint(1000, 9999)}F",
                aadhaar_number_masked=f"XXXX-XXXX-{random.randint(1000, 9999)}",
                occupation=occupations[i],
                annual_income=Decimal(str(random.randint(25000, 750000))),
                address=f"{random.randint(1, 99)} Rue du Rhone, Geneva, Switzerland"
            )
            db.add(cust)
            customers.append(cust)
            
        await db.flush()
        print(f"Generated {len(customers)} synthetic customers.")

        # 3. Create KYC Records
        kyc_statuses = ["VERIFIED", "VERIFIED", "VERIFIED", "VERIFIED", "VERIFIED", "VERIFIED", "FAILED", "PENDING", "VERIFIED", "VERIFIED"]
        kyc_records = []
        for i, cust in enumerate(customers):
            open_date = datetime.now(timezone.utc) - timedelta(days=random.randint(30, 730))
            kyc = KYCRecord(
                id=uuid.uuid4(),
                customer_id=cust.id,
                kyc_status=kyc_statuses[i],
                account_open_date=open_date,
                kyc_verification_date=open_date + timedelta(days=random.randint(1, 3)),
                selfie_match_score=random.uniform(0.65, 0.99),
                doc_verification_score=random.uniform(0.60, 0.98)
            )
            db.add(kyc)
            kyc_records.append(kyc)
        await db.flush()
        print("Generated KYC verification dossiers.")

        # 4. Generate Accounts
        accounts = []
        for i, cust in enumerate(customers):
            acct_num = f"ACC-{random.randint(100000, 999999)}"
            # Force target demo account number
            if i == 0:
                acct_num = "ACC-092281"
            status = "ACTIVE"
            if cust.full_name == "Li Wei":
                status = "SUSPENDED"
                
            acct = Account(
                id=uuid.uuid4(),
                customer_id=cust.id,
                account_number=acct_num,
                ifsc=f"MSAI000{random.randint(1000, 9999)}",
                bank_name="MuleShield Swiss Bank",
                branch="Geneva Central",
                balance=Decimal(str(random.uniform(100.0, 1500000.0))),
                daily_limit=Decimal("50000.00"),
                monthly_limit=Decimal("1500000.00"),
                status=status
            )
            db.add(acct)
            accounts.append(acct)
        await db.flush()
        print(f"Generated {len(accounts)} active bank account ledgers.")

        # 5. Generate Device Sessions
        devices = [f"iPhone-15-{uuid.uuid4().hex[:6]}", f"MacBookPro-{uuid.uuid4().hex[:6]}", f"Windows-PC-{uuid.uuid4().hex[:6]}"]
        ips = ["195.176.3.11", "84.22.109.43", "46.12.98.204", "195.176.3.11"]
        
        for cust in customers:
            # Seed 2-3 device sessions per customer
            for _ in range(random.randint(1, 3)):
                sess = DeviceSession(
                    id=uuid.uuid4(),
                    customer_id=cust.id,
                    device_id=random.choice(devices),
                    ip_address=random.choice(ips),
                    login_time=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 15)),
                    geo_location="Geneva, Switzerland"
                )
                db.add(sess)
        await db.flush()
        print("Generated device trace footprint sessions.")

        # 6. Generate External CyberIntel Fraud complaints
        # Seed fraud intel warning reports against Vasily's account and Chloe's account
        intel1 = ExternalIntel(
            id=uuid.uuid4(),
            account_id=accounts[0].id,
            source="CYBER_COMPLAINT",
            reference_number="EU-CY-2026-902A",
            description="Account linked to SWIFT redirection wire phishing campaign targeting German corporate payroll."
        )
        db.add(intel1)
        
        intel2 = ExternalIntel(
            id=uuid.uuid4(),
            account_id=accounts[7].id,
            source="RBI_BLACKLIST",
            reference_number="US-IC3-7294",
            description="Target account associated with multiple digital payments receiver complaints under tech-support giftcard scams."
        )
        db.add(intel2)
        await db.flush()
        print("Seeded external law-enforcement fraud intel files.")

        # 7. Generate Transaction History showing specific suspicious patterns
        print("Seeding Transaction details...")
        ingest_id = str(uuid.uuid4())
        
        # Pattern 7.1: Circular Pass-through (Loop Flow)
        # Vasily (ACC-092281) -> Sarah (ACC-1) -> Elena (ACC-3) -> Vasily (ACC-092281)
        acct_a = accounts[0] # Vasily
        acct_b = accounts[1] # Sarah
        acct_c = accounts[3] # Elena
        
        t1 = datetime.now(timezone.utc) - timedelta(days=3)
        tx_loop1 = Transaction(
            ingestion_id=ingest_id,
            transaction_id=f"TX-LOOP-{uuid.uuid4().hex[:6].upper()}",
            sender_account_id=acct_a.id,
            receiver_account_id=acct_b.id,
            sender_account=acct_a.account_number,
            receiver_account=acct_b.account_number,
            amount=Decimal("45000.00"),
            currency="USD",
            timestamp=t1,
            transaction_type="TRANSFER",
            payment_channel="WIRE",
            status="CONFIRMED",
            fingerprint=f"{acct_a.account_number}:{acct_b.account_number}:45000.00:{t1.isoformat()}"
        )
        db.add(tx_loop1)
        
        t2 = t1 + timedelta(minutes=10)
        tx_loop2 = Transaction(
            ingestion_id=ingest_id,
            transaction_id=f"TX-LOOP-{uuid.uuid4().hex[:6].upper()}",
            sender_account_id=acct_b.id,
            receiver_account_id=acct_c.id,
            sender_account=acct_b.account_number,
            receiver_account=acct_c.account_number,
            amount=Decimal("44950.00"), # High pass-through with fee deduction
            currency="USD",
            timestamp=t2,
            transaction_type="TRANSFER",
            payment_channel="WIRE",
            status="CONFIRMED",
            fingerprint=f"{acct_b.account_number}:{acct_c.account_number}:44950.00:{t2.isoformat()}"
        )
        db.add(tx_loop2)

        t3 = t2 + timedelta(minutes=8)
        tx_loop3 = Transaction(
            ingestion_id=ingest_id,
            transaction_id=f"TX-LOOP-{uuid.uuid4().hex[:6].upper()}",
            sender_account_id=acct_c.id,
            receiver_account_id=acct_a.id,
            sender_account=acct_c.account_number,
            receiver_account=acct_a.account_number,
            amount=Decimal("44900.00"),
            currency="USD",
            timestamp=t3,
            transaction_type="TRANSFER",
            payment_channel="WIRE",
            status="CONFIRMED",
            fingerprint=f"{acct_c.account_number}:{acct_a.account_number}:44900.00:{t3.isoformat()}"
        )
        db.add(tx_loop3)

        # Pattern 7.2: Dormancy Spike (dormant 95 days, then rapid high frequency txns)
        # Rudra (ACC-2)
        acct_dorm = accounts[2]
        dorm_t1 = datetime.now(timezone.utc) - timedelta(days=100)
        tx_old = Transaction(
            ingestion_id=ingest_id,
            transaction_id=f"TX-OLD-{uuid.uuid4().hex[:6].upper()}",
            sender_account_id=acct_dorm.id,
            receiver_account_id=accounts[4].id,
            sender_account=acct_dorm.account_number,
            receiver_account=accounts[4].account_number,
            amount=Decimal("150.00"),
            currency="USD",
            timestamp=dorm_t1,
            transaction_type="PAYMENT",
            payment_channel="ACH",
            status="CONFIRMED",
            fingerprint=f"{acct_dorm.account_number}:{accounts[4].account_number}:150.00:{dorm_t1.isoformat()}"
        )
        db.add(tx_old)

        # 6 rapid txns in last 24h
        for k in range(6):
            t_now = datetime.now(timezone.utc) - timedelta(minutes=k * 15)
            tx_spike = Transaction(
                ingestion_id=ingest_id,
                transaction_id=f"TX-SPIKE-{k}-{uuid.uuid4().hex[:4].upper()}",
                sender_account_id=accounts[random.randint(4, 9)].id,
                receiver_account_id=acct_dorm.id,
                sender_account=accounts[random.randint(4, 9)].account_number,
                receiver_account=acct_dorm.account_number,
                amount=Decimal(str(random.randint(500, 1500))),
                currency="USD",
                timestamp=t_now,
                transaction_type="TRANSFER",
                payment_channel="ACH",
                status="CONFIRMED",
                fingerprint=f"gen-spike-{k}:{t_now.isoformat()}"
            )
            db.add(tx_spike)

        # Commit PostgreSQL/SQLite transactional data
        await db.commit()
        print("Database transactional metrics committed.")

        # 8. Attempt Neo4j graph nodes and relations syncing
        try:
            print("Syncing transactional data nodes to Neo4j graph database...")
            # For each account
            for acct in accounts:
                cust_match = [c for c in customers if c.id == acct.customer_id]
                full_name = cust_match[0].full_name if cust_match else "Unknown"
                await neo4j_manager.sync_customer_and_account(
                    customer_id=str(acct.customer_id),
                    customer_name=full_name,
                    account_id=str(acct.id),
                    account_number=acct.account_number
                )
                
            # Sync transfers (edges)
            # Fetch loop transactions we created
            await neo4j_manager.sync_transfer(
                sender_number=acct_a.account_number,
                receiver_number=acct_b.account_number,
                amount=45000.00,
                timestamp=t1.isoformat()
            )
            await neo4j_manager.sync_transfer(
                sender_number=acct_b.account_number,
                receiver_number=acct_c.account_number,
                amount=44950.00,
                timestamp=t2.isoformat()
            )
            await neo4j_manager.sync_transfer(
                sender_number=acct_c.account_number,
                receiver_number=acct_a.account_number,
                amount=44900.00,
                timestamp=t3.isoformat()
            )
            print("Neo4j structural compliance graph nodes populated successfully.")
        except Exception as ge:
            print(f"Neo4j synchronization bypassed: {str(ge)} (Neo4j server not running or connection refused)")

        print("Synthetic Compliance Data Seeding Process Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
