"""Automated tests for Authentication endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test user registration with valid credentials."""
    payload = {
        "full_name": "New Pilot",
        "email": "pilot@example.com",
        "phone": "+1-555-8822",
        "password": "ValidPassword123!",
        "confirm_password": "ValidPassword123!",
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "pilot@example.com"
    assert data["full_name"] == "New Pilot"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test registration with existing email returns 400."""
    payload = {
        "full_name": "Pilot Duplicate",
        "email": "duplicate@example.com",
        "password": "ValidPassword123!",
        "confirm_password": "ValidPassword123!",
    }
    res1 = await client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test login with registered user credentials."""
    # First register
    reg_payload = {
        "full_name": "Login User",
        "email": "loginuser@example.com",
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
    }
    await client.post("/api/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "loginuser@example.com",
        "password": "StrongPassword123!",
    }
    response = await client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with wrong password returns 401."""
    login_payload = {
        "email": "nonexistent@example.com",
        "password": "WrongPassword123!",
    }
    response = await client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient, auth_headers: dict):
    """Test /api/auth/me returns authenticated user."""
    response = await client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admintest@dronefleet.ai"
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_get_profile_unauthorized(client: AsyncClient):
    """Test /api/auth/me without token returns 401."""
    response = await client.get("/api/auth/me")
    assert response.status_code == 401
