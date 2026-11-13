"""Automated tests for Mission endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_mission(client: AsyncClient, auth_headers: dict):
    """Test creating and listing missions."""
    payload = {
        "mission_name": "Perimeter Inspection Patrol",
        "mission_type": "inspection",
        "start_location": "Gate A",
        "destination": "Tower B",
        "start_lat": 37.77,
        "start_lng": -122.41,
        "dest_lat": 37.78,
        "dest_lng": -122.42,
        "notes": "Test mission notes",
    }
    create_res = await client.post("/api/missions", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    mission_id = create_res.json()["id"]

    # List
    list_res = await client.get("/api/missions", headers=auth_headers)
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 1
    assert any(m["id"] == mission_id for m in data["missions"])
