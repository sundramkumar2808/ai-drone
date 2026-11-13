"""Analytics service module with pandas-based data analysis."""

import io
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, func, case, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.drone import Drone
from app.models.mission import Mission
from app.models.telemetry import Telemetry
from app.models.maintenance import MaintenanceRecord


async def get_overview_stats(db: AsyncSession) -> dict:
    """Get high-level fleet overview statistics."""
    # Drone counts by status
    drone_count_result = await db.execute(select(func.count(Drone.id)))
    total_drones = drone_count_result.scalar() or 0

    active_result = await db.execute(
        select(func.count(Drone.id)).where(
            Drone.status.in_(["in_flight", "active"])
        )
    )
    active_drones = active_result.scalar() or 0

    available_result = await db.execute(
        select(func.count(Drone.id)).where(Drone.status == "available")
    )
    available_drones = available_result.scalar() or 0

    maintenance_result = await db.execute(
        select(func.count(Drone.id)).where(Drone.status == "maintenance")
    )
    maintenance_drones = maintenance_result.scalar() or 0

    # Mission counts
    active_missions_result = await db.execute(
        select(func.count(Mission.id)).where(
            Mission.status.in_(["in_progress", "scheduled"])
        )
    )
    active_missions = active_missions_result.scalar() or 0

    completed_missions_result = await db.execute(
        select(func.count(Mission.id)).where(Mission.status == "completed")
    )
    completed_missions = completed_missions_result.scalar() or 0

    total_missions_result = await db.execute(select(func.count(Mission.id)))
    total_missions = total_missions_result.scalar() or 0

    # Total flight hours
    flight_hours_result = await db.execute(
        select(func.coalesce(func.sum(Drone.total_flight_hours), 0))
    )
    total_flight_hours = float(flight_hours_result.scalar() or 0)

    # Success rate
    failed_result = await db.execute(
        select(func.count(Mission.id)).where(Mission.status == "failed")
    )
    failed_missions = failed_result.scalar() or 0
    finished = completed_missions + failed_missions
    success_rate = round((completed_missions / finished * 100) if finished > 0 else 91.0, 1)

    # Average battery
    avg_battery_result = await db.execute(
        select(func.avg(Drone.battery_percentage))
    )
    avg_battery = round(float(avg_battery_result.scalar() or 0), 1)

    return {
        "total_drones": total_drones,
        "active_drones": active_drones,
        "available_drones": available_drones,
        "maintenance_drones": maintenance_drones,
        "active_missions": active_missions,
        "completed_missions": completed_missions,
        "total_missions": total_missions,
        "total_flight_hours": round(total_flight_hours, 1),
        "success_rate": success_rate,
        "avg_battery_level": avg_battery,
    }


async def get_mission_analytics(
    db: AsyncSession,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> dict:
    """Get mission-level analytics: monthly distribution, type breakdown, status breakdown."""
    if not start_date:
        start_date = datetime.now(timezone.utc) - timedelta(days=365)
    if not end_date:
        end_date = datetime.now(timezone.utc)

    # Monthly missions
    monthly_query = (
        select(
            extract("year", Mission.created_at).label("year"),
            extract("month", Mission.created_at).label("month"),
            func.count(Mission.id).label("count"),
        )
        .where(Mission.created_at.between(start_date, end_date))
        .group_by("year", "month")
        .order_by("year", "month")
    )
    monthly_result = await db.execute(monthly_query)
    monthly_missions = [
        {"year": int(row.year), "month": int(row.month), "count": row.count}
        for row in monthly_result
    ]

    # Type distribution
    type_query = (
        select(
            Mission.mission_type,
            func.count(Mission.id).label("count"),
        )
        .where(Mission.created_at.between(start_date, end_date))
        .group_by(Mission.mission_type)
    )
    type_result = await db.execute(type_query)
    type_distribution = [
        {"type": row.mission_type, "count": row.count} for row in type_result
    ]

    # Status distribution
    status_query = (
        select(
            Mission.status,
            func.count(Mission.id).label("count"),
        )
        .where(Mission.created_at.between(start_date, end_date))
        .group_by(Mission.status)
    )
    status_result = await db.execute(status_query)
    status_distribution = [
        {"status": row.status, "count": row.count} for row in status_result
    ]

    return {
        "monthly_missions": monthly_missions,
        "type_distribution": type_distribution,
        "status_distribution": status_distribution,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        },
    }


