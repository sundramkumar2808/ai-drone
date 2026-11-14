"""
Database provider bridge for MongoDB.
Exports get_db, init_db, get_database, and Base for MongoDB compatibility.
"""

from app.database.mongodb import get_db, init_db, get_database
from app.models.base import MongoModel

Base = MongoModel

__all__ = ["get_db", "init_db", "get_database", "Base"]
