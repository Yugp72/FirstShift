import type { ReactNode } from "react";

// [DEMO ONLY] Visual-only control: rendered disabled with a "Coming in pilot" tooltip. Never throws.
export function DemoOnly({ children, className = "tool", label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <button type="button" className={`${className} demo-only`} disabled aria-disabled="true" title="Coming in pilot"
      aria-label={label ? `${label} (coming in pilot)` : undefined}>
      {children}
    </button>
  );
}
