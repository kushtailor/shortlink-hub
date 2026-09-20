/**
 * Dashboard: create links, browse/search, QR + copy, analytics.
 * API mapping: POST/GET /api/v1/links, DELETE /links/:id, GET /analytics/summary.
 */
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Alert, Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, Page, Spinner,
} from "../components/ui";

const STATS = [
  { key: "total_links", label: "Total links", hint: "live in your workspace", accent: "#4f46e5", bg: "var(--primary-soft)" },
  { key: "total_clicks", label: "Total clicks", hint: "across all short URLs", accent: "#059669", bg: "var(--success-soft)" },
  { key: "device_kinds", label: "Device types", hint: "seen in click logs", accent: "#d97706", bg: "var(--warning-soft)" },
];

function StatCard({ label, hint, value, accent, bg, loading }) {
  return (
    <Card style={{ padding: 18, borderTop: `3px solid ${accent}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center",
          background: bg, color: accent, fontWeight: 800,
        }}>●</span>
        {loading && <Spinner size={15} />}
      </div>
      <div style={{
        fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 8,
        background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
      }}>
        {value}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{label}</div>
      <div className="small muted">{hint}</div>
    </Card>
  );
}

function LinkRow({ link, onDelete, deleting }) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.short_url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link.short_url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="link-card" style={{
      border: "1px solid var(--border)", borderRadius: 13, padding: "15px 16px",
      marginTop: 10, background: "#fff",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 230 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <b style={{ fontSize: 14.5 }}>{link.title || "(no title)"}</b>
            <Badge>{link.total_clicks} clicks</Badge>
            <span className="mono muted">/{(link.short_url || "").split("/").pop()}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <a href={link.short_url} target="_blank" rel="noreferrer"
              style={{ fontWeight: 700, fontSize: 13.5, wordBreak: "break-all" }}>
              {link.short_url}
            </a>
          </div>
          <div className="small muted" style={{
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 3,
          }} title={link.destination}>
            → {link.destination}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm" onClick={copy}>{copied ? "✓ Copied" : "Copy"}</Button>
          <Button variant="secondary" size="sm" onClick={() => setQrOpen(true)}>QR</Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={() => setConfirm(true)}>Delete</Button>
        </div>
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={link.title || "QR code"} width={340}>
        <div style={{ display: "grid", placeItems: "center", gap: 12, padding: "6px 0 2px" }}>
          <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 14, background: "#fff" }}>
            <QRCodeSVG value={link.short_url} size={180} />
          </div>
          <p className="mono small muted" style={{ margin: 0, wordBreak: "break-all", textAlign: "center" }}>{link.short_url}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={copy}>{copied ? "✓ Copied" : "Copy URL"}</Button>
            <Button variant="dark" size="sm" onClick={() => setQrOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Delete this link?" width={400}>
        <p className="small muted" style={{ margin: "0 0 16px" }}>
          <b style={{ color: "var(--text)" }}>{link.short_url}</b> will stop redirecting.
          Clicks already logged stay in analytics. This can’t be undone.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={() => { onDelete(); setConfirm(false); }}>
            Delete link
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [links, setLinks] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ destination: "", custom_slug: "", title: "" });
  const [msg, setMsg] = useState(null); // { tone, text }
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const pageSize = 10;

  const load = async (s = search, p = page) => {
    const r = await api.listLinks(s, p);
    setLinks(r.items || []);
    setTotal(r.total || 0);
    setStats(await api.summary());
  };

  useEffect(() => {
    setLoading(true);
    load(search, page).catch((e) => setMsg({ tone: "error", text: e.message })).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(search, 1).catch(() => {});
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const create = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.destination.trim()) {
      setMsg({ tone: "error", text: "Paste a long URL first — e.g. https://example.com/article" });
      return;
    }
    setCreating(true);
    try {
      const l = await api.createLink({
        destination: form.destination.trim(),
        custom_slug: form.custom_slug.trim() || undefined,
        title: form.title.trim() || undefined,
      });
      setMsg({ tone: "success", text: `Created ${l.short_url} — open it in a new tab, then watch the charts update.` });
      setForm({ destination: "", custom_slug: "", title: "" });
      await load("", 1);
      setSearch("");
      setPage(1);
    } catch (err) {
      setMsg({ tone: "error", text: friendlyError(err.message) });
    } finally {
      setCreating(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      await api.verify();
      setMsg({ tone: "success", text: "Email verified (simulated) — badge unlocked." });
    } catch (e) {
      setMsg({ tone: "error", text: e.message });
    } finally {
      setVerifying(false);
    }
  };

  const maxDay = Math.max(1, ...((stats?.over_time || []).map((d) => d.clicks)));
  const maxRef = Math.max(1, ...((stats?.top_referrers || []).map((r) => r.clicks)));
  const maxDev = Math.max(1, ...Object.values(stats?.by_device || {}));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statValues = useMemo(() => ({
    total_links: stats?.total_links ?? "…",
    total_clicks: stats?.total_clicks ?? "…",
    device_kinds: stats ? Object.keys(stats.by_device || {}).length : "…",
  }), [stats]);

  return (
    <Page
      eyebrow="Link studio"
      title={`Hi ${user?.name?.split(" ")[0] || "there"} — let’s shorten something`}
      sub="Create branded short links, share QR codes, and watch privacy-preserving click analytics update after each visit."
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => { window.location.hash = "#/bio"; }}>
            ✦ Edit Bio page
          </Button>
          <Button variant="secondary" size="sm" loading={verifying} onClick={verify}>
            Verify email (sim)
          </Button>
          <Button variant="ghost" size="sm" onClick={async () => { await logout(); window.location.hash = "#/login"; }}>
            Logout
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Avatar name={user?.name || user?.email} size={34} />
        <div className="small">
          <b>{user?.name}</b> <span className="muted">· {user?.email}</span>
        </div>
      </div>

      <Card
        title="Create short link"
        sub="Only http/https URLs are accepted. Dangerous schemes are blocked before and after normalization."
        action={<Badge tone="gray">10 / min rate limit</Badge>}
      >
        <form onSubmit={create} style={{ display: "grid", gap: 12 }}>
          <Field label="Destination URL" hint="Paste the long link. Try javascript:alert(1) to see it blocked.">
            <Input
              placeholder="https://example.com/super-long-article…"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              inputMode="url"
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Custom slug" hint="Optional · e.g. summer-sale">
              <Input
                placeholder="summer-sale"
                value={form.custom_slug}
                onChange={(e) => setForm({ ...form, custom_slug: e.target.value.replace(/\s+/g, "-") })}
              />
            </Field>
            <Field label="Title" hint="Optional · shown in list">
              <Input
                placeholder="Summer campaign"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
          </div>
          <div>
            <Button type="submit" loading={creating}>⚡ Shorten URL</Button>
          </div>
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        </form>
      </Card>

      <div className="stats-grid">
        {STATS.map((s) => (
          <StatCard key={s.key} label={s.label} hint={s.hint} value={statValues[s.key]} accent={s.accent} bg={s.bg} loading={loading && !stats} />
        ))}
      </div>

      <Card
        title="Clicks over time"
        sub={stats?.over_time?.length ? `${stats.over_time[0]?.date} → ${stats.over_time.at(-1)?.date}` : "Visits to any short URL appear here."}
        action={<Badge tone="green">{stats?.total_clicks ?? 0} total</Badge>}
      >
        {!stats ? (
          <div style={{ display: "flex", gap: 6, height: 140 }}>{Array.from({ length: 14 }).map((_, i) => <div key={i} className="skeleton" style={{ flex: 1 }} />)}</div>
        ) : (stats.over_time || []).length === 0 ? (
          <EmptyState icon="📈" title="No clicks yet" sub="Open one of your short URLs in a new tab, then come back — the chart updates on reload." />
        ) : (
          <div className="chart" role="img" aria-label="Clicks over time bar chart">
            {stats.over_time.map((d) => (
              <div
                key={d.date}
                className="chart-bar"
                title={`${d.date}: ${d.clicks} click${d.clicks === 1 ? "" : "s"}`}
                style={{ height: `${Math.max(4, (d.clicks / maxDay) * 100)}%` }}
              />
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Your links"
        sub={total ? `${total} total · page ${page} of ${totalPages}` : "Search, copy, QR, delete."}
        style={{ marginTop: 12 }}
        action={
          <div style={{ minWidth: 220 }}>
            <Input placeholder="🔍 Search links…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
      >
        {loading && links.length === 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 86 }} />)}
          </div>
        ) : links.length === 0 ? (
          <EmptyState
            icon="🔗"
            title={search ? `No links match “${search}”` : "No links yet"}
            sub={search ? "Try a different keyword, or clear the search." : "Create your first short link above — it takes 5 seconds."}
            action={search
              ? <Button variant="secondary" size="sm" onClick={() => setSearch("")}>Clear search</Button>
              : null}
          />
        ) : (
          links.map((l) => (
            <LinkRow
              key={l.id}
              link={l}
              deleting={deletingId === l.id}
              onDelete={async () => {
                setDeletingId(l.id);
                try { await api.deleteLink(l.id); await load(search, page); }
                catch (e) { setMsg({ tone: "error", text: e.message }); }
                finally { setDeletingId(null); }
              }}
            />
          ))
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</Button>
          <span className="small muted">Page {page} of {totalPages} · {total} total</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</Button>
        </div>
      </Card>

      {stats && (
        <div className="duo-grid">
          <Card title="Top referrers" sub="Where clicks came from.">
            {(stats.top_referrers || []).length === 0
              ? <p className="small muted" style={{ margin: 0 }}>No clicks yet — share a link to seed this.</p>
              : stats.top_referrers.map((r) => (
                <div key={r.referrer} className="bar-row">
                  <span style={{ minWidth: 110, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.referrer || "(direct)"}
                  </span>
                  <span className="bar-track"><span className="bar-fill" style={{ display: "block", width: `${(r.clicks / maxRef) * 100}%` }} /></span>
                  <b style={{ minWidth: 28, textAlign: "right" }}>{r.clicks}</b>
                </div>
              ))}
          </Card>
          <Card title="Devices" sub="Parsed from user-agent at redirect time.">
            {Object.keys(stats.by_device || {}).length === 0
              ? <p className="small muted" style={{ margin: 0 }}>No clicks yet.</p>
              : Object.entries(stats.by_device || {}).map(([k, v]) => (
                <div key={k} className="bar-row">
                  <span style={{ minWidth: 110, fontWeight: 650, textTransform: "capitalize" }}>{k}</span>
                  <span className="bar-track"><span className="bar-fill" style={{ display: "block", width: `${(v / maxDev) * 100}%`, background: "linear-gradient(90deg,#6ee7b7,#059669)" }} /></span>
                  <b style={{ minWidth: 28, textAlign: "right" }}>{v}</b>
                </div>
              ))}
          </Card>
        </div>
      )}
    </Page>
  );
}

function friendlyError(m) {
  if (!m) return "Something went wrong. Try again.";
  if (/422/i.test(m)) return m;
  return m;
}
