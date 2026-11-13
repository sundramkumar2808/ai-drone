"""FastAPI main application entry point."""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
from typing import AsyncGenerator

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.endpoints import (
    admin,
    ai_chat,
    alerts,
    analytics,
    auth,
    drones,
    maintenance,
    missions,
    telemetry,
)
from app.core.config import get_settings
from app.database.session import async_session_factory, engine, init_db
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.services.telemetry_service import telemetry_simulator

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager for startup and shutdown tasks."""
    await init_db()

    # Startup: start background telemetry simulation
    try:
        telemetry_simulator.start(async_session_factory)
        print("[Telemetry Simulator] Started background streaming service.")
    except Exception as e:
        print(f"[Telemetry Simulator Warning] Could not start simulator: {e}")

    yield

    # Shutdown: stop telemetry simulation
    try:
        await telemetry_simulator.stop()
        print("[Telemetry Simulator] Stopped gracefully.")
    except Exception as e:
        print(f"[Telemetry Simulator Shutdown Error] {e}")


app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise-grade AI-assisted Drone Fleet Management Platform API.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Custom Rate Limiter middleware
app.add_middleware(RateLimiterMiddleware, max_requests=120, window_seconds=60)

# Include API routers
app.include_router(auth.router)
app.include_router(drones.router)
app.include_router(missions.router)
app.include_router(telemetry.router)
app.include_router(maintenance.router)
app.include_router(analytics.router)
app.include_router(alerts.router)
app.include_router(admin.router)
app.include_router(ai_chat.router)


@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to OpenAPI Swagger documentation."""
    return RedirectResponse(url="/api/docs")


@app.get("/api/health", tags=["Health"], status_code=status.HTTP_200_OK)
async def health_check():
    """Report API health and verify database connectivity."""
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Database health check failed")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "unavailable",
                "app": settings.APP_NAME,
            },
        )

    return {
        "status": "healthy",
        "database": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
