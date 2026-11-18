import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PillTone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneClasses: Record<PillTone, string> = {
  neutral: "border-border bg-secondary/70 text-secondary-foreground",
  accent: "border-accent-foreground/15 bg-accent text-accent-foreground",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
};

interface PillProps {
  tone?: PillTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Pill({ tone = "neutral", dot = false, className, children }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
