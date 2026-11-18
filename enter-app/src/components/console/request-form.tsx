import { useState, type FormEvent } from "react";
import { Loader2, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsePanel } from "./response-panel";
import { callAiCore, isAiCoreConfigured, type AiCoreResult } from "@/lib/ai-core";
import {
  AI_TASKS,
  MAX_PROMPT_LENGTH,
  getTask,
  type AiTaskId,
} from "@/lib/ai-tasks";
import { cn } from "@/lib/utils";

export function RequestForm() {
  const [taskId, setTaskId] = useState<AiTaskId>("grade_answer");
  const [prompt, setPrompt] = useState(getTask("grade_answer").example);
  const [result, setResult] = useState<AiCoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const task = getTask(taskId);
  const overLimit = prompt.length > MAX_PROMPT_LENGTH;
  const canSend =
    isAiCoreConfigured && !isSending && !overLimit && prompt.trim().length > 0;

  const handleTaskChange = (value: string) => {
    const nextId = value as AiTaskId;
    const promptIsAnExample = AI_TASKS.some((item) => item.example === prompt);
    setTaskId(nextId);
    if (promptIsAnExample || prompt.trim().length === 0) {
      setPrompt(getTask(nextId).example);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;

    setIsSending(true);
    setError(null);
    try {
      const response = await callAiCore(taskId, prompt);
      setResult(response);
    } catch (submitError) {
      setResult(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not reach the endpoint.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/80 bg-card/90 shadow-lift">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Try the core</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The same request the FirstShift app sends.
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            response_format: json
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5 pt-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="task"
              className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
            >
              Task
            </Label>
            <Select value={taskId} onValueChange={handleTaskChange}>
              <SelectTrigger id="task" className="h-11 bg-background">
                <SelectValue placeholder="Choose a task" />
              </SelectTrigger>
              <SelectContent>
                {AI_TASKS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="flex items-baseline gap-2">
                      {item.label}
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {item.id}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-2">
              <Label
                htmlFor="prompt"
                className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
              >
                Prompt
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPrompt(task.example)}
                className="-mr-2 h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Load example
              </Button>
            </div>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={9}
              spellCheck={false}
              placeholder="Describe the job for the model, then state the JSON shape you expect back."
              className="min-h-[220px] resize-y bg-background text-[13px] leading-relaxed"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                End with the JSON shape you want back.
              </p>
              <span
                className={cn(
                  "font-mono text-[11px]",
                  overLimit ? "font-medium text-destructive" : "text-muted-foreground",
                )}
              >
                {prompt.length.toLocaleString()} / {MAX_PROMPT_LENGTH.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={cn(
                "text-[11px] leading-relaxed",
                overLimit
                  ? "text-destructive"
                  : isAiCoreConfigured
                    ? "text-muted-foreground"
                    : "text-warning",
              )}
            >
              {overLimit
                ? "Prompt is over the 8,000 character limit."
                : isAiCoreConfigured
                  ? "No credentials needed. CORS is open to any origin."
                  : "Service not connected yet — sending is disabled while the core is deployed."}
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={!canSend}
              className="w-full shrink-0 sm:w-auto"
            >
              {isSending ? <Loader2 className="animate-spin" /> : <Send />}
              {isSending ? "Sending" : "Send"}
            </Button>
          </div>
        </form>
      </Card>

      <ResponsePanel result={result} error={error} isSending={isSending} />
    </div>
  );
}
