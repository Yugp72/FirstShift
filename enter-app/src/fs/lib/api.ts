export type Lang = "en" | "zh" | "es";
export type Status = "APPLIED" | "TRAINING" | "REVIEW" | "SHIFT_READY" | "PRACTICE";

export interface ModuleProgress {
  id: number; slug: string; icon: string; title: string;
  passed: boolean; score: number | null; confidence: number | null; formats?: string[];
}
export interface Flag { kind: "buddy" | "double_check" | "allergen_risk" | "confident_miss"; label: string; detail: string; module: string }
export interface Ticket {
  id: number; ticket_no: number; name: string; role: "server" | "kitchen"; job_title: string; lang: Lang;
  status: Status; source_channel: string; applied_at: string; updated_at: string; summary: string;
  hire: null | {
    id: number; token: string; path: string; lang: Lang; started_at: string; stamped_at: string | null;
    modules: ModuleProgress[]; flags: Flag[]; first_try_pct: number; confidence: number | null;
    sent_back: null | { module_id: number; module: string; note: string };
    prefs: { id: string; label: string }[]; setup_notes: string[]; formats_used: string[];
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
export interface TaskCard { kind: string; title: string; detail: string }
export interface ApplyResult { ok: boolean; application_id: number; reply: string; lang: Lang; interview_slots: string[]; interview_note: string }
export interface ChannelPost { channel: string; label: string; lang: string; text: string; limit: number; format_note: string }
export interface Job {
  id: number; role: string; title: string; location: string; pay_range: string; schedule: string; notes: string;
  requirements: string[]; languages: Lang[]; posts: ChannelPost[]; created_at: string;
  task_cards?: TaskCard[]; posts_by?: string;
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
export type Format = "read" | "pictures" | "video" | "listen";
export interface ModuleMedia { video?: string; poster?: string; steps?: Record<string, string>; credit?: string }
export interface HireModule {
  id: number; slug: string; icon: string; title: string;
  cards: { id: string; icon: string; text: string }[];
  questions: { id: string; type: "mc" | "free"; prompt: string; options: { id: string; text: string; icon: string }[] }[];
  passed: boolean; confidence: number | null; answered: string[];
  media: ModuleMedia; seconds_per_card: number;
}
export interface HireStatus { status: Status; stamped_at: string | null; sent_back: null | { module_id: number; note: string; original: string } }
export interface Training {
  hire: { name: string; first_name: string; role: string; role_title: string; ticket_no: number; lang: Lang; prefs: string[]; mode: "practice" | "hired" } & HireStatus;
  lang: Lang;
  modules: HireModule[];
}
export interface AnswerResult {
  passed: boolean; feedback: string; hint_card: string | null; hint_text: string | null;
  first_try: boolean; module_complete: boolean;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

// The API is the `firstshift-api` edge function on this Enter project's managed Supabase.
// Local dev can point elsewhere with VITE_FS_API (e.g. http://localhost:8787).
const SUPABASE_URL = "https://br-prime-seal-b67e3e22.supabase.aidap-global.ap-southeast-1.bytepluses.com";
export const API_BASE: string =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FS_API) || `${SUPABASE_URL}/functions/v1/firstshift-api`;
const SESSION_KEY = "fs_session";
export function getSession(): string | null {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}
function setSession(tok: string | null) {
  try { if (tok) localStorage.setItem(SESSION_KEY, tok); else localStorage.removeItem(SESSION_KEY); } catch { /* storage blocked */ }
}

async function raw(path: string, init?: RequestInit): Promise<Response> {
  const s = getSession();
  const res = await fetch(API_BASE + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(s ? { "x-fs-session": s } : {}), ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).detail || msg; } catch { /* keep statusText */ }
    throw new ApiError(msg, res.status);
  }
  return res;
}
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const data = await (await raw(path, init)).json();
  if (data && typeof data === "object" && "session" in data) setSession((data as { session: string }).session);
  return data as T;
}

/** Download an API file (CSV/JSON export) with the session header, as a real file save. */
export async function download(path: string, fallbackName: string): Promise<void> {
  const res = await raw(path);
  const cd = res.headers.get("content-disposition") || "";
  const name = /filename="?([^";]+)"?/.exec(cd)?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** WebVTT captions built from a lesson's cards (one cue per card), as a same-origin blob URL. */
