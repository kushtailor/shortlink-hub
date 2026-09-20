"""Link library: create / list (search+pages) / delete."""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.tables import Click, Link, User
from app.schemas.shapes import LinkCreate, LinkOut
from app.services.helpers import generate_code, is_safe_url, is_valid_slug, normalize_url, raw_has_bad_scheme

router = APIRouter(prefix="/api/v1/links", tags=["links"])
limiter = Limiter(key_func=get_remote_address)


def _short_url(req: Request, code: str) -> str:
    return f"{req.base_url}r/{code}".rstrip("/")


def _to_out(req: Request, link: Link, total: int = 0) -> dict:
    return {
        "id": link.id, "destination": link.destination, "short_code": link.short_code,
        "short_url": _short_url(req, link.short_code), "title": link.title,
        "total_clicks": total, "created_at": link.created_at.isoformat() if link.created_at else "",
    }


@router.post("", response_model=LinkOut)
@limiter.limit("10/minute")  # abuse protection: max 10 new links/min per IP
def create_link(request: Request, data: LinkCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if raw_has_bad_scheme(data.destination):
        raise HTTPException(422, "Only http:// and https:// URLs are allowed")
    dest = normalize_url(data.destination)
    ok, msg = is_safe_url(dest)
    if not ok:
        raise HTTPException(422, msg)

    slug = data.custom_slug.strip()
    if slug:
        if not is_valid_slug(slug):
            raise HTTPException(422, "Custom slug: 3-50 chars, letters/numbers/_/- only")
        if db.query(Link).filter_by(short_code=slug).first():
            raise HTTPException(409, "That custom slug is already taken")
        code = slug
    else:
        # random code + retry on rare collision
        for _ in range(5):
            code = generate_code()
            if not db.query(Link).filter_by(short_code=code).first():
                break
        else:
            raise HTTPException(500, "Could not generate unique code, try again")

    link = Link(owner_id=user.id, destination=dest, short_code=code, title=data.title.strip()[:200])
    db.add(link)
    db.commit()
    db.refresh(link)
    return _to_out(request, link, 0)


@router.get("")
def list_links(request: Request, search: str = Query(default=""), page: int = Query(default=1, ge=1),
               limit: int = Query(default=10, ge=1, le=50),
               user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Link).filter_by(owner_id=user.id)
    if search.strip():
        like = f"%{search.strip()}%"
        q = q.filter(or_(Link.destination.ilike(like), Link.short_code.ilike(like), Link.title.ilike(like)))
    total = q.count()
    links = q.order_by(Link.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    counts = dict(db.query(Click.link_id, func.count(Click.id)).filter(
        Click.link_id.in_([l.id for l in links])).group_by(Click.link_id).all()) if links else {}
    return {
        "total": total, "page": page, "limit": limit,
        "items": [_to_out(request, l, counts.get(l.id, 0)) for l in links],
    }


@router.delete("/{link_id}")
def delete_link(link_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.query(Link).filter_by(id=link_id, owner_id=user.id).first()
    if not link:
        raise HTTPException(404, "Link not found")
    db.delete(link)
    db.commit()
    return {"message": "deleted"}
