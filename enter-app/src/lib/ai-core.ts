import { SUPABASE_URL } from "@/integrations/supabase/client";
import type { AiTaskId } from "./ai-tasks";

export const AI_ENDPOINT = `${SUPABASE_URL}/functions/v1/firstshift-ai`;

export const isAiCoreConfigured = AI_ENDPOINT.length > 0;

export interface AiCoreResult {
  ok: boolean;
  status: number;
  durationMs: number;
  body: unknown;
}

export interface AiCoreRequest {
  task: AiTaskId;
  prompt: string;
  response_format: "json";
}

export async function callAiCore(
  task: AiTaskId,
  prompt: string,
): Promise<AiCoreResult> {
  const startedAt = performance.now();

  const payload: AiCoreRequest = { task, prompt, response_format: "json" };

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let body: unknown = raw;
    try {
      body = JSON.parse(raw);
    } catch {
      body = { raw };
    }

    return {
      ok: response.ok,
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt),
      body,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: Math.round(performance.now() - startedAt),
      body: {
        error:
          error instanceof Error
            ? error.message
            : "Could not reach the endpoint.",
      },
    };
  }
}
