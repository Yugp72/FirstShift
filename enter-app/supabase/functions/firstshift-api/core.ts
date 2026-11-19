// FirstShift API core: a faithful TypeScript port of the FastAPI backend (backend/), runtime-agnostic.
// Runs in the Enter-managed Supabase edge runtime (index.ts) and in Node for local tests.
// State is one JSON document (small demo data) with optimistic-concurrency saves.
// Every AI call goes through `aiCall` (Enter's built-in model); any failure falls back to the deterministic mock.
// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any -- rows are loosely typed JSON documents */
import { MEDIA, MOCK_AI, MODULES, PEOPLE, ROLES } from "./seed_data.ts";

// ---------------------------------------------------------------- types
type Row = Record<string, any>;
export interface State {
  seq: Record<string, number>;
  job: Row[]; candidate: Row[]; hire: Row[]; attempt: Row[]; format_use: Row[];
  account: Row[]; session: Row[]; module_result: Row[];
  ai_cache: Record<string, any>;
}
export interface Store {
  load(): Promise<{ state: State; version: number } | null>;
  /** Save if the stored version still equals `version`. Returns false on a concurrent write. */
  save(state: State, version: number): Promise<boolean>;
}
export type AiCall = (task: string, prompt: string) => Promise<any>;
export interface Options { store: Store; ai: AiCall | null; mediaBase: string; publicBase?: string | null }

class HttpError extends Error {
  status: number; detail: string;
  constructor(status: number, detail: string) { super(detail); this.status = status; this.detail = detail; }
}

// ---------------------------------------------------------------- helpers
const LANGS = ["en", "zh", "yue", "es"];
const STATUSES = ["APPLIED", "TRAINING", "REVIEW", "SHIFT_READY"];
const ALL_CHANNELS = ["job_board", "classifieds", "chat_zh", "chat_yue", "chat_es", "flyer", "bilingual", "easy_read"];
const nowIso = (d?: Date) => (d || new Date()).toISOString();
const daysAgo = (days: number, hours = 0) => new Date(Date.now() - days * 86400e3 - hours * 3600e3);

export function pick(d: any, lang: string): string {
  if (typeof d === "string") return d;
  if (!d) return "";
  return d[lang] || d.en || Object.values(d)[0] as string || "";
}

