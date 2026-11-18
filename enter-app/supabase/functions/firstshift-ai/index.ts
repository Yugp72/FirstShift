const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
};

const tasks = new Set([
  "grade_answer",
  "translate",
  "summarize_readiness",
  "generate_job_posts",
]);

const systemInstruction = "You are the AI core of FirstShift, a restaurant hiring and multilingual training tool. Reply with ONLY valid JSON that matches the shape described at the end of the prompt. No markdown fences, no extra text.";

function respond(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed. Use POST." }, 405);

  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return respond({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return respond({ error: "Request body must be a JSON object." }, 400);
  }
  const { task, prompt, response_format } = input as Record<string, unknown>;
  if (typeof task !== "string" || !tasks.has(task)) {
    return respond({ error: "Invalid task." }, 400);
  }
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return respond({ error: "Prompt must be a non-empty string." }, 400);
  }
  if (prompt.length > 8000) return respond({ error: "Prompt must not exceed 8000 characters." }, 400);
  if (response_format !== "json") return respond({ error: "response_format must be json." }, 400);

  const token = Deno.env.get("AI_API_TOKEN_7ceaa6f9d4a2");
  if (!token) {
    console.error("AI service token is not configured");
    return respond({ error: "AI service is not configured." }, 503);
  }
  const sessionId = crypto.randomUUID();
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const upstream = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
          "X-Enter-Project-ID": "7ceaa6f9d4a2409ab7753ed1c9165da1",
        },
        body: JSON.stringify({
          model: "alibaba/qwen-3.7-plus",
          stream: false,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!upstream.ok) {
        const data = await upstream.json().catch(() => null);
        const message = typeof data?.error?.message === "string" ? data.error.message : "AI service temporarily unavailable.";
        console.error("AI upstream error", upstream.status, data?.error?.type);
        return respond({ error: message }, upstream.status >= 400 && upstream.status <= 599 ? upstream.status : 502);
      }
      const data = await upstream.json();
      const output = data?.choices?.[0]?.message?.content;
      if (typeof output === "string") {
        try {
          JSON.parse(output);
          return respond({ output });
        } catch {
          // Retry one invalid model response, then return a gateway error.
        }
      }
    }
    return respond({ error: "The AI model did not return valid JSON after two attempts." }, 502);
  } catch (error) {
    console.error("AI request failed", error instanceof Error ? error.message : "unknown error");
    return respond({ error: "AI service temporarily unavailable." }, 502);
  }
});
