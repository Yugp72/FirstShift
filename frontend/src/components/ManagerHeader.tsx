import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { DemoOnly } from "./DemoOnly";

export function ManagerHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="mgr-head">
      <a className="skip" href="#main">Skip to content</a>
      <NavLink to="/" className="brand" aria-label="FirstShift home">
        <span className="brand-mark" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <span>FirstShift<small>Imperial Treasure Palo Alto</small></span>
      </NavLink>
      <nav className="mgr-nav" aria-label="Manager">
        <NavLink to="/manager" end>Pipeline</NavLink>
        <NavLink to="/manager/new">Post a job</NavLink>
      </nav>
      <div className="mgr-tools">
        {children}
        {/* [DEMO ONLY] location switcher */}
        <DemoOnly className="btn btn-sm hide-sm" label="Switch location">Palo Alto ▾</DemoOnly>
        {/* [DEMO ONLY] manager account menu */}
        <DemoOnly className="avatar" label="Manager account">MG</DemoOnly>
      </div>
    </header>
  );
}