const T: Record<string, Record<string, string>> = {
  mc_correct: { en: "That's it.", zh: "对了！", yue: "啱喇！", es: "¡Eso es!" },
  almost: { en: "Almost. Here's the bit to look at.", zh: "差一点。我们再看一下这一句。", yue: "差少少。我哋再睇下呢句。", es: "Casi. Mira esta parte otra vez." },
  free_pass: { en: "Good answer. You covered: {points}.", zh: "回答得很好。你说到了：{points}。", yue: "答得好好。你講到：{points}。", es: "Buena respuesta. Mencionaste: {points}." },
  free_tip: { en: " One more thing to remember: {missing}.", zh: "再记住一点：{missing}。", yue: "再記住一樣：{missing}。", es: " Recuerda también: {missing}." },
  free_almost: {
    en: "Almost. You're on the right track. The key step: {missing}.",
    zh: "差一点，方向是对的。最重要的一步是：{missing}。", yue: "差少少，方向啱嘅。最重要嘅一步係：{missing}。",
    es: "Casi, vas por buen camino. El paso clave: {missing}.",
  },
  free_empty: { en: "Write a few words. Any language is fine.", zh: "写几个字就可以，用什么语言都行。", yue: "寫幾個字就得，用咩語言都得。", es: "Escribe unas palabras. Cualquier idioma está bien." },
};
function t(key: string, lang: string, kw: Record<string, string> = {}): string {
  let s = T[key][lang] || T[key].en;
  for (const [k, v] of Object.entries(kw)) s = s.replace(`{${k}}`, v);
  return s;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const randToken = (n: number) => b64url(crypto.getRandomValues(new Uint8Array(n)));
const hex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(buf as ArrayBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

async function sha256(s: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

const PBKDF2_ITER = 100_000;
async function hashPw(password: string, salt?: string): Promise<string> {
  salt = salt || hex(crypto.getRandomValues(new Uint8Array(16)));
  const saltBytes = new Uint8Array(salt.match(/../g)!.map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: PBKDF2_ITER }, key, 256);
  return `pbkdf2$${salt}$${hex(bits)}`;
}
async function checkPw(password: string, stored?: string | null): Promise<boolean> {
  if (!stored || stored.split("$").length !== 3) return false;
  const [, salt, digest] = stored.split("$");
  const got = (await hashPw(password, salt)).split("$")[2];
  let diff = got.length ^ digest.length;
  for (let i = 0; i < Math.min(got.length, digest.length); i++) diff |= got.charCodeAt(i) ^ digest.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------- modules (static seed content, stable ids)
const MODS: Row[] = MODULES.map((m: Row, i: number) => ({ ...m, id: i + 1 }));
const modulesFor = (role: string) => MODS.filter((m) => m.role === role).sort((a, b) => a.order - b.order);
const moduleById = (id: number) => MODS.find((m) => m.id === id) || null;
const ROLE_LABEL: Record<string, string> = { server: "Front of house", kitchen: "Back of house" };
const ROLE_TITLES: Record<string, Record<string, string>> = {
  server: { en: "Server", zh: "服务员", yue: "侍應", es: "Mesero/a" },
  kitchen: { en: "Kitchen prep", zh: "厨房备料", yue: "廚房備料", es: "Preparación en cocina" },
};
const COURSE_TITLE: Record<string, string> = { server: "Server essentials", kitchen: "Kitchen prep essentials" };
const COURSE_BLURB: Record<string, string> = {
  server: "Greet and seat guests, serve tea safely, and handle allergy questions the right way.",
  kitchen: "Hand-washing and gloves, cold storage and labels, knife and station safety.",
};
const PREFS: Record<string, [string, string]> = {
  captions: ["Captions", "Give instructions in writing or captioned video, not verbal-only briefings."],
  visual: ["Visual steps", "Show the steps: picture cards at the station, demonstrate first."],
  read_aloud: ["Read aloud", "Read instructions aloud or pair them with audio."],
  seated: ["Seated station", "Offer a seated prep station where possible."],
  extra_time: ["Extra time", "Allow extra time on early shifts; no rushing on new tasks."],
};
const FORMAT_LABELS: Record<string, string> = { read: "Text", pictures: "Picture steps", video: "Captioned video", listen: "Audio" };
const LANG_NAMES: Record<string, string> = { en: "English", zh: "中文", yue: "粵語", es: "Español" };
const LANG_FULL: Record<string, string> = { en: "English", zh: "Simplified Chinese (Mandarin)", yue: "Traditional Chinese (written Cantonese, Hong Kong)", es: "Spanish" };

// ---------------------------------------------------------------- the request context
class Ctx {
  dirty = false;
  s: State; opt: Options; req: Request; url: URL; body: any;
  constructor(s: State, opt: Options, req: Request, url: URL, body: any) {
    this.s = s; this.opt = opt; this.req = req; this.url = url; this.body = body;
  }

  // tiny table helpers
  insert(table: keyof State, row: Row): number {
    const id = (this.s.seq[table as string] || 0) + 1;
    this.s.seq[table as string] = id;
    (this.s[table] as Row[]).push({ id, ...row });
    this.dirty = true;
    return id;
  }
  touch() { this.dirty = true; }

  account(): Row | null {
    const tok = this.req.headers.get("x-fs-session");
    if (!tok) return null;
    const ses = this.s.session.find((x) => x.token === tok);
    return ses ? this.s.account.find((a) => a.id === ses.account_id) || null : null;
  }
  requireAccount(): Row {
    const a = this.account();
    if (!a) throw new HttpError(401, "Please sign in.");
    return a;
  }
  requireManager(): Row {
    const a = this.requireAccount();
    if (a.role !== "manager") throw new HttpError(403, "Manager access only.");
    return a;
  }

  // ------------------------------------------------ AI (cached, falls back to mock)
  async ai(task: string, prompt: string): Promise<any | null> {
    if (!this.opt.ai) return null;
    const key = await sha256(`${task}\n${prompt}`);
    if (memCache.has(key)) return memCache.get(key);
    if (key in this.s.ai_cache) return this.s.ai_cache[key];
    try {
      const out = await this.opt.ai(task, prompt);
      memCache.set(key, out);
      this.s.ai_cache[key] = out;
      this.touch();
      return out;
    } catch (e) {
      console.error(`live ${task} failed; using mock:`, e instanceof Error ? e.message : e);
      return null;
    }
  }
}
const memCache = new Map<string, any>();

// ---------------------------------------------------------------- mock AI (deterministic, offline)
function normalize(s: string): string {
  return (s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function mockGrade(rubric: Row[], answer: string, lang: string) {
  const text = normalize(answer);
  const kw = MOCK_AI.rubric_keywords;
  const matched: string[] = [];
  for (const p of rubric) {
    const per = kw[p.id] || {};
    const words: string[] = Object.values(per).flat() as string[];
    if (words.some((k) => text.includes(normalize(k)))) matched.push(p.id);
  }
  const missing = rubric.filter((p) => !matched.includes(p.id));
  const requiredOk = rubric.filter((p) => p.required).every((p) => matched.includes(p.id));
  const passed = requiredOk && matched.length >= Math.ceil(rubric.length / 2);
  const sep = lang === "zh" || lang === "yue" ? "、" : ", ";
  let fb: string;
  if (passed) {
    fb = t("free_pass", lang, { points: rubric.filter((p) => matched.includes(p.id)).map((p) => pick(p.text, lang)).join(sep) });
    if (missing.length) fb += t("free_tip", lang, { missing: pick(missing[0].text, lang) });
  } else {
    const key = missing.find((p) => p.required) || missing[0] || rubric[0];
    fb = t("free_almost", lang, { missing: pick(key.text, lang) });
  }
  return { passed, feedback: fb, matched_points: matched, missing_points: missing.map((p) => p.id) };
}

function mockTranslate(text: string, lang: string): string {
  if (lang === "en") return text;
  const needle = text.trim();
  for (const n of ROLES.send_back_notes) if (n.en.trim() === needle) return n[lang] || text;
  for (const [en, tr] of Object.entries(MOCK_AI.translations || {}) as [string, any][]) {
    if (en.trim() === needle) return tr[lang] || text;
  }
  return text;
}

function mockSummary(s: Row): string {
  const mods: Row[] = s.modules || [];
  const done = mods.filter((m) => m.passed);
  if (s.status === "APPLIED") return `Applied via ${s.source_channel || "a channel"}. Prefers ${s.lang_name || "English"}.`;
  if (s.status === "SHIFT_READY") return `Stamped ready. Passed all ${mods.length} steps, ${s.first_try_pct || 0}% on first try.`;
  if (!done.length) return "Link sent. Hasn't finished a step yet.";
  if (done.length < mods.length) {
    const nxt = mods.find((m) => !m.passed)!;
    return `${done.length} of ${mods.length} steps done. Working on ${nxt.title} next.`;
  }
  let line = `Passed all ${mods.length} steps, ${s.first_try_pct || 0}% on first try.`;
  const flags: Record<string, Row> = Object.fromEntries((s.flags || []).map((f: Row) => [f.kind, f]));
  if (flags.buddy) line += " Says they feel unsure: pair with a buddy for the first shift.";
  if (flags.double_check) line += ` Felt sure about ${flags.double_check.module} but missed parts first time: quick check.`;
  if (!Object.keys(flags).length) line += " Feels ready.";
  return line;
}

function mockJobPosts(job: Row, channels = ALL_CHANNELS): Row[] {
  const role = ROLES.roles[job.role] || ROLES.roles.server;
  const reqs = ROLES.requirements;
  const meta = ROLES.channels;
  const langs: string[] = job.languages?.length ? job.languages : ["en"];
  const other = langs.filter((l) => l !== "en");
  const reqLines = (lang: string, bullet: string) =>
    (job.requirements || []).filter((r: string) => reqs[r]).map((r: string) => `${bullet}${pick(reqs[r], lang)}`).join("\n");
  const namesEn: Record<string, string> = { en: "English", zh: "Mandarin", yue: "Cantonese", es: "Spanish" };
  const welcomeEn = langs.filter((x) => namesEn[x]).map((x) => namesEn[x]).join(", ");
  const pay = job.pay_range || "Pay discussed at interview";
  const sched = job.schedule || "Flexible shifts";
  const notes = (job.notes || "").trim() ? `\n${job.notes.trim()}\n` : "";
  const natives = langs.map((x) => LANG_NAMES[x]).filter(Boolean);
  const trainIn = natives.length > 1 ? `${natives.slice(0, -1).join(", ")} or ${natives[natives.length - 1]}` : natives[0] || "English";
  const texts: Record<string, [string, string]> = {};
  texts.job_board = ["en",
    `${job.title} · ${job.location}\nImperial Treasure Palo Alto · ${pay}\n\nAbout the role\n${pick(role.blurb, "en")}\n\n` +
    `Schedule\n${sched}\n\nWhat we're looking for\n${reqLines("en", "• ")}\n\n` +
    `Languages\n${welcomeEn} speakers welcome. Training is available in your language.\n${notes}\n` +
    "How to apply\nReply to this post or ask for the manager in person. No résumé needed."];
  texts.classifieds = ["en",
    `${job.title.toUpperCase()} · ${pay} (${job.location})\n\nNow hiring: ${job.title}. ${sched}.\n${reqLines("en", "- ")}\n` +
    `No résumé needed. Training in ${trainIn}.\n${notes}Reply with your name, phone and the days you can work.`];
  if (langs.includes("zh")) {
    texts.chat_zh = ["zh",
      `【招聘】${pick(role.title, "zh")} 📍${job.location}\n💰 ${pay}\n🗓 ${sched}\n${reqLines("zh", "✅ ")}\n` +
      "欢迎讲中文、英文、西班牙语的朋友！提供中文培训。\n有兴趣请回复你的名字和可以上班的时间 🙏"];
  }
  if (langs.includes("yue")) {
    texts.chat_yue = ["yue",
      `【請人】${pick(role.title, "yue")} 📍${job.location}\n💰 ${pay}\n🗓 ${sched}\n${reqLines("yue", "✅ ")}\n` +
      "歡迎識講廣東話、普通話、英文嘅朋友！提供廣東話培訓。\n有興趣請回覆你個名同可以返工嘅時間 🙏"];
  }
  if (langs.includes("es")) {
    texts.chat_es = ["es",
      `*Estamos contratando: ${pick(role.title, "es")}* 📍${job.location}\n💰 ${pay}\n🗓 ${sched}\n${reqLines("es", "✅ ")}\n` +
      "Capacitación en español, inglés o chino.\nSi te interesa, responde con tu nombre y los días que puedes trabajar 🙌"];
  }
  texts.flyer = ["en",
    `NOW HIRING\n${job.title.toUpperCase()}\n${sched} · ${pay}\nNo experience? We'll train you, in ${trainIn}. Ask any of our team.`];
  if (other.length) {
    const o = other[0];
    const label = LANG_NAMES[o] || o;
    texts.bilingual = [`en+${o}`,
      `NOW HIRING: ${job.title}\n${pick(role.blurb, "en")}\n${sched} · ${pay}\n${reqLines("en", "• ")}\n\n── ${label} ──\n` +
      (o === "zh" ? `招聘：${pick(role.title, o)}\n` : o === "yue" ? `請人：${pick(role.title, o)}\n` : `SE BUSCA: ${pick(role.title, o)}\n`) +
      `${pick(role.blurb, o)}\n${sched} · ${pay}\n${reqLines(o, "• ")}`];
  }
  const simple = (job.requirements || []).filter((r: string) => reqs[r]).map((r: string) => pick(reqs[r], "en") + ".").join("\n");
  texts.easy_read = ["en",
    `We need a ${pick(role.title, "en").toLowerCase()}.\n${pick(role.easy, "en")}\nWhen: ${sched}.\nPay: ${pay}.\n${simple}\n` +
    `We will train you.\nYou can learn in ${trainIn}.\nYou do not need a résumé.` + "\nTo apply: talk to us, or reply to this post."];
  return channels.filter((ch) => texts[ch]).map((ch) => ({
    channel: ch, label: meta[ch].label, lang: texts[ch][0], text: texts[ch][1].trim(), limit: meta[ch].limit, format_note: meta[ch].format_note,
  }));
}

// ---------------------------------------------------------------- AI-backed operations (live first, mock fallback)
async function gradeAnswer(c: Ctx, question: string, rubric: Row[], answer: string, lang: string) {
  const points = rubric.map((p) => `- id=${p.id} required=${!!p.required}: ${pick(p.text, "en")}`).join("\n");
  const prompt =
    "You grade a new restaurant hire's short answer. Grade MEANING, not grammar or language. " +
    `The hire may answer in any language.\nQuestion: ${question}\nRubric points:\n${points}\nAnswer: ${answer}\n` +
    "Pass if every required point is present and at least half of all points are present. " +
    `Write 1-2 warm, encouraging sentences of feedback in ${LANG_FULL[lang] || "English"}. ` +
    "Never use the words wrong, fail, test or quiz. If not passed, name the key missing step kindly.\n" +
    'Reply as JSON: {"passed": bool, "feedback": str, "matched_points": [ids], "missing_points": [ids]}';
  const out = await c.ai("grade_answer", prompt);
  if (out && typeof out.passed === "boolean" && typeof out.feedback === "string") {
    return {
      passed: out.passed, feedback: out.feedback,
      matched_points: Array.isArray(out.matched_points) ? out.matched_points : [],
      missing_points: Array.isArray(out.missing_points) ? out.missing_points : [],
      graded_by: "enter-ai",
    };
  }
  return { ...mockGrade(rubric, answer, lang), graded_by: "rubric" };
}

async function translate(c: Ctx, text: string, lang: string): Promise<string> {
  if (lang === "en" || !text) return text;
  const canned = mockTranslate(text, lang);
  if (canned !== text) return canned;
  const out = await c.ai("translate",
    `Translate this note from a restaurant manager to a new hire into ${LANG_FULL[lang]}. Keep it warm and simple.\n` +
    `Note: ${text}\nReply as JSON: {"text": str}`);
  return out && typeof out.text === "string" && out.text.trim() ? out.text : text;
}

async function generateJobPosts(c: Ctx, job: Row): Promise<{ posts: Row[]; task_cards: Row[]; by: string }> {
  const base = mockJobPosts(job);
  const has = (ch: string) => base.some((p) => p.channel === ch);
  const entry =
    "Imperial Treasure Palo Alto is a Chinese restaurant in Palo Alto, CA. Write job posts from ONE job entry. " +
    "Do not invent pay, policies or perks beyond the entry. Use the manager's notes. No résumé needed.\n" +
    `Entry: ${JSON.stringify(job)}\n`;
  const shape = 'Reply as JSON: {"posts": [{"channel": str, "text": str}]}';
  const rules: Record<string, string> = {
    job_board: "job_board: English, <=900 chars, short headings",
    classifieds: "classifieds: English, <=500 chars, pay in the first line",
    flyer: "flyer: English, <=250 chars, big simple lines",
    easy_read: "easy_read: plain English, very short sentences, one idea per line, <=450 chars",
    chat_zh: "chat_zh: WeChat-style post in Simplified Chinese, a few emoji, <=350 chars",
    chat_yue: "chat_yue: WhatsApp-style post in written Cantonese (Traditional Chinese, Hong Kong usage), a few emoji, <=350 chars",
    chat_es: "chat_es: WhatsApp-style post in Spanish, a few emoji, <=350 chars",
    bilingual: `bilingual: English, then the same post in ${LANG_FULL[(job.languages || []).find((l: string) => l !== "en") || "zh"]}, <=800 chars`,
  };
  const groups = [["job_board", "classifieds", "flyer", "easy_read"], ["chat_zh", "chat_yue", "chat_es", "bilingual"]]
    .map((g) => g.filter(has)).filter((g) => g.length);
  // Smaller parallel calls: Enter's model is ~7 s per call, so one big call can time out.
  const [cards, ...outs] = await Promise.all([
    c.ai("generate_job_posts", entry +
      "Break the role into 3-5 task cards a candidate can check against how they work best " +
      '(kind is one of "seated", "standing", "lifting", "customer", "language", "detail"). Keep titles under 5 words.\n' +
      'Reply as JSON: {"task_cards": [{"kind": str, "title": str, "detail": str}]}'),
    ...groups.map((g) => c.ai("generate_job_posts", entry + "Write these channels:\n" + g.map((ch) => `- ${rules[ch]}`).join("\n") + "\n" + shape)),
  ]);
  const byCh: Record<string, string> = {};
  for (const out of outs) {
    for (const p of out && Array.isArray(out.posts) ? out.posts : []) {
      if (p && typeof p.text === "string" && p.text.trim() && has(p.channel)) {
        byCh[p.channel] = p.text.replace(/\*\*|__/g, "").replace(/^#{1,6}\s*/gm, "").trim();
      }
    }
  }
  const posts = base.map((p) => (byCh[p.channel] ? { ...p, text: [...byCh[p.channel]].slice(0, p.limit).join("") } : p));
  const by = Object.keys(byCh).length ? "enter-ai" : "template";
  const out = cards;
  const task_cards = out && Array.isArray(out.task_cards) && out.task_cards.length
    ? out.task_cards.filter((x: Row) => x && x.title).slice(0, 6).map((x: Row) => ({ kind: String(x.kind || "detail"), title: String(x.title), detail: String(x.detail || "") }))
    : defaultTaskCards(job);
  return { posts, task_cards, by };
}

function defaultTaskCards(job: Row): Row[] {
  const r: string[] = job.requirements || [];
  const cards: Row[] = [];
  if (job.role === "kitchen") cards.push({ kind: "detail", title: "Prep and portioning", detail: "Wash, cut and portion ingredients to the recipe card." });
  else cards.push({ kind: "customer", title: "Greet and seat guests", detail: "Welcome guests and guide them to their table." });
  if (r.includes("standing")) cards.push({ kind: "standing", title: "On your feet", detail: "Most of the shift is spent standing or walking." });
  else cards.push({ kind: "seated", title: "Seated tasks possible", detail: "Some prep can be done at a seated station." });
  if (r.includes("lifting")) cards.push({ kind: "lifting", title: "Lifting", detail: "Carry trays or boxes up to about 25 lb." });
  cards.push({ kind: "language", title: "Any language welcome", detail: "Training in English, 中文 or Español." });
  return cards;
}

// ---------------------------------------------------------------- readiness (port of services/readiness.py)
function confidentWrongFlags(c: Ctx, hireId: number): Row[] {
  const hits = c.s.attempt.filter((a) => a.hire_id === hireId && !a.passed && a.confidence === 3 && !a.superseded)
    .map((a) => ({ a, m: moduleById(a.module_id)! })).filter((x) => x.m);
  if (!hits.length) return [];
  const allergen = hits.filter((h) => h.m.slug === "allergy");
  const h = (allergen.length ? allergen : hits)[0];
  const q = h.m.questions.find((q: Row) => q.id === h.a.question_id);
  const qtext = q ? pick(q.prompt, "en") : "";
  if (allergen.length) {
    return [{ kind: "allergen_risk", label: "Confidently wrong on an allergen check",
      detail: `Was very sure, but missed: “${qtext}” Review allergy hand-off before first shift.`, module: pick(h.m.title, "en") }];
  }
  return [{ kind: "confident_miss", label: `Confident miss: ${pick(h.m.title, "en")}`,
    detail: `Was very sure, but missed: “${qtext}”`, module: pick(h.m.title, "en") }];
}

function moduleProgress(c: Ctx, hireId: number | null, role: string): Row[] {
  const results: Record<number, Row> = {};
  if (hireId) for (const r of c.s.module_result) if (r.hire_id === hireId) results[r.module_id] = r;
  return modulesFor(role).map((m) => {
    const r = results[m.id];
    return { id: m.id, slug: m.slug, icon: m.icon, title: pick(m.title, "en"),
      passed: !!(r && r.passed), score: r ? r.score : null, confidence: r ? r.confidence : null };
  });
}

function flagsFor(mods: Row[]): Row[] {
  const done = mods.filter((m) => m.passed && m.confidence);
  const flags: Row[] = [];
  if (!done.length) return flags;
  const avg = done.reduce((s, m) => s + m.score, 0) / done.length;
  const nervous = done.filter((m) => m.confidence === 1);
  if (nervous.length && avg >= 0.85) {
    flags.push({ kind: "buddy", label: "Needs a buddy shift",
      detail: `Scored ${Math.round(avg * 100)}% but feels unsure about ${nervous[0].title}.`, module: nervous[0].title });
  }
  const sureMissed = done.filter((m) => m.confidence === 3 && m.score < 0.7);
  if (sureMissed.length) {
    const m = sureMissed[0];
    flags.push({ kind: "double_check", label: `Double-check: ${m.title}`,
      detail: `Felt very sure, but missed ${Math.round((1 - m.score) * 3)} of 3 on first try.`, module: m.title });
  }
  return flags;
}

function ticket(c: Ctx, cand: Row): Row {
  const job = c.s.job.find((j) => j.id === cand.job_id) || { role: "server", title: "" };
  const h = c.s.hire.find((x) => x.candidate_id === cand.id) || null;
  const mods = moduleProgress(c, h ? h.id : null, job.role);
  let flags = h ? flagsFor(mods) : [];
  let prefs: string[] = [];
  if (h) {
    flags = [...confidentWrongFlags(c, h.id), ...flags];
    prefs = h.prefs || [];
    const used: Record<number, string[]> = {};
    for (const f of c.s.format_use.filter((f) => f.hire_id === h.id)) (used[f.module_id] ||= []).push(f.format);
    for (const m of mods) m.formats = used[m.id] || [];
  }
  const done = mods.filter((m) => m.passed);
  const firstTryPct = done.length ? Math.round(100 * done.reduce((s, m) => s + m.score, 0) / done.length) : 0;
  const confs = mods.map((m) => m.confidence).filter(Boolean);
  let sentBack = null;
  if (h && h.sent_back_module_id) {
    const sm = mods.find((m) => m.id === h.sent_back_module_id);
    sentBack = { module_id: h.sent_back_module_id, module: sm ? sm.title : "", note: h.sent_back_note_original };
  }
  return {
    id: cand.id, ticket_no: cand.ticket_no, name: cand.name, role: job.role, job_title: job.title, lang: cand.preferred_lang,
    status: cand.status, source_channel: cand.source_channel, applied_at: cand.created_at, updated_at: cand.updated_at,
    work_prefs: cand.work_prefs || [],
    hire: !h ? null : {
      id: h.id, token: h.token, path: `/t/${h.token}`, lang: h.lang, started_at: h.started_at, stamped_at: h.stamped_at,
      modules: mods, flags, first_try_pct: firstTryPct, confidence: confs.length ? confs[confs.length - 1] : null,
      sent_back: sentBack,
      prefs: prefs.filter((p) => PREFS[p]).map((p) => ({ id: p, label: PREFS[p][0] })),
      setup_notes: prefs.filter((p) => PREFS[p]).map((p) => PREFS[p][1]),
      formats_used: [...new Set(mods.flatMap((m) => (m.formats || []).map((f: string) => FORMAT_LABELS[f] || f)))].sort(),
    },
    summary: mockSummary({ name: cand.name, status: cand.status, source_channel: cand.source_channel,
      lang_name: LANG_NAMES[cand.preferred_lang] || "English", modules: mods, flags, first_try_pct: firstTryPct }),
  };
}

function metrics(tickets: Row[]): Row {
  const onRail = tickets.filter((t) => t.status !== "SHIFT_READY");
  const ready = tickets.filter((t) => t.status === "SHIFT_READY" && t.hire);
  const days: number[] = [];
  for (const t of ready) {
    if (t.hire.started_at && t.hire.stamped_at) days.push((Date.parse(t.hire.stamped_at) - Date.parse(t.hire.started_at)) / 86400e3);
  }
  const hired = tickets.filter((t) => t.hire);
  const total = hired.reduce((s, t) => s + t.hire.modules.length, 0);
  const passed = hired.reduce((s, t) => s + t.hire.modules.filter((m: Row) => m.passed).length, 0);
  return {
    on_rail: onRail.length,
    avg_days_to_ready: days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null,
    completion_rate: total ? Math.round((100 * passed) / total) : 0,
    approvals_with_evidence: ready.length,
    flags: hired.filter((t) => t.hire.flags.length).length,
  };
}

function board(c: Ctx): Row {
  const cands = c.s.candidate.filter((x) => x.status !== "PRACTICE")
    .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || "") || b.id - a.id);
  const tickets = cands.map((x) => ticket(c, x));
  const columns: Record<string, Row[]> = {};
  for (const s of STATUSES) columns[s] = tickets.filter((t) => t.status === s);
  const jobs = c.s.job.filter((j) => !j.closed).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((j) => ({
    id: j.id, role: j.role, title: j.title, pay_range: j.pay_range, schedule: j.schedule, languages: j.languages,
    channels: (j.posts || []).length, created_at: j.created_at, applicants: cands.filter((x) => x.job_id === j.id).length,
  }));
  return { jobs, columns, metrics: metrics(tickets), public_base: c.opt.publicBase || null };
}

function move(c: Ctx, candidateId: number, to: string) {
  const cand = c.s.candidate.find((x) => x.id === candidateId);
  if (cand) { cand.status = to; cand.updated_at = nowIso(); c.touch(); }
}

function recompute(c: Ctx, candidateId: number): string {
  const cand = c.s.candidate.find((x) => x.id === candidateId);
  if (!cand || !["TRAINING", "REVIEW"].includes(cand.status)) return cand ? cand.status : "";
  const job = c.s.job.find((j) => j.id === cand.job_id)!;
  const h = c.s.hire.find((x) => x.candidate_id === candidateId)!;
  const mods = moduleProgress(c, h.id, job.role);
  const next = mods.length && mods.every((m) => m.passed && m.confidence) ? "REVIEW" : "TRAINING";
  if (next !== cand.status) move(c, candidateId, next);
  return next;
}

function insights(c: Ctx, limit = 3): Row[] {
  const live = new Set(c.s.hire.filter((h) => {
    const cand = c.s.candidate.find((x) => x.id === h.candidate_id);
    return cand && cand.status !== "PRACTICE";
  }).map((h) => h.id));
  const first: Record<string, Row> = {};
  for (const a of [...c.s.attempt].sort((x, y) => x.id - y.id)) {
    if (!live.has(a.hire_id)) continue;
    const k = `${a.hire_id}|${a.module_id}|${a.question_id}`;
    if (!first[k]) first[k] = a;
  }
  const stats: Record<string, { mid: number; qid: string; attempted: number; missed: number }> = {};
  for (const a of Object.values(first)) {
    const k = `${a.module_id}|${a.question_id}`;
    const s = (stats[k] ||= { mid: a.module_id, qid: a.question_id, attempted: 0, missed: 0 });
    s.attempted++;
    if (!a.passed) s.missed++;
  }
  const out: Row[] = [];
  for (const s of Object.values(stats)) {
    if (!s.missed) continue;
    const m = moduleById(s.mid);
    const q = m?.questions.find((q: Row) => q.id === s.qid);
    if (!m || !q) continue;
    const hint = m.cards.find((cd: Row) => cd.id === q.hint_card);
    out.push({ module: pick(m.title, "en"), module_icon: m.icon, role: m.role, question: pick(q.prompt, "en"),
      missed: s.missed, attempted: s.attempted, lesson_line: hint ? pick(hint.text, "en") : "" });
  }
  out.sort((a, b) => b.missed / b.attempted - a.missed / a.attempted || b.missed - a.missed);
  return out.slice(0, limit);
}

// ---------------------------------------------------------------- seed (port of backend/seed.py)
export async function freshState(): Promise<State> {
  const s: State = { seq: {}, job: [], candidate: [], hire: [], attempt: [], format_use: [], account: [], session: [], module_result: [], ai_cache: {} };
  await seed(s);
  return s;
}

async function seed(s: State) {
  for (const k of ["job", "candidate", "hire", "attempt", "format_use", "module_result"] as const) { s[k] = []; s.seq[k] = 0; }
  const c = new Ctx(s, { store: null as any, ai: null, mediaBase: "" }, new Request("http://x"), new URL("http://x"), null);
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const acctIds: Record<string, number> = {};
  for (const a of PEOPLE.accounts) {
    const ex = s.account.find((x) => x.email === a.email);
    if (ex) { acctIds[a.candidate || a.email] = ex.id; continue; }
    acctIds[a.candidate || a.email] = c.insert("account", {
      email: a.email, name: a.name, role: a.role, pw_hash: await hashPw(PEOPLE.demo_password), lang: a.lang, created_at: iso(now),
    });
  }
  const jobIds: Record<string, number> = {};
  for (const j of PEOPLE.jobs) {
    const job = { role: j.role, title: j.title, location: j.location, pay_range: j.pay_range, schedule: j.schedule,
      requirements: j.requirements, languages: j.languages, notes: "" };
    jobIds[j.key] = c.insert("job", { ...job, posts: mockJobPosts(job), task_cards: defaultTaskCards(job), posts_by: "template",
      closed: false, created_at: iso(now - j.days_ago * 86400e3) });
  }
  const bySlug: Record<string, Row> = Object.fromEntries(MODS.map((m) => [m.slug, m]));
  for (const cd of PEOPLE.candidates) {
    const created = iso(now - cd.applied_days_ago * 86400e3 - 3 * 3600e3);
    const cid = c.insert("candidate", { job_id: jobIds[cd.job], ticket_no: cd.ticket, name: cd.name, preferred_lang: cd.lang,
      source_channel: cd.source, status: cd.status, created_at: created, updated_at: created, account_id: acctIds[cd.name] ?? null,
      work_prefs: cd.hire?.prefs || [] });
    const h = cd.hire;
    if (!h) continue;
    const started = now - h.started_days_ago * 86400e3 - 2 * 3600e3;
    const stamped = "stamped_days_ago" in h ? iso(now - h.stamped_days_ago * 86400e3) : null;
    const hid = c.insert("hire", { candidate_id: cid, token: h.token, lang: cd.lang, started_at: iso(started), stamped_at: stamped,
      stamped_by: stamped ? "Manager" : null, sent_back_module_id: null, sent_back_note: null, sent_back_note_original: null, prefs: h.prefs || [] });
    h.modules.forEach((mr: Row, i: number) => {
      const m = bySlug[mr.slug];
      const at = iso(started + 4 * 3600e3 * (i + 1));
      for (const fmt of mr.formats || ["read"]) {
        if (!s.format_use.some((f) => f.hire_id === hid && f.module_id === m.id && f.format === fmt)) {
          c.insert("format_use", { hire_id: hid, module_id: m.id, format: fmt, created_at: at });
        }
      }
      for (const q of m.questions) {
        if (mr.missed.includes(q.id)) {
          c.insert("attempt", { hire_id: hid, module_id: m.id, question_id: q.id, answer: "(seed)", passed: false, feedback: "",
            superseded: false, confidence: (mr.confident_wrong || []).includes(q.id) ? 3 : 2, created_at: at });
        }
        c.insert("attempt", { hire_id: hid, module_id: m.id, question_id: q.id, answer: "(seed)", passed: true, feedback: "",
          superseded: false, confidence: null, created_at: at });
      }
      c.insert("module_result", { hire_id: hid, module_id: m.id, passed: true,
        score: (m.questions.length - mr.missed.length) / m.questions.length, confidence: mr.confidence, updated_at: at });
    });
  }
}

// ---------------------------------------------------------------- media + training views
function mediaFor(c: Ctx, slug: string): Row {
  const m = (MEDIA.modules || {})[slug] || {};
  const fix = (v: any): any =>
    typeof v === "string" ? (v.startsWith("/media/") ? c.opt.mediaBase + v.slice(7) : v)
      : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)])) : v;
  return fix(m);
}
const secondsPerCard = (slug: string) => Number((MEDIA.modules || {})[slug]?.seconds_per_card || 6);

