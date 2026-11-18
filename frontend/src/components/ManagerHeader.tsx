import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { DemoOnly } from "./DemoOnly";

export function ManagerHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="mgr-head">
      <a className="skip" href="#main">Skip to content</a>
      <NavLink to="/" className="brand" aria-label="FirstShift home">
        <span className="brand-chop" aria-hidden="true">可</span>
        <span>
          <span className="brand-name">FIRSTSHIFT</span>
          <span className="brand-sub" style={{ display: "block" }}>The Pass · Imperial Treasure Palo Alto</span>
        </span>
      </NavLink>
      <nav className="mgr-nav" aria-label="Manager">
        <NavLink to="/manager" end>THE RAIL</NavLink>
        <NavLink to="/manager/new">ORDER IN</NavLink>
      </nav>
      <div className="mgr-tools">
        {children}
        {/* [DEMO ONLY] location switcher */}
        <DemoOnly label="Switch location">Palo Alto ▾</DemoOnly>
        {/* [DEMO ONLY] manager login menu */}
        <DemoOnly className="avatar" label="Manager account">MG</DemoOnly>
      </div>
    </header>
  );
}
