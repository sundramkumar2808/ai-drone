import pytest
from sqlalchemy.exc import SQLAlchemyError

import app.main


@pytest.mark.asyncio
async def test_health_reports_database_connectivity(client, test_db, monkeypatch):
    monkeypatch.setattr(app.main, "engine", test_db.bind)

    response = await client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["database"] == "healthy"


@pytest.mark.asyncio
async def test_health_reports_database_failure(client, monkeypatch):
    class UnavailableEngine:
        def connect(self):
            raise SQLAlchemyError("database unavailable")

    monkeypatch.setattr(app.main, "engine", UnavailableEngine())

    response = await client.get("/api/health")

    assert response.status_code == 503
    assert response.json()["database"] == "unavailable"
