"""
Firestore Database Manager for MuleShield AI backend services.
Provides a centralized client for reading/writing from Firebase Firestore collections.
Falls back to a no-op mock client if no credentials are present (offline/local dev mode).
"""
import os
import uuid
from datetime import datetime
from typing import Any, Optional

import structlog

logger = structlog.get_logger(__name__)

_firestore_client = None
_firebase_app = None

# Collection names — centralized constants
COLLECTION_CUSTOMERS = "customers"
COLLECTION_ACCOUNTS = "accounts"
COLLECTION_TRANSACTIONS = "transactions"
COLLECTION_ALERTS = "alerts"
COLLECTION_CASES = "cases"
COLLECTION_AUDIT_LOGS = "audit_logs"
COLLECTION_KYC_RECORDS = "kyc_records"
COLLECTION_RISK_SCORES = "risk_scores"


def _initialize_firebase():
    """
    Initializes the Firebase Admin SDK. Attempts to load credentials from:
    1. `backend/firebase-service-account.json` (explicit path)
    2. GOOGLE_APPLICATION_CREDENTIALS environment variable
    3. Application Default Credentials (ADC)
    Falls back to offline mock mode if none are available.
    """
    global _firebase_app, _firestore_client

    if _firebase_app is not None:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        service_account_path = os.path.join(
            os.path.dirname(__file__), 
            "../../../../firebase-service-account.json"
        )

        cred = None
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            logger.info("Firebase: loaded service account credentials from file", path=service_account_path)
        elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            cred = credentials.ApplicationDefault()
            logger.info("Firebase: using GOOGLE_APPLICATION_CREDENTIALS path")
        else:
            cred = credentials.ApplicationDefault()
            logger.warning("Firebase: no explicit credentials found — attempting Application Default Credentials")

        project_id = os.environ.get("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "muleshield-967045850546")

        if not firebase_admin._apps:
            _firebase_app = firebase_admin.initialize_app(cred, {"projectId": project_id})
        else:
            _firebase_app = firebase_admin.get_app()

        _firestore_client = firestore.client()
        logger.info("Firestore client initialized successfully", project_id=project_id)

    except Exception as exc:
        logger.warning(
            "Firebase Admin SDK initialization failed — running in offline mock mode",
            error=str(exc)
        )
        _firestore_client = None


class FirestoreManager:
    """
    High-level Firestore wrapper providing CRUD operations for all MuleShield AI collections.
    Gracefully falls back to offline dictionary store when Firestore is unavailable (local dev).
    """

    def __init__(self):
        _initialize_firebase()
        self._offline_store: dict[str, dict[str, Any]] = {}

    @property
    def client(self):
        return _firestore_client

    def _is_online(self) -> bool:
        return _firestore_client is not None

    # -------------------------------------------------------------------------
    # Generic CRUD helpers
    # -------------------------------------------------------------------------

    async def create_document(self, collection: str, data: dict, doc_id: Optional[str] = None) -> str:
        """
        Creates a document in the given collection. Returns the document ID.
        """
        doc_id = doc_id or str(uuid.uuid4())
        data.setdefault("created_at", datetime.utcnow().isoformat())
        data.setdefault("updated_at", datetime.utcnow().isoformat())
        data["id"] = doc_id

        if self._is_online():
            self.client.collection(collection).document(doc_id).set(data)
            logger.info("Firestore: document created", collection=collection, doc_id=doc_id)
        else:
            self._offline_store.setdefault(collection, {})[doc_id] = data
            logger.debug("Offline mock: document created", collection=collection, doc_id=doc_id)

        return doc_id

    async def get_document(self, collection: str, doc_id: str) -> Optional[dict]:
        """Fetches a single document by ID."""
        if self._is_online():
            doc = self.client.collection(collection).document(doc_id).get()
            return doc.to_dict() if doc.exists else None
        else:
            return self._offline_store.get(collection, {}).get(doc_id)

    async def update_document(self, collection: str, doc_id: str, updates: dict) -> None:
        """Partially updates a document."""
        updates["updated_at"] = datetime.utcnow().isoformat()
        if self._is_online():
            self.client.collection(collection).document(doc_id).update(updates)
        else:
            existing = self._offline_store.get(collection, {}).get(doc_id, {})
            existing.update(updates)
            self._offline_store.setdefault(collection, {})[doc_id] = existing

    async def delete_document(self, collection: str, doc_id: str) -> None:
        """Deletes a document."""
        if self._is_online():
            self.client.collection(collection).document(doc_id).delete()
        else:
            self._offline_store.get(collection, {}).pop(doc_id, None)

    async def query_collection(
        self, 
        collection: str, 
        filters: Optional[list[tuple]] = None,
        limit: int = 100
    ) -> list[dict]:
        """
        Queries a collection with optional filters.
        filters: list of (field, operator, value) tuples, e.g. [("status", "==", "OPEN")]
        """
        if self._is_online():
            ref = self.client.collection(collection)
            if filters:
                for field, op, value in filters:
                    ref = ref.where(field, op, value)
            docs = ref.limit(limit).stream()
            return [doc.to_dict() for doc in docs]
        else:
            all_docs = list(self._offline_store.get(collection, {}).values())
            if filters:
                for field, op, value in filters:
                    if op == "==":
                        all_docs = [d for d in all_docs if d.get(field) == value]
                    elif op == ">=":
                        all_docs = [d for d in all_docs if d.get(field, 0) >= value]
                    elif op == "<=":
                        all_docs = [d for d in all_docs if d.get(field, 0) <= value]
            return all_docs[:limit]

    # -------------------------------------------------------------------------
    # Domain-specific helpers
    # -------------------------------------------------------------------------

    async def upsert_customer(self, customer_data: dict, customer_id: Optional[str] = None) -> str:
        return await self.create_document(COLLECTION_CUSTOMERS, customer_data, doc_id=customer_id)

    async def get_customer_by_email(self, email: str) -> Optional[dict]:
        results = await self.query_collection(COLLECTION_CUSTOMERS, filters=[("email", "==", email)], limit=1)
        return results[0] if results else None

    async def upsert_account(self, account_data: dict, account_id: Optional[str] = None) -> str:
        return await self.create_document(COLLECTION_ACCOUNTS, account_data, doc_id=account_id)

    async def create_alert(self, alert_data: dict) -> str:
        return await self.create_document(COLLECTION_ALERTS, alert_data)

    async def get_alerts(self, limit: int = 50) -> list[dict]:
        return await self.query_collection(COLLECTION_ALERTS, limit=limit)

    async def create_case(self, case_data: dict) -> str:
        return await self.create_document(COLLECTION_CASES, case_data)

    async def get_case(self, case_id: str) -> Optional[dict]:
        return await self.get_document(COLLECTION_CASES, case_id)

    async def update_case_status(self, case_id: str, status: str) -> None:
        await self.update_document(COLLECTION_CASES, case_id, {"status": status})

    async def append_audit_log(self, actor_id: str, action: str, entity: str, entity_id: str, details: dict) -> str:
        log_data = {
            "actor_id": actor_id,
            "action": action,
            "entity": entity,
            "entity_id": entity_id,
            "details": details,
        }
        return await self.create_document(COLLECTION_AUDIT_LOGS, log_data)

    async def create_transaction(self, txn_data: dict) -> str:
        return await self.create_document(COLLECTION_TRANSACTIONS, txn_data)

    async def get_transactions(self, account_id: Optional[str] = None, limit: int = 100) -> list[dict]:
        filters = [("account_id", "==", account_id)] if account_id else None
        return await self.query_collection(COLLECTION_TRANSACTIONS, filters=filters, limit=limit)


# Singleton instance — import this from other modules
firestore_manager = FirestoreManager()
