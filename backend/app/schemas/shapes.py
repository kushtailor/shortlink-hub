"""Request/response shapes (Pydantic = automatic validation).

If frontend sends bad data, FastAPI returns 422 automatically.
This is our first security gate: bad URLs, bad emails never reach the DB.
"""
from pydantic import BaseModel, EmailStr, field_validator


# ---------- Auth ----------
class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def _pwd_len(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("password must be at least 6 characters")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    new_password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar: str = ""
    is_verified: bool = False


# ---------- Links ----------
class LinkCreate(BaseModel):
    destination: str
    custom_slug: str = ""
    title: str = ""


class LinkOut(BaseModel):
    id: int
    destination: str
    short_code: str
    short_url: str = ""
    title: str
    total_clicks: int = 0
    created_at: str = ""


# ---------- Bio ----------
class SocialLink(BaseModel):
    label: str
    url: str


class BioUpdate(BaseModel):
    username: str = ""
    display_name: str = ""
    bio: str = ""
    avatar: str = ""
    theme: str = "light"
    social_links: list[SocialLink] = []
