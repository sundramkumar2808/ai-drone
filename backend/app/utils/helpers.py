"""
Utility / helper functions for the Drone Fleet Management Platform.
"""

import hashlib
import re
import secrets
import uuid
from datetime import datetime, timezone
from typing import Optional


def generate_reset_token() -> str:
    """
    Generate a cryptographically secure password reset token.

    Returns:
        A URL-safe random token string (64 characters).
    """
    return secrets.token_urlsafe(48)


def validate_email_format(email: str) -> bool:
    """
    Validate basic email format using a regex pattern.

    Args:
        email: The email address string to validate.

    Returns:
        True if the email format is valid, False otherwise.
    """
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def generate_uuid() -> uuid.UUID:
    """Generate a new UUID4."""
    return uuid.uuid4()


def utc_now() -> datetime:
    """Get the current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def hash_token(token: str) -> str:
    """
    Create a SHA-256 hash of a token for secure storage.

    Args:
        token: The token string to hash.

    Returns:
        The hex-encoded SHA-256 hash.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def truncate_string(value: str, max_length: int = 100) -> str:
    """
    Truncate a string to a maximum length, appending '...' if truncated.

    Args:
        value: The string to truncate.
        max_length: Maximum allowed length.

    Returns:
        The truncated string.
    """
    if len(value) <= max_length:
        return value
    return value[: max_length - 3] + "..."


def format_flight_hours(hours: float) -> str:
    """
    Format flight hours into a human-readable string.

    Args:
        hours: Total flight hours as a float.

    Returns:
        Formatted string like "12h 30m".
    """
    total_minutes = int(hours * 60)
    h = total_minutes // 60
    m = total_minutes % 60
    return f"{h}h {m}m"


def calculate_distance_km(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate the approximate distance between two GPS coordinates
    using the Haversine formula.

    Args:
        lat1, lon1: Latitude and longitude of point 1 (degrees).
        lat2, lon2: Latitude and longitude of point 2 (degrees).

    Returns:
        Distance in kilometers.
    """
    import math

    R = 6371.0  # Earth's radius in km

    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename by removing unsafe characters.

    Args:
        filename: The original filename.

    Returns:
        A sanitized filename safe for filesystem use.
    """
    # Remove path separators and null bytes
    sanitized = re.sub(r'[<>:"/\\|?*\x00]', "_", filename)
    # Remove leading/trailing dots and spaces
    sanitized = sanitized.strip(". ")
    return sanitized or "unnamed_file"


def paginate_params(
    page: int = 1,
    page_size: int = 20,
) -> tuple[int, int]:
    """
    Calculate offset and limit from page number and page size.

    Args:
        page: Current page number (1-indexed).
        page_size: Number of items per page.

    Returns:
        Tuple of (offset, limit).
    """
    page = max(1, page)
    page_size = max(1, min(100, page_size))
    offset = (page - 1) * page_size
    return offset, page_size
