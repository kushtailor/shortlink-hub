"""Password hashing, JWT tokens, IP hashing.

SIMPLE EXPLANATION:
- Passwords are never stored as plain text. We hash them with bcrypt.
- Login gives you two tokens: short access (15 min) + long refresh (7 days).
  Both live in httpOnly cookies so JavaScript (and XSS attacks) can't steal them.
- Click tracking stores a HASH of your IP, not the real IP (privacy).
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
import bcrypt

from app.core.config import settings

def hash_password(password: str) -> str:
    pw = password.encode()[:72]  # bcrypt limit
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode()[:72], hashed.encode())
    except Exception:
        return False


def _make_token(user_id: int, kind: str, expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": kind,
        "iat": now,
        "exp": now + expires,
        "jti": secrets.token_hex(8),  # unique id so each token differs (rotation)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def create_access_token(user_id: int) -> str:
    return _make_token(user_id, "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(user_id: int) -> str:
    return _make_token(user_id, "refresh", timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))


def decode_token(token: str, expected_type: str) -> int:
    """Returns user_id or raises jwt errors if invalid/expired/wrong type."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("wrong token type")
    return int(payload["sub"])


def hash_ip(ip: str) -> str:
    """One-way hash so analytics work without storing real IPs."""
    return hashlib.sha256(f"{ip}{settings.IP_HASH_SALT}".encode()).hexdigest()[:32]


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)
