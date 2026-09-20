/**
 * Owned UI primitives (shadcn-style, zero deps):
 * Button / Input / Textarea / Select / Card / Badge / Page /
 * Field / Alert / Spinner / EmptyState / Avatar / Modal / Stat.
 * Backwards compatible with existing pages.
 */
import { useState } from "react";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ---------------- Button ---------------- */
const btnBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid transparent",
  cursor: "pointer",
  fontWeight: 650,
  fontSize: 14,
  lineHeight: 1,
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  transition: "background .15s ease, box-shadow .15s ease, transform .06s ease, border-color .15s ease",
};

const btnVariants = {
  primary: {
    background: "linear-gradient(180deg,#6366f1,#4f46e5)",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(79,70,229,.35), inset 0 1px 0 rgba(255,255,255,.2)",
  },
  secondary: {
    background: "#fff",
    color: "#1e293b",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-xs)",
  },
  ghost: { background: "transparent", color: "var(--text-2)", border: "1px solid transparent" },
  danger: { background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid #fecaca" },
  dark: { background: "#0f172a", color: "#fff", boxShadow: "var(--shadow-sm)" },
};

const btnSizes = {
  sm: { padding: "7px 11px", fontSize: 13, borderRadius: 9 },
  md: {},
  lg: { padding: "12px 20px", fontSize: 15, borderRadius: 12 },
};

export function Button({
  children, variant = "primary", size = "md", loading = false, ...props
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const hoverStyle =
    !hover || props.disabled || loading ? {} :
    variant === "primary" ? { filter: "brightness(1.06)" } :
    variant === "secondary" ? { background: "#f8fafc", border: "1px solid var(--border-strong)" } :
    variant === "ghost" ? { background: "var(--bg-subtle)" } :
    variant === "dark" ? { background: "#1e293b" } : { background: "#fee2e2" };

  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        ...btnBase,
        ...btnVariants[variant],
        ...btnSizes[size],
        ...(active ? { transform: "translateY(1px)" } : {}),
        ...hoverStyle,
        opacity: props.disabled || loading ? 0.6 : 1,
        cursor: props.disabled || loading ? "not-allowed" : "pointer",
        ...props.style,
      }}
    >
      {loading && <Spinner size={14} light={variant === "primary" || variant === "dark"} />}
      {children}
    </button>
  );
}

/* ---------------- Fields ---------------- */
const inputStyle = (focus, error) => ({
  width: "100%",
  padding: "10px 13px",
  borderRadius: 10,
  border: error
    ? "1px solid #fca5a5"
    : focus
      ? "1px solid var(--primary)"
      : "1px solid var(--border)",
  boxShadow: error
    ? "0 0 0 3px rgba(220,38,38,.1)"
    : focus
      ? "0 0 0 3px var(--primary-ring)"
      : "none",
  outline: "none",
  fontSize: 14,
  fontFamily: "inherit",
  background: "#fff",
  color: "var(--text)",
  transition: "border .15s ease, box-shadow .15s ease",
});

export function Field({ label, hint, error, children }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 650, color: "var(--text-2)" }}>
      {label && <span>{label}</span>}
      {children}
      {hint && !error && <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 12.5 }}>{hint}</span>}
      {error && <span style={{ fontWeight: 600, color: "var(--danger)", fontSize: 12.5 }}>{error}</span>}
    </label>
  );
}

export function Input({ error, style, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => { setFocus(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocus(false); props.onBlur?.(e); }}
      style={{ ...inputStyle(focus, error), ...style }}
    />
  );
}

export function Textarea({ error, style, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{ ...inputStyle(focus, error), minHeight: 84, resize: "vertical", lineHeight: 1.55, ...style }}
    />
  );
}

export function Select({ error, style, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <select
      {...props}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{ ...inputStyle(focus, error), appearance: "auto", ...style }}
    />
  );
}

