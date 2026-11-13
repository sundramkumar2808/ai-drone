"""Automated tests for Drone endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_drone(client: AsyncClient, auth_headers: dict):
    """Test creating a drone and reading it back."""
    payload = {
        "drone_name": "Test Predator X",
        "model": "Matrice 300",
        "manufacturer": "DJI",
        "serial_number": "SN-TEST-99901",
        "battery_percentage": 95.0,
        "status": "available",
        "location": "Bay 1",
        "latitude": 37.77,
        "longitude": -122.41,
        "max_flight_time": 45.0,
        "max_payload": 3.0,
    }
    create_res = await client.post("/api/drones", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    drone_id = create_res.json()["id"]

    # Read back
    get_res = await client.get(f"/api/drones/{drone_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["drone_name"] == "Test Predator X"


@pytest.mark.asyncio
async def test_list_drones(client: AsyncClient, auth_headers: dict):
    """Test listing drones with pagination."""
    response = await client.get("/api/drones", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "drones" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_drone_unauthorized(client: AsyncClient):
    """Test creating drone without authentication fails with 401."""
    payload = {
        "drone_name": "Unauthorized Drone",
        "model": "Test",
        "manufacturer": "Test",
        "serial_number": "SN-UNAUTH",
        "max_flight_time": 30.0,
        "max_payload": 1.0,
    }
    response = await client.post("/api/drones", json=payload)
    assert response.status_code == 401