function hireByToken(c: Ctx, token: string): Row {
  const h = c.s.hire.find((x) => x.token === token);
  const cand = h && c.s.candidate.find((x) => x.id === h.candidate_id);
  const job = cand && c.s.job.find((j) => j.id === cand.job_id);
  if (!h || !cand || !job) throw new HttpError(404, "This training link isn't active.");
  return { h, cand, role: job.role };
}

function hireStatus(h: Row, cand: Row): Row {
  return { status: cand.status, stamped_at: h.stamped_at,
    sent_back: h.sent_back_module_id ? { module_id: h.sent_back_module_id, note: h.sent_back_note, original: h.sent_back_note_original } : null };
}

function localizeModule(c: Ctx, m: Row, lang: string, hireId: number): Row {
  const res = c.s.module_result.find((r) => r.hire_id === hireId && r.module_id === m.id);
  const answered = [...new Set(c.s.attempt.filter((a) => a.hire_id === hireId && a.module_id === m.id && a.passed && !a.superseded)
    .map((a) => a.question_id))].sort();
  return {
    id: m.id, slug: m.slug, icon: m.icon, title: pick(m.title, lang),
    cards: m.cards.map((cd: Row) => ({ id: cd.id, icon: cd.icon, text: pick(cd.text, lang) })),
    questions: m.questions.map((q: Row) => ({ id: q.id, type: q.type, prompt: pick(q.prompt, lang),
      options: (q.options || []).map((o: Row) => ({ id: o.id, text: pick(o.text, lang), icon: o.icon || "" })) })),
    media: mediaFor(c, m.slug), seconds_per_card: secondsPerCard(m.slug),
    passed: !!(res && res.passed), confidence: res ? res.confidence : null, answered,
  };
}

