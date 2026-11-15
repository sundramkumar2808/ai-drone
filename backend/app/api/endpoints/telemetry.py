"""Telemetry API and WebSocket endpoints."""

from typing import Any, List
import uuid

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, status

from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.telemetry import TelemetryResponse
from app.services import telemetry_service
from app.services.telemetry_service import ws_connections

router = APIRouter(tags=["Telemetry"])


@router.get("/api/telemetry", response_model=List[dict])
async def get_all_telemetry(
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get the latest telemetry reading for every drone in the fleet."""
    return await telemetry_service.get_all_latest_telemetry(db)


@router.get("/api/telemetry/{drone_id}", response_model=List[TelemetryResponse])
async def get_drone_telemetry(
    drone_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get historical telemetry records for a specific drone."""
    return await telemetry_service.get_telemetry(db, drone_id=drone_id, limit=limit)


@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time live telemetry streaming.
    Clients receive JSON payloads every 2 seconds containing simulated live drone states.
    """
    await websocket.accept()
    ws_connections.append(websocket)
    try:
        while True:
            # Keep connection open and listen for client pings or filters
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in ws_connections:
            ws_connections.remove(websocket)
    except Exception:
        if websocket in ws_connections:
            ws_connections.remove(websocket)
