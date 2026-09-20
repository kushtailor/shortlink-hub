/** Owner's bio editor: GET+PUT /api/v1/bio/me, with live preview. */
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Alert, Badge, Button, Card, Field, Input, Page, Select, Spinner, Textarea } from "../components/ui";
import { PublicBioPreview } from "./PublicBio";

const THEMES = [
  { id: "light", label: "Minimal Light", swatch: "linear-gradient(135deg,#fff,#eef2ff)" },
  { id: "dark", label: "Dark Slate", swatch: "linear-gradient(135deg,#0f172a,#334155)" },
  { id: "gradient", label: "Gradient", swatch: "linear-gradient(135deg,#667eea,#764ba2)" },
];

export function BioEditor() {
  const [bio, setBio] = useState({ username: "", display_name: "", bio: "", avatar: "", theme: "light", social_links: [] });
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.myBio()
      .then((b) => setBio({ theme: "light", social_links: [], ...b }))
      .catch((e) => setMsg({ tone: "error", text: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setMsg(null);
    if (!bio.username.trim()) {
      setMsg({ tone: "error", text: "Username is required — it becomes your /bio/:username URL." });
      return;
    }
    setSaving(true);
    try {
      const r = await api.updateBio({ ...bio, username: bio.username.trim() });
      setBio({ theme: "light", social_links: [], ...r });
      setMsg({ tone: "success", text: `Saved! Your public page is #/bio/${r.username}` });
    } catch (e) {
      setMsg({ tone: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    if (!newLink.label.trim() || !newLink.url.trim()) {
      setMsg({ tone: "error", text: "Give the link a label and a https:// URL." });
      return;
    }
    if (!/^https?:\/\//i.test(newLink.url.trim())) {
      setMsg({ tone: "error", text: "Link URL must start with http:// or https://." });
      return;
    }
    setBio({ ...bio, social_links: [...(bio.social_links || []), { label: newLink.label.trim(), url: newLink.url.trim() }] });
    setNewLink({ label: "", url: "" });
  };

  if (loading) {
    return (
      <Page eyebrow="Bio hub" title="Bio Hub editor" sub="Loading your page…">
        <div style={{ display: "grid", placeItems: "center", padding: 60 }}><Spinner size={26} /></div>
      </Page>
    );
  }

  return (
    <Page
      eyebrow="Bio hub"
      title="Bio Hub editor"
      sub="Your Linktree-style page. Anyone can open it without login — edits go live instantly."
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => { window.location.hash = `#/bio/${bio.username}`; }} disabled={!bio.username}>
            Preview public page →
          </Button>
          <Button size="sm" loading={saving} onClick={save}>Save bio page</Button>
        </>
      }
    >
      <div className="bio-layout">
        <div style={{ display: "grid", gap: 12 }}>
          <Card title="Profile" sub="This header appears at the top of your public page.">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Username" hint={`Page URL will be #/bio/${bio.username || "…"}`}>
                <Input value={bio.username || ""} placeholder="e.g. aarav"
                  onChange={(e) => setBio({ ...bio, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Display name">
                  <Input placeholder="Aarav Sharma" value={bio.display_name || ""}
                    onChange={(e) => setBio({ ...bio, display_name: e.target.value })} />
                </Field>
                <Field label="Avatar URL" hint="Square image works best.">
                  <Input placeholder="https://…" value={bio.avatar || ""}
                    onChange={(e) => setBio({ ...bio, avatar: e.target.value })} />
                </Field>
              </div>
              <Field label="Bio" hint="One or two lines.">
                <Textarea placeholder="Creator · photography · newsletter ↓" value={bio.bio || ""}
                  onChange={(e) => setBio({ ...bio, bio: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card
            title={`Social links (${(bio.social_links || []).length})`}
            sub="Buttons shown on your public page, in order."
          >
            <div style={{ display: "grid", gap: 8 }}>
              {(bio.social_links || []).length === 0 && (
                <p className="small muted" style={{ margin: 0 }}>No links yet — add your first one below.</p>
              )}
              {(bio.social_links || []).map((s, i) => (
                <div key={i} className="bio-link-row">
                  <span style={{
                    width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center",
                    background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 800, fontSize: 12,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b>{s.label}</b>
                    <span className="small muted" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.url}</span>
                  </span>
                  <button
                    onClick={() => setBio({ ...bio, social_links: bio.social_links.filter((_, j) => j !== i) })}
                    style={{ border: "1px solid var(--border)", background: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 8, marginTop: 6 }}>
                <Input placeholder="Label e.g. GitHub" value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })} />
                <Input placeholder="https://…" value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} />
                <Button variant="secondary" onClick={addLink}>Add</Button>
              </div>
            </div>
          </Card>

          <Card title="Theme" sub="Preview updates live on the right.">
            <div className="theme-pick">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setBio({ ...bio, theme: t.id })}
                  className={`theme-opt${bio.theme === t.id ? " active" : ""}`}
                >
                  <span style={{ display: "block", height: 44, borderRadius: 9, background: t.swatch, marginBottom: 8, border: "1px solid var(--border)" }} />
                  {t.label}
                </button>
              ))}
            </div>
            {/* Keep a native select for keyboard / screen-reader users */}
            <div style={{ marginTop: 10, maxWidth: 260 }}>
              <Select value={bio.theme} onChange={(e) => setBio({ ...bio, theme: e.target.value })} aria-label="Theme">
                <option value="light">Minimal Light</option>
                <option value="dark">Dark Slate</option>
                <option value="gradient">Gradient</option>
              </Select>
            </div>
          </Card>

          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <div>
            <Button loading={saving} onClick={save} size="lg">Save bio page</Button>
          </div>
        </div>

        <div className="bio-preview-phone">
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <b style={{ fontSize: 13 }}>Live preview</b>
            <Badge tone="gray">auto-updates</Badge>
          </div>
          <PublicBioPreview bio={bio} />
        </div>
      </div>
    </Page>
  );
}
