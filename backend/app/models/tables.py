"""Database tables.

User    = someone with an account (owns links + a bio page)
Link    = one short link: short_code -> destination
Click   = one visit to a short link (for charts)
Profile = public bio page per user (/bio/:username)
"""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _now() -> datetime:
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    avatar: Mapped[str] = mapped_column(String(500), default="")
    is_verified: Mapped[int] = mapped_column(Integer, default=0)  # 0/1 (simulation)
    is_admin: Mapped[int] = mapped_column(Integer, default=0)
    reset_token: Mapped[str] = mapped_column(String(100), default="")
    reset_expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    links: Mapped[list["Link"]] = relationship("Link", back_populates="owner", cascade="all, delete")
    profile: Mapped["Profile | None"] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete")


class Link(Base):
    __tablename__ = "links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    destination: Mapped[str] = mapped_column(Text)  # the long URL
    short_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)  # indexed for fast redirect
    title: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)

    owner: Mapped[User] = relationship("User", back_populates="links")
    clicks: Mapped[list["Click"]] = relationship("Click", back_populates="link", cascade="all, delete")


class Click(Base):
    __tablename__ = "clicks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    link_id: Mapped[int] = mapped_column(ForeignKey("links.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)
    referrer: Mapped[str] = mapped_column(String(500), default="")
    device: Mapped[str] = mapped_column(String(20), default="Desktop")  # Mobile/Desktop/Tablet
    ip_hash: Mapped[str] = mapped_column(String(64), default="")

    link: Mapped[Link] = relationship("Link", back_populates="clicks")


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)  # /bio/:username
    display_name: Mapped[str] = mapped_column(String(100), default="")
    bio: Mapped[str] = mapped_column(String(500), default="")
    avatar: Mapped[str] = mapped_column(String(500), default="")
    theme: Mapped[str] = mapped_column(String(30), default="light")  # light | dark | gradient
    social_links: Mapped[list] = mapped_column(JSON, default=list)  # [{label, url}]

    user: Mapped[User] = relationship("User", back_populates="profile")