/* ---------------- Card / Badge / Page ---------------- */
export function Card({ children, style, title, sub, action, hoverable = false }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 20,
        background: "var(--surface)",
        boxShadow: hover && hoverable ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: hover && hoverable ? "translateY(-1px)" : "none",
        transition: "box-shadow .16s ease, transform .16s ease",
        ...style,
      }}
    >
      {(title || action) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: sub ? 4 : 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15.5 }}>{title}</h3>
            {sub && <p className="small muted" style={{ margin: "4px 0 10px" }}>{sub}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

const badgeTones = {
  indigo: { background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid #e0e7ff" },
  green: { background: "var(--success-soft)", color: "var(--success)", border: "1px solid #a7f3d0" },
  amber: { background: "var(--warning-soft)", color: "#b45309", border: "1px solid #fde68a" },
  red: { background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid #fecaca" },
  gray: { background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" },
};

export function Badge({ children, tone = "indigo", style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 12, fontWeight: 750, whiteSpace: "nowrap",
      ...badgeTones[tone], ...style,
    }}>
      {children}
    </span>
  );
}

export function Page({ title, sub, eyebrow, actions, children, narrow = false }) {
  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 56 }}>
      {(eyebrow || title) && (
        <div className="page-hero">
          <div style={{ maxWidth: narrow ? 640 : 720 }}>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h1 style={{ fontSize: 30 }}>{title}</h1>}
            {sub && <p className="muted" style={{ margin: "8px 0 0", fontSize: 14.5 }}>{sub}</p>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
        </div>
      )}
      <div className="fade-in">{children}</div>
    </div>
  );
}

/* ---------------- Feedback ---------------- */
export function Alert({ tone = "info", children, style }) {
  const tones = {
    info: { background: "var(--primary-soft)", color: "#3730a3", border: "1px solid #e0e7ff" },
    success: { background: "var(--success-soft)", color: "#065f46", border: "1px solid #a7f3d0" },
    error: { background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid #fecaca" },
    warning: { background: "var(--warning-soft)", color: "#92400e", border: "1px solid #fde68a" },
  };
  return (
    <div style={{
      fontSize: 13.5, padding: "11px 13px", borderRadius: 11,
      lineHeight: 1.55, wordBreak: "break-word", ...tones[tone], ...style,
    }}>
      {children}
    </div>
  );
}

export function Spinner({ size = 18, light = false }) {
  return (
    <span
      aria-label="loading"
      style={{
        width: size, height: size, borderRadius: "50%", display: "inline-block",
        border: `2px solid ${light ? "rgba(255,255,255,.35)" : "var(--border-strong)"}`,
        borderTopColor: light ? "#fff" : "var(--primary)",
        animation: "spin .7s linear infinite",
      }}
    />
  );
}

export function EmptyState({ icon = "✦", title, sub, action }) {
  return (
    <div style={{
      textAlign: "center", padding: "34px 20px",
      border: "1.5px dashed var(--border-strong)", borderRadius: 14, background: "var(--surface-2)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14, margin: "0 auto 12px",
        display: "grid", placeItems: "center", fontSize: 20,
        background: "#fff", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)",
      }}>
        {icon}
      </div>
      <div style={{ fontWeight: 750, fontSize: 15 }}>{title}</div>
      {sub && <div className="small muted" style={{ marginTop: 6, maxWidth: 420, marginInline: "auto" }}>{sub}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function Avatar({ name = "?", size = 26, style }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.45, ...style }}>
      {initial}
    </span>
  );
}

export function Modal({ open, onClose, title, children, width = 440 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 90,
        background: "rgba(15,23,42,.45)", backdropFilter: "blur(3px)",
        display: "grid", placeItems: "center", padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{ width: "100%", maxWidth: width, background: "#fff", borderRadius: 18, padding: 22, boxShadow: "var(--shadow-lg)" }}
      >
        {title && <h3 style={{ margin: "0 0 12px", fontSize: 17 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

/* spin keyframes injected once */
if (typeof document !== "undefined" && !document.getElementById("ui-spin")) {
  const s = document.createElement("style");
  s.id = "ui-spin";
  s.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
  document.head.appendChild(s);
}
