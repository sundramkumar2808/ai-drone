"""
Simple in-memory rate limiter middleware for FastAPI.
Uses a sliding window counter approach per client IP.
"""

import time
from collections import defaultdict
from typing import Dict, List, Tuple

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    In-memory rate limiting middleware.

    Tracks request counts per client IP using a sliding window.
    Returns HTTP 429 when the rate limit is exceeded.

    Args:
        app: The FastAPI/Starlette application.
        max_requests: Maximum number of requests allowed per window.
        window_seconds: Duration of the sliding window in seconds.
    """

    def __init__(
        self,
        app,
        max_requests: int = 100,
        window_seconds: int = 60,
    ) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Mapping from client IP to list of request timestamps
        self._request_log: Dict[str, List[float]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        """Extract the client IP address from the request."""
        # Check for forwarded headers (behind a reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        # Fallback to direct client
        if request.client:
            return request.client.host

        return "unknown"

    def _cleanup_old_requests(self, ip: str, now: float) -> None:
        """Remove request timestamps outside the current window."""
        cutoff = now - self.window_seconds
        self._request_log[ip] = [
            ts for ts in self._request_log[ip] if ts > cutoff
        ]
        # Clean up empty entries to prevent memory leaks
        if not self._request_log[ip]:
            del self._request_log[ip]

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Process the request and apply rate limiting."""
        # Skip rate limiting for health checks
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now = time.time()

        # Clean up expired entries
        self._cleanup_old_requests(client_ip, now)

        # Check current request count
        request_count = len(self._request_log.get(client_ip, []))

        if request_count >= self.max_requests:
            retry_after = int(self.window_seconds)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        # Record this request
        self._request_log[client_ip].append(now)

        # Process the request
        response = await call_next(request)

        # Add rate limit headers
        remaining = max(0, self.max_requests - len(self._request_log.get(client_ip, [])))
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(now + self.window_seconds))

        return response
