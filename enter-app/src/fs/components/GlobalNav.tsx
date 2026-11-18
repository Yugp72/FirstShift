import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size, borderRadius: size * 0.27 }} aria-hidden="true">
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </span>
  );
}

/** Thin, frosted global navigation. */
export function GlobalNav() {
  const { account, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="gnav">
      <a className="skip" href="#main">Skip to content</a>
      <nav className="gnav-inner" aria-label="Global">
        <Link to="/" className="brand"><BrandMark />FirstShift</Link>
        <div className="links">
          <NavLink to="/jobs">Jobs</NavLink>
          <NavLink to="/learn">Training</NavLink>
          <NavLink to="/manager" className="hide-sm">For managers</NavLink>
        </div>
        <div className="acct">
          {account?.role === "applicant" && <NavLink to="/me" className="hide-sm">My applications</NavLink>}
          {account ? (
            <>
              <span className="avatar" title={account.name} aria-label={`Signed in as ${account.name}`}>{account.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}</span>
              <button type="button" className="linklike" onClick={async () => { await logout(); nav("/"); }}>Sign out</button>
            </>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}
