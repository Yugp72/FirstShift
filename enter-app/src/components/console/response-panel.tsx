import { useState } from "react";
import { AlertTriangle, Braces, Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "./pill";
import type { AiCoreResult } from "@/lib/ai-core";

interface ResponsePanelProps {
  result: AiCoreResult | null;
  error: string | null;
  isSending: boolean;
}

function getErrorMessage(result: AiCoreResult): string {
  const body = result.body;
  if (body && typeof body === "object" && "error" in body) {
    const message = (body as { error?: unknown }).error;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return `Request failed with status ${result.status || "network error"}.`;
}

export function ResponsePanel({ result, error, isSending }: ResponsePanelProps) {
  const [copied, setCopied] = useState(false);

  const pretty = result ? JSON.stringify(result.body, null, 2) : "";
  const failure = error ?? (result && !result.ok ? getErrorMessage(result) : null);

  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/80 bg-card/90 shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Response
          {isSending && <Loader2 className="h-3 w-3 animate-spin" />}
        </span>
        <div className="flex items-center gap-2">
          {result && (
            <>
              <span className="font-mono text-[11px] text-muted-foreground">
                {result.durationMs} ms
              </span>
              <Pill tone={result.ok ? "success" : "danger"} dot>
                {result.status === 0 ? "network" : result.status}
              </Pill>
            </>
          )}
          {pretty && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={copyResponse}
              aria-label="Copy response JSON"
              className="h-7 w-7 text-muted-foreground"
            >
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 py-4" aria-live="polite">
        {isSending && (
          <div className="space-y-2.5 py-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <p className="pt-2 text-xs text-muted-foreground">Waiting for the model…</p>
          </div>
        )}

        {!isSending && !result && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <Braces className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nothing sent yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick a task and send a prompt to see the raw JSON reply here.
              </p>
            </div>
          </div>
        )}

        {!isSending && failure && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{failure}</span>
          </div>
        )}

        {!isSending && result && (
          <>
            {!failure && (
              <p className="mb-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">output</span> holds the model's
                reply as a JSON string, ready to parse in FirstShift.
              </p>
            )}
            <pre className="max-h-[420px] overflow-auto rounded-lg bg-ink p-4 font-mono text-[12px] leading-relaxed text-ink-foreground">
              {pretty}
            </pre>
          </>
        )}
      </div>
    </Card>
  );
}
