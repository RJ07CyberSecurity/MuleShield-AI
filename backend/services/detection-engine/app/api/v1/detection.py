from datetime import datetime, timedelta
from decimal import Decimal
import uuid
import structlog
from fastapi import APIRouter, Depends, Request, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from shared.database import get_db_session, Base, Transaction, Account, Alert, RiskScore
from shared.database.neo4j import neo4j_manager
from app.services.features import FeatureEngineeringPipeline
from app.services.ml_service import ml_model_service
from shared.schemas import ResponseEnvelope

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/detection", tags=["Detection"])


class DetectionRequest(BaseModel):
    ingestion_id: str


class FlaggedAccountResponse(BaseModel):
    account_id: str
    account_number: str
    risk_score: int
    severity: str
    factors: list[dict]
    balance: float
    currency: str
    status: str


async def get_90th_percentile_threshold(db: AsyncSession) -> Decimal:
    """
    Computes the 90th percentile transaction volume across all accounts in the ledger.
    """
    try:
        # Sum outgoing transactions per account
        send_stmt = select(
            Transaction.sender_account,
            func.sum(Transaction.amount)
        ).where(Transaction.status == "CONFIRMED").group_by(Transaction.sender_account)
        send_res = await db.execute(send_stmt)
        
        # Sum incoming transactions per account
        rec_stmt = select(
            Transaction.receiver_account,
            func.sum(Transaction.amount)
        ).where(Transaction.status == "CONFIRMED").group_by(Transaction.receiver_account)
        rec_res = await db.execute(rec_stmt)
        
        acct_vols = {}
        for row in send_res.all():
            acct_vols[row[0]] = acct_vols.get(row[0], Decimal("0")) + Decimal(str(row[1]))
        for row in rec_res.all():
            acct_vols[row[0]] = acct_vols.get(row[0], Decimal("0")) + Decimal(str(row[1]))
            
        volumes = sorted(acct_vols.values())
        if not volumes:
            return Decimal("10000.00")
            
        idx = int(len(volumes) * 0.90)
        threshold = volumes[min(idx, len(volumes) - 1)]
        return max(threshold, Decimal("5000.00"))  # Baseline threshold protection
    except Exception as exc:
        logger.error("Failed to compute 90th percentile volumes, using defaults", error=str(exc))
        return Decimal("10000.00")


