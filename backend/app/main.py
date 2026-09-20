"""App entry: creates tables, wires routers, CORS, rate limiting.

RUN: uvicorn app.main:app --reload --port 8000   (from backend/ folder)
DOCS: http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.db.session import Base, engine

# import models so tables are known
from app.models import tables  # noqa: F401
from app.routers import analytics, auth, bio, links, redirect

Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Short-Link & Bio Hub API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,  # REQUIRED so cookies work cross-origin (5173 -> 8000)
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(links.router)
app.include_router(analytics.router)
app.include_router(bio.router)
app.include_router(redirect.router)


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}


@app.get("/api/v1/feed")
def public_feed():
    """Public read-only JSON feed (deliverable: feed syndication)."""
    from app.db.session import SessionLocal
    from app.models.tables import Link
    db = SessionLocal()
    try:
        latest = db.query(Link).order_by(Link.created_at.desc()).limit(20).all()
        return {"items": [{"short_code": l.short_code, "title": l.title,
                           "created_at": l.created_at.isoformat() if l.created_at else ""} for l in latest]}
    finally:
        db.close()
