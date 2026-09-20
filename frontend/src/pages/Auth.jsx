import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, Field, Input } from "../components/ui";

function Shell({ title, children }) {
  return (
    <div className="fade-in" style={{ maxWidth: 480, margin: "36px auto 56px", padding: "0 20px" }}>
      <div className="auth-panel" style={{ borderRadius: "var(--radius-lg)" }}>
        <Link to="/login" className="brand" style={{ marginBottom: 18 }}>
          <span className="brand-mark">⌁</span>
          <span>Short-Link&nbsp;Hub</span>
        </Link>
        <h1 style={{ fontSize: 26, margin: "6px 0 20px" }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <Input {...props} type={show ? "text" : "password"} style={{ paddingRight: 64, ...props.style }} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: "absolute", right: 6, top: 6, bottom: 6, border: "none",
          background: "var(--bg-subtle)", borderRadius: 8, padding: "0 10px",
          fontSize: 12, fontWeight: 750, cursor: "pointer", color: "var(--text-2)",
        }}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.email.trim() || !form.password) { setErr("Enter your email and password."); return; }
    setBusy(true);
    try { await login(form); nav("/"); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Welcome back">
      <form onSubmit={submit} style={{ display: "grid", gap: 13 }}>
        <Field label="Email">
          <Input placeholder="you@example.com" type="email" autoComplete="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <PasswordInput placeholder="••••••••" autoComplete="current-password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        {err && <Alert tone="error">{err}</Alert>}
        <Button type="submit" loading={busy} size="lg">Log in →</Button>
        <p className="small muted" style={{ margin: 0 }}>
          No account? <Link to="/signup"><b>Sign up</b></Link> · <Link to="/forgot">Forgot password?</Link>
        </p>
      </form>
    </Shell>
  );
}

export function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (!form.name.trim() || !form.email.trim()) { setErr("Name and email are required."); return; }
    setBusy(true);
    try { await signup(form); nav("/"); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Create your account">
      <form onSubmit={submit} style={{ display: "grid", gap: 13 }}>
        <Field label="Name">
          <Input placeholder="Aarav Sharma" autoComplete="name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input placeholder="you@example.com" type="email" autoComplete="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" hint="Minimum 6 characters.">
          <PasswordInput placeholder="Choose a strong password" autoComplete="new-password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        {err && <Alert tone="error">{err}</Alert>}
        <Button type="submit" loading={busy} size="lg">Create account →</Button>
        <p className="small muted" style={{ margin: 0 }}><Link to="/login">← Back to login</Link></p>
      </form>
    </Shell>
  );
}