function jobOut(j: Row): Row {
  return { id: j.id, role: j.role, title: j.title, location: j.location, pay_range: j.pay_range, schedule: j.schedule,
    notes: j.notes, created_at: j.created_at, requirements: j.requirements, languages: j.languages, posts: j.posts || [],
    task_cards: j.task_cards || [], posts_by: j.posts_by || "template", closed: !!j.closed };
}
function jobPublic(j: Row): Row {
  const posts: Row[] = j.posts || [];
  return { id: j.id, role: j.role, area: ROLE_LABEL[j.role] || "", title: j.title, location: j.location, pay_range: j.pay_range,
    schedule: j.schedule, requirements: j.requirements, languages: j.languages, created_at: j.created_at,
    listing: posts.find((p) => p.channel === "job_board")?.text || "", easy_read: posts.find((p) => p.channel === "easy_read")?.text || "",
    task_cards: j.task_cards || [] };
}
const publicAcct = (a: Row | null) => a ? { id: a.id, email: a.email, name: a.name, role: a.role, lang: a.lang || "en" } : null;

async function startSession(c: Ctx, accountId: number): Promise<string> {
  const token = randToken(32);
  c.s.session = c.s.session.filter((x) => Date.now() - Date.parse(x.created_at) < 14 * 86400e3).slice(-500);
  c.insert("session", { token, account_id: accountId, created_at: nowIso() });
  return token;
}

