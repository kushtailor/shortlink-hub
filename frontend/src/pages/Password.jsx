import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Alert, Button, Field, Input } from "../components/ui";

function Shell({ title, sub, children }) {
  return (
    <div className="auth-wrap fade-in">
      <div className="auth-panel">
        <Link to="/login" className="brand" style={{ marginBottom: 18 }}>
          <span className="brand-mark">⌁</span>
          <span>Short-Link&nbsp;Hub</span>
        </Link>
        <h1 style={{ fontSize: 26, margin: "6px 0" }}>{title}</h1>
        <p className="small muted" style={{ margin: "0 0 20px" }}>{sub}</p>
        {children}
      </div>
      <div className="auth-side">
        <span className="eyebrow" style={{ background: "rgba(255,255,255,.16)", color: "#fff", border: "1px solid rgba(255,255,255,.25)", alignSelf: "flex-start" }}>
          Account recovery
        </span>
        <h2>Reset links are simulated — no SMTP needed.</h2>
        <p>Generate a token, paste it on the reset page, choose a new password. The flow mirrors a real email-based reset.</p>
        <div className="auth-checks">
          <div className="auth-check"><span>✉️</span><span><b>Step 1</b> — enter your email, get a one-time reset token.</span></div>
          <div className="auth-check"><span>🔑</span><span><b>Step 2</b> — paste the token + new password on the reset page.</span></div>
        </div>
      </div>
    </div>
  );
}

export function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const r = await api.forgot({ email });
      setMsg(r.reset_token
        ? { tone: "success", text: `Token: ${r.reset_token}` }
        : { tone: "info", text: r.message });
    } catch (err) {
      setMsg({ tone: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Forgot password" sub="We’ll generate a simulated reset token for your account.">
      <form onSubmit={submit} style={{ display: "grid", gap: 13 }}>
        <Field label="Account email">
          <Input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button loading={busy} size="lg">Generate reset token</Button>
        {msg && (
          <Alert tone={msg.tone}>
            <span style={{ wordBreak: "break-all" }}>{msg.text}</span>
            <br />Then go to <Link to="/reset"><b>Reset page →</b></Link>
          </Alert>
        )}
        <p className="small muted" style={{ margin: 0 }}><Link to="/login">← Back to login</Link></p>
      </form>
    </Shell>
  );
}

export function Reset() {
  const [form, setForm] = useState({ token: "", new_password: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.token.trim() || form.new_password.length < 6) {
      setMsg({ tone: "error", text: "Paste the token and choose a password (min 6 chars)." });
      return;
    }
    setBusy(true);
    try {
      const r = await api.reset(form);
      setMsg({ tone: "success", text: `${r.message} — now log in.` });
    } catch (err) {
      setMsg({ tone: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Reset password" sub="Paste the token from the forgot-password step.">
      <form onSubmit={submit} style={{ display: "grid", gap: 13 }}>
        <Field label="Reset token">
          <Input placeholder="Paste reset token…" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
        </Field>
        <Field label="New password" hint="Minimum 6 characters.">
          <Input placeholder="New password" type="password" autoComplete="new-password"
            value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} />
        </Field>
        <Button loading={busy} size="lg">Reset password</Button>
        {msg && (
          <Alert tone={msg.tone}>
            {msg.text} {msg.tone === "success" && <Link to="/login"><b>Log in →</b></Link>}
          </Alert>
        )}
        <p className="small muted" style={{ margin: 0 }}><Link to="/forgot">← Get a token first</Link></p>
      </form>
    </Shell>
  );
}