@router.post("/run")
async def run_detection(
    payload: DetectionRequest,
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[dict]:
    """
    Runs the rules-based, ML-assisted, and graph-linked risk scoring engine on the ingested batch.
    """
    logger.info("Starting composite risk scoring orchestrator run", IngestionId=payload.ingestion_id)
    
    # 1. Fetch transactions for ingestion batch
    stmt = select(Transaction).where(
        Transaction.ingestion_id == payload.ingestion_id,
        Transaction.status == "CONFIRMED"
    )
    res = await db.execute(stmt)
    batch_txs = list(res.scalars().all())
    
    if not batch_txs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No confirmed transactions found for ingestion ID {payload.ingestion_id}."
        )
        
    # 2. Get unique account numbers from this batch
    acct_nums = set()
    for t in batch_txs:
        acct_nums.add(t.sender_account)
        acct_nums.add(t.receiver_account)
        
    # 3. Pull account models
    accts_stmt = select(Account).where(Account.account_number.in_(list(acct_nums)))
    accts_res = await db.execute(accts_stmt)
    accounts = {a.account_number: a for a in accts_res.scalars().all()}
    
    alert_count = 0
    import json
    import os
    from datetime import timezone
    from shared.database.models import ExternalIntel
    
    # 4. Orchestrate risk scoring per account
    for acct_num, account in accounts.items():
        # 4.1 Compute rolling behavioral features
        features = await FeatureEngineeringPipeline.compute_features_for_account(db, acct_num)
        
        # 4.2 Query Neo4j Graph Centrality and Linkage Loops
        linked_mule = False
        graph_centrality = 0.0
        try:
            driver = neo4j_manager.get_driver()
            async with driver.session() as session:
                # Degree Centrality (counterparty density metric)
                centrality_query = (
                    "MATCH (a:Account {number: $account_number}) "
                    "OPTIONAL MATCH (a)-[r:TRANSFERRED_TO]-(other) "
                    "RETURN count(distinct other) as degree"
                )
                c_res = await session.run(centrality_query, account_number=acct_num)
                record = await c_res.single()
                if record:
                    # Degree counts mapping to proxy PageRank centrality
                    graph_centrality = min(100.0, float(record["degree"] * 5))
                    
                # Loop Cycle Check
                loop_query = (
                    "MATCH p=(a:Account {number: $account_number})-[:TRANSFERRED_TO*2..5]->(a) "
                    "RETURN length(p) as loop_length LIMIT 1"
                )
                l_res = await session.run(loop_query, account_number=acct_num)
                l_rec = await l_res.single()
                if l_rec:
                    linked_mule = True
        except Exception as ge:
            logger.warning("Neo4j engine connection not active, skipping graph calculations", error=str(ge))

        # 4.3 Evaluate Rule Engine per table A6
        rule_factors = []
        
        # Rule 1: >30 transactions/day
        if features.get("txn_count_24h", 0) > 30:
            rule_factors.append({"rule": "R1_HIGH_TXN_FREQ", "reason": "Exceeded 30 transactions in a 24-hour period.", "weight": 10})
            
        # Rule 2: >₹5 lakh/day (approx $6,000 USD daily volume)
        day_vol = features.get("incoming_amt_24h", 0.0) + features.get("outgoing_amt_24h", 0.0)
        if day_vol > 6000.0:
            rule_factors.append({"rule": "R2_HIGH_DAILY_VOLUME", "reason": "Daily transaction volume exceeded equivalent of ₹5 lakh ($6,000 USD).", "weight": 15})
            
        # Rule 3: Funds moved within 15 min of receipt
        holding_time = features.get("avg_holding_time_minutes", 0.0)
        if 0 < holding_time <= 15:
            rule_factors.append({"rule": "R3_RAPID_PASS_THROUGH", "reason": "Average funds holding duration was less than 15 minutes before dispersal.", "weight": 20})
            
        # Rule 4: Balance persistently near zero
        if features.get("avg_balance_7d", 0.0) < 100.0 and day_vol > 5000.0:
            rule_factors.append({"rule": "R4_PERSISTENT_NEAR_ZERO", "reason": "Account balance remains near zero despite substantial daily transaction velocity.", "weight": 15})
            
        # Rule 5: High unique senders
        if features.get("unique_senders_30d", 0) > 5:
            rule_factors.append({"rule": "R5_HIGH_UNIQUE_SENDERS", "reason": "Interacted with more than 5 unique senders in the last 30 days.", "weight": 15})
            
        # Rule 6: High unique receivers
        if features.get("unique_receivers_30d", 0) > 5:
            rule_factors.append({"rule": "R6_HIGH_UNIQUE_RECEIVERS", "reason": "Interacted with more than 5 unique receivers in the last 30 days.", "weight": 15})
            
        # Rule 7: Frequent device changes
        if features.get("device_change_count_7d", 0) > 2:
            rule_factors.append({"rule": "R7_FREQUENT_DEVICE_CHANGES", "reason": "Account customer associated with more than 2 device changes in 7 days.", "weight": 10})
            
        # Rule 8: IP from unexpected state/country
        if features.get("location_change_flag", 0) == 1:
            rule_factors.append({"rule": "R8_IP_LOCATION_DRIFT", "reason": "Device IP location change drift velocity exceeds physical thresholds.", "weight": 10})
            
        # Rule 9: High fraud complaint count
        intel_stmt = select(func.count(ExternalIntel.id)).where(ExternalIntel.account_id == account.id)
        intel_count = (await db.execute(intel_stmt)).scalar() or 0
        if intel_count > 0:
            rule_factors.append({"rule": "R9_EXTERNAL_FRAUD_INTEL", "reason": f"Account reported across {intel_count} external blacklists or law enforcement cyber complaints.", "weight": 25})
            
        # Rule 10: Linked to known mule account (graph)
        if linked_mule:
            rule_factors.append({"rule": "R10_GRAPH_MULE_LINK", "reason": "Account is linked in close proximity to a known mule account or circular loop in Neo4j network graph.", "weight": 40})

        # Calculate rule base score
        rule_score = min(100.0, sum(f["weight"] for f in rule_factors))

        # 4.4 ML Risk Model Inference & SHAP
        ml_prob, shap_contributors = ml_model_service.predict_risk(features)

        # 4.5 Orchestrated Final Score
        # 50% Rule Engine + 30% ML Inference + 20% Graph PageRank Centrality
        final_score = int(round(0.5 * rule_score + 0.3 * (ml_prob * 100) + 0.2 * graph_centrality))
        final_score = min(100, max(0, final_score))

        # Map to Risk Bands
        if final_score >= 80:
            risk_band = "CRITICAL"
            severity = "CRITICAL"
        elif final_score >= 60:
            risk_band = "HIGH"
            severity = "HIGH"
        elif final_score >= 40:
            risk_band = "MEDIUM"
            severity = "MEDIUM"
        elif final_score >= 20:
            risk_band = "LOW"
            severity = "LOW"
        else:
            risk_band = "NORMAL"
            severity = "LOW"

        # 4.6 Persist RiskScore explainability payload
        explain_data = {
            "factors": rule_factors,
            "shap_values": shap_contributors,
            "rule_score": rule_score,
            "ml_probability": ml_prob,
            "graph_score": graph_centrality
        }
        
        new_score = RiskScore(
            id=uuid.uuid4(),
            account_id=account.id,
            rule_score=float(rule_score),
            ml_probability=float(ml_prob),
            graph_score=float(graph_centrality),
            final_score=float(final_score),
            risk_band=risk_band,
            explainability_payload=explain_data
        )
        db.add(new_score)
        await db.flush()

        # 4.7 Create Alert record for investigator queues
        # Alert threshold condition: final_score > 70 OR ml_prob > 0.90 OR linked blacklists
        if final_score > 70 or ml_prob > 0.90 or intel_count > 0:
            # Check if alert already exists
            alert_stmt = select(Alert).where(Alert.account_id == account.id)
            alert_res = await db.execute(alert_stmt)
            existing_alert = alert_res.scalars().first()

            reason_details = json.dumps({
                "risk_score": final_score,
                "factors": rule_factors,
                "shap_values": shap_contributors
            })

            if existing_alert:
                existing_alert.risk_score_id = new_score.id
                existing_alert.score = float(final_score)
                existing_alert.severity = severity
                existing_alert.trigger_reason = reason_details
                existing_alert.status = "NEW"
                logger.info("Updated existing compliance alert via orchestrator", account_number=acct_num, score=final_score)
            else:
                new_alert = Alert(
                    id=uuid.uuid4(),
                    account_id=account.id,
                    risk_score_id=new_score.id,
                    status="NEW",
                    trigger_reason=reason_details,
                    score=float(final_score),
                    assigned_officer_id=None
                )
                db.add(new_alert)
                logger.info("Triggered new compliance alert via orchestrator", account_number=acct_num, score=final_score)
            alert_count += 1

    await db.commit()
    logger.info("Detection orchestrator pipeline complete", alerts_triggered=alert_count)
    
    return ResponseEnvelope(
        success=True,
        message="Risk assessment and detection engine completed analysis successfully.",
        data={
            "ingestion_id": payload.ingestion_id,
            "accounts_analyzed": len(accounts),
            "alerts_triggered": alert_count
        }
    )


