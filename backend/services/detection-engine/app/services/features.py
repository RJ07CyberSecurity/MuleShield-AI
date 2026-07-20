import os
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from shared.database import Transaction, Account, Customer, KYCRecord, DeviceSession
import structlog

logger = structlog.get_logger(__name__)

class FeatureEngineeringPipeline:
    """
    Computes rolling transactional and behavioral features for any account.
    """
    
    @staticmethod
    async def compute_features_for_account(
        db: AsyncSession,
        account_number: str,
        ref_time: datetime | None = None
    ) -> dict:
        if ref_time is None:
            ref_time = datetime.now(timezone.utc)
            
        # Ensure ref_time is timezone-aware
        if ref_time.tzinfo is None:
            ref_time = ref_time.replace(tzinfo=timezone.utc)

        features = {
            "txn_count_24h": 0,
            "incoming_amt_24h": 0.0,
            "outgoing_amt_24h": 0.0,
            "avg_balance_7d": 0.0,
            "avg_holding_time_minutes": 0.0,
            "unique_senders_30d": 0,
            "unique_receivers_30d": 0,
            "pct_night_txns": 0.0,
            "device_change_count_7d": 0,
            "new_device_flag": 0,
            "location_change_flag": 0,
            "kyc_mismatch_flag": 0,
            "income_to_txn_ratio": 0.0,
            "network_centrality_score": 0.0,
            "days_since_account_open": 365,  # default
            "dormancy_then_spike_flag": 0
        }

        try:
            # 1. Fetch account and customer profile
            acct_stmt = select(Account).where(Account.account_number == account_number)
            acct_res = await db.execute(acct_stmt)
            account = acct_res.scalars().first()
            if not account:
                return features

            features["avg_balance_7d"] = float(account.balance)
            customer = None
            if account.customer_id:
                cust_stmt = select(Customer).where(Customer.id == account.customer_id)
                customer = (await db.execute(cust_stmt)).scalars().first()

            # 2. Query transactions for rolling windows
            t_24h = ref_time - timedelta(days=1)
            t_7d = ref_time - timedelta(days=7)
            t_30d = ref_time - timedelta(days=30)
            t_90d = ref_time - timedelta(days=90)

            # 2.1 Txns involving account
            tx_stmt = select(Transaction).where(
                and_(
                    or_(
                        Transaction.sender_account == account_number,
                        Transaction.receiver_account == account_number
                    ),
                    Transaction.status == "CONFIRMED"
                )
            )
            tx_res = await db.execute(tx_stmt)
            all_txs = tx_res.scalars().all()

            txs_24h = [tx for tx in all_txs if tx.timestamp.replace(tzinfo=timezone.utc) >= t_24h]
            txs_7d = [tx for tx in all_txs if tx.timestamp.replace(tzinfo=timezone.utc) >= t_7d]
            txs_30d = [tx for tx in all_txs if tx.timestamp.replace(tzinfo=timezone.utc) >= t_30d]

            # Computations
            features["txn_count_24h"] = len(txs_24h)
            
            # Incoming vs Outgoing 24h
            incoming_24h = [tx for tx in txs_24h if tx.receiver_account == account_number]
            outgoing_24h = [tx for tx in txs_24h if tx.sender_account == account_number]
            
            features["incoming_amt_24h"] = sum(float(tx.amount) for tx in incoming_24h)
            features["outgoing_amt_24h"] = sum(float(tx.amount) for tx in outgoing_24h)

            # Unique senders and receivers 30d
            senders_30d = {tx.sender_account for tx in txs_30d if tx.receiver_account == account_number}
            receivers_30d = {tx.receiver_account for tx in txs_30d if tx.sender_account == account_number}
            
            features["unique_senders_30d"] = len(senders_30d)
            features["unique_receivers_30d"] = len(receivers_30d)

            # Percentage night transactions (10 PM to 6 AM)
            if all_txs:
                night_txs = 0
                for tx in all_txs:
                    hour = tx.timestamp.hour
                    if hour >= 22 or hour < 6:
                        night_txs += 1
                features["pct_night_txns"] = float(night_txs) / len(all_txs)

            # Average balance 7d (calculated by rolling back transactions)
            bal_hist = []
            curr_bal = float(account.balance)
            # Sort txs by timestamp descending
            sorted_txs = sorted(all_txs, key=lambda x: x.timestamp, reverse=True)
            
            for day in range(7):
                day_start = ref_time - timedelta(days=day)
                day_end = ref_time - timedelta(days=day-1) if day > 0 else ref_time
                
                # Undo transactions that occurred after this day
                for tx in sorted_txs:
                    tx_time = tx.timestamp.replace(tzinfo=timezone.utc)
                    if tx_time > day_start:
                        if tx.sender_account == account_number:
                            curr_bal += float(tx.amount)
                        elif tx.receiver_account == account_number:
                            curr_bal -= float(tx.amount)
                bal_hist.append(curr_bal)
                
            features["avg_balance_7d"] = sum(bal_hist) / len(bal_hist)

            # Average holding time (minutes between receive and send)
            # Find consecutive pairs of (Inbound, Outbound) txs
            inbounds = sorted([tx for tx in all_txs if tx.receiver_account == account_number], key=lambda x: x.timestamp)
            outbounds = sorted([tx for tx in all_txs if tx.sender_account == account_number], key=lambda x: x.timestamp)
            
            hold_times = []
            for ob in outbounds:
                # Find the closest inbound txn that occurred before this outbound txn
                matching_ib = [ib for ib in inbounds if ib.timestamp < ob.timestamp]
                if matching_ib:
                    last_ib = matching_ib[-1]
                    diff = (ob.timestamp - last_ib.timestamp).total_seconds() / 60.0
                    hold_times.append(diff)
            if hold_times:
                features["avg_holding_time_minutes"] = sum(hold_times) / len(hold_times)

            # Device sessions metrics (Customer level)
            if customer:
                sess_stmt = select(DeviceSession).where(
                    and_(
                        DeviceSession.customer_id == customer.id,
                        DeviceSession.login_time >= t_7d
                    )
                )
                sessions_res = await db.execute(sess_stmt)
                sessions = sessions_res.scalars().all()
                
                unique_devices = {s.device_id for s in sessions}
                features["device_change_count_7d"] = len(unique_devices)
                
                # Check for new device in last 24h
                sessions_24h = [s for s in sessions if s.login_time.replace(tzinfo=timezone.utc) >= t_24h]
                if sessions_24h:
                    historical_devices = {s.device_id for s in sessions if s.login_time.replace(tzinfo=timezone.utc) < t_24h}
                    new_devices = {s.device_id for s in sessions_24h if s.device_id not in historical_devices}
                    if new_devices:
                        features["new_device_flag"] = 1

            # Location Change Velocity (> 2 locations in 1 hour)
            locations_1h = []
            for tx in txs_24h:
                if tx.location:
                    locations_1h.append((tx.timestamp, tx.location))
            # Find any location change within 60 minutes
            for i in range(len(locations_1h)):
                for j in range(i+1, len(locations_1h)):
                    t_diff = abs((locations_1h[i][0] - locations_1h[j][0]).total_seconds()) / 60.0
                    if t_diff <= 60.0 and locations_1h[i][1] != locations_1h[j][1]:
                        features["location_change_flag"] = 1

            # KYC records & Profile metrics
            if customer:
                kyc_stmt = select(KYCRecord).where(KYCRecord.customer_id == customer.id)
                kyc_res = await db.execute(kyc_stmt)
                kyc_rec = kyc_res.scalars().first()
                if kyc_rec:
                    features["days_since_account_open"] = (ref_time - kyc_rec.account_open_date.replace(tzinfo=timezone.utc)).days
                    if kyc_rec.kyc_status == "FAILED" or kyc_rec.doc_verification_score < 0.6:
                        features["kyc_mismatch_flag"] = 1

                # Income to transaction ratio
                if customer.annual_income > 0 and features["outgoing_amt_24h"] > 0:
                    features["income_to_txn_ratio"] = float(features["outgoing_amt_24h"]) / float(customer.annual_income)

            # Dormancy reactivation (no txn for > 90 days, then > 5 txns in 24 hours)
            recent_txs = [tx for tx in all_txs if tx.timestamp.replace(tzinfo=timezone.utc) >= t_90d]
            older_txs = [tx for tx in all_txs if tx.timestamp.replace(tzinfo=timezone.utc) < t_90d]
            if len(older_txs) > 0 and len(recent_txs) == len(txs_24h) and len(txs_24h) >= 5:
                features["dormancy_then_spike_flag"] = 1

        except Exception as e:
            logger.error("Error computing features for account", account_number=account_number, error=str(e))

        return features
