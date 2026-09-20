/**
 * THE ONLY FILE that talks to the backend. Everything else calls these helpers.
 *
 * How frontend <-> backend connect:
 *  1. Browser sends fetch() to http://localhost:8000/api/...
 *  2. `credentials: "include"` means cookies (access_token) go along automatically.
 *  3. If access token expired (401), we call /auth/refresh once, then retry.
 */
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (res.status === 401 && !path.includes("/auth/") && !options._retried) {
    // access token (15 min) may have expired -> try refresh (7 days), then retry once
    const r = await fetch(BASE + "/api/v1/auth/refresh", { method: "POST", credentials: "include" });
    if (r.ok) return req(path, { ...options, _retried: true });
  }
  if (!res.ok) {
    let msg = "Request failed";
    try { msg = (await res.json()).detail || msg; } catch { /* keep default */ }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // auth
  signup: (d) => req("/api/v1/auth/signup", { method: "POST", body: JSON.stringify(d) }),
  login: (d) => req("/api/v1/auth/login", { method: "POST", body: JSON.stringify(d) }),
  logout: () => req("/api/v1/auth/logout", { method: "POST" }),
  me: () => req("/api/v1/auth/me"),
  verify: () => req("/api/v1/auth/verify-sim", { method: "POST" }),
  forgot: (d) => req("/api/v1/auth/forgot", { method: "POST", body: JSON.stringify(d) }),
  reset: (d) => req("/api/v1/auth/reset", { method: "POST", body: JSON.stringify(d) }),
  // links
  createLink: (d) => req("/api/v1/links", { method: "POST", body: JSON.stringify(d) }),
  listLinks: (search = "", page = 1) =>
    req(`/api/v1/links?search=${encodeURIComponent(search)}&page=${page}`),
  deleteLink: (id) => req(`/api/v1/links/${id}`, { method: "DELETE" }),
  // analytics + bio
  summary: () => req("/api/v1/analytics/summary"),
  myBio: () => req("/api/v1/bio/me"),
  updateBio: (d) => req("/api/v1/bio/me", { method: "PUT", body: JSON.stringify(d) }),
  publicBio: (username) => req(`/api/v1/bio/${username}`),
};

export const API_BASE = BASE;
