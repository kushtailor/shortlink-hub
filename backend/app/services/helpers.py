"""Small helpers: short-code generation + URL safety checks."""
import re
import secrets
from urllib.parse import urlparse

SLUG_RE = re.compile(r"^[A-Za-z0-9_-]{3,50}$")
CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"


def generate_code(length: int = 6) -> str:
    """Random 6-char code using secrets (not random = safer, unpredictable)."""
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(length))


def is_valid_slug(slug: str) -> bool:
    return bool(SLUG_RE.match(slug))


def normalize_url(url: str) -> str:
    """Add https:// if user forgot it, e.g. 'google.com' -> 'https://google.com'."""
    url = url.strip()
    if "://" not in url:
        url = "https://" + url
    return url


def raw_has_bad_scheme(raw: str) -> bool:
    """Check the USER'S original text for javascript:/data:/etc. before we add https://."""
    m = re.match(r"^([a-zA-Z][a-zA-Z0-9+.-]*)\s*:", raw.strip())
    return bool(m and m.group(1).lower() not in ("http", "https"))


def is_safe_url(url: str) -> tuple[bool, str]:
    """Only allow http/https. Blocks javascript:, data:, file: etc. (XSS/phishing safety)."""
    raw = url.strip()
    # Block dangerous schemes BEFORE we auto-add https://
    # e.g. "javascript:alert(1)" must be rejected, not turned into https://...
    m = re.match(r"^([a-zA-Z][a-zA-Z0-9+.-]*)\s*:", raw)
    if m and m.group(1).lower() not in ("http", "https"):
        return False, "Only http:// and https:// URLs are allowed"
    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Invalid URL"
    if parsed.scheme not in ("http", "https"):
        return False, "Only http:// and https:// URLs are allowed"
    if not parsed.netloc:
        return False, "Invalid URL"
    if len(url) > 2000:
        return False, "URL too long"
    return True, ""


def detect_device(user_agent: str) -> str:
    ua = (user_agent or "").lower()
    if "mobile" in ua or "iphone" in ua or "android" in ua:
        return "Mobile"
    if "tablet" in ua or "ipad" in ua:
        return "Tablet"
    return "Desktop"
