"""Pytest test configuration and fixtures."""

import asyncio
from typing import AsyncGenerator
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database.session import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.drone import Drone
from app.main import app

# In-memory SQLite async engine for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean in-memory database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Test client with overridden database dependency."""
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def admin_user(test_db: AsyncSession) -> User:
    """Create and return a sample admin user."""
    user = User(
        id=uuid.uuid4(),
        full_name="Admin Test",
        email="admintest@dronefleet.ai",
        phone="+123456789",
        hashed_password=get_password_hash("TestPassword123!"),
        role="admin",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def auth_headers(admin_user: User) -> dict:
    """Generate authorization headers for admin user."""
    token = create_access_token(
        data={"sub": str(admin_user.id), "role": admin_user.role, "type": "access"}
    )
    return {"Authorization": f"Bearer {token}"}
