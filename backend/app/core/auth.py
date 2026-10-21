"""Verify Supabase access tokens server-side before accessing user-owned records."""
import httpx
from fastapi import Header, HTTPException

from app.core.config import settings


async def current_user_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if not settings.supabase_url or not settings.supabase_client_key:
        raise HTTPException(status_code=503, detail="Supabase authentication not configured")
    token = authorization.removeprefix("Bearer ").strip()
    if not token or len(token) > 8192:
        raise HTTPException(status_code=401, detail="Invalid bearer token")
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=False) as client:
            response = await client.get(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}",
                         "apikey": settings.supabase_client_key},
            )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Authentication service unavailable") from None
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    try:
        user_id = response.json()["id"]
    except (ValueError, KeyError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid identity response") from None
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=401, detail="Invalid identity response")
    return user_id
