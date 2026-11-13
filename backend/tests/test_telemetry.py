"""Automated tests for Telemetry endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_telemetry_authorized(client: AsyncClient, auth_headers: dict):
    """Test getting all latest drone telemetry."""
    response = await client.get("/api/telemetry", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_telemetry_unauthorized(client: AsyncClient):
    """Test unauthorized access to telemetry endpoint returns 401."""
    response = await client.get("/api/telemetry")
    assert response.status_code == 401
