import { useState } from "react";
import { Check, Copy, Globe2, KeyRound, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "./pill";
import { AI_ENDPOINT, isAiCoreConfigured } from "@/lib/ai-core";
import { cn } from "@/lib/utils";

export function EndpointCard() {
  const [copied, setCopied] = useState(false);

  const copyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(AI_ENDPOINT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/80 bg-card/90 shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Endpoint
        </span>
        <Pill tone="neutral" className="font-mono text-[10px] uppercase tracking-wider">
          POST
        </Pill>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "break-all font-mono text-[12px] leading-relaxed",
              isAiCoreConfigured ? "text-foreground" : "text-muted-foreground italic",
            )}
          >
            {isAiCoreConfigured ? AI_ENDPOINT : "Pending deployment"}
          </p>
          {isAiCoreConfigured && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={copyEndpoint}
              aria-label="Copy endpoint URL"
              className="-mr-1 -mt-1 h-8 w-8 shrink-0 text-muted-foreground"
            >
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isAiCoreConfigured ? "bg-success" : "bg-warning",
            )}
            aria-hidden
          />
          {isAiCoreConfigured
            ? "Endpoint configured"
            : "Service not connected yet"}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-t border-border/70 bg-border/60">
        <div className="flex items-center gap-2 bg-card px-5 py-3">
          <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">CORS</dt>
            <dd className="text-xs font-medium">Any origin</dd>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-card px-5 py-3">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Auth</dt>
            <dd className="text-xs font-medium">None</dd>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-card px-5 py-3">
          <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Limit</dt>
            <dd className="text-xs font-medium">8,000 chars</dd>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-card px-5 py-3">
          <span className="font-mono text-[11px] text-muted-foreground">{"{ }"}</span>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Reply</dt>
            <dd className="text-xs font-medium">JSON only</dd>
          </div>
        </div>
      </dl>
    </Card>
  );
}
