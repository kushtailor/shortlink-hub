"""Seed dummy data: python seed.py  (creates 3 users, links, clicks)."""
from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models.tables import Click, Link, Profile, User
from app.services.helpers import generate_code

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if db.query(User).first():
    print("Already seeded, skipping.")
    raise SystemExit

users = []
for i, (name, email) in enumerate([("Aarav Sharma", "aarav@test.com"), ("Diya Patel", "diya@test.com"), ("Kabir Singh", "kabir@test.com")]):
    u = User(name=name, email=email, password_hash=hash_password("password123"), is_verified=1)
    db.add(u)
    db.commit()
    db.refresh(u)
    uname = email.split("@")[0]
    db.add(Profile(user_id=u.id, username=uname, display_name=name, bio=f"Hey, I am {name}!",
                   theme=["light", "dark", "gradient"][i % 3],
                   social_links=[{"label": "GitHub", "url": "https://github.com"}, {"label": "Twitter", "url": "https://x.com"}]))
    db.commit()
    users.append(u)

dests = [("https://fastapi.tiangolo.com", "FastAPI docs"), ("https://react.dev", "React docs"),
         ("https://github.com", "GitHub"), ("https://tailwindcss.com", "Tailwind")]
for u in users:
    for dest, title in dests:
        code = generate_code()
        while db.query(Link).filter_by(short_code=code).first():
            code = generate_code()
        link = Link(owner_id=u.id, destination=dest, short_code=code, title=title)
        db.add(link)
        db.commit()
        db.refresh(link)
        for _ in range(5):
            db.add(Click(link_id=link.id, referrer="https://google.com", device="Desktop", ip_hash="seedhash"))
        db.commit()

print("Seeded 3 users (password: password123), links + clicks.")
