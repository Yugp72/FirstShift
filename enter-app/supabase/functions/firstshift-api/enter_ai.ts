// Enter AI (Converge.AI) client. Uses the project's built-in model access, never an external key.
// Direct gateway when the project AI token is available; otherwise via the published firstshift-ai function.
import type { AiCall } from "./core.ts";

const SYSTEM =
  "You are the AI core of FirstShift, a restaurant hiring and multilingual training tool for Imperial Treasure Palo Alto. " +
  "Reply with ONLY valid JSON that matches the shape described at the end of the prompt. No markdown fences, no extra text.";
const PROJECT_ID = "7ceaa6f9d4a2409ab7753ed1c9165da1";

function parse(text: string): unknown {
  const s = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(s);
}

export function enterAi(opts: { token?: string | null; aiFunctionUrl?: string | null; timeoutMs?: number }): AiCall | null {
  const timeoutMs = opts.timeoutMs ?? 55_000;
  if (opts.token && !opts.aiFunctionUrl) {
    return async (task, prompt) => {
      for (let i = 0; i < 2; i++) {
        const r = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
          method: "POST",
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            Authorization: `Bearer ${opts.token}`, "Content-Type": "application/json",
            "X-Session-ID": crypto.randomUUID(), "X-Enter-Project-ID": PROJECT_ID,
          },
          body: JSON.stringify({
            model: "alibaba/qwen-3.7-plus", stream: false,
            messages: [{ role: "system", content: SYSTEM }, { role: "user", content: `[task: ${task}]\n${prompt}` }],
          }),
        });
        if (!r.ok) throw new Error(`Enter AI HTTP ${r.status}`);
        const data = await r.json();
        const out = data?.choices?.[0]?.message?.content;
        if (typeof out === "string") { try { return parse(out); } catch { /* retry once */ } }
      }
      throw new Error("Enter AI returned invalid JSON twice");
    };
  }
  if (opts.aiFunctionUrl) {
    // Per-task caps keep the hire's screen responsive; on timeout the caller falls back to the rubric/templates.
    const CAP: Record<string, number> = { grade_answer: 35_000, translate: 25_000 };
    return async (task, prompt) => {
      const r = await fetch(opts.aiFunctionUrl!, {
        method: "POST", signal: AbortSignal.timeout(CAP[task] ?? timeoutMs),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, prompt: prompt.slice(0, 7900), response_format: "json" }),
      });
      if (!r.ok) throw new Error(`firstshift-ai HTTP ${r.status}`);
      const data = await r.json();
      const out = data?.output ?? data;
      return typeof out === "string" ? parse(out) : out;
    };
  }
  return null;
}
