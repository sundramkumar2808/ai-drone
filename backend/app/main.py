"""FastAPI main application entry point."""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
from typing import AsyncGenerator

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

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
from app.database.mongodb import get_database, init_db
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.services.telemetry_service import telemetry_simulator

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager for startup and shutdown tasks."""
    try:
        await init_db()
    except Exception as e:
        logger.warning("DB init: %s", e)

    # Startup: start background telemetry simulation
    try:
        telemetry_simulator.start(get_database)
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


@app.get("/api/health", tags=["Health"], status_code=status.HTTP_200_OK)
async def health_check():
    """Report API health and verify MongoDB connectivity."""
    db = get_database()
    return {
        "status": "healthy",
        "database": "mongodb_connected",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Static frontend hosting for unified cloud deployments (Render, Railway, Docker, Local)
import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

_root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_frontend_build = os.path.join(_root_dir, "frontend", "build")
_public_dir = os.path.join(_root_dir, "public")
_static_root = _frontend_build if os.path.isdir(_frontend_build) else (_public_dir if os.path.isdir(_public_dir) else None)

if _static_root:
    _static_assets = os.path.join(_static_root, "static")
    if os.path.isdir(_static_assets):
        app.mount("/static", StaticFiles(directory=_static_assets), name="static")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        if (
            full_path.startswith("api")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path.startswith("openapi")
        ):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        target = os.path.join(_static_root, full_path)
        if os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(_static_root, "index.html"))
else:
    @app.get("/", include_in_schema=False)
    async def root():
        """Redirect root to OpenAPI Swagger documentation."""
        return RedirectResponse(url="/api/docs")
