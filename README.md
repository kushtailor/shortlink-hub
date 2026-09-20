# Short-Link & Bio-Link Hub 

A Bitly + Linktree hybrid: create branded short links with vanity slugs, track clicks
(referrer, device, hashed IP), view dashboard charts, and run a public Link-in-Bio page.
Built with **Python (FastAPI) + React (Vite)**.

## Why this project 

Short links are a classic phishing vector, so this project is full of real security work:
- **JWT pair auth** (15-min access + 7-day refresh in `httpOnly` cookies, rotation)
- **URL validation** (only `http/https`, blocks `javascript:`/`data:`/`file:` before *and* after normalization)
- **Rate limiting** (`slowapi`: 10 link-creates/min, 60 redirects/min per IP)
- **Privacy-preserving analytics** (IP stored as salted SHA-256 hash, never raw)
- **Collision handling** (409 on duplicate vanity slug, `secrets`-based random codes)

## Tech stack

| Layer | Choice |
|---|---|
| Backend | FastAPI, SQLAlchemy, SQLite (dev, zero setup) / Postgres-ready, slowapi, PyJWT, bcrypt |
| Frontend | React + Vite + react-router-dom, `qrcode.react` for QR, owned coss.com/ui-style primitives (`src/components/ui.jsx`) |
| Auth | httpOnly `access_token` + `refresh_token` cookies, `credentials: "include"` |

## Run locally (2 terminals)

**1. Backend** (http://localhost:8000, docs at `/docs`):
```bash
cd shortlink-hub/backend
cp .env.example .env          # then edit SECRET_KEY / IP_HASH_SALT
uv venv .venv 2>/dev/null; export PATH="$HOME/.local/bin:$PATH"
uv pip install --python .venv/bin/python -q fastapi "uvicorn[standard]" sqlalchemy "pydantic>=2" pydantic-settings pyjwt bcrypt python-multipart slowapi email-validator httpx
.venv/bin/python seed.py      # creates demo users (password: password123)
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

**2. Frontend** (http://localhost:5173):
```bash
cd shortlink-hub/frontend
cp .env.example .env   # VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Demo logins after seeding: `aarav@test.com` / `diya@test.com` / `kabir@test.com`, password `password123`.

## How frontend and backend are connected (read this!)

Only **one file** talks to the backend: `frontend/src/lib/api.js`.
Every page calls helpers from there:

| What you click | Frontend code | API call | Backend file:table |
|---|---|---|---|
| Sign up / Login | `pages/Auth.jsx` → `api.signup/login` | `POST /api/v1/auth/signup`, `/login` (sets cookies) | `routers/auth.py` : `users` |
| Verify email (sim) | Dashboard button → `api.verify()` | `POST /api/v1/auth/verify-sim` | `routers/auth.py` |
| Forgot / Reset | `pages/Password.jsx` | `POST /api/v1/auth/forgot`, `/reset` | `routers/auth.py` |
| Create link | Dashboard form → `api.createLink` | `POST /api/v1/links` | `routers/links.py` : `links` |
| Search / pages | Dashboard search → `api.listLinks(search,page)` | `GET /api/v1/links?search=&page=` | `routers/links.py` |
| Open short link | `<a href=short_url>` (points at backend) | `GET /r/:code` → **302 redirect** + background click log | `routers/redirect.py` : `links`+`clicks` |
| Charts | Dashboard → `api.summary()` | `GET /api/v1/analytics/summary` | `routers/analytics.py` : `clicks` |
| Edit bio | `BioEditor.jsx` → `api.updateBio` | `PUT /api/v1/bio/me` | `routers/bio.py` : `profiles` |
| View bio | `#/bio/:username` → `api.publicBio` (no login) | `GET /api/v1/bio/:username` | `routers/bio.py` |

Open DevTools → Network tab while clicking: each button = one request above, cookies sent automatically.

## Key flows

**Login:** `POST /login` → server sets 2 cookies → app calls `GET /me` → `AuthContext` stores user → protected routes unlock. Access expires in 15 min; `api.js` auto-calls `/refresh` once and retries.

**Shorten:** form → `POST /links` → backend rejects bad URLs (422) / duplicate slugs (409) / too-fast abuse (429) → saves row → returns `short_url` like `http://localhost:8000/r/aB12xZ`.

**Visit:** browser `GET /r/aB12xZ` → DB lookup by indexed `short_code` → instant `302` → click saved in background (time, referrer, device, `ip_hash`).

## API docs

- Interactive: run backend → http://localhost:8000/docs
- Summary: see `docs/API.md`. Public feed: `GET /api/v1/feed`.

## Assumptions / limitations (honest)

- Email verification + password-reset emails are **simulated** (token returned in API response) — no SMTP wired.
- SQLite by default (fine for assessment); switch `DATABASE_URL` to Postgres for production.
- No malware/anti-phishing URL scanning — listed as future work.
- UI primitives are hand-made in coss.com/ui spirit (Button/Input/Card/Badge), not the actual `coss.com/ui` package, to keep setup light.

## Project structure

```
shortlink-hub/
  backend/app/{core,db,models,schemas,routers,services}  # FastAPI
  backend/seed.py
  frontend/src/{lib/api.js, context, components/ui.jsx, pages}  # React
  docs/API.md
```
