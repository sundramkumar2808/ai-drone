"""
MongoDB database connection and collection provider using Motor (AsyncIO driver).
Provides automatic fallback for local offline testing and seamless MongoDB Atlas connection.
"""

import os
import logging
import asyncio
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone
import pymongo.errors
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("drone_fleet.database")

_mongo_client: Optional[AsyncIOMotorClient] = None
_mongo_db: Optional[Any] = None


class AsyncLocalCollection:
    """
    In-memory async collection fallback that mimics Motor's AsyncIOMotorCollection API.
    Ensures zero downtime or crashes during offline development or cold starts.
    """

    def __init__(self, name: str):
        self.name = name
        self._data: List[Dict[str, Any]] = []

    def _matches(self, doc: Dict[str, Any], filter_dict: Dict[str, Any]) -> bool:
        if not filter_dict:
            return True
        for key, val in filter_dict.items():
            if key == "$or" and isinstance(val, list):
                if not any(self._matches(doc, cond) for cond in val):
                    return False
                continue

            doc_val = doc.get(key)
            if isinstance(val, dict):
                if "$in" in val:
                    if doc_val not in val["$in"]:
                        return False
                elif "$gte" in val:
                    if doc_val is None or doc_val < val["$gte"]:
                        return False
                elif "$lte" in val:
                    if doc_val is None or doc_val > val["$lte"]:
                        return False
                elif "$ne" in val:
                    if doc_val == val["$ne"]:
                        return False
                elif "$regex" in val:
                    pattern = str(val["$regex"]).lower()
                    if pattern not in str(doc_val or "").lower():
                        return False
            else:
                if str(doc_val) != str(val):
                    return False
        return True

    async def insert_one(self, document: Dict[str, Any]) -> Any:
        doc = dict(document)
        if "id" not in doc or not doc["id"]:
            doc["id"] = str(uuid.uuid4())
        self._data.append(doc)

        class InsertResult:
            inserted_id = doc["id"]

        return InsertResult()

    async def find_one(
        self, filter_dict: Optional[Dict[str, Any]] = None, *args, **kwargs
    ) -> Optional[Dict[str, Any]]:
        filter_dict = filter_dict or {}
        matches = [d for d in self._data if self._matches(d, filter_dict)]
        if not matches:
            return None
        return dict(matches[0])

    def find(self, filter_dict: Optional[Dict[str, Any]] = None, *args, **kwargs) -> Any:
        filter_dict = filter_dict or {}
        matches = [dict(d) for d in self._data if self._matches(d, filter_dict)]

        class AsyncCursor:
            def __init__(self, items: List[Dict[str, Any]]):
                self._items = items

            def sort(self, key_or_list: Any, direction: int = 1):
                key = key_or_list if isinstance(key_or_list, str) else key_or_list[0][0]
                desc = direction == -1 if isinstance(key_or_list, str) else key_or_list[0][1] == -1
                self._items.sort(key=lambda x: str(x.get(key, "")), reverse=desc)
                return self

            def skip(self, n: int):
                self._items = self._items[n:]
                return self

            def limit(self, n: int):
                self._items = self._items[:n]
                return self

            async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
                return self._items[:length] if length else self._items

            def __aiter__(self):
                self._iter = iter(self._items)
                return self

            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        return AsyncCursor(matches)

    async def count_documents(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        filter_dict = filter_dict or {}
        return len([d for d in self._data if self._matches(d, filter_dict)])

    async def update_one(
        self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]
    ) -> Any:
        target = await self.find_one(filter_dict)
        if target:
            for item in self._data:
                if str(item.get("id")) == str(target.get("id")):
                    if "$set" in update_dict:
                        item.update(update_dict["$set"])
                    else:
                        item.update(update_dict)
                    break

        class UpdateResult:
            modified_count = 1 if target else 0

        return UpdateResult()

    async def delete_one(self, filter_dict: Dict[str, Any]) -> Any:
        target = await self.find_one(filter_dict)
        if target:
            self._data = [
                d for d in self._data if str(d.get("id")) != str(target.get("id"))
            ]

        class DeleteResult:
            deleted_count = 1 if target else 0

        return DeleteResult()


class AsyncLocalDatabase:
    """In-memory MongoDB Database representation."""

    def __init__(self, name: str = "drone_fleet"):
        self.name = name
        self._collections: Dict[str, AsyncLocalCollection] = {}

    def __getitem__(self, collection_name: str) -> AsyncLocalCollection:
        if collection_name not in self._collections:
            self._collections[collection_name] = AsyncLocalCollection(collection_name)
        return self._collections[collection_name]

    def __getattr__(self, name: str) -> AsyncLocalCollection:
        return self[name]


def get_mongo_uri() -> Optional[str]:
    """Retrieve the active MongoDB URI from environment if configured."""
    for key in ["MONGODB_URI", "MONGO_URL", "DATABASE_URL"]:
        val = os.environ.get(key)
        if val and ("mongodb://" in val or "mongodb+srv://" in val):
            return val
    return None


def get_database() -> Any:
    """Retrieve the singleton database instance."""
    global _mongo_client, _mongo_db

    if _mongo_db is not None:
        return _mongo_db

    uri = get_mongo_uri()
    db_name = os.environ.get("MONGODB_DB_NAME") or "drone_fleet"
    local_db = AsyncLocalDatabase(db_name)

    # If explicit remote MongoDB URI is provided (e.g. MongoDB Atlas on Vercel)
    if uri and ("mongodb+srv://" in uri or ("mongodb://" in uri and "localhost" not in uri and "127.0.0.1" not in uri)):
        try:
            logger.info("Connecting to remote MongoDB Atlas...")
            _mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=4000)
            _mongo_db = _mongo_client[db_name]
            return _mongo_db
        except Exception as e:
            logger.warning("MongoDB client initialization error: %s. Using local store.", e)

    # In local testing or offline environments
    _mongo_db = local_db
    return _mongo_db


async def get_db() -> Any:
    """FastAPI Dependency for request-scoped database access."""
    return get_database()


async def init_db() -> None:
    """Initialize MongoDB collections and trigger automatic seeding if empty."""
    db = get_database()
    try:
        from app.database.seed import seed
        await seed()
    except Exception as e:
        logger.warning("MongoDB initialization notice: %s", e)
