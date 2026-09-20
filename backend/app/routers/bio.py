"""Bio hub: owner edits their page, anyone can view /bio/:username."""
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.tables import Profile, User
from app.schemas.shapes import BioUpdate
from app.services.helpers import raw_has_bad_scheme

router = APIRouter(prefix="/api/v1/bio", tags=["bio"])
USERNAME_RE = re.compile(r"^[a-z0-9-]{3,50}$")
THEMES = {"light", "dark", "gradient"}


def _out(p: Profile) -> dict:
    return {"username": p.username, "display_name": p.display_name, "bio": p.bio,
            "avatar": p.avatar, "theme": p.theme, "social_links": p.social_links or []}


@router.get("/me")
def my_bio(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Profile).filter_by(user_id=user.id).first()
    if not p:
        raise HTTPException(404, "Profile not found")
    return _out(p)


@router.put("/me")
def update_bio(data: BioUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Profile).filter_by(user_id=user.id).first()
    if not p:
        raise HTTPException(404, "Profile not found")
    if data.username and data.username != p.username:
        u = data.username.lower().strip()
        if not USERNAME_RE.match(u):
            raise HTTPException(422, "Username: 3-50 chars, lowercase letters/numbers/- only")
        if db.query(Profile).filter_by(username=u).first():
            raise HTTPException(409, "Username taken")
        p.username = u
    if data.theme not in THEMES:
        raise HTTPException(422, "Theme must be light, dark or gradient")
    p.display_name = data.display_name[:100]
    p.bio = data.bio[:500]
    p.avatar = data.avatar[:500]
    p.theme = data.theme
    # validate social links: only http/https, like short links
    clean = []
    for s in data.social_links[:20]:
        if raw_has_bad_scheme(s.url):
            raise HTTPException(422, f"Bad social URL: {s.url}")
        url = s.url.strip()
        if "://" not in url:
            url = "https://" + url
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise HTTPException(422, f"Bad social URL: {s.url}")
        clean.append({"label": s.label[:50], "url": url})
    p.social_links = clean
    db.commit()
    db.refresh(p)
    return _out(p)


@router.get("/{username}")
def public_bio(username: str, db: Session = Depends(get_db)):
    """PUBLIC: no login needed (like Linktree)."""
    p = db.query(Profile).filter_by(username=username.lower()).first()
    if not p:
        raise HTTPException(404, "Bio page not found")
    return _out(p)
