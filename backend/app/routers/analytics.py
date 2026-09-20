"""Analytics: totals + clicks-over-time + top referrers + device split."""
from collections import Counter

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.tables import Click, Link, User

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/summary")
def summary(link_id: int | None = Query(default=None),
            user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Link).filter_by(owner_id=user.id)
    if link_id:
        q = q.filter_by(id=link_id)
    links = q.all()
    ids = [l.id for l in links]
    if not ids:
        return {"total_clicks": 0, "total_links": 0, "over_time": [], "top_referrers": [], "by_device": {}}

    total = db.query(func.count(Click.id)).filter(Click.link_id.in_(ids)).scalar() or 0

    # clicks per day (last 14 days-ish, grouped in Python for SQLite simplicity)
    rows = db.query(Click.created_at).filter(Click.link_id.in_(ids)).order_by(Click.created_at).all()
    per_day: dict[str, int] = Counter()
    for (ts,) in rows:
        if ts:
            per_day[ts.strftime("%Y-%m-%d")] += 1
    over_time = [{"date": d, "clicks": c} for d, c in sorted(per_day.items())][-14:]

    ref_rows = db.query(Click.referrer, func.count(Click.id)).filter(
        Click.link_id.in_(ids)).group_by(Click.referrer).order_by(func.count(Click.id).desc()).limit(5).all()
    top_referrers = [{"referrer": r or "(direct)", "clicks": c} for r, c in ref_rows]

    dev_rows = db.query(Click.device, func.count(Click.id)).filter(
        Click.link_id.in_(ids)).group_by(Click.device).all()
    by_device = {d or "Desktop": c for d, c in dev_rows}

    per_link = dict(db.query(Click.link_id, func.count(Click.id)).filter(
        Click.link_id.in_(ids)).group_by(Click.link_id).all())
    top_links = sorted(
        [{"id": l.id, "short_code": l.short_code, "destination": l.destination, "clicks": per_link.get(l.id, 0)} for l in links],
        key=lambda x: x["clicks"], reverse=True)[:5]

    return {"total_clicks": total, "total_links": len(links), "over_time": over_time,
            "top_referrers": top_referrers, "by_device": by_device, "top_links": top_links}
