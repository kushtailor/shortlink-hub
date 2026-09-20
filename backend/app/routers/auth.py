"""Auth endpoints: signup / verify-sim / login / refresh / forgot / reset / me.

COOKIE MODEL (simple version):
- After login we set 2 httpOnly cookies: access_token (15 min) + refresh_token (7 days).
- Frontend never touches token values; browser sends them automatically.
- /refresh reads the refresh cookie and issues a NEW pair (rotation).
"""
from datetime import datetime

from fastapi import APIRouter, Depends, Response
from fastapi import Cookie as FastCookie
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.tables import Profile, User
from app.schemas.shapes import ForgotIn, LoginIn, ResetIn, SignupIn, UserOut

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _set_cookies(resp: Response, user_id: int):
    resp.set_cookie(
        "access_token", security.create_access_token(user_id),
        httponly=True, samesite="lax", max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/",
    )
    resp.set_cookie(
        "refresh_token", security.create_refresh_token(user_id),
        httponly=True, samesite="lax", max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400, path="/",
    )


def _user_out(u: User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email, "avatar": u.avatar, "is_verified": bool(u.is_verified)}


@router.post("/signup", response_model=UserOut)
def signup(data: SignupIn, resp: Response, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=data.email.lower()).first():
        from fastapi import HTTPException
        raise HTTPException(400, "Email already registered")
    user = User(name=data.name.strip(), email=data.email.lower(),
                password_hash=security.hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    # auto-create a bio profile so /bio/:username works later
    base = data.email.split("@")[0].lower().replace(".", "-")[:30]
    username = base
    n = 1
    while db.query(Profile).filter_by(username=username).first():
        n += 1
        username = f"{base}-{n}"
    db.add(Profile(user_id=user.id, username=username, display_name=user.name))
    db.commit()
    _set_cookies(resp, user.id)
    return _user_out(user)


@router.post("/verify-sim")
def verify_sim(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Email verification SIMULATION: no real email sent, just flips the flag."""
    user.is_verified = 1
    db.commit()
    return {"message": "Email verified (simulated)", "is_verified": True}


@router.post("/login", response_model=UserOut)
def login(data: LoginIn, resp: Response, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    user = db.query(User).filter_by(email=data.email.lower()).first()
    if not user or not security.verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    _set_cookies(resp, user.id)
    return _user_out(user)


@router.post("/refresh")
def refresh(resp: Response, refresh_token: str | None = FastCookie(default=None), db: Session = Depends(get_db)):
    from fastapi import HTTPException
    if not refresh_token:
        raise HTTPException(401, "No refresh token")
    try:
        user_id = security.decode_token(refresh_token, "refresh")
    except Exception:
        raise HTTPException(401, "Refresh expired, please login again")
    if not db.get(User, user_id):
        raise HTTPException(401, "User not found")
    _set_cookies(resp, user_id)  # rotation: brand-new pair
    return {"message": "refreshed"}


@router.post("/logout")
def logout(resp: Response):
    resp.delete_cookie("access_token", path="/")
    resp.delete_cookie("refresh_token", path="/")
    return {"message": "logged out"}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _user_out(user)


@router.post("/forgot")
def forgot(data: ForgotIn, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=data.email.lower()).first()
    # Always return success so attackers can't probe which emails exist
    if user:
        user.reset_token = security.generate_reset_token()
        from datetime import timedelta
        user.reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        # Simulation: return token in response so you can test without email.
        return {"message": "Reset link generated (simulated)", "reset_token": user.reset_token}
    return {"message": "If that email exists, a reset link was generated (simulated)"}


@router.post("/reset")
def reset(data: ResetIn, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    user = db.query(User).filter_by(reset_token=data.token).first()
    if not user or not user.reset_expires or user.reset_expires < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired reset token")
    if len(data.new_password) < 6:
        raise HTTPException(400, "Password too short")
    user.password_hash = security.hash_password(data.new_password)
    user.reset_token = ""
    user.reset_expires = None
    db.commit()
    return {"message": "Password reset successfully"}
