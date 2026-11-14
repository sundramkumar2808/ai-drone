"""Analytics and reporting API endpoints."""

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query, Response

from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_overview(
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get high-level summary statistics for the dashboard."""
    return await analytics_service.get_overview_stats(db)


@router.get("/missions")
async def get_mission_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get mission performance metrics, monthly trends, and type distribution."""
    return await analytics_service.get_mission_analytics(
        db, start_date=start_date, end_date=end_date
    )


@router.get("/drones")
async def get_drone_analytics(
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get drone utilization, battery health status, and reliability comparisons."""
    return await analytics_service.get_drone_analytics(db)


@router.get("/export/csv")
async def export_csv(
    report_type: str = Query("overview", pattern="^(overview|drones|missions|maintenance)$"),
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Response:
    """Export analytics report as a downloadable CSV file."""
    csv_bytes = await analytics_service.export_report_csv(db, report_type=report_type)
    filename = f"drone_fleet_{report_type}_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/pdf")
async def export_pdf(
    report_type: str = Query("overview", pattern="^(overview|drones|missions|maintenance)$"),
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Response:
    """Export analytics report in PDF format."""
    pdf_bytes = await analytics_service.export_report_pdf(db, report_type=report_type)
    filename = f"drone_fleet_{report_type}_report_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
