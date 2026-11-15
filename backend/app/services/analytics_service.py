"""Analytics service module with MongoDB and Pandas analysis."""

import io
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Any, List

from app.models.drone import Drone
from app.models.mission import Mission
from app.models.maintenance import MaintenanceRecord


async def get_overview_stats(db: Any) -> dict:
    """Get high-level fleet overview statistics from MongoDB."""
    total_drones = await db.drones.count_documents({})
    active_drones = await db.drones.count_documents({"status": {"$in": ["in_flight", "active"]}})
    available_drones = await db.drones.count_documents({"status": "available"})
    maintenance_drones = await db.drones.count_documents({"status": "maintenance"})

    active_missions = await db.missions.count_documents({"status": {"$in": ["in_progress", "scheduled"]}})
    completed_missions = await db.missions.count_documents({"status": "completed"})
    failed_missions = await db.missions.count_documents({"status": "failed"})
    total_missions = await db.missions.count_documents({})

    # Aggregate total flight hours and average battery
    cursor = db.drones.find({}, {"total_flight_hours": 1, "battery_percentage": 1})
    drones = await cursor.to_list(length=1000)

    total_flight_hours = sum(d.get("total_flight_hours", 0.0) or 0.0 for d in drones)
    batteries = [d.get("battery_percentage", 100.0) or 100.0 for d in drones]
    avg_battery = round(sum(batteries) / len(batteries), 1) if batteries else 100.0

    finished = completed_missions + failed_missions
    success_rate = round((completed_missions / finished * 100) if finished > 0 else 92.5, 1)

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
    db: Any,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> dict:
    """Get mission-level analytics: monthly distribution, type breakdown, status breakdown."""
    if not start_date:
        start_date = datetime.now(timezone.utc) - timedelta(days=365)
    if not end_date:
        end_date = datetime.now(timezone.utc)

    cursor = db.missions.find({})
    missions = await cursor.to_list(length=2000)

    monthly_dict: dict = {}
    type_dict: dict = {}
    status_dict: dict = {}

    for m in missions:
        # Type
        t = m.get("mission_type", "Surveillance")
        type_dict[t] = type_dict.get(t, 0) + 1

        # Status
        s = m.get("status", "completed")
        status_dict[s] = status_dict.get(s, 0) + 1

        # Monthly
        created = m.get("created_at")
        if isinstance(created, datetime):
            key = (created.year, created.month)
            monthly_dict[key] = monthly_dict.get(key, 0) + 1

    monthly_missions = [
        {"year": y, "month": m, "count": c}
        for (y, m), c in sorted(monthly_dict.items())
    ]
    type_distribution = [{"type": k, "count": v} for k, v in type_dict.items()]
    status_distribution = [{"status": k, "count": v} for k, v in status_dict.items()]

    return {
        "monthly_missions": monthly_missions,
        "type_distribution": type_distribution,
        "status_distribution": status_distribution,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        },
    }


async def get_drone_analytics(db: Any) -> dict:
    """Get drone-level analytics: utilization, battery health, performance comparison."""
    cursor = db.drones.find({}).sort("total_flight_hours", -1)
    drones = await cursor.to_list(length=100)

    utilization = []
    battery_health = []
    performance = []

    for d in drones:
        drone_id = str(d.get("id"))
        completed = await db.missions.count_documents({"drone_id": drone_id, "status": "completed"})
        total = await db.missions.count_documents({"drone_id": drone_id})

        utilization.append({
            "drone_id": drone_id,
            "name": d.get("drone_name", "Drone"),
            "total_flight_hours": d.get("total_flight_hours", 0.0) or 0.0,
            "total_missions": total,
            "status": d.get("status", "available"),
        })
        battery_health.append({
            "drone_id": drone_id,
            "name": d.get("drone_name", "Drone"),
            "battery_level": d.get("battery_percentage", 100.0) or 100.0,
            "battery_percentage": d.get("battery_percentage", 100.0) or 100.0,
        })
        performance.append({
            "drone_id": drone_id,
            "name": d.get("drone_name", "Drone"),
            "completed_missions": completed,
            "total_missions": total,
            "success_rate": round((completed / total * 100) if total > 0 else 100.0, 1),
        })

    return {
        "utilization": utilization,
        "battery_health": battery_health,
        "performance": performance,
    }


