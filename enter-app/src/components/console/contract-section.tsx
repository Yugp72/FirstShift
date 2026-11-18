import { Card } from "@/components/ui/card";
import { Pill } from "./pill";
import { AI_ENDPOINT, isAiCoreConfigured } from "@/lib/ai-core";

const responseExample = `200 OK

{
  "output": "{\\"score\\": 92, \\"verdict\\": \\"pass\\", \\"feedback\\": \\"Clear, safe call.\\", \\"next_step\\": \\"Review ticket marking on the floor.\\"}"
}`;

export function ContractSection() {
  const endpoint = isAiCoreConfigured ? AI_ENDPOINT : "<endpoint from the card above>";

  const requestExample = `POST ${endpoint}
Content-Type: application/json

{
  "task": "grade_answer",
  "prompt": "...describe the job and the JSON shape...",
  "response_format": "json"
}`;

  return (
    <section className="mt-14 animate-rise border-t border-border/70 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Integration
          </p>
          <h2 className="mt-2 font-display text-3xl">How FirstShift calls it</h2>
        </div>
        <Pill tone="neutral" className="font-mono text-[10px]">JSON in / JSON out</Pill>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card className="overflow-hidden border-border/80 bg-card/90 shadow-card">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Request
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">application/json</span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
            {requestExample}
          </pre>
        </Card>

        <Card className="overflow-hidden border-border/80 bg-card/90 shadow-card">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Response
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">output: string</span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
            {responseExample}
          </pre>
        </Card>
      </div>

      <div className="mt-5 grid gap-3 text-xs leading-relaxed text-muted-foreground sm:grid-cols-3">
        <p className="rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <span className="font-mono text-[10px] font-medium text-foreground">400</span>
          <span className="mx-1.5 text-border">/</span>
          Prompts over 8,000 characters are refused before the model runs.
        </p>
        <p className="rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <span className="font-mono text-[10px] font-medium text-foreground">502</span>
          <span className="mx-1.5 text-border">/</span>
          If the reply isn't valid JSON, the model is asked once more, then the call fails honestly.
        </p>
        <p className="rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <span className="font-mono text-[10px] font-medium text-foreground">CORS</span>
          <span className="mx-1.5 text-border">/</span>
          Any origin may call the endpoint, with no auth header and no cookies.
        </p>
      </div>
    </section>
  );
}
