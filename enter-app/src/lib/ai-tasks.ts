export type AiTaskId =
  | "grade_answer"
  | "translate"
  | "summarize_readiness"
  | "generate_job_posts";

export interface AiTaskDefinition {
  id: AiTaskId;
  label: string;
  blurb: string;
  example: string;
}

export const MAX_PROMPT_LENGTH = 8000;

export const AI_TASKS: AiTaskDefinition[] = [
  {
    id: "grade_answer",
    label: "Grade answer",
    blurb: "Score a trainee's answer against a kitchen or service question.",
    example: `Grade this trainee answer.

Question: A guest with a shellfish allergy asks about the tasting menu. What do you do first?
Trainee answer: "I tell the chef right away and mark the ticket."

Return JSON shaped like {"score": 0-100, "verdict": "pass" | "needs_review", "feedback": "one short paragraph", "next_step": "one action for the manager"}.`,
  },
  {
    id: "translate",
    label: "Translate",
    blurb: "Turn a manager message into another language for the line.",
    example: `Translate this manager message into Spanish for a prep cook, keeping kitchen terms intact.

Message: "Wear gloves when handling the shrimp, and label every container with today's date."

Return JSON shaped like {"language": "Spanish", "translation": "translated text", "notes": "one short safety or cultural note"}.`,
  },
  {
    id: "summarize_readiness",
    label: "Summarize readiness",
    blurb: "Turn shift notes into a readiness call for the next service.",
    example: `Summarize this trainee's readiness for a solo opening shift.

Trainee: Mei, three shifts on the floor. Passed allergen protocol. Slow on the POS during the dinner rush. Strong guest greetings, needs prompting on table numbers.

Return JSON shaped like {"readiness": "ready" | "coaching" | "not_ready", "summary": "two sentences", "top_gaps": ["gap", "gap"], "recommended_next_shift": "one concrete focus"}.`,
  },
  {
    id: "generate_job_posts",
    label: "Generate job posts",
    blurb: "Draft hiring posts from a short staffing brief.",
    example: `Write job posts for a 60-seat modern Cantonese restaurant opening in Palo Alto. Hiring a host and a wok chef. Pay is competitive, tips shared, Mandarin or Cantonese is a plus.

Return JSON shaped like {"posts": [{"role": "host" | "wok_chef", "title": "post headline", "body": "three short paragraphs", "must_haves": ["requirement", "requirement"]}]}.`,
  },
];

export function getTask(id: AiTaskId): AiTaskDefinition {
  return AI_TASKS.find((task) => task.id === id) ?? AI_TASKS[0];
}
