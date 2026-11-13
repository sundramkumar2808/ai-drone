"""AI chatbot assistant API endpoints."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, examples=["Which drones have low battery?"])


class ChatResponse(BaseModel):
    response: str
    timestamp: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_drone_ai(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Chat with the intelligent Drone AI Assistant.
    Provides data-grounded insights on fleet status, mission planning, and maintenance.
    """
    ai_reply = await ai_service.chat(db, req.message, user_id=current_user.id)
    return {
        "response": ai_reply,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
