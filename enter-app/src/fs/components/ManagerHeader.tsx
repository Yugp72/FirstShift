import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { DemoOnly } from "./DemoOnly";
import { GlobalNav } from "./GlobalNav";

/** Global nav plus the manager's local nav bar. */
export function ManagerHeader({ children }: { children?: ReactNode }) {
  return (
    <>
      <GlobalNav />
      <div className="lnav">
        <div className="lnav-inner">
          <span className="title">Hiring</span>
          <NavLink to="/manager" end>Pipeline</NavLink>
          <NavLink to="/manager/new">Post a job</NavLink>
          {children}
          {/* [DEMO ONLY] location switcher */}
          <DemoOnly className="btn btn-sm hide-sm" label="Switch location">Palo Alto ▾</DemoOnly>
        </div>
      </div>
    </>
  );
}