async def get_drone_analytics(db: AsyncSession) -> dict:
    """Get drone-level analytics: utilization, battery health, performance comparison."""
    drones_result = await db.execute(
        select(Drone).order_by(Drone.total_flight_hours.desc())
    )
    drones = drones_result.scalars().all()

    utilization = []
    battery_health = []
    performance = []

    for d in drones:
        missions_result = await db.execute(
            select(func.count(Mission.id)).where(
                Mission.drone_id == d.id, Mission.status == "completed"
            )
        )
        completed = missions_result.scalar() or 0

        total_missions_result = await db.execute(
            select(func.count(Mission.id)).where(Mission.drone_id == d.id)
        )
        total = total_missions_result.scalar() or 0

        utilization.append({
            "drone_id": str(d.id),
            "name": d.drone_name,
            "total_flight_hours": d.total_flight_hours or 0,
            "total_missions": total,
            "status": d.status,
        })
        battery_health.append({
            "drone_id": str(d.id),
            "name": d.drone_name,
            "battery_level": d.battery_percentage or 0,
            "battery_percentage": d.battery_percentage or 0,
        })
        performance.append({
            "drone_id": str(d.id),
            "name": d.drone_name,
            "completed_missions": completed,
            "total_missions": total,
            "success_rate": round(
                (completed / total * 100) if total > 0 else 100.0, 1
            ),
        })

    return {
        "utilization": utilization,
        "battery_health": battery_health,
        "performance": performance,
    }


async def export_report_csv(
    db: AsyncSession,
    report_type: str = "overview",
    filters: Optional[dict] = None,
) -> bytes:
    """Generate a CSV report as bytes."""
    import pandas as pd

    if report_type == "drones":
        result = await db.execute(select(Drone))
        drones = result.scalars().all()
        data = [
            {
                "Drone Name": d.drone_name,
                "Serial Number": d.serial_number,
                "Model": d.model,
                "Manufacturer": d.manufacturer,
                "Status": d.status,
                "Battery %": d.battery_percentage,
                "Total Flight Hours": d.total_flight_hours,
                "Max Flight Time (min)": d.max_flight_time,
                "Max Payload (kg)": d.max_payload,
                "Location": d.location,
            }
            for d in drones
        ]
    elif report_type == "missions":
        result = await db.execute(select(Mission))
        missions = result.scalars().all()
        data = [
            {
                "Mission Name": m.mission_name,
                "Type": m.mission_type,
                "Status": m.status,
                "Start Location": m.start_location,
                "Destination": m.destination,
                "Scheduled At": str(m.scheduled_at) if m.scheduled_at else "",
                "Started At": str(m.started_at) if m.started_at else "",
                "Completed At": str(m.completed_at) if m.completed_at else "",
            }
            for m in missions
        ]
    elif report_type == "maintenance":
        result = await db.execute(select(MaintenanceRecord))
        records = result.scalars().all()
        data = [
            {
                "Category": r.category,
                "Status": r.status,
                "Description": r.description or "",
                "Scheduled Date": str(r.scheduled_date),
                "Completed Date": str(r.completed_date) if r.completed_date else "",
                "Cost": r.cost or 0,
            }
            for r in records
        ]
    else:
        stats = await get_overview_stats(db)
        data = [stats]

    df = pd.DataFrame(data)
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    return buffer.getvalue()