const vttCache = new Map<string, string>();
export function captionsUrl(cards: { text: string }[], secondsPerCard: number): string {
  const key = secondsPerCard + "|" + cards.map((c) => c.text).join("||");
  const hit = vttCache.get(key);
  if (hit) return hit;
  const ts = (s: number) => `00:${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.000`;
  const lines = ["WEBVTT", ""];
  cards.forEach((c, i) => lines.push(String(i + 1), `${ts(i * secondsPerCard)} --> ${ts((i + 1) * secondsPerCard)}`, c.text, ""));
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/vtt" }));
  vttCache.set(key, url);
  return url;
}

export const MEDIA_BASE = "https://cdn.jsdelivr.net/gh/Yugp72/FirstShift@8738124/media/";

export interface Account { id: number; email: string; name: string; role: "manager" | "applicant"; lang: Lang }
export interface PublicJob {
  id: number; role: "server" | "kitchen"; area: string; title: string; location: string; pay_range: string; schedule: string;
  requirements: string[]; languages: Lang[]; created_at: string; listing: string; easy_read: string;
  task_cards?: TaskCard[];
}
export interface Application {
  id: number; job_id: number; title: string; role: "server" | "kitchen"; location: string; schedule: string; status: Status;
  applied_at: string; training: null | { token: string; passed: number; total: number }; stamped_at: string | null;
}
export interface Course {
  role: "server" | "kitchen"; title: string; area: string; blurb: string; lessons: number; quizzes: number;
  sections: { title: string; icon: string; lessons: number; questions: number; has_video: boolean }[];
}
const post = <T>(path: string, body?: unknown) => req<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });

export const api = {
  me: () => req<{ account: Account | null }>("/api/auth/me"),
  login: (email: string, password: string) => post<{ account: Account }>("/api/auth/login", { email, password }),
  signup: (name: string, email: string, password: string, lang: Lang) => post<{ account: Account }>("/api/auth/signup", { name, email, password, lang }),
  demoLogin: (role: "manager" | "applicant") => post<{ account: Account }>("/api/auth/demo", { role }),
  logout: () => post<{ ok: boolean }>("/api/auth/logout").finally(() => setSession(null)),
  openJobs: () => req<{ jobs: PublicJob[] }>("/api/careers/jobs"),
  openJob: (id: number) => req<PublicJob>(`/api/careers/jobs/${id}`),
  apply: (id: number, lang?: Lang, prefs?: string[]) => post<ApplyResult>(`/api/careers/jobs/${id}/apply`, { lang, prefs }),
  closeJob: (id: number, reopen = false) => post<{ ok: boolean; closed: boolean }>(`/api/jobs/${id}/close`, { reopen }),
  myApplications: () => req<{ applications: Application[] }>("/api/me/applications"),
  courses: () => req<{ courses: Course[] }>("/api/learn/courses"),
  learnSession: (role: string, token?: string | null) => post<{ token: string; mode: "practice" | "hired" }>("/api/learn/session", { role, token }),
  meta: () => req<Meta>("/api/meta"),
  board: () => req<Board>("/api/board"),
  insights: () => req<{ gaps: Gap[] }>("/api/insights"),
  hire: (candidateId: number) => post<{ token: string; path: string }>(`/api/candidates/${candidateId}/hire`),
  stamp: (hireId: number) => post<{ ok: boolean }>(`/api/hires/${hireId}/stamp`),
  sendBack: (hireId: number, module_id: number, note: string) =>
    post<{ ok: boolean; lang: Lang; note: string; translated: boolean }>(`/api/hires/${hireId}/send-back`, { module_id, note }),
  createJob: (body: Omit<Job, "id" | "posts" | "created_at" | "task_cards" | "posts_by">) => post<Job>("/api/jobs", body),
  job: (id: number) => req<Job>(`/api/jobs/${id}`),
  reset: () => post<{ ok: boolean }>("/api/demo/reset"),
  training: (token: string, lang?: Lang) => req<Training>(`/api/training/${token}${lang ? `?lang=${lang}` : ""}`),
  setLang: (token: string, lang: Lang) => post<{ ok: boolean }>(`/api/training/${token}/lang`, { lang }),
  answer: (token: string, module_id: number, question_id: string, answer: string, confidence?: number) =>
    post<AnswerResult>(`/api/training/${token}/answers`, { module_id, question_id, answer, confidence }),
  setPrefs: (token: string, prefs: string[]) => post<{ ok: boolean }>(`/api/training/${token}/prefs`, { prefs }),
  usedFormat: (token: string, module_id: number, format: Format) =>
    post<{ ok: boolean }>(`/api/training/${token}/format`, { module_id, format }),
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