// Mocked interview slots: the next three weekday afternoons (scheduling is DEMO ONLY).
function interviewSlots(lang: string): string[] {
  const out: string[] = [];
  const loc = lang === "zh" ? "zh-CN" : lang === "yue" ? "zh-HK" : lang === "es" ? "es-ES" : "en-US";
  const tz = "America/Los_Angeles";
  for (let day = 1; out.length < 3 && day < 10; day++) {
    const d = new Date(Date.now() + day * 86400e3);
    const wd = d.toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
    if (wd === "Sat" || wd === "Sun") continue;
    out.push(d.toLocaleDateString(loc, { weekday: "long", month: "short", day: "numeric", timeZone: tz }) + " · 3:00 PM");
  }
  return out;
}
const APPLY_REPLY: Record<string, string> = {
  en: "Thank you, {name}! We got your application for {title}. No résumé needed. You can start the training now, in your language. Pick a time below to meet the manager.",
  zh: "谢谢你，{name}！我们收到了你对「{title}」的申请。不需要简历。你现在就可以用中文开始培训。请在下面选一个时间和经理见面。", yue: "多謝你，{name}！我哋收到你申請「{title}」。唔使履歷。你而家就可以用廣東話開始培訓。請喺下面揀個時間同經理見面。",
  es: "¡Gracias, {name}! Recibimos tu solicitud para {title}. No necesitas currículum. Puedes empezar la capacitación ahora, en tu idioma. Elige un horario abajo para conocer al gerente.",
};

