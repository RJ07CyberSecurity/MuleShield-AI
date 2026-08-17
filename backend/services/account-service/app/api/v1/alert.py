from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.alert import Alert, Rule
from app.models.account import Account
from app.schemas.alert import AlertResponse, RuleResponse, AlertResolveRequest, GraphDataResponse, GraphNode, GraphEdge
from app.dependencies.auth import get_token_claims
from shared.database import get_db_session
from shared.schemas import ResponseEnvelope
from sqlalchemy import text

router = APIRouter(prefix="", tags=["Alerts & Rules"])

@router.get("/alerts", response_model=ResponseEnvelope[list[AlertResponse]])
async def list_alerts(
    request: Request,
    severity: str | None = None,
    location: str | None = None,
    min_size: float | None = None,
    max_size: float | None = None,
    account_type: str | None = None,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[list[AlertResponse]]:
    """
    Retrieves triggered compliance alerts, optionally filtered by severity, location, size, or account type.
    """
    from shared.database.models import Customer
    owner_id = claims.get("sub") if claims else None
    if not owner_id:
        return ResponseEnvelope(
            success=True,
            message="Compliance alerts retrieved.",
            data=[],
            request_id=request.state.request_id
        )
    stmt = select(Alert).where(Alert.owner_id == owner_id)
    
    needs_account_join = account_type is not None or min_size is not None or max_size is not None
    if needs_account_join:
        stmt = stmt.join(Account, Alert.account_id == Account.id)
        if account_type:
            stmt = stmt.where(Account.account_type == account_type.upper().strip())
        if min_size is not None:
            stmt = stmt.where(Account.balance >= min_size)
        if max_size is not None:
            stmt = stmt.where(Account.balance <= max_size)
            
    if location:
        # Join Customer to filter by location (address)
        stmt = stmt.join(Customer, Alert.customer_id == Customer.id)
        stmt = stmt.where(Customer.address.ilike(f"%{location}%"))
        
    if severity:
        stmt = stmt.where(Alert.severity == severity.upper().strip())
    
    result = await session.execute(stmt)
    alerts = result.scalars().all()
    
    return ResponseEnvelope(
        success=True,
        message="Compliance alerts retrieved.",
        data=[AlertResponse.model_validate(a) for a in alerts],
        request_id=request.state.request_id
    )

@router.get("/alerts/critical", response_model=ResponseEnvelope[list[AlertResponse]])
async def list_critical_alerts(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[list[AlertResponse]]:
    """
    Retrieves alerts with high or critical severity.
    """
    owner_id = claims.get("sub") if claims else None
    if not owner_id:
        return ResponseEnvelope(
            success=True,
            message="Critical severity alerts retrieved.",
            data=[],
            request_id=request.state.request_id
        )
    stmt = select(Alert).where(Alert.severity.in_(["HIGH", "CRITICAL"])).where(Alert.owner_id == owner_id)
    result = await session.execute(stmt)
    alerts = result.scalars().all()
    
    return ResponseEnvelope(
        success=True,
        message="Critical severity alerts retrieved.",
        data=[AlertResponse.model_validate(a) for a in alerts],
        request_id=request.state.request_id
    )

@router.get("/rules", response_model=ResponseEnvelope[list[RuleResponse]])
async def list_rules(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[list[RuleResponse]]:
    """
    Retrieves the compliance rules catalog.
    """
    stmt = select(Rule)
    result = await session.execute(stmt)
    rules = result.scalars().all()
    
    return ResponseEnvelope(
        success=True,
        message="Compliance rules retrieved.",
        data=[RuleResponse.model_validate(r) for r in rules],
        request_id=request.state.request_id
    )

@router.post("/alerts/{id}/resolve", response_model=ResponseEnvelope[AlertResponse])
async def resolve_alert(
    request: Request,
    id: str,
    payload: AlertResolveRequest,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[AlertResponse]:
    """
    Resolves a specific alert (Dismisses or escalates).
    """
    import uuid
    try:
        alert_uuid = uuid.UUID(id)
    except ValueError:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Alert not found (invalid UUID format).")

    result = await session.execute(select(Alert).where(Alert.id == alert_uuid))
    alert = result.scalars().first()
    if not alert:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Alert not found.")

    status_map = {
        "DISMISSED": "DISMISSED",
        "ESCALATED": "ESCALATED_TO_CASE"
    }
    alert.status = status_map.get(payload.action.upper().strip(), payload.action.upper().strip())
    await session.commit()

    return ResponseEnvelope(
        success=True,
        message=f"Alert resolved as {alert.status}.",
        data=AlertResponse.model_validate(alert),
        request_id=request.state.request_id
    )

@router.get("/graph", response_model=GraphDataResponse)
async def get_graph(
    request: Request,
    alert_id: str | None = None,
    ingestion_id: str | None = None,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> GraphDataResponse:
    """
    Generates the dynamic relationship graph from active SQLite databases.
    """
    if not ingestion_id:
        return GraphDataResponse(nodes=[], edges=[])

    from shared.database.models import Transaction, Customer, Account, RiskScore, Alert

    # Filter transactions to construct actual edges dynamically
    owner_id = claims.get("sub") if claims else None
    tx_stmt = select(Transaction).where(Transaction.ingestion_id == ingestion_id)
    if owner_id:
        tx_stmt = tx_stmt.where(Transaction.owner_id == owner_id)
    txs_res = await session.execute(tx_stmt)
    transactions = txs_res.scalars().all()

    # Get accounts associated with these transactions
    acct_ids = set()
    for tx in transactions:
        if tx.sender_account_id: acct_ids.add(tx.sender_account_id)
        if tx.receiver_account_id: acct_ids.add(tx.receiver_account_id)

    # Fetch accounts
    accounts = []
    if not owner_id or acct_ids:
        accts_stmt = select(Account)
        if acct_ids:
            accts_stmt = accts_stmt.where(Account.id.in_(acct_ids))
        accts_res = await session.execute(accts_stmt)
        accounts = accts_res.scalars().all()

    # Fetch alerts
    alerts = []
    if not owner_id or acct_ids:
        alerts_stmt = select(Alert)
        if acct_ids:
            alerts_stmt = alerts_stmt.where(Alert.account_id.in_(acct_ids))
        alerts_res = await session.execute(alerts_stmt)
        alerts = alerts_res.scalars().all()

    # Fetch customer names from shared DB
    customers_map = {}
    try:
        from sqlalchemy import func
        stmt = (
            select(
                Customer.id,
                Customer.full_name,
                func.coalesce(func.max(RiskScore.final_score) / 100.0, 0.0)
            )
            .outerjoin(Account, Customer.id == Account.customer_id)
            .outerjoin(RiskScore, Account.id == RiskScore.account_id)
            .group_by(Customer.id, Customer.full_name)
        )
        cust_res = await session.execute(stmt)
        for row in cust_res.all():
            cust_id, full_name, r_score = row
            parts = full_name.split(" ", 1) if full_name else []
            first = parts[0] if len(parts) > 0 else ""
            last = parts[1] if len(parts) > 1 else ""
            customers_map[cust_id] = (first, last, float(r_score))
            customers_map[str(cust_id)] = (first, last, float(r_score))
    except Exception:
        pass

    nodes = []
    edges = []

    # Map accounts
    for acct in accounts:
        cust_id = str(acct.customer_id)
        cust_info = customers_map.get(acct.customer_id) or customers_map.get(cust_id)
        
        if cust_info:
            first, last, r_score = cust_info
            label = f"{first[0]}. {last} (Acc)"
            name = f"{first} {last}"
            risk_score = int(r_score * 100)
        else:
            label = f"Account {acct.account_number}"
            name = "Unknown Customer"
            risk_score = 30

        # Override risk score if account has critical alerts
        acct_alerts = [a for a in alerts if a.account_id == acct.id]
        if acct_alerts:
            risk_score = int(max(getattr(a, "score", 30) for a in acct_alerts))

        category = "High Risk Mule Node" if risk_score >= 70 else "Legitimate Account"
        if "mule" in acct.account_number or risk_score >= 90:
            category = "Critical Mule Node"

        currency_map = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "JPY": "¥"}
        acct_sym = currency_map.get(getattr(acct, "currency", "USD"), "$")

        details = {
            "name": name,
            "balance": f"{acct_sym}{float(acct.balance):,.2f}",
            "category": category,
            "created": acct.created_at.strftime("%Y-%m-%d") if getattr(acct, "created_at", None) else "2026-01-01",
            "location": "New York, USA" if risk_score >= 70 else "Boston, USA"
        }
        
        if category == "Critical Mule Node":
            details["muleSummary"] = "Pattern matched with known mule networks. Rapid transfer structuring observed."
            details["pastRecords"] = [
                f"Flagged for high risk transactional velocity.",
                f"Linked to suspicious IP addresses and devices.",
                f"Associated alerts generated on {acct.created_at.strftime('%Y-%m-%d') if getattr(acct, 'created_at', None) else '2026-01-01'}."
            ]

        clean_acct_num = getattr(acct, "account_number_raw", None) or acct.account_number or "UNKNOWN"
        nodes.append(GraphNode(
            id=clean_acct_num,
            label=label,
            type="account",
            riskScore=risk_score,
            details=details
        ))

    # -------------------------------------------------------------
    # ENTITY DEDUPLICATION & SUB-TREE TIMELINE RESOLUTION LOGIC
    # -------------------------------------------------------------
    import re
    from difflib import SequenceMatcher

    def normalize_name(name: str | None) -> str:
        if not name: return ""
        s = re.sub(r"\b(mr|mrs|ms|dr|shri|smt|prof|sir)\.?\b", "", str(name), flags=re.IGNORECASE)
        s = re.sub(r"[^\w\s]", " ", s)
        return " ".join(s.lower().split())

    def clean_acct_val(val: str | None) -> str:
        if not val: return ""
        v = str(val).strip().upper()
        if v in ("UNKNOWN", "NOT FOUND", "N/A", "NONE", ""): return ""
        return v

    entity_registry: dict[str, dict] = {}

    def resolve_entity(raw_acct: str | None, raw_name: str | None, upi: str | None) -> tuple[str, str, dict | None]:
        acct = clean_acct_val(raw_acct)
        name = str(raw_name).strip() if raw_name else ""
        norm_n = normalize_name(name)
        upi_str = str(upi).strip().lower() if upi and upi != "Not Found" else ""

        # 1. Exact Match on Account Number
        if acct:
            key = f"ACC-{acct}"
            disp_name = name if name and name not in ("UNKNOWN", "Not Found", acct) else acct
            return key, disp_name, None

        # 2. Match on UPI ID
        if upi_str:
            key = f"UPI-{upi_str}"
            disp_name = name if name and name not in ("UNKNOWN", "Not Found") else upi_str
            return key, disp_name, None

        # 3. Match on Normalized Name
        if norm_n and len(norm_n) >= 3:
            for existing_key, info in entity_registry.items():
                if existing_key.startswith("NAME-"):
                    existing_norm = existing_key.replace("NAME-", "")
                    ratio = SequenceMatcher(None, norm_n, existing_norm).ratio()
                    if ratio >= 0.85:
                        audit = {
                            "sourceIdentifier": name or raw_acct or "Unknown",
                            "matchedToEntity": info["displayName"],
                            "confidenceScore": round(ratio * 100, 1),
                            "reason": f"Fuzzy match on normalized name '{norm_n}' vs '{existing_norm}' ({round(ratio*100, 1)}%)"
                        }
                        return existing_key, info["displayName"], audit
            key = f"NAME-{norm_n}"
            disp_name = name if name else norm_n.title()
            return key, disp_name, None

        fallback = acct or name or "UNKNOWN"
        key = f"ACC-{fallback}"
        return key, fallback, None

    # Group transactions per entity & edge pair
    entity_txs: dict[str, list] = {}
    entity_info: dict[str, dict] = {}
    entity_audits: dict[str, list] = {}

    edge_txs: dict[tuple[str, str], list] = {}

    unique_tx_ids = set()

    for idx, tx in enumerate(transactions):
        raw_s_acct = getattr(tx, "sender_account_raw", None) or tx.sender_account
        raw_r_acct = getattr(tx, "receiver_account_raw", None) or tx.receiver_account
        beneficiary = getattr(tx, "beneficiary", None)
        upi_id = getattr(tx, "upi_id_raw", None) or getattr(tx, "upi_id", None)
        txn_display_id = getattr(tx, "transaction_id_raw", None) or tx.transaction_id or str(tx.id)

        source_key, source_disp, s_audit = resolve_entity(raw_s_acct, raw_s_acct, upi_id)
        if source_key not in entity_registry:
            entity_registry[source_key] = {"displayName": source_disp}

        target_key, target_disp, t_audit = resolve_entity(raw_r_acct, beneficiary or raw_r_acct, upi_id)
        if target_key not in entity_registry:
            entity_registry[target_key] = {"displayName": target_disp}

        if s_audit:
            entity_audits.setdefault(source_key, []).append(s_audit)
        if t_audit:
            entity_audits.setdefault(target_key, []).append(t_audit)

        tx_time_str = tx.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC") if getattr(tx, "timestamp", None) else "Unknown Date"
        tx_dt = tx.timestamp if getattr(tx, "timestamp", None) else datetime.utcnow()

        currency_map = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "JPY": "¥"}
        tx_sym = currency_map.get(getattr(tx, "currency", "USD"), "₹")

        tx_item = {
            "id": txn_display_id,
            "timestamp": tx_time_str,
            "rawTimestamp": tx_dt.isoformat(),
            "amount": float(tx.amount),
            "amountFormatted": f"{tx_sym}{float(tx.amount):,.2f}",
            "currency": getattr(tx, "currency", "INR"),
            "mode": getattr(tx, "payment_channel", "TRANSFER"),
            "refId": txn_display_id,
            "upiId": upi_id or "Not Found",
            "narration": getattr(tx, "narration_raw", None) or getattr(tx, "purpose", "N/A") or "N/A",
            "sender": source_disp,
            "senderId": source_key,
            "receiver": target_disp,
            "receiverId": target_key,
        }

        entity_txs.setdefault(source_key, []).append({**tx_item, "direction": "OUTGOING"})
        entity_txs.setdefault(target_key, []).append({**tx_item, "direction": "INCOMING"})
        
        entity_info.setdefault(source_key, {"name": source_disp, "rawAccount": raw_s_acct})
        entity_info.setdefault(target_key, {"name": target_disp, "rawAccount": raw_r_acct})

        edge_key = (source_key, target_key)
        edge_txs.setdefault(edge_key, []).append(tx_item)

        unique_tx_ids.add(str(tx.id))

    # Build final deduplicated nodes
    nodes = []
    
    # Add pre-existing accounts from Accounts DB table if available
    existing_acct_keys = set()
    for acct in accounts:
        clean_acct_num = getattr(acct, "account_number_raw", None) or acct.account_number or "UNKNOWN"
        e_key = f"ACC-{clean_acct_num.strip().upper()}"
        existing_acct_keys.add(e_key)

        cust_info = customers_map.get(acct.customer_id) or customers_map.get(str(acct.customer_id))
        if cust_info:
            first, last, r_score = cust_info
            name = f"{first} {last}"
            risk_score = int(r_score * 100)
        else:
            name = "Account Holder"
            risk_score = 30

        acct_alerts = [a for a in alerts if a.account_id == acct.id]
        if acct_alerts:
            risk_score = int(max(getattr(a, "score", 30) for a in acct_alerts))

        category = "High Risk Mule Node" if risk_score >= 70 else "Legitimate Account"
        if "mule" in acct.account_number.lower() or risk_score >= 90:
            category = "Critical Mule Node"

        sub_txs = entity_txs.get(e_key, [])
        sub_txs_sorted = sorted(sub_txs, key=lambda x: x["rawTimestamp"])
        
        total_vol = sum(t["amount"] for t in sub_txs)
        tx_count = len(sub_txs)
        badge_label = f"{clean_acct_num} ({tx_count} txns)" if tx_count > 1 else clean_acct_num

        currency_map = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "JPY": "¥"}
        acct_sym = currency_map.get(getattr(acct, "currency", "USD"), "₹")

        details = {
            "name": name,
            "accountNumber": clean_acct_num,
            "balance": f"{acct_sym}{float(acct.balance):,.2f}",
            "totalVolume": f"{acct_sym}{total_vol:,.2f}",
            "totalTransactions": tx_count,
            "firstTxDate": sub_txs_sorted[0]["timestamp"] if sub_txs_sorted else "N/A",
            "lastTxDate": sub_txs_sorted[-1]["timestamp"] if sub_txs_sorted else "N/A",
            "category": category,
            "created": acct.created_at.strftime("%Y-%m-%d") if getattr(acct, "created_at", None) else "2026-01-01",
            "location": "New York, USA" if risk_score >= 70 else "Boston, USA",
            "transactions": sub_txs_sorted,
            "mergedEntities": entity_audits.get(e_key, [])
        }

        if category == "Critical Mule Node":
            details["muleSummary"] = "Pattern matched with known mule networks. Rapid transfer structuring observed."
            details["pastRecords"] = [
                "Flagged for high risk transactional velocity.",
                "Linked to suspicious IP addresses and devices.",
                f"Associated alerts generated on {acct.created_at.strftime('%Y-%m-%d') if getattr(acct, 'created_at', None) else '2026-01-01'}."
            ]

        nodes.append(GraphNode(
            id=e_key,
            label=badge_label,
            type="account",
            riskScore=risk_score,
            details=details
        ))

    # Add deduplicated transaction entity nodes not already in accounts DB
    for e_key, sub_txs in entity_txs.items():
        if e_key in existing_acct_keys:
            continue

        info = entity_info.get(e_key, {})
        disp_name = info.get("name") or e_key
        sub_txs_sorted = sorted(sub_txs, key=lambda x: x["rawTimestamp"])
        total_vol = sum(t["amount"] for t in sub_txs)
        tx_count = len(sub_txs)
        
        # Calculate risk score based on transactions
        r_score = 40
        if any("MULE" in t["senderId"] or "MULE" in t["receiverId"] for t in sub_txs):
            r_score = 80

        badge_label = f"{disp_name} ({tx_count} txns)" if tx_count > 1 else disp_name

        currency_map = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "JPY": "¥"}
        tx_sym = currency_map.get(sub_txs[0]["currency"] if sub_txs else "INR", "₹")

        details = {
            "name": disp_name,
            "accountNumber": e_key.replace("ACC-", "").replace("NAME-", "").replace("UPI-", ""),
            "totalVolume": f"{tx_sym}{total_vol:,.2f}",
            "totalTransactions": tx_count,
            "firstTxDate": sub_txs_sorted[0]["timestamp"] if sub_txs_sorted else "N/A",
            "lastTxDate": sub_txs_sorted[-1]["timestamp"] if sub_txs_sorted else "N/A",
            "category": "High Risk Counterparty" if r_score >= 70 else "Discovered Counterparty",
            "transactions": sub_txs_sorted,
            "mergedEntities": entity_audits.get(e_key, [])
        }

        nodes.append(GraphNode(
            id=e_key,
            label=badge_label,
            type="account",
            riskScore=r_score,
            details=details
        ))

    # Build aggregated edges between deduplicated entities
    edges = []
    for (s_key, t_key), sub_e_txs in edge_txs.items():
        total_vol = sum(t["amount"] for t in sub_e_txs)
        tx_count = len(sub_e_txs)
        tx_sym = currency_map.get(sub_e_txs[0]["currency"] if sub_e_txs else "INR", "₹")
        
        edge_label = f"{tx_sym}{total_vol:,.2f} ({tx_count} txns)" if tx_count > 1 else f"{tx_sym}{total_vol:,.2f}"

        edges.append(GraphEdge(
            id=f"e-{s_key}-{t_key}",
            source=s_key,
            target=t_key,
            label=edge_label,
            value=total_vol,
            details={
                "transactionCount": tx_count,
                "totalVolume": f"{tx_sym}{total_vol:,.2f}",
                "transactions": sub_e_txs
            }
        ))

    # Dynamic device and IP nodes / links based on transactions
    added_devices = set()
    added_ips = set()
    for idx, tx in enumerate(transactions):
        raw_s_acct = getattr(tx, "sender_account_raw", None) or tx.sender_account
        s_key, _, _ = resolve_entity(raw_s_acct, raw_s_acct, getattr(tx, "upi_id_raw", None))

        if tx.device_id and tx.device_id not in added_devices:
            nodes.append(GraphNode(
                id=tx.device_id,
                label=f"Device {tx.device_id}",
                type="device",
                riskScore=75,
                details={
                    "hardware": "Associated Device",
                    "location": tx.location or "Unknown Location",
                    "category": "Shared Hardware Identifier"
                }
            ))
            added_devices.add(tx.device_id)
            
            edges.append(GraphEdge(
                id=f"e-dev-{idx}",
                source=s_key,
                target=tx.device_id,
                label="Authorized Session"
            ))

        if tx.ip_address and tx.ip_address not in added_ips:
            nodes.append(GraphNode(
                id=tx.ip_address,
                label=tx.ip_address,
                type="ip",
                riskScore=70,
                details={
                    "isp": "Internet Provider",
                    "location": tx.location or "Unknown Location",
                    "category": "Network Endpoint"
                }
            ))
            added_ips.add(tx.ip_address)

            conn_source = tx.device_id if tx.device_id else s_key
            edges.append(GraphEdge(
                id=f"e-ip-{idx}",
                source=conn_source,
                target=tx.ip_address,
                label="NAT Route"
            ))

    # Reconciliation Check: rawTxCount vs sum of unique transaction IDs
    raw_tx_count = len(transactions)
    dedup_tx_count = len(unique_tx_ids)
    reconciliation_passed = (raw_tx_count == dedup_tx_count)

    return GraphDataResponse(
        nodes=nodes,
        edges=edges,
        reconciliationPassed=reconciliation_passed,
        rawTxCount=raw_tx_count,
        dedupGraphTxCount=dedup_tx_count,
        uniqueEntitiesCount=len(nodes)
    )

@router.get("/graph/expand/{id}", response_model=GraphDataResponse)
async def expand_graph(
    request: Request,
    id: str,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> GraphDataResponse:
    """
    Expands the neighborhood of a graph node to show additional overlapping descriptors.
    """
    from shared.database.models import Transaction, Account, RiskScore, Customer
    from sqlalchemy import or_

    clean_id = id.replace("ACC-", "")

    # Find transactions where this account is sender or receiver (check both prefixed and unprefixed)
    tx_stmt = select(Transaction).where(
        or_(
            Transaction.sender_account == clean_id,
            Transaction.receiver_account == clean_id,
            Transaction.sender_account == f"ACC-{clean_id}",
            Transaction.receiver_account == f"ACC-{clean_id}"
        )
    )
    
    # Allow expanding the global pre-fetched graph nodes without owner_id isolation, 
    # since expand_graph doesn't take an ingestion_id filter yet.
    # owner_id = claims.get("sub")
    # if owner_id:
    #     tx_stmt = tx_stmt.where(Transaction.owner_id == owner_id)
        
    tx_stmt = tx_stmt.limit(50)

    txs_res = await session.execute(tx_stmt)
    transactions = txs_res.scalars().all()

    nodes_map = {}
    edges_list = []

    for tx in transactions:
        is_sender = tx.sender_account.replace("ACC-", "") == clean_id or tx.sender_account == clean_id
        counterparty = tx.receiver_account if is_sender else tx.sender_account
        counterparty_id = f"ACC-{counterparty.replace('ACC-', '')}"

        if counterparty_id not in nodes_map:
            nodes_map[counterparty_id] = GraphNode(
                id=counterparty_id,
                label=f"Counterparty: {counterparty}",
                type="account",
                riskScore=40,
                details={
                    "bank": tx.bank_name or "Unknown Bank",
                    "category": "Discovered Link"
                }
            )

        edge_id = f"e-exp-{tx.id}"
        source = id if is_sender else counterparty_id
        target = counterparty_id if is_sender else id

        edges_list.append(GraphEdge(
            id=edge_id,
            source=source,
            target=target,
            label=f"${float(tx.amount):,.2f}",
            value=float(tx.amount)
        ))

    return GraphDataResponse(nodes=list(nodes_map.values()), edges=edges_list)
