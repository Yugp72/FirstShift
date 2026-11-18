import { Activity, ClipboardCheck, Languages, Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AI_TASKS, type AiTaskId } from "@/lib/ai-tasks";

const taskIcons: Record<AiTaskId, typeof ClipboardCheck> = {
  grade_answer: ClipboardCheck,
  translate: Languages,
  summarize_readiness: Activity,
  generate_job_posts: Megaphone,
};

export function TaskGuide() {
  return (
    <Card className="border-border/80 bg-card/90 shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Tasks
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">4</span>
      </div>

      <ul className="divide-y divide-border/70">
        {AI_TASKS.map((task) => {
          const Icon = taskIcons[task.id];
          return (
            <li key={task.id} className="flex gap-3 px-5 py-3.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="text-sm font-medium">{task.label}</p>
                  <span className="font-mono text-[10px] text-muted-foreground">{task.id}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{task.blurb}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