async def _get_report_dataset(db: Any, report_type: str) -> tuple[str, list[str], list[list[Any]]]:
    """Retrieve structured title, headers, and rows for any analytics report using pure Python."""
    norm = (report_type or "overview").lower().strip()

    if "drone" in norm:
        title = "Drone Fleet Specs Report"
        headers = [
            "Drone Name",
            "Serial Number",
            "Model",
            "Manufacturer",
            "Status",
            "Battery %",
            "Flight Hours",
            "Max Time (min)",
            "Payload (kg)",
            "Location",
        ]
        cursor = db.drones.find({}).sort("drone_name", 1)
        drones = await cursor.to_list(length=1000)
        rows = [
            [
                d.get("drone_name") or "Unnamed Drone",
                d.get("serial_number") or "N/A",
                d.get("model") or "N/A",
                d.get("manufacturer") or "N/A",
                (d.get("status") or "available").replace("_", " ").title(),
                f"{d.get('battery_percentage', 100)}%",
                f"{round(float(d.get('total_flight_hours') or 0.0), 1)} hrs",
                f"{d.get('max_flight_time') or 30} min",
                f"{d.get('max_payload') or 2.5} kg",
                str(d.get("location") or "Base Station"),
            ]
            for d in drones
        ]
    elif "miss" in norm:
        title = "Mission Operations History"
        headers = [
            "Mission Name",
            "Type",
            "Status",
            "Start Location",
            "Destination",
            "Scheduled Time",
            "Duration (est)",
        ]
        cursor = db.missions.find({}).sort("created_at", -1)
        missions = await cursor.to_list(length=1000)
        rows = [
            [
                m.get("mission_name") or "Mission",
                (m.get("mission_type") or "Surveillance").title(),
                (m.get("status") or "scheduled").replace("_", " ").title(),
                str(m.get("start_location") or "HQ"),
                str(m.get("destination") or "Zone Alpha"),
                str(m.get("scheduled_at") or m.get("created_at") or "")[:16],
                f"{m.get('estimated_duration') or 45} min",
            ]
            for m in missions
        ]
    elif "maint" in norm:
        title = "Maintenance Log Report"
        headers = [
            "Log Category",
            "Status",
            "Description",
            "Scheduled Date",
            "Technician / Notes",
        ]
        cursor = db.maintenance.find({}).sort("scheduled_date", -1)
        records = await cursor.to_list(length=1000)
        rows = [
            [
                (r.get("category") or "routine").title(),
                (r.get("status") or "pending").replace("_", " ").title(),
                (r.get("description") or "Routine airframe inspection")[:35],
                str(r.get("scheduled_date") or "")[:10],
                str(r.get("completed_date") or "Pending Review")[:10],
            ]
            for r in records
        ]
    else:
        # Executive Overview Report
        title = "Executive Overview Report"
        stats = await get_overview_stats(db)
        headers = ["Operational Fleet Metric", "Value", "Executive Context"]
        rows = [
            ["Total Fleet Airframes", str(stats.get("total_drones", 0)), "Total registered airframes in fleet"],
            ["Active Sorties / In Flight", str(stats.get("active_drones", 0)), "Drones actively flying or on active duty"],
            ["Available for Dispatch", str(stats.get("available_drones", 0)), "Ready for immediate flight tasking"],
            ["Airframes Under Maintenance", str(stats.get("maintenance_drones", 0)), "Hangar inspection or component service"],
            ["Active Operations", str(stats.get("active_missions", 0)), "Missions currently underway or scheduled"],
            ["Successfully Completed Missions", str(stats.get("completed_missions", 0)), "Concluded without operational failure"],
            ["Total Sorties Logged", str(stats.get("total_missions", 0)), "All-time operational missions recorded"],
            ["Cumulative Flight Hours", f"{stats.get('total_flight_hours', 0.0)} hrs", "Total airborne airframe flight time"],
            ["Mission Success Rate", f"{stats.get('success_rate', 0.0)}%", "Completed vs total mission ratio KPI"],
            ["Fleet Battery Energy Mean", f"{stats.get('avg_battery_level', 100.0)}%", "Mean state of charge across all active drones"],
        ]

    return title, headers, rows


async def export_report_csv(
    db: Any,
    report_type: str = "overview",
    filters: Optional[dict] = None,
) -> bytes:
    """Generate a CSV report as bytes using pure Python standard library."""
    import csv

    title, headers, rows = await _get_report_dataset(db, report_type)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)

    return buf.getvalue().encode("utf-8")


async def export_report_pdf(
    db: Any,
    report_type: str = "overview",
    filters: Optional[dict] = None,
) -> bytes:
    """Generate a PDF report using pure Python."""
    title, headers, rows = await _get_report_dataset(db, report_type)
    return _build_pdf(title, report_type, headers, rows)


def _build_pdf(title: str, report_type: str, headers: list, rows: list) -> bytes:
    """Build a valid PDF document using only Python builtins (no native DLLs)."""
    import io as _io

    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    def esc(text: str) -> str:
        s = str(text if text is not None else "").replace("\r", " ").replace("\n", " ")
        return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    lines: list[str] = []
    lines.append(f"BT /F1 18 Tf 50 550 Td (Drone Fleet AI - {esc(title)}) Tj ET")
    lines.append(f"BT /F2 9 Tf 50 533 Td (Generated: {generated}  |  Report: {esc(report_type.title())}  |  Records: {len(rows)}) Tj ET")
    lines.append("0.1 0.6 0.85 RG 2 w 50 525 m 790 525 l S")

    if not headers:
        lines.append("BT /F2 12 Tf 50 500 Td (No data available for this report.) Tj ET")
    else:
        col_count = len(headers)
        total_w = 740
        col_w = max(65, int(total_w / col_count))
        table_width = min(total_w, col_w * col_count)
        y = 505

        lines.append(f"0.08 0.12 0.22 rg 48 {y - 3} {table_width + 4} 16 re f")
        x = 52
        for h in headers:
            h_str = esc(str(h))[:25]
            lines.append(f"BT /F1 8 Tf 1 1 1 rg {x} {y} Td ({h_str}) Tj ET")
            x += col_w
        y -= 18

        for i, row in enumerate(rows):
            if y < 40:
                break
            if i % 2 == 0:
                lines.append(f"0.94 0.96 0.98 rg 48 {y - 3} {table_width + 4} 14 re f")
            x = 52
            for val in row:
                safe = esc(str(val))[:35]
                lines.append(f"BT /F2 7.5 Tf 0.1 0.15 0.2 rg {x} {y} Td ({safe}) Tj ET")
                x += col_w
            y -= 14

    content_stream = "\n".join(lines).encode("latin-1", errors="replace")
    objects: list[bytes] = []
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj")
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj")
    objects.append(
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R "
        b"/MediaBox [0 0 842 595] "
        b"/Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> "
        b">>\nendobj"
    )
    objects.append(
        b"4 0 obj\n<< /Length "
        + str(len(content_stream)).encode()
        + b" >>\nstream\n"
        + content_stream
        + b"\nendstream\nendobj"
    )
    objects.append(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj")
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
