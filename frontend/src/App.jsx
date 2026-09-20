import { HashRouter, Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login, Signup } from "./pages/Auth";
import { Forgot, Reset } from "./pages/Password";
import { Dashboard } from "./pages/Dashboard";
import { BioEditor } from "./pages/BioEditor";
import { PublicBio } from "./pages/PublicBio";
import { Avatar, Spinner } from "./components/ui";

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", padding: "80px 20px", gap: 12 }}>
        <Spinner size={26} />
        <p className="small muted" style={{ margin: 0 }}>Loading your workspace…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const linkCls = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to={user ? "/" : "/login"} className="brand" aria-label="Short-Link Hub home">
          <span className="brand-mark">⌁</span>
          <span>Short-Link&nbsp;Hub</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {user ? (
            <>
              <NavLink to="/" end className={linkCls}>Dashboard</NavLink>
              <NavLink to="/bio" className={linkCls}>Bio editor</NavLink>
              {user?.username && (
                <NavLink to={`/bio/${user.username}`} className={linkCls}>My public page</NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkCls}>Login</NavLink>
              <NavLink to="/signup" className={linkCls}>Sign up</NavLink>
            </>
          )}
        </nav>

        <div className="topbar-spacer" />

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="user-chip" title={user.email || user.name}>
              <Avatar name={user.name || user.email} size={26} />
              <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name || user.email}
              </span>
            </span>
            <button
              onClick={async () => { await logout(); nav("/login"); }}
              style={{
                border: "1px solid var(--border)", background: "#fff", borderRadius: 9,
                padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/signup"
            style={{
              background: "linear-gradient(180deg,#6366f1,#4f46e5)", color: "#fff",
              padding: "9px 15px", borderRadius: 10, fontSize: 13.5, fontWeight: 750,
              textDecoration: "none", boxShadow: "0 2px 8px rgba(79,70,229,.35)",
            }}
          >
            Get started →
          </Link>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span><b style={{ color: "var(--text)" }}>Short-Link Hub</b> · Bitly + Linktree hybrid</span>
        <span>JWT cookies · salted click hashes · rate-limited redirects</span>
      </div>
    </footer>
  );
}

function NotFound() {
  return (
    <div className="container" style={{ padding: "70px 20px", textAlign: "center" }}>
      <h1 style={{ fontSize: 34 }}>404</h1>
      <p className="muted">That page doesn’t exist.</p>
      <Link to="/">← Back to dashboard</Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Nav />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/bio/:username" element={<PublicBio />} />
            <Route path="/" element={<Guard><Dashboard /></Guard>} />
            <Route path="/bio" element={<Guard><BioEditor /></Guard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </HashRouter>
    </AuthProvider>
  );
}