@router.get("/flagged")
async def list_flagged_accounts(
    request: Request,
    ingestion_id: str | None = None,
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[list[FlaggedAccountResponse]]:
    """
    Returns ranked accounts flagged during compliance screening, sorted by risk score.
    """
    logger.info("Listing flagged accounts", ingestion_id=ingestion_id)
    
    # Query accounts that have alerts
    # If ingestion_id is provided, limit to accounts that have transactions in that ingestion batch
    if ingestion_id:
        tx_stmt = select(Transaction.sender_account, Transaction.receiver_account).where(
            Transaction.ingestion_id == ingestion_id,
            Transaction.status == "CONFIRMED"
        )
        tx_res = await db.execute(tx_stmt)
        rows = tx_res.all()
        acct_nums = set()
        for r in rows:
            acct_nums.add(r[0])
            acct_nums.add(r[1])
            
        if not acct_nums:
            return ResponseEnvelope(
                success=True,
                message="No flagged accounts found for this ingestion.",
                data=[]
            )
            
        accts_stmt = select(Account).where(Account.account_number.in_(list(acct_nums)))
        accts_res = await db.execute(accts_stmt)
        acct_ids = [a.id for a in accts_res.scalars().all()]
        
        if not acct_ids:
            return ResponseEnvelope(
                success=True,
                message="No flagged accounts found for this ingestion.",
                data=[]
            )
            
        alert_stmt = select(Alert, Account, RiskScore).join(
            Account, Alert.account_id == Account.id
        ).outerjoin(
            RiskScore, Alert.risk_score_id == RiskScore.id
        ).where(
            Alert.account_id.in_(acct_ids),
            Alert.status != "CLOSED_FALSE_POSITIVE"
        ).order_by(RiskScore.final_score.desc())
    else:
        alert_stmt = select(Alert, Account, RiskScore).join(
            Account, Alert.account_id == Account.id
        ).outerjoin(
            RiskScore, Alert.risk_score_id == RiskScore.id
        ).where(
            Alert.status != "CLOSED_FALSE_POSITIVE"
        ).order_by(RiskScore.final_score.desc())
        
    res = await db.execute(alert_stmt)
    results = res.all()
    
    flagged = []
    
    for alert, account, risk_score in results:
        factors = []
        final_score = int(risk_score.final_score) if risk_score else 0
        severity = risk_score.risk_band if risk_score else "LOW"
        
        if risk_score and risk_score.explainability_payload:
            factors = risk_score.explainability_payload.get("factors", [])
        else:
            factors = [{"rule": "UNKNOWN", "reason": "No factors available", "weight": final_score}]
            
        flagged.append(FlaggedAccountResponse(
            account_id=str(account.id),
            account_number=account.account_number,
            risk_score=final_score,
            severity=severity,
            factors=factors,
            balance=float(account.balance),
            currency="USD",
            status=account.status
        ))
        
    return ResponseEnvelope(
        success=True,
        message="Flagged accounts retrieved.",
        data=flagged,
        request_id=request.state.request_id
    )
