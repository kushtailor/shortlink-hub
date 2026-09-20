import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

/** Holds "who is logged in" for the whole app. Calls GET /me once on load. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (d) => { const u = await api.login(d); setUser(u); return u; };
  const signup = async (d) => { const u = await api.signup(d); setUser(u); return u; };
  const logout = async () => { await api.logout(); setUser(null); };

  return <Ctx.Provider value={{ user, setUser, loading, login, signup, logout }}>{children}</Ctx.Provider>;
}
