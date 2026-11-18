export type Lang = "en" | "zh" | "es";
export type Status = "APPLIED" | "TRAINING" | "REVIEW" | "SHIFT_READY";

export interface ModuleProgress {
  id: number; slug: string; icon: string; title: string;
  passed: boolean; score: number | null; confidence: number | null;
}
export interface Flag { kind: "buddy" | "double_check"; label: string; detail: string; module: string }
export interface Ticket {
  id: number; ticket_no: number; name: string; role: "server" | "kitchen"; job_title: string; lang: Lang;
  status: Status; source_channel: string; applied_at: string; updated_at: string; summary: string;
  hire: null | {
    id: number; token: string; path: string; lang: Lang; started_at: string; stamped_at: string | null;
    modules: ModuleProgress[]; flags: Flag[]; first_try_pct: number; confidence: number | null;
    sent_back: null | { module_id: number; module: string; note: string };
  };
}
export interface JobCard {
  id: number; role: string; title: string; pay_range: string; schedule: string; languages: Lang[];
  channels: number; created_at: string; applicants: number;
}
export interface Board {
  jobs: JobCard[];
  columns: Record<Status, Ticket[]>;
  metrics: { on_rail: number; avg_days_to_ready: number | null; completion_rate: number; approvals_with_evidence: number; flags: number };
  public_base: string | null;
}
export interface Gap { module: string; module_icon: string; role: string; question: string; missed: number; attempted: number; lesson_line: string }
export interface ChannelPost { channel: string; label: string; lang: string; text: string; limit: number; format_note: string }
export interface Job {
  id: number; role: string; title: string; location: string; pay_range: string; schedule: string; notes: string;
  requirements: string[]; languages: Lang[]; posts: ChannelPost[]; created_at: string;
}
export type L10n = Record<Lang, string>;
export interface Meta {
  roles: Record<string, { title: L10n; area: L10n; blurb: L10n }>;
  requirements: Record<string, L10n>;
  languages: { code: Lang; native: string; name: string; bcp47: string }[];
  pilot_languages: { native: string; name: string }[];
  channels: Record<string, { label: string; kind: string; limit: number; format_note: string }>;
  send_back_notes: L10n[];
  ai: { mode: string; provider: string };
}
export interface HireModule {
  id: number; slug: string; icon: string; title: string;
  cards: { id: string; icon: string; text: string }[];
  questions: { id: string; type: "mc" | "free"; prompt: string; options: { id: string; text: string }[] }[];
  passed: boolean; confidence: number | null; answered: string[];
}
export interface HireStatus { status: Status; stamped_at: string | null; sent_back: null | { module_id: number; note: string; original: string } }
export interface Training {
  hire: { name: string; first_name: string; role: string; role_title: string; ticket_no: number; lang: Lang } & HireStatus;
  lang: Lang;
  modules: HireModule[];
}
export interface AnswerResult {
  passed: boolean; feedback: string; hint_card: string | null; hint_text: string | null;
  first_try: boolean; module_complete: boolean;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).detail || msg; } catch { /* keep statusText */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}
const post = <T>(path: string, body?: unknown) => req<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });

export const api = {
  meta: () => req<Meta>("/api/meta"),
  board: () => req<Board>("/api/board"),
  insights: () => req<{ gaps: Gap[] }>("/api/insights"),
  hire: (candidateId: number) => post<{ token: string; path: string }>(`/api/candidates/${candidateId}/hire`),
  stamp: (hireId: number) => post<{ ok: boolean }>(`/api/hires/${hireId}/stamp`),
  sendBack: (hireId: number, module_id: number, note: string) =>
    post<{ ok: boolean; lang: Lang; note: string; translated: boolean }>(`/api/hires/${hireId}/send-back`, { module_id, note }),
  createJob: (body: Omit<Job, "id" | "posts" | "created_at">) => post<Job>("/api/jobs", body),
  job: (id: number) => req<Job>(`/api/jobs/${id}`),
  reset: () => post<{ ok: boolean }>("/api/demo/reset"),
  training: (token: string, lang?: Lang) => req<Training>(`/api/training/${token}${lang ? `?lang=${lang}` : ""}`),
  setLang: (token: string, lang: Lang) => post<{ ok: boolean }>(`/api/training/${token}/lang`, { lang }),
  answer: (token: string, module_id: number, question_id: string, answer: string) =>
    post<AnswerResult>(`/api/training/${token}/answers`, { module_id, question_id, answer }),
  confidence: (token: string, module_id: number, confidence: number) =>
    post<{ ok: boolean; status: Status }>(`/api/training/${token}/confidence`, { module_id, confidence }),
  status: (token: string) => req<HireStatus>(`/api/training/${token}/status`),
};

export const LANG_CHIP: Record<Lang, string> = { en: "EN", zh: "中文", es: "ES" };
export const CONF_EMOJI: Record<number, string> = { 1: "😟", 2: "🙂", 3: "💪" };

export function ago(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function hireUrl(path: string, base: string | null): string {
  return (base || window.location.origin).replace(/\/$/, "") + path;
}