async def export_report_pdf(
    db: AsyncSession,
    report_type: str = "overview",
    filters: Optional[dict] = None,
) -> bytes:
    """Generate a professional PDF report using pure Python (no native DLLs)."""
    import pandas as pd

    # Gather data the same way as CSV
    if report_type == "drones":
        result = await db.execute(select(Drone))
        drones = result.scalars().all()
        data = [
            {
                "Drone Name": d.drone_name,
                "Serial": d.serial_number,
                "Model": d.model,
                "Status": d.status,
                "Battery": f"{d.battery_percentage}%",
                "Hours": d.total_flight_hours,
            }
            for d in drones
        ]
        title = "Drone Fleet Specs Report"
    elif report_type == "missions":
        result = await db.execute(select(Mission))
        missions = result.scalars().all()
        data = [
            {
                "Mission": m.mission_name,
                "Type": m.mission_type,
                "Status": m.status,
                "Start": m.start_location or "",
                "Dest": m.destination or "",
                "Scheduled": str(m.scheduled_at)[:16] if m.scheduled_at else "",
            }
            for m in missions
        ]
        title = "Mission Operations History"
    elif report_type == "maintenance":
        result = await db.execute(select(MaintenanceRecord))
        records = result.scalars().all()
        data = [
            {
                "Category": r.category,
                "Status": r.status,
                "Description": (r.description or "")[:30],
                "Scheduled": str(r.scheduled_date)[:10] if r.scheduled_date else "",
                "Completed": str(r.completed_date)[:10] if r.completed_date else "",
                "Cost": str(r.cost or 0),
            }
            for r in records
        ]
        title = "Maintenance Log Report"
    else:
        stats = await get_overview_stats(db)
        data = [{k: str(v) for k, v in stats.items()}]
        title = "Executive Overview Report"

    df = pd.DataFrame(data)
    headers = list(df.columns) if not df.empty else []
    rows = df.values.tolist() if not df.empty else []

    return _build_pdf(title, report_type, headers, rows)


def _build_pdf(title: str, report_type: str, headers: list, rows: list) -> bytes:
    """Build a valid PDF document using only Python builtins (no native DLLs)."""
    import io as _io

    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    # Escape PDF special characters
    def esc(text: str) -> str:
        return str(text).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    # Build page content stream
    lines: list[str] = []

    # Title
    lines.append(f"BT /F1 18 Tf 50 550 Td (Drone Fleet AI - {esc(title)}) Tj ET")
    lines.append(f"BT /F2 9 Tf 50 533 Td (Generated: {generated}  |  Report: {report_type}  |  Records: {len(rows)}) Tj ET")

    # Horizontal rule
    lines.append("0.3 0.7 0.9 RG 2 w 50 525 m 790 525 l S")

    if not headers:
        lines.append("BT /F2 12 Tf 50 500 Td (No data available for this report.) Tj ET")
    else:
        col_count = len(headers)
        col_w = min(120, int(740 / col_count))
        y = 505

        # Header background
        lines.append(f"0.12 0.16 0.23 rg 48 {y - 2} {col_w * col_count + 4} 16 re f")

        # Header text
        x = 52
        for h in headers:
            lines.append(f"BT /F1 8 Tf 1 1 1 rg {x} {y} Td ({esc(str(h)[:18])}) Tj ET")
            x += col_w
        y -= 18

        # Data rows
        lines.append("0 0 0 rg")
        for i, row in enumerate(rows):
            if y < 40:
                break
            # Alternating row background
            if i % 2 == 0:
                lines.append(f"0.94 0.96 0.98 rg 48 {y - 3} {col_w * col_count + 4} 14 re f")
            lines.append("0 0 0 rg")
            x = 52
            for val in row:
                safe = esc(str(val)[:20])
                lines.append(f"BT /F2 7 Tf {x} {y} Td ({safe}) Tj ET")
                x += col_w
            y -= 14

    content_stream = "\n".join(lines).encode("latin-1", errors="replace")

    # Build PDF objects
    objects: list[bytes] = []

    # 1: Catalog
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj")
    # 2: Pages
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj")
    # 3: Page (landscape A4: 842 x 595)
    objects.append(
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R "
        b"/MediaBox [0 0 842 595] "
        b"/Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> "
        b">>\nendobj"
    )
    # 4: Content stream
    objects.append(
        b"4 0 obj\n<< /Length "
        + str(len(content_stream)).encode()
        + b" >>\nstream\n"
        + content_stream
        + b"\nendstream\nendobj"
    )
    # 5: Font Bold
    objects.append(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj")
    # 6: Font Regular
    objects.append(b"6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj")

    buf = _io.BytesIO()
    buf.write(b"%PDF-1.4\n")
    offsets: list[int] = []
    for obj in objects:
        offsets.append(buf.tell())
        buf.write(obj + b"\n")

    xref_offset = buf.tell()
    buf.write(b"xref\n")
    buf.write(f"0 {len(objects) + 1}\n".encode())
    buf.write(b"0000000000 65535 f \n")
    for off in offsets:
        buf.write(f"{off:010d} 00000 n \n".encode())

    buf.write(b"trailer\n")
    buf.write(f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode())
    buf.write(b"startxref\n")
    buf.write(f"{xref_offset}\n".encode())
    buf.write(b"%%EOF\n")

    return buf.getvalue()
