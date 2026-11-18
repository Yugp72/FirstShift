import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, type Account } from "./api";

interface AuthState {
  account: Account | null;
  loading: boolean;
  setAccount: (a: Account | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState>({ account: null, loading: true, setAccount: () => undefined, refresh: async () => undefined, logout: async () => undefined });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setAccount((await api.me()).account); } catch { setAccount(null); }
    setLoading(false);
  }, []);
  const logout = useCallback(async () => { await api.logout().catch(() => undefined); setAccount(null); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return <Ctx.Provider value={{ account, loading, setAccount, refresh, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

/** Gate a route by role. Sends signed-out visitors to sign in, then back. */
export function RequireRole({ role, children }: { role: "manager" | "applicant" | "any"; children: ReactNode }) {
  const { account, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="auth-wrap"><p className="muted">Loading…</p></div>;
  if (!account) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}${role === "manager" ? "&as=manager" : ""}`} replace />;
  if (role !== "any" && account.role !== role) {
    return (
      <div className="auth-wrap">
        <div className="auth center">
          <h1>{role === "manager" ? "Managers only" : "Applicants only"}</h1>
          <p className="sub">You're signed in as {account.name} ({account.role}). {role === "manager" ? "Sign in with a manager account to see the hiring pipeline." : "Sign in with an applicant account to apply."}</p>
          <a className="btn btn-primary" href={`/login?next=${encodeURIComponent(loc.pathname)}${role === "manager" ? "&as=manager" : ""}`}>Switch account</a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
