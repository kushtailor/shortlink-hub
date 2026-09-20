/** Public bio page: GET /api/v1/bio/:username — NO login needed. */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Spinner } from "../components/ui";

const THEMES = {
  light: {
    page: "#f1f5f9", card: "#ffffff", text: "#0f172a", sub: "#64748b",
    btn: "linear-gradient(180deg,#6366f1,#4f46e5)", btnText: "#fff",
    ring: "rgba(79,70,229,.25)",
  },
  dark: {
    page: "#020617", card: "#0f172a", text: "#f8fafc", sub: "#94a3b8",
    btn: "linear-gradient(180deg,#334155,#0f172a)", btnText: "#f8fafc",
    ring: "rgba(148,163,184,.3)",
  },
  gradient: {
    page: "linear-gradient(135deg,#667eea 0%,#764ba2 60%,#4f46e5 100%)",
    card: "#ffffff", text: "#111827", sub: "#6b7280",
    btn: "linear-gradient(180deg,#111827,#1f2937)", btnText: "#fff",
    ring: "rgba(17,24,39,.25)",
  },
};

export function PublicBioPreview({ bio }) {
  const t = THEMES[bio?.theme] || THEMES.light;
  return (
    <div style={{ background: t.page, padding: 26, fontFamily: "inherit", minHeight: 420 }}>
      <div style={{
        maxWidth: 360, margin: "0 auto", background: t.card, color: t.text,
        borderRadius: 22, padding: "30px 24px 24px", textAlign: "center",
        boxShadow: "0 16px 40px rgba(15,23,42,.16)", border: "1px solid rgba(255,255,255,.4)",
      }}>
        {bio?.avatar
          ? <img src={bio.avatar} alt="" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: `3px solid ${t.card}`, boxShadow: `0 0 0 3px ${t.ring}` }} />
          : (
            <div style={{
              width: 88, height: 88, borderRadius: "50%", margin: "0 auto",
              display: "grid", placeItems: "center", fontSize: 32, fontWeight: 800, color: "#fff",
              background: "linear-gradient(135deg,#6366f1,#7c3aed)",
            }}>
              {(bio?.display_name || bio?.username || "?").charAt(0).toUpperCase()}
            </div>
          )}
        <h2 style={{ margin: "14px 0 2px", fontSize: 20, color: t.text }}>{bio?.display_name || (bio?.username ? `@${bio.username}` : "Your name")}</h2>
        <p style={{ margin: "0 0 4px", fontSize: 12.5, color: t.sub, fontWeight: 600 }}>@{bio?.username || "username"}</p>
        {bio?.bio && <p style={{ color: t.sub, fontSize: 13.5, margin: "8px 0 0", lineHeight: 1.55 }}>{bio.bio}</p>}
        <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
          {(bio?.social_links || []).length === 0 && (
            <p style={{ fontSize: 13, color: t.sub, border: "1.5px dashed currentColor", borderRadius: 12, padding: 12, opacity: 0.7, margin: 0 }}>
              Your links will appear here
            </p>
          )}
          {(bio?.social_links || []).map((s, i) => (
            <span key={i} style={{
              display: "block", padding: "13px 14px", borderRadius: 13, background: t.btn, color: t.btnText,
              fontWeight: 700, fontSize: 14, boxShadow: "0 4px 14px rgba(15,23,42,.18)",
            }}>
              {s.label}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: t.sub, margin: "18px 0 0", opacity: 0.85 }}>Made with ⌁ Short-Link Hub</p>
      </div>
    </div>
  );
}

export function PublicBio() {
  const { username } = useParams();
  const [bio, setBio] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setBio(null); setErr("");
    api.publicBio(username).then((b) => alive && setBio(b)).catch(() => alive && setErr("This bio page doesn’t exist (yet)."));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (err) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "70vh", padding: 24, textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 44 }}>🔍</div>
          <h1 style={{ fontSize: 24 }}>{err}</h1>
          <p className="muted small">Check the spelling, or claim this username in the Bio editor.</p>
          <Link to="/">← Back home</Link>
        </div>
      </div>
    );
  }

  if (!bio) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "70vh", gap: 12 }}>
        <Spinner size={28} />
        <p className="small muted">Loading @{username}…</p>
      </div>
    );
  }

  const t = THEMES[bio.theme] || THEMES.light;
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="fade-in" style={{ minHeight: "calc(100vh - 57px)", background: t.page, padding: "40px 20px 56px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button
            onClick={share}
            style={{
              border: "1px solid rgba(255,255,255,.5)", background: "rgba(255,255,255,.85)", backdropFilter: "blur(6px)",
              borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 750, cursor: "pointer", color: "#0f172a",
            }}
          >
            {copied ? "✓ Link copied" : "⧉ Share page"}
          </button>
        </div>

        <div style={{
          background: t.card, color: t.text, borderRadius: 26, padding: "36px 28px 26px",
          textAlign: "center", boxShadow: "0 20px 50px rgba(15,23,42,.2)",
          border: "1px solid rgba(255,255,255,.4)",
        }}>
          {bio.avatar
            ? <img src={bio.avatar} alt={bio.display_name || bio.username} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: `4px solid ${t.card}`, boxShadow: `0 0 0 3px ${t.ring}` }} />
            : (
              <div style={{
                width: 96, height: 96, borderRadius: "50%", margin: "0 auto",
                display: "grid", placeItems: "center", fontSize: 36, fontWeight: 800, color: "#fff",
                background: "linear-gradient(135deg,#6366f1,#7c3aed)", boxShadow: `0 0 0 3px ${t.ring}`,
              }}>
                {(bio.display_name || bio.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
          <h1 style={{ margin: "16px 0 2px", fontSize: 24, color: t.text }}>{bio.display_name || `@${bio.username}`}</h1>
          <p style={{ margin: 0, fontSize: 13, color: t.sub, fontWeight: 600 }}>@{bio.username}</p>
          {bio.bio && <p style={{ color: t.sub, fontSize: 14, margin: "10px 0 0", lineHeight: 1.6 }}>{bio.bio}</p>}

          <div style={{ display: "grid", gap: 11, marginTop: 22 }}>
            {(bio.social_links || []).map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px 16px", borderRadius: 14, background: t.btn, color: t.btnText,
                  textDecoration: "none", fontWeight: 750, fontSize: 14.5,
                  boxShadow: "0 6px 18px rgba(15,23,42,.2)",
                  transition: "transform .12s ease, filter .12s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.filter = "brightness(1.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "none"; }}
              >
                {s.label} <span aria-hidden>↗</span>
              </a>
            ))}
            {(!bio.social_links || bio.social_links.length === 0) && (
              <p style={{ fontSize: 13.5, color: t.sub }}>No links yet — check back soon.</p>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: bio.theme === "dark" ? "#94a3b8" : "rgba(15,23,42,.6)" }}>
          Made with <Link to="/" style={{ fontWeight: 800, color: "inherit" }}>⌁ Short-Link Hub</Link> · create your own bio page
        </p>
      </div>
    </div>
  );
}