// ---------------------------------------------------------------- routes
type Handler = (c: Ctx, p: string[]) => Promise<any> | any;
const routes: [string, RegExp, Handler][] = [];
const on = (method: string, pattern: string, h: Handler) =>
  routes.push([method, new RegExp("^" + pattern.replace(/:(\w+)/g, "([^/]+)") + "$"), h]);

on("GET", "/api/health", (c) => ({ ok: true, mode: c.opt.ai ? "live" : "mock", provider: c.opt.ai ? "enter" : "mock" }));

// auth
on("GET", "/api/auth/me", (c) => ({ account: publicAcct(c.account()) }));
on("POST", "/api/auth/signup", async (c) => {
  const b = c.body || {};
  const email = String(b.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
  if (String(b.password || "").length < 8) throw new HttpError(400, "Use at least 8 characters for your password.");
  if (!String(b.name || "").trim()) throw new HttpError(400, "Enter your name.");
  if (c.s.account.some((a) => a.email === email)) throw new HttpError(409, "An account with this email already exists. Sign in instead.");
  const lang = LANGS.includes(b.lang) ? b.lang : "en";
  const id = c.insert("account", { email, name: String(b.name).trim().slice(0, 80), role: "applicant",
    pw_hash: await hashPw(String(b.password)), lang, created_at: nowIso() });
  const session = await startSession(c, id);
  return { account: publicAcct(c.s.account.find((a) => a.id === id)!), session };
});
on("POST", "/api/auth/login", async (c) => {
  const b = c.body || {};
  const a = c.s.account.find((x) => x.email === String(b.email || "").trim().toLowerCase());
  if (!a || !(await checkPw(String(b.password || ""), a.pw_hash))) throw new HttpError(401, "That email and password don't match.");
  return { account: publicAcct(a), session: await startSession(c, a.id) };
});
on("POST", "/api/auth/demo", async (c) => {
  // [DEMO ONLY] One-click sign-in to the seeded demo accounts, so judges never need a password.
  const email = ({ manager: "manager@firstshift.test", applicant: "lin@firstshift.test" } as Record<string, string>)[c.body?.role];
  const a = email && c.s.account.find((x) => x.email === email);
  if (!a) throw new HttpError(404, "Demo account not found.");
  return { account: publicAcct(a), session: await startSession(c, a.id) };
});
on("POST", "/api/auth/logout", (c) => {
  const tok = c.req.headers.get("x-fs-session");
  if (tok) { c.s.session = c.s.session.filter((x) => x.token !== tok); c.touch(); }
  return { ok: true };
});

// careers (applicant side)
on("GET", "/api/careers/jobs", (c) => ({
  jobs: c.s.job.filter((j) => !j.closed).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(jobPublic),
}));
on("GET", "/api/careers/jobs/:id", (c, [id]) => {
  const j = c.s.job.find((x) => x.id === Number(id) && !x.closed);
  if (!j) throw new HttpError(404, "This job is no longer open.");
  return jobPublic(j);
});
on("POST", "/api/careers/jobs/:id/apply", (c, [id]) => {
  const a = c.requireAccount();
  if (a.role !== "applicant") throw new HttpError(403, "Sign in with an applicant account to apply.");
  const j = c.s.job.find((x) => x.id === Number(id) && !x.closed);
  if (!j) throw new HttpError(404, "This job is no longer open.");
  if (c.s.candidate.some((x) => x.account_id === a.id && x.job_id === j.id && x.status !== "PRACTICE")) {
    throw new HttpError(409, "You've already applied to this job.");
  }
  const b = c.body || {};
  const lang = LANGS.includes(b.lang) ? b.lang : (a.lang || "en");
  const prefs = (Array.isArray(b.prefs) ? b.prefs : []).filter((p: string) => PREFS[p]);
  const next = Math.max(400, ...c.s.candidate.map((x) => x.ticket_no || 0)) + 1;
  const cid = c.insert("candidate", { job_id: j.id, ticket_no: next, name: a.name, preferred_lang: lang,
    source_channel: b.source || "FirstShift jobs", status: "APPLIED", created_at: nowIso(), updated_at: nowIso(),
    account_id: a.id, work_prefs: prefs, note: String(b.note || "").slice(0, 500) });
  const reply = (APPLY_REPLY[lang] || APPLY_REPLY.en).replace("{name}", a.name.split(" ")[0]).replace("{title}", j.title);
  return { ok: true, application_id: cid, reply, lang, interview_slots: interviewSlots(lang), interview_note: "Interview times are a demo preview." };
});
on("GET", "/api/me/applications", (c) => {
  const a = c.requireAccount();
  const out = c.s.candidate.filter((x) => x.account_id === a.id && x.status !== "PRACTICE")
    .sort((x, y) => y.created_at.localeCompare(x.created_at)).map((cand) => {
      const j = c.s.job.find((x) => x.id === cand.job_id)!;
      const h = c.s.hire.find((x) => x.candidate_id === cand.id);
      const total = modulesFor(j.role).length;
      const passed = h ? c.s.module_result.filter((r) => r.hire_id === h.id && r.passed).length : 0;
      return { id: cand.id, job_id: cand.job_id, title: j.title, role: j.role, location: j.location, schedule: j.schedule,
        status: cand.status, applied_at: cand.created_at, training: h ? { token: h.token, passed, total } : null,
        stamped_at: h ? h.stamped_at : null };
    });
  return { applications: out };
});
on("GET", "/api/learn/courses", (c) => ({
  courses: ["server", "kitchen"].map((role) => {
    const mods = modulesFor(role);
    return { role, title: COURSE_TITLE[role], area: ROLE_LABEL[role], blurb: COURSE_BLURB[role],
      sections: mods.map((m) => ({ title: pick(m.title, "en"), icon: m.icon, lessons: m.cards.length, questions: m.questions.length,
        has_video: !!mediaFor(c, m.slug).video })),
      lessons: mods.reduce((s, m) => s + m.cards.length, 0), quizzes: mods.length };
  }),
}));
on("POST", "/api/learn/session", (c) => {
  const role = c.body?.role;
  if (!COURSE_TITLE[role]) throw new HttpError(400, "Unknown course");
  const a = c.account();
  const roleOf = (cand: Row) => c.s.job.find((j) => j.id === cand.job_id)?.role;
  if (a) {
    const cands = c.s.candidate.filter((x) => x.account_id === a.id && roleOf(x) === role && ["TRAINING", "REVIEW", "SHIFT_READY"].includes(x.status))
      .sort((x, y) => y.id - x.id);
    for (const cand of cands) {
      const h = c.s.hire.find((x) => x.candidate_id === cand.id);
      if (h) return { token: h.token, mode: "hired" };
    }
  }
  if (c.body?.token) {
    const h = c.s.hire.find((x) => x.token === c.body.token);
    const cand = h && c.s.candidate.find((x) => x.id === h.candidate_id);
    if (h && cand && cand.status === "PRACTICE" && roleOf(cand) === role && (cand.account_id == null || (a && cand.account_id === a.id))) {
      if (a && cand.account_id == null) { cand.account_id = a.id; cand.name = a.name; c.touch(); }
      return { token: h.token, mode: "practice" };
    }
  }
  if (a) {
    const cand = c.s.candidate.filter((x) => x.account_id === a.id && roleOf(x) === role && x.status === "PRACTICE").sort((x, y) => y.id - x.id)[0];
    const h = cand && c.s.hire.find((x) => x.candidate_id === cand.id);
    if (h) return { token: h.token, mode: "practice" };
  }
  const job = c.s.job.filter((j) => j.role === role).sort((x, y) => x.id - y.id)[0];
  if (!job) throw new HttpError(404, "No course content for this role yet");
  const lang = (a && a.lang) || "en";
  const cid = c.insert("candidate", { job_id: job.id, ticket_no: 0, name: a ? a.name : "Learner", preferred_lang: lang,
    source_channel: "Practice", status: "PRACTICE", created_at: nowIso(), updated_at: nowIso(), account_id: a ? a.id : null, work_prefs: [] });
  const token = "p-" + randToken(9).replace(/-/g, "x").replace(/_/g, "y");
  c.insert("hire", { candidate_id: cid, token, lang, started_at: nowIso(), stamped_at: null, stamped_by: null,
    sent_back_module_id: null, sent_back_note: null, sent_back_note_original: null, prefs: [] });
  return { token, mode: "practice" };
});

// jobs (manager)
on("GET", "/api/meta", (c) => ({
  roles: ROLES.roles, requirements: ROLES.requirements, languages: ROLES.languages, pilot_languages: ROLES.pilot_languages,
  channels: ROLES.channels, send_back_notes: ROLES.send_back_notes,
  ai: { mode: c.opt.ai ? "live" : "mock", provider: c.opt.ai ? "Enter AI (Converge.AI)" : "mock" },
}));
on("POST", "/api/jobs", async (c) => {
  c.requireManager();
  const b = c.body || {};
  const title = String(b.title || "").trim();
  if (!title) throw new HttpError(400, "Give the role a title");
  if (!ROLES.roles[b.role]) throw new HttpError(400, "Pick a role we have training for (server or kitchen prep).");
  const job = { role: b.role, title, location: String(b.location || "Palo Alto, CA"), pay_range: String(b.pay_range || ""),
    schedule: String(b.schedule || ""), requirements: (b.requirements || []).filter((r: string) => ROLES.requirements[r]),
    languages: (b.languages?.length ? b.languages : ["en", "zh", "yue", "es"]).filter((l: string) => LANGS.includes(l)),
    notes: String(b.notes || "").slice(0, 600) };
  const { posts, task_cards, by } = await generateJobPosts(c, job);
  const id = c.insert("job", { ...job, posts, task_cards, posts_by: by, closed: false, created_at: nowIso() });
  return jobOut(c.s.job.find((j) => j.id === id)!);
});
on("GET", "/api/jobs/:id", (c, [id]) => {
  c.requireManager();
  const j = c.s.job.find((x) => x.id === Number(id));
  if (!j) throw new HttpError(404, "Job not found");
  return jobOut(j);
});
on("POST", "/api/jobs/:id/close", (c, [id]) => {
  c.requireManager();
  const j = c.s.job.find((x) => x.id === Number(id));
  if (!j) throw new HttpError(404, "Job not found");
  j.closed = c.body?.reopen !== true;
  c.touch();
  return { ok: true, closed: j.closed };
});
on("GET", "/api/jobs/:id/export", (c, [id]) => {
  c.requireManager();
  const j = c.s.job.find((x) => x.id === Number(id));
  if (!j) throw new HttpError(404, "Job not found");
  const out = jobOut(j);
  const name = `firstshift-job-${j.id}`;
  if (c.url.searchParams.get("fmt") === "json") {
    return new Response(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${name}.json"` } });
  }
  const esc = (v: any) => { const s = String(v ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [["channel", "label", "lang", "char_count", "limit", "text"].join(",")];
  for (const p of out.posts) lines.push([p.channel, p.label, p.lang, [...p.text].length, p.limit, p.text].map(esc).join(","));
  return new Response("﻿" + lines.join("\r\n") + "\r\n", { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"` } });
});

// the rail (manager)
on("GET", "/api/board", (c) => { c.requireManager(); return board(c); });
on("GET", "/api/insights", (c) => { c.requireManager(); return { gaps: insights(c, 3) }; });
on("POST", "/api/candidates/:id/hire", (c, [id]) => {
  c.requireManager();
  const cand = c.s.candidate.find((x) => x.id === Number(id));
  if (!cand) throw new HttpError(404, "Candidate not found");
  if (cand.status !== "APPLIED") throw new HttpError(409, "Already hired");
  const token = randToken(6).replace(/-/g, "x").replace(/_/g, "y");
  c.insert("hire", { candidate_id: cand.id, token, lang: cand.preferred_lang, started_at: nowIso(), stamped_at: null, stamped_by: null,
    sent_back_module_id: null, sent_back_note: null, sent_back_note_original: null, prefs: cand.work_prefs || [] });
  move(c, cand.id, "TRAINING");
  return { token, path: `/t/${token}`, ticket: ticket(c, cand) };
});
on("POST", "/api/hires/:id/stamp", (c, [id]) => {
  c.requireManager();
  const h = c.s.hire.find((x) => x.id === Number(id));
  const cand = h && c.s.candidate.find((x) => x.id === h.candidate_id);
  if (!h || !cand) throw new HttpError(404, "Hire not found");
  if (cand.status !== "REVIEW") throw new HttpError(409, "Only tickets at the pass can be stamped");
  h.stamped_at = nowIso(); h.stamped_by = "Manager";
  move(c, cand.id, "SHIFT_READY");
  return { ok: true };
});
on("POST", "/api/hires/:id/send-back", async (c, [id]) => {
  c.requireManager();
  const h = c.s.hire.find((x) => x.id === Number(id));
  const cand = h && c.s.candidate.find((x) => x.id === h.candidate_id);
  if (!h || !cand) throw new HttpError(404, "Hire not found");
  if (!["REVIEW", "TRAINING"].includes(cand.status)) throw new HttpError(409, "Only tickets in training or at the pass can be sent back");
  const moduleId = Number(c.body?.module_id);
  const note = String(c.body?.note || "").trim().slice(0, 400);
  const lang = h.lang || "en";
  const translated = note ? await translate(c, note, lang) : "";
  for (const a of c.s.attempt) if (a.hire_id === h.id && a.module_id === moduleId) a.superseded = true;
  c.s.module_result = c.s.module_result.filter((r) => !(r.hire_id === h.id && r.module_id === moduleId));
  h.sent_back_module_id = moduleId; h.sent_back_note = translated; h.sent_back_note_original = note;
  c.touch();
  if (cand.status === "REVIEW") move(c, cand.id, "TRAINING");
  return { ok: true, lang, note: translated, translated: lang === "en" || translated !== note };
});
on("POST", "/api/demo/reset", async (c) => {
  c.requireManager();
  await seed(c.s);
  c.touch();
  return { ok: true };
});

// training (the hire's side; the token is the credential)
on("GET", "/api/training/:token", (c, [token]) => {
  const { h, cand, role } = hireByToken(c, token);
  const q = c.url.searchParams.get("lang");
  const lang = q && LANGS.includes(q) ? q : (h.lang || "en");
  return {
    hire: { name: cand.name, first_name: cand.name.split(" ")[0], role, role_title: pick(ROLE_TITLES[role] || ROLE_TITLES.server, lang),
      ticket_no: cand.ticket_no, lang: h.lang, prefs: h.prefs || [], mode: cand.status === "PRACTICE" ? "practice" : "hired", ...hireStatus(h, cand) },
    lang,
    modules: modulesFor(role).map((m) => localizeModule(c, m, lang, h.id)),
  };
});
on("POST", "/api/training/:token/lang", (c, [token]) => {
  const { h, cand } = hireByToken(c, token);
  if (!LANGS.includes(c.body?.lang)) throw new HttpError(400, "Unsupported language");
  h.lang = c.body.lang; cand.preferred_lang = c.body.lang; cand.updated_at = nowIso(); c.touch();
  return { ok: true, lang: c.body.lang };
});
on("POST", "/api/training/:token/prefs", (c, [token]) => {
  const { h } = hireByToken(c, token);
  h.prefs = (c.body?.prefs || []).filter((p: string) => PREFS[p]); c.touch();
  return { ok: true, prefs: h.prefs };
});
on("POST", "/api/training/:token/format", (c, [token]) => {
  const { h } = hireByToken(c, token);
  const fmt = c.body?.format;
  if (!["read", "pictures", "video", "listen"].includes(fmt)) throw new HttpError(400, "Unknown format");
  const mid = Number(c.body?.module_id);
  if (!c.s.format_use.some((f) => f.hire_id === h.id && f.module_id === mid && f.format === fmt)) {
    c.insert("format_use", { hire_id: h.id, module_id: mid, format: fmt, created_at: nowIso() });
  }
  return { ok: true };
});
on("POST", "/api/training/:token/answers", async (c, [token]) => {
  const { h, cand, role } = hireByToken(c, token);
  if (cand.status === "SHIFT_READY") throw new HttpError(409, "Already shift-ready");
  const b = c.body || {};
  const m = moduleById(Number(b.module_id));
  if (!m || m.role !== role) throw new HttpError(404, "Module not found");
  const q = m.questions.find((x: Row) => x.id === b.question_id);
  if (!q) throw new HttpError(404, "Question not found");
  const lang = h.lang || "en";
  const prior = c.s.attempt.filter((a) => a.hire_id === h.id && a.module_id === m.id && a.question_id === q.id && !a.superseded).length;
  const answer = String(b.answer ?? "");
  let result: Row;
  if (q.type === "mc") {
    const passed = answer === q.answer;
    result = { passed, feedback: t(passed ? "mc_correct" : "almost", lang), hint_card: passed ? null : q.hint_card, matched_points: [], missing_points: [] };
  } else if (answer.trim().length < 2) {
    result = { passed: false, feedback: t("free_empty", lang), hint_card: null, matched_points: [], missing_points: [] };
  } else {
    const g = await gradeAnswer(c, pick(q.prompt, "en"), q.rubric, answer.trim(), lang);
    result = { ...g, hint_card: g.passed ? null : q.hint_card };
  }
  const conf = [1, 2, 3].includes(b.confidence) ? b.confidence : null;
  c.insert("attempt", { hire_id: h.id, module_id: m.id, question_id: q.id, answer: answer.slice(0, 1000), passed: !!result.passed,
    feedback: result.feedback, superseded: false, confidence: conf, created_at: nowIso() });
  let hintText = null;
  if (result.hint_card) {
    const card = m.cards.find((cd: Row) => cd.id === result.hint_card);
    hintText = card ? pick(card.text, lang) : null;
  }
  let moduleComplete = false;
  const live = c.s.attempt.filter((a) => a.hire_id === h.id && a.module_id === m.id && !a.superseded);
  const passedQ = new Set(live.filter((a) => a.passed).map((a) => a.question_id));
  if (m.questions.every((qq: Row) => passedQ.has(qq.id))) {
    const firsts: Record<string, Row> = {};
    for (const a of [...live].sort((x, y) => x.id - y.id)) if (!firsts[a.question_id]) firsts[a.question_id] = a;
    const score = Object.values(firsts).filter((a) => a.passed).length / m.questions.length;
    const ex = c.s.module_result.find((r) => r.hire_id === h.id && r.module_id === m.id);
    if (ex) { ex.passed = true; ex.score = score; ex.updated_at = nowIso(); }
    else c.insert("module_result", { hire_id: h.id, module_id: m.id, passed: true, score, confidence: null, updated_at: nowIso() });
    moduleComplete = true;
  }
  cand.updated_at = nowIso(); c.touch();
  return { ...result, hint_text: hintText, first_try: prior === 0, module_complete: moduleComplete };
});
on("POST", "/api/training/:token/confidence", (c, [token]) => {
  const { h, cand } = hireByToken(c, token);
  const v = c.body?.confidence;
  if (![1, 2, 3].includes(v)) throw new HttpError(400, "confidence must be 1, 2 or 3");
  const mid = Number(c.body?.module_id);
  const res = c.s.module_result.find((r) => r.hire_id === h.id && r.module_id === mid);
  if (!res) throw new HttpError(409, "Finish the checks for this step first");
  res.confidence = v; res.updated_at = nowIso();
  if (h.sent_back_module_id === mid) { h.sent_back_module_id = null; h.sent_back_note = null; h.sent_back_note_original = null; }
  c.touch();
  return { ok: true, status: recompute(c, cand.id) };
});
on("GET", "/api/training/:token/status", (c, [token]) => {
  const { h, cand } = hireByToken(c, token);
  return hireStatus(h, cand);
});

// ---------------------------------------------------------------- entry point
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-fs-session",
  "Access-Control-Expose-Headers": "content-disposition",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" } });

export function createHandler(opt: Options) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    // Supabase routes /functions/v1/<name>/api/... to us; accept any prefix before /api/.
    const i = url.pathname.indexOf("/api/");
    const path = i >= 0 ? url.pathname.slice(i).replace(/\/+$/, "") : url.pathname;
    let match: [Handler, string[]] | null = null;
    let pathKnown = false;
    for (const [m, re, h] of routes) {
      const r = re.exec(path);
      if (!r) continue;
      pathKnown = true;
      if (m === req.method) { match = [h, r.slice(1).map(decodeURIComponent)]; break; }
    }
    if (!match) return json({ detail: pathKnown ? "Method not allowed" : "Not found" }, pathKnown ? 405 : 404);
    let body: any = null;
    if (req.method === "POST") {
      const txt = await req.text();
      if (txt) { try { body = JSON.parse(txt); } catch { return json({ detail: "Body must be JSON" }, 400); } }
    }
    for (let attempt = 0; attempt < 4; attempt++) {
      const loaded = await opt.store.load();
      let version = loaded ? loaded.version : 0;
      let state: State;
      if (!loaded) {
        state = await freshState();
        if (!(await opt.store.save(state, 0))) continue; // someone else seeded first: reload
        version = 1;
      } else state = loaded.state;
      const c = new Ctx(state, opt, req, url, body);
      let out: any;
      try {
        out = await match[0](c, match[1]);
      } catch (e) {
        if (e instanceof HttpError) return json({ detail: e.detail }, e.status);
        console.error("handler error", e);
        return json({ detail: "Something went wrong. Please try again." }, 500);
      }
      if (c.dirty && !(await opt.store.save(state, version))) continue; // concurrent write: rerun on fresh state
      if (out instanceof Response) {
        const h = new Headers(out.headers);
        for (const [k, v] of Object.entries(CORS)) h.set(k, v);
        return new Response(out.body, { status: out.status, headers: h });
      }
      return json(out);
    }
    return json({ detail: "Busy right now. Please try again." }, 503);
  };
}
