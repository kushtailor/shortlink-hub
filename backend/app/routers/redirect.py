"""Redirect engine: GET /r/:code -> 302 to destination + log click in background.

WHY BACKGROUND? The visitor should be redirected instantly; saving the
click stat happens just after, without making them wait.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.security import hash_ip
from app.db.session import get_db
from app.models.tables import Click, Link
from app.services.helpers import detect_device

router = APIRouter(tags=["redirect"])
limiter = Limiter(key_func=get_remote_address)


def _save_click(db_session_factory, link_id: int, referrer: str, user_agent: str, ip: str):
    db = db_session_factory()
    try:
        db.add(Click(link_id=link_id, referrer=(referrer or "")[:500],
                     device=detect_device(user_agent), ip_hash=hash_ip(ip or "unknown")))
        db.commit()
    finally:
        db.close()


@router.get("/r/{code}")
@limiter.limit("60/minute")
def redirect_code(request: Request, code: str, bg: BackgroundTasks, db: Session = Depends(get_db)):
    link = db.query(Link).filter_by(short_code=code).first()
    if not link:
        raise HTTPException(404, "Short link not found")
    # log after responding: import here to avoid circular import
    from app.db.session import SessionLocal
    bg.add_task(_save_click, SessionLocal, link.id,
                request.headers.get("referer", ""), request.headers.get("user-agent", ""),
                request.client.host if request.client else "unknown")
    return RedirectResponse(url=link.destination, status_code=302)
