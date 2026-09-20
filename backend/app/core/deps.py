"""Reads the logged-in user from the access-token cookie."""
import jwt
from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.tables import User


def get_current_user(access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)) -> User:
    if not access_token:
        raise HTTPException(status_code=401, detail="Not logged in")
    try:
        user_id = decode_token(access_token, "access")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please refresh")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
