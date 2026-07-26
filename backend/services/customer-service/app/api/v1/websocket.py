import asyncio
from typing import Dict, List, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from shared.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # Maps user_id → list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Maps user_id → display name (for presence events)
        self.display_names: Dict[str, str] = {}
        # Maps case_id → set of user_ids currently viewing it
        self.presence: Dict[str, set] = {}

    async def connect(self, websocket: WebSocket, user_id: str, display_name: str = ""):
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.display_names[user_id] = display_name or user_id
        logger.info(f"WebSocket connected: user_id={user_id}, name={display_name}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.display_names.pop(user_id, None)

        # Clean up presence for all cases
        for case_id in list(self.presence.keys()):
            self.presence[case_id].discard(user_id)

        logger.info(f"WebSocket disconnected: user_id={user_id}")

    @property
    def connected_user_count(self) -> int:
        return len(self.active_connections)

    async def broadcast(self, message: dict):
        """Broadcast to ALL connected clients."""
        disconnected = []
        for user_id, connections in list(self.active_connections.items()):
            for ws in list(connections):
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")
                    disconnected.append((user_id, ws))
        for user_id, ws in disconnected:
            self.disconnect(ws, user_id)

    async def broadcast_except(self, exclude_user_id: str, message: dict):
        """Broadcast to all clients EXCEPT the originating user."""
        disconnected = []
        for user_id, connections in list(self.active_connections.items()):
            if user_id == exclude_user_id:
                continue
            for ws in list(connections):
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")
                    disconnected.append((user_id, ws))
        for user_id, ws in disconnected:
            self.disconnect(ws, user_id)

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to a specific user's connections."""
        for ws in list(self.active_connections.get(user_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                pass

    def get_presence_viewers(self, case_id: str) -> List[str]:
        """Return display names of all users viewing a case."""
        user_ids = self.presence.get(case_id, set())
        return [self.display_names.get(uid, uid) for uid in user_ids]

    def _build_presence_payload(self, case_id: str) -> dict:
        return {
            "type": "presence_update",
            "case_id": case_id,
            "viewers": self.get_presence_viewers(case_id),
            "viewer_count": len(self.presence.get(case_id, set())),
        }


manager = ConnectionManager()


@router.websocket("/ws/cases")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """
    Authenticated WebSocket endpoint for shared real-time investigation workspace.

    Clients must supply a valid JWT via ?token=<JWT>.
    Close code 4001 is sent for unauthenticated / invalid-token connections.

    Supported incoming message types:
      - viewing_case   { type, case_id }
      - left_case      { type, case_id }
      - ping           { type }

    Outgoing broadcast event types (also emitted by REST endpoints):
      - case_created         { type, data: CaseResponse }
      - case_updated         { type, case_id, data: CaseResponse }
      - case_assigned        { type, case_id, assigned_to }
      - case_escalated       { type, case_id }
      - case_note_added      { type, case_id, note }
      - presence_update      { type, case_id, viewers, viewer_count }
      - connected_users      { type, count }
      - pong                 { type }
    """
    user_id = None
    display_name = "Unknown Investigator"

    # Accept the connection first so we can send standard close codes on failure
    await websocket.accept()
    
    # ── JWT Authentication ────────────────────────────────────────────────────
    if token:
        try:
            from shared.config import BaseAppSettings
            _settings = BaseAppSettings()
            from shared.authentication.jwt import decode_token
            claims = decode_token(token, _settings.JWT_SECRET_KEY, _settings.JWT_ALGORITHM)
            user_id = claims.get("sub", "")

            # Try to resolve a human display name from the auth database
            try:
                import uuid as _uuid
                from shared.database import db_manager
                from sqlalchemy import text
                sessionmaker = db_manager.get_sessionmaker()
                if sessionmaker and user_id:
                    async with sessionmaker() as _session:
                        result = await _session.execute(
                            text("SELECT first_name, last_name, email FROM users WHERE id = :uid LIMIT 1"),
                            {"uid": str(user_id)}
                        )
                        row = result.fetchone()
                        if row:
                            fn, ln, em = row
                            name_parts = f"{fn or ''} {ln or ''}".strip()
                            display_name = name_parts if name_parts else (em or display_name)
                        else:
                            display_name = f"Investigator {str(user_id)[:6].upper()}"
            except Exception:
                # DB lookup failed — fall back gracefully
                display_name = f"Investigator {str(user_id)[:6].upper()}"

        except Exception as e:
            logger.warning(f"WebSocket JWT validation failed: {e}")
            await websocket.close(code=4001)
            return
    else:
        # No token provided — reject
        await websocket.close(code=4001)
        return

    if not user_id:
        await websocket.close(code=4001)
        return

    # ── Register ─────────────────────────────────────────────────────
    await manager.connect(websocket, user_id, display_name)

    # Notify everyone of the updated connected user count
    asyncio.create_task(manager.broadcast({
        "type": "connected_users",
        "count": manager.connected_user_count
    }))

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "viewing_case":
                case_id = data.get("case_id")
                if case_id:
                    if case_id not in manager.presence:
                        manager.presence[case_id] = set()
                    manager.presence[case_id].add(user_id)
                    asyncio.create_task(manager.broadcast(
                        manager._build_presence_payload(case_id)
                    ))

            elif msg_type == "left_case":
                case_id = data.get("case_id")
                if case_id and case_id in manager.presence:
                    manager.presence[case_id].discard(user_id)
                    asyncio.create_task(manager.broadcast(
                        manager._build_presence_payload(case_id)
                    ))

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        # Broadcast updated user count and clear presence for all open cases
        asyncio.create_task(manager.broadcast({
            "type": "connected_users",
            "count": manager.connected_user_count
        }))
        for case_id in list(manager.presence.keys()):
            if user_id in manager.presence.get(case_id, set()):
                asyncio.create_task(manager.broadcast(
                    manager._build_presence_payload(case_id)
                ))
