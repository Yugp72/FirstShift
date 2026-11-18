# FirstShift: build plan

**Team33_FirstShift** · Stanford 30x30 "We Mean Business" buildathon
Company: **Imperial Treasure Palo Alto** · Challenge: *From Hiring to Shift-Ready: Streamlining Restaurant Recruitment and Multilingual Training*
Hard deadline: **Wed Nov 18, 11:59 PM PT** (no extensions). Plan clock starts **11:30 AM PT**, ends **11:30 PM PT** with a 29-minute submission buffer.

> **For Claude Code:** this file is the single source of truth. Read sections 0, 3, 4 and 5 before writing code. Work the task table in section 5 top to bottom. Every task has acceptance criteria; a task is done only when they pass. When a section says **VERIFY**, stop and ask the human; do not guess.

---

## 0. Rules for Claude Code in this repo

1. **Mock mode is the default.** `FS_MODE=mock` must run the whole demo with zero network calls. Live mode is opt-in (`FS_MODE=live`).
2. **Every AI call goes through `backend/ai/` adapters.** No route, page or script calls an AI or Converge.AI SDK directly. This keeps the Converge.AI integration swappable while its API is unverified.
3. **Cache every live AI response** to `backend/cache/` keyed by a hash of (adapter, method, input). A second identical call must never hit the network.
4. **Respect the test budgets in section 4.4.** Use mock mode for UI work. Never put a live AI call in a test, a hot-reload path, or a `useEffect` that can loop.
5. **Seed data is fictional.** Use only the challenge brief and generic restaurant knowledge. Do not invent Imperial Treasure menu items, prices, policies, staff names or internal procedures. Label seed content as "Sample training content" in the UI footer.
6. **Visual-only controls** carry a `// [DEMO ONLY]` (or `# [DEMO ONLY]`) comment and render visually disabled with a tooltip "Coming in pilot". Nothing may throw when clicked.
7. **No generic SaaS look.** No default Tailwind/shadcn/MUI cards, no purple gradients, no hero-with-three-feature-cards. Follow section 6 exactly.
8. Commit after every green task with a message naming the task ID (e.g. `T07: hire lesson screen`).

---

## 1. Intake

- **Core idea:** A new restaurant hire opens one link, picks their language, and is walked through their role kindly and out loud, with short checks; the manager watches each hire's "ticket" move down the rail and stamps them shift-ready with one tap.
- **Problem + pain owner:** The business owner/managers at Imperial Treasure repeatedly write postings, re-explain the same procedures to staff with different language backgrounds, and can't tell when someone is actually ready to work. New hires feel the fear of day one, often in a second language.
- **Time limit:** ~12.5 hours of build from now (11:30 AM to 11:59 PM PT, Nov 18).
- **Team size:** **VERIFY.** Rules require 3 to 4 members. This plan is written so one person can ship it, with lanes marked for parallel work (section 5.2).
- **Stack:** Python/FastAPI + SQLite backend, React (Vite) + Tailwind frontend, Converge.AI product as the AI core behind an adapter, browser Web Speech API for read-aloud. Fits the operator's strengths.
- **Judging:** Business Impact 30 / Innovation 20 / Execution & AI 20 / Scalability 20 / Demo 10. Ties for 8th go to higher Business Impact, so the business story must be explicit in the UI itself (metrics strip on the manager view).

### Fatal flaw check

| Check | Result |
|---|---|
| Core demo moment demoable in the window? | **Yes.** Hire answers in Mandarin or Spanish, manager screen updates live and stamps READY. All of it can run on mock data. |
| Needs data, hardware or approvals we can't get? | **No.** Brief says not to assume external job-platform access, so job posting is copy/export only. Training content is seeded fictional content. |
| Depends on a service with strict limits? | **Risk.** Converge.AI credits are limited and its products' capabilities are unverified. See below. |

> **[FATAL FLAW RISK: Converge.AI fit]** The rules say *"The core of the solution must use at least one Converge.AI product (Covey, Enter, Framia, Combos)"* and *"only solutions built using Converge.AI products will be accepted"*. We cannot confirm from the documents what each product does or whether it exposes an API. **Task T00 resolves this in the first 30 minutes.** If no product can sit in the AI core, the fallback is to make the Converge.AI project link the working prototype (rules allow "a Converge.AI project link") and wrap our UI around what it can do. Do not spend more than 45 minutes on this before choosing.

> **Second risk:** the brief notes a previous training platform "was not fully implemented". Pitch FirstShift as a **lightweight layer** (one link, no install, works on the hire's phone), never as a platform rebuild.

---

## 2. Product scope

### 2.1 The three screens that matter

| # | Screen | User | Covers brief area |
|---|---|---|---|
| A | **Order In** (post a job) | Manager | 01 One-entry, multi-channel recruitment |
| B | **The Rail** (pipeline + readiness + approval) | Manager | 02 Unified candidate journey, 03 manager approval |
| C | **First Shift** (hire's training + checks) | New hire, on phone | 03 Multilingual learning and readiness |

Screen B is the hub. A feeds tickets onto it; C moves tickets along it.

### 2.2 Ticket lifecycle

```
POSTED ──► APPLIED ──► TRAINING ──► REVIEW ──► SHIFT-READY
 (job)    (candidate)  (hire on C)  (all modules   (manager
                                     passed)        stamped)
```

- `APPLIED` candidates are seeded (no real platform intake). A "Hire" button moves one to `TRAINING` and generates their personal link + QR.
- `REVIEW` is automatic when every module's check is passed.
- `SHIFT-READY` only via the manager's one-tap stamp. Manager can also send back one module ("Review tea service again") with a kind note that is auto-translated into the hire's language.

### 2.3 The emotional + accessibility design (the differentiator)

- **Kind checks, not quizzes.** Never show "Wrong" or a red X. Copy is "Almost. Here's the bit to look at." with the relevant line of the lesson highlighted and read aloud, then a retry.
- **Confidence check.** After each module, the hire taps how they feel (😟 / 🙂 / 💪, labelled in their language). Manager sees **score vs confidence**. A hire who scores 100% but feels 😟 is flagged "Needs a buddy shift", the insight a quiz alone can't give. This is the innovation hook.
- **Language first.** First screen is a language picker with each language written in itself (English / 中文 / Español), big buttons, no login.
- **Read-aloud everywhere.** Every lesson card and question has a speaker button using browser `speechSynthesis` with the right voice (`zh-CN`, `es-ES`, `en-US`). Autoplay off; one tap to play.
- **Low reading load.** One idea per card, max ~25 words, icon per card, large type (20px body minimum on hire screens).
- **Free-text answer in own language** (one per module): AI grades meaning, not grammar, and replies in the hire's language.
- **WCAG 2.1 AA targets:** contrast ≥ 4.5:1, tap targets ≥ 48px, full keyboard path, `lang` attribute set per content block so screen readers and TTS pronounce correctly, `aria-live="polite"` on result messages, `prefers-reduced-motion` respected (stamp animation becomes a fade).

### 2.4 Languages

Default: **English, Mandarin (Simplified), Spanish.** **VERIFY** with the team; swapping a language is a seed-data change, not a code change. Two languages done well beat six done badly.

### 2.5 Seed content (fictional, generic)

Two roles, three short modules each, 4 to 6 cards + 2 multiple-choice + 1 free-text question per module:

- **Server (front of house):** Greeting & seating, Tea service basics, Allergy questions (always ask, always tell the kitchen).
- **Kitchen prep (back of house):** Hand-washing & glove use, Cold storage & labelling (FIFO), Knife & station safety.

Seeded people: 1 open job per role, 6 to 8 `APPLIED` candidates, 3 hires already in `TRAINING` at different progress points, 1 in `REVIEW`, 2 `SHIFT-READY`. Names are fictional and diverse in language background. The demo hire ("Lin" or similar) starts at module 3 of 3 so the live demo is short.

---

## 3. Architecture

### 3.1 System diagram

```
             ┌─────────────────────────── Browser ───────────────────────────┐
             │                                                               │
  Manager ──►│  /manager  (React)                 /t/:token  (React, mobile) │◄── New hire
  laptop     │  ┌────────────┐ ┌───────────────┐  ┌────────────────────────┐ │    phone
             │  │ Order In   │ │  The Rail     │  │ First Shift            │ │
             │  │ (post job) │ │ (tickets,     │  │ lang pick → lessons →  │ │
             │  └─────┬──────┘ │  stamp READY) │  │ checks → confidence    │ │
             │        │        └──────┬────────┘  └───────────┬────────────┘ │
             │        │               │ ▲ SSE /events          │ speechSynthesis
             └────────┼───────────────┼─┼──────────────────────┼─────────────┘
                      │ REST          │ │                      │ REST
             ┌────────▼───────────────▼─┴──────────────────────▼─────────────┐
             │                  FastAPI  (backend/app.py)                     │
             │  routes/jobs   routes/hires   routes/training   routes/events  │
             │        │             │               │               ▲         │
             │        ▼             ▼               ▼               │         │
             │  ┌─────────────────────────────────────────┐   EventBus       │
             │  │  services/  (posting, readiness, grading)│──(in-proc pub/sub)│
             │  └───────────────┬─────────────────────────┘                   │
             │                  ▼                                             │
             │  ┌──────────────────── backend/ai/ ─────────────────────────┐  │
             │  │ AIProvider interface                                     │  │
             │  │   ├─ ConvergeProvider   (live, core, **VERIFY**)         │  │
             │  │   ├─ MockProvider       (default, canned JSON)           │  │
             │  │   └─ cache layer        (disk JSON, hash-keyed)          │  │
             │  └──────────────────────────────────────────────────────────┘  │
             │                  │                                             │
             │           SQLite (data/firstshift.db)  ◄── seed.py             │
             └────────────────────────────────────────────────────────────────┘
```

### 3.2 Components

| Component | Responsibility |
|---|---|
| `frontend/src/pages/Manager*` | Order In and The Rail for the manager; subscribes to SSE for live ticket moves. |
| `frontend/src/pages/Hire*` | Mobile-first hire flow: language, lessons, checks, confidence, done screen. |
| `frontend/src/lib/speak.ts` | Wraps `speechSynthesis`; picks voice by BCP-47 tag; no-ops gracefully if unsupported. |
| `backend/routes/jobs.py` | Create job from one entry; return channel-formatted posts; export CSV/JSON. |
| `backend/routes/hires.py` | Candidates, hire action (creates token), stamp, send-back. |
| `backend/routes/training.py` | Serve modules in hire's language; accept answers + confidence; return kind feedback. |
| `backend/routes/events.py` | `GET /api/events` Server-Sent Events stream of ticket changes. |
| `backend/services/readiness.py` | Computes per-hire readiness, confidence gap flag, team knowledge gaps. |
| `backend/services/grading.py` | Multiple choice graded locally; free text graded via `AIProvider.grade_answer`. |
| `backend/ai/` | The only place AI is called. Provider chosen by env. Caches all live results. |
| `backend/seed.py` | Builds DB from `backend/seed/*.json` (content is pre-translated and checked in). |

### 3.3 Critical data flow (the demo moment)

1. Hire on phone (`/t/abc123`, language `zh`) submits the free-text answer for "Allergy questions".
2. `POST /api/training/abc123/answers` → `grading.grade_free_text()` → `AIProvider.grade_answer(question, rubric, answer, lang="zh")`.
3. Provider returns `{passed, feedback_in_lang, matched_points[]}` (from cache or Converge.AI or mock).
4. `readiness.recompute(hire)` → all modules passed → status `REVIEW`; confidence recorded.
5. Event `{type:"ticket.moved", hire_id, to:"REVIEW"}` published on EventBus → SSE → manager's Rail slides the ticket into the REVIEW column with a bell sound (muted by default) and the readiness summary.
6. Manager clicks **STAMP READY** → `POST /api/hires/{id}/stamp` → status `SHIFT-READY` → SSE → stamp animation on the Rail; the hire's phone (polling `GET /api/training/abc123/status` every 3s or listening to SSE) shows "You're ready for your first shift" in Mandarin, read aloud.

### 3.4 Data model (SQLite via SQLModel)

```
Job(id, role, title, location, pay_range, schedule, requirements[], languages[], created_at)
Candidate(id, job_id, name, preferred_lang, source_channel, status, created_at)
  status ∈ APPLIED | TRAINING | REVIEW | SHIFT_READY
Hire(id, candidate_id, token, lang, started_at, stamped_at, stamped_by, sent_back_module_id?)
Module(id, role, order, slug, content_json)          # content_json holds every language
Attempt(id, hire_id, module_id, question_id, answer, passed, feedback, created_at)
ModuleResult(id, hire_id, module_id, passed, score, confidence)   # confidence ∈ 1|2|3
```

### 3.5 API

| Method | Path | Notes |
|---|---|---|
| POST | `/api/jobs` | One entry → job + `posts[]` per channel (AI) |
| GET | `/api/jobs/{id}/export?fmt=csv\|json` | Download all channel posts |
| GET | `/api/board` | All tickets grouped by status + metrics strip |
| POST | `/api/candidates/{id}/hire` | → Hire with token, returns link + QR data URL |
| POST | `/api/hires/{id}/stamp` | → SHIFT_READY |
| POST | `/api/hires/{id}/send-back` | `{module_id, note}` → note translated to hire's lang (AI) |
| GET | `/api/training/{token}` | Modules for this hire in their language + progress |
| POST | `/api/training/{token}/lang` | Set language |
| POST | `/api/training/{token}/answers` | Grade answer, return kind feedback |
| POST | `/api/training/{token}/confidence` | `{module_id, confidence}` |
| GET | `/api/training/{token}/status` | For the hire's "you're ready" screen |
| GET | `/api/events` | SSE |
| GET | `/api/insights` | Team knowledge gaps (most-missed questions) |
| POST | `/api/demo/reset` | Reseed DB; used before every demo take |

### 3.6 AI provider interface

```python
class AIProvider(Protocol):
    def generate_job_posts(self, job: JobInput, channels: list[str]) -> list[ChannelPost]: ...
    def grade_answer(self, question: str, rubric: list[str], answer: str, lang: str) -> Grade: ...
    def translate(self, text: str, target_lang: str) -> str: ...
    def summarize_readiness(self, hire_summary: dict) -> str: ...   # one line for manager card
```

`get_provider()` reads `FS_MODE` (`mock` | `live`) and `FS_PROVIDER` (`converge` | other, see 4.2). All live calls go through `cached_call()`.

### 3.7 Repo layout

```
firstshift/
├── README.md                 # setup in ≤3 commands
├── plan.md                   # this file
├── .env.example              # FS_MODE=mock, FS_PROVIDER=converge, CONVERGE_API_KEY=, ...
├── Makefile                  # make dev | make seed | make build | make demo-reset
├── docker-compose.yml        # optional, single service
├── backend/
│   ├── app.py                # FastAPI app, mounts routes, serves frontend/dist in prod
│   ├── db.py  models.py
│   ├── routes/ jobs.py hires.py training.py events.py demo.py
│   ├── services/ posting.py grading.py readiness.py events.py
│   ├── ai/ __init__.py base.py converge.py mock.py cache.py
│   ├── seed/ roles.json modules_server.json modules_kitchen.json people.json mock_ai.json
│   ├── seed.py
│   ├── cache/                # gitignored except committed demo cache
│   └── tests/ test_readiness.py test_grading_mock.py test_api_smoke.py
└── frontend/
    ├── index.html
    ├── src/
    │   ├── main.tsx  App.tsx  router.tsx
    │   ├── styles/tokens.css           # palette + type from section 6
    │   ├── lib/ api.ts speak.ts sse.ts i18n.ts
    │   ├── components/ Ticket.tsx Rail.tsx Stamp.tsx SpeakButton.tsx KindFeedback.tsx
    │   │               ConfidencePicker.tsx MetricsStrip.tsx ChannelPostCard.tsx QR.tsx
    │   └── pages/ ManagerOrderIn.tsx ManagerRail.tsx HireLanguage.tsx HireLesson.tsx
    │              HireCheck.tsx HireDone.tsx
    └── public/ sounds/bell.mp3 (optional, royalty-free or generated)
```

---

## 4. Stack, risks and trade-offs

### 4.1 Tech stack

| Layer | Primary | Fallback | Why |
|---|---|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind (custom tokens only) | Plain HTML + Alpine.js if the build fights you | Operator knows React; Vite is fast to scaffold. |
| Backend | FastAPI + SQLModel | Flask if SSE gives trouble | Operator's strength; async SSE is easy. |
| Database | SQLite file | Postgres via docker-compose | Zero setup, reseedable in one command, enough for a demo. |
| Real-time | Server-Sent Events | 2-second polling of `/api/board` | One-way updates are all we need; SSE is simpler than WebSockets. |
| AI core | **Converge.AI product (VERIFY which)** | MockProvider with cached responses | Hard rule: core must use Converge.AI. |
| Read-aloud | Browser `speechSynthesis` | Pre-recorded audio is **[CUT]** | Free, offline, no rate limit; zh-CN and es-ES voices exist in Chrome/Safari/Edge. |
| Voice answer | Browser `SpeechRecognition` (Chrome only) **[NICE]** | Typed answer | Nice for accessibility; not core because browser support is uneven. |
| QR codes | `qrcode` npm package | Show the plain link | Lets the demo hire scan from the manager screen. |
| Hosting | Render or Railway single web service (FastAPI serves built frontend) | Fly.io; or a Converge.AI project link if that is where the core lives | One URL for judges. **[NEW, learning risk]** only if the team hasn't used the chosen host. |

**[NEW, learning risk]:** Converge.AI products (all four), Web Speech API voices across browsers, SSE behind the chosen host's proxy.

### 4.2 Converge.AI integration point (T00 decides)

From the documents we only know the product names: **Covey, Enter, Framia, Combos**, accounts at convergeai.com, and help in Discord `#converge-ai-help`. Before writing AI code, answer these in T00 and record answers in `backend/ai/CONVERGE_NOTES.md`:

1. Which product generates/understands text (needed for job posts, grading, translation)?
2. Does it have an API or SDK we can call from FastAPI, or is it a hosted builder/workflow tool?
3. What are the credit limits and rate limits on our accounts?
4. Can a judge open a Converge.AI project link without an account?

Decision tree:
- **API exists** → implement `ConvergeProvider`, keep everything else as planned.
- **No API, but a hosted builder/agent tool** → build the grading and job-post flows inside the Converge.AI product, link to it from our UI (or embed if it supports iframes), and submit the Converge.AI project link as the prototype alongside our web app. `ConvergeProvider` becomes a thin client to whatever webhook/export it offers, or the MockProvider replays outputs captured from it.
- **Can't resolve in 45 minutes** → ask in `#converge-ai-help`, proceed in mock mode, and revisit at the kill switch. Do not block the skeleton.

Any non-Converge LLM is allowed only as a non-core helper, and only if the team decides it doesn't weaken the "core uses Converge.AI" requirement. Default: don't add one.

### 4.3 Rate limit + API risk register

| Service | Free tier limit | Risk | Mitigation |
|---|---|---|---|
| Converge.AI (product TBD) | **Unknown; VERIFY in T00** (credits are limited per kickoff "products and credits" channel) | **High** | Mock mode default, disk cache, pre-generate all lesson content offline, only grading + job posts + send-back translation are live, demo cache committed. |
| Browser speechSynthesis | No limit; voice availability varies by OS/browser | Low | Detect voices on load; hide speaker button if no voice for that lang; record demo in Chrome on the machine you tested. |
| Browser SpeechRecognition | Chrome only; uses Google servers; can fail offline | Medium | **[NICE]** only; typed input always available. |
| Hosting (Render/Railway free) | Free instances sleep after inactivity; cold start can take ~30-60s | Medium | Hit the URL before judging; mention "may take a minute to wake" in submission; keep `FS_MODE=mock` on the judge deployment so it never runs out of credits overnight. |
| SQLite on free hosting | Disk may reset on redeploy | Low | Seed on startup if DB is empty; `/api/demo/reset`. |

### 4.4 Test budget (MANDATORY)

> Excessive testing against live services during build **will** burn the credits you need for the demo recording. Build the UI in mock mode. Go live only in the tasks marked LIVE.

| Service | Build-time budget | Rule after budget is spent |
|---|---|---|
| Converge.AI: `grade_answer` | **max 20 calls** | Replay from cache; tune prompts by editing mock outputs. |
| Converge.AI: `generate_job_posts` | **max 8 calls** | Cache the 2 demo roles' outputs and commit them. |
| Converge.AI: `translate` (send-back note) | **max 10 calls** | Cache; demo uses the same note. |
| Converge.AI: pre-generating lesson content (if used) | **max 12 calls** (one per module per batch) | Output saved to `seed/*.json`, reviewed by a human, then never regenerated. |
| SpeechRecognition | **max 15 tries** | Fall back to typing. |

Add a counter in `ai/cache.py` that logs `LIVE CALL #n for <method>` and refuses (raises) once `FS_LIVE_BUDGET` (default 50) is exceeded in a process.

### 4.5 Key trade-offs

1. **Lesson content: pre-generated vs generated live**
   - Pre-generated: reliable, reviewable translations, zero demo risk. / Less "AI magic" on screen.
   - Live: shows AI at work. / Slow, costs credits, unreviewed translations in front of judges.
   - **Choose pre-generated** (via the Converge.AI product if possible, then human-checked), and show live AI where it reads as smart: grading a free-text answer in Mandarin and translating the manager's note.

2. **Real-time: SSE vs WebSockets**
   - SSE: one-way, plain HTTP, trivial in FastAPI. / No client→server channel (not needed).
   - WebSockets: two-way. / More code, proxy quirks on free hosts.
   - **Choose SSE**, with polling fallback.

3. **Hire auth: magic link token vs login**
   - Token link/QR: zero friction, fits the "one link" story and accessibility. / Anyone with the link can open it (fine for a demo).
   - Login: realistic. / Kills the emotional, low-friction story.
   - **Choose token link.** Mention SSO/phone verification as pilot next step.

4. **Job posting: real platform APIs vs channel-formatted copy/export**
   - Real APIs: impressive if it worked. / Brief says don't assume access; accounts and approvals impossible tonight.
   - Copy/export: honest, works. / Less flashy.
   - **Choose copy/export** with per-channel character limits and format rules displayed, plus a "Copy" button per channel and CSV/JSON export.

5. **Grading: AI for everything vs local for multiple choice**
   - **Choose local grading for multiple choice** (deterministic, free) and AI for the one free-text answer per module.

---

## 5. Execution plan

All times PT, Wed Nov 18. Total build window 11:30 AM to 11:30 PM (12h).

- **First 15% (to 1:15 PM): skeleton.** Happy path end to end, mock mode.
- **50% mark (5:30 PM): [KILL SWITCH].**
- **Last 20% (9:00 PM to 11:30 PM): LOCKED polish, video, one-pager, submit.** Not reallocatable.

### 5.1 Task table

| ID | Task | Type | Est. | Depends on | Window | Acceptance criteria |
|---|---|---|---|---|---|---|
| T00 | Converge.AI verification: answer the 4 questions in 4.2, pick the core product, record in `CONVERGE_NOTES.md`; confirm team size, languages, team name in submission form | CORE | 0:30 (hard cap 0:45) | – | 11:30–12:00 | Notes file exists with answers or explicit "unknown, asked in Discord at HH:MM". Decision recorded. |
| T01 | Scaffold repo per 3.7: FastAPI app, Vite React TS app, Tailwind with tokens.css, Makefile, `.env.example`, README stub | CORE | 0:25 | – | 12:00–12:25 | `make dev` runs both; `/api/health` returns ok; frontend shows a page with the palette. |
| T02 | Models + seed.py + seed JSON (roles, 6 modules in en/zh/es, people) | CORE | 0:35 | T01 | 12:25–1:00 | `make seed` builds DB; `GET /api/board` returns tickets in all statuses. |
| T03 | AI provider layer: base interface, MockProvider (reads `mock_ai.json`), cache with live-call counter, `get_provider()` | CORE | 0:15 | T01 | 1:00–1:15 | Unit test: mock grade returns pass/fail + feedback in requested lang; counter raises past budget. |
| **—** | **SKELETON CHECKPOINT 1:15 PM** | | | | | Board loads, a hire link opens a module, answering moves the ticket (polling is fine). |
| T04 | Hire flow: language picker → lesson cards → checks → kind feedback → confidence → done | CORE | 1:15 | T02,T03 | 1:15–2:30 | Full module completable on a 390px-wide screen in zh and es; no "wrong" wording anywhere; `lang` attrs set. |
| T05 | `SpeakButton` + `speak.ts` | CORE | 0:20 | T04 | 2:30–2:50 | Plays lesson text in zh-CN/es-ES/en-US in Chrome; button hidden if no voice. |
| T06 | The Rail: columns, ticket component, readiness summary, confidence-gap flag, STAMP READY, send-back | CORE | 1:15 | T02 | 2:50–4:05 | Stamp changes status and persists; send-back shows translated note on hire's phone (mock). |
| T07 | SSE events + live ticket movement + stamp animation; hire "you're ready" screen | CORE | 0:40 | T06 | 4:05–4:45 | Two browser windows: answering on hire window moves ticket on manager window within 2s. |
| T08 | ConvergeProvider (or Converge.AI-built flow per T00 decision) for `grade_answer`; LIVE within budget | CORE | 0:45 | T00,T03 | 4:45–5:30 | One live free-text grade in Mandarin and one in Spanish return sensible feedback; responses cached and committed. |
| **—** | **[KILL SWITCH] 5:30 PM** | | | | | See 5.3. |
| T09 | Order In: one-entry job form → channel posts (Indeed-style, Craigslist-style, WeChat/WhatsApp message, in-store flyer text, bilingual) with Copy + Export CSV/JSON | CORE | 0:50 | T03 | 5:30–6:20 | Submitting the form shows ≥4 channel cards with per-channel length limit badges; export downloads a file. Live `generate_job_posts` used ≤ budget, then cached. |
| T10 | Hire action: candidate → TRAINING with token link + QR on the ticket | CORE | 0:20 | T06 | 6:20–6:40 | Scanning QR on a phone opens that hire's flow. |
| T11 | Metrics strip on the Rail (targets framed as targets) + Insights drawer (most-missed questions per module) | NICE | 0:35 | T06 | 6:40–7:15 | Strip shows counts computed from DB; drawer lists top 3 gaps. |
| T12 | Deploy to Render/Railway (FastAPI serves `frontend/dist`), `FS_MODE=mock` on judge deploy, seed on boot | CORE | 0:40 | T07 | 7:15–7:55 | Public URL works from a phone on cellular; reset endpoint works. |
| T13 | Accessibility pass: contrast check, keyboard path, 48px targets, reduced motion, focus rings | CORE | 0:30 | T04,T06 | 7:55–8:25 | Lighthouse accessibility ≥ 90 on hire screens; tab through whole hire flow without mouse. |
| T14 | Voice answer via SpeechRecognition (Chrome) | NICE | 0:25 | T04 | 8:25–8:50 | Mic button fills the free-text box in zh/es; hidden when unsupported. |
| T15 | Buffer / bug fixes | – | 0:10 | – | 8:50–9:00 | – |
| T16 | Extra languages (Cantonese/Vietnamese), manager login, SMS invites, real platform APIs | CUT | – | – | – | Show as [DEMO ONLY] chips or mention as next steps. |
| **—** | **LOCKED POLISH 9:00 PM** | | | | | |
| P1 | Visual polish: ticket paper texture, stamp animation timing, empty states, copy pass in all 3 languages | CORE | 0:35 | – | 9:00–9:35 | Screenshot moment (6.3) looks right at 1440×900 and 390×844. |
| P2 | Demo data reset + rehearse demo path 3 times with a timer | CORE | 0:25 | P1 | 9:35–10:00 | Demo fits 2:30; no dead clicks. |
| P3 | Record demo video (2–3 min, product running, not slides), upload unlisted YouTube/Loom, "Anyone with link" | CORE | 0:35 | P2 | 10:00–10:35 | Link plays logged out. Named `Team33_FirstShift`. |
| P4 | One-page overview (problem, solution, day-to-day use, how built, results/targets, next steps, Converge.AI products used) | CORE | 0:25 | – | 10:35–11:00 | PDF `Team33_FirstShift_Overview.pdf`, fits on one page. |
| P5 | README (≤3 commands), architecture slide, push repo (optional item), disclose any pre-Nov-17 code | CORE | 0:15 | – | 11:00–11:15 | Fresh clone runs with `make setup && make seed && make dev`. |
| P6 | Submit form; open every link in an incognito window | CORE | 0:15 | P3–P5 | 11:15–11:30 | Confirmation received. **29 minutes of buffer remain.** |

### 5.2 Parallel lanes (if 3–4 people)

- **Lane A (backend):** T00 → T02 → T03 → T08 → T09 backend → T12.
- **Lane B (hire UI):** T01 frontend → T04 → T05 → T13 → T14.
- **Lane C (manager UI):** T06 → T07 → T10 → T11.
- **Lane D (business + content, non-coder OK):** seed content review in zh/es with native speakers if available, metrics framing, one-pager, demo script, video edit. Starts P4 early (draft by 6 PM).
- Daily sync points: 1:15 PM, 5:30 PM, 9:00 PM.

### 5.3 Scope reduction plan (trigger at 5:30 PM if skeleton isn't solid)

Skeleton "solid" = a hire can finish a module on phone and the manager sees it and can stamp, in mock mode, deployed or deployable.

If not solid at 5:30 PM:
1. **Drop immediately:** T11 (metrics strip becomes static numbers from seed), T14 (voice input), SSE (use 2s polling), QR (show link only).
2. **Shrink T09:** Order In shows cached posts for one role only; form fields still editable but the "Generate" call returns the cached result.
3. **Shrink content:** one role (Server), two modules, one free-text question total.
4. **Converge.AI still unresolved:** keep MockProvider in the app and build the grading flow directly inside the Converge.AI product so the core requirement is met by a project link; record that flow in the demo video.

**Minimum shippable version:** language picker → one module with read-aloud and kind feedback → manager Rail with that hire's ticket → one-tap STAMP READY with animation, deployed at a public URL, plus the Converge.AI-powered grading step.

---

## 6. UI brief

### 6.1 Visual identity

**Theme: "The Pass".** The manager sees the restaurant's kitchen pass: a steel rail where paper order tickets hang and slide along, and a gold "READY" chop stamp. The hire sees a single warm paper ticket, written to them, in their language.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#16130F` | Manager background (dark kitchen steel/wood) |
| `--paper` | `#F7EFDC` | Tickets, hire screens background |
| `--ink` | `#1E1A16` | Text on paper (contrast on `--paper` ≈ 15:1) |
| `--primary` (Imperial red) | `#A3161A` | Headers, primary buttons, rail accents |
| `--secondary` (gold) | `#D4A72C` | READY stamp, progress, focus rings on dark |
| `--alert` (warm orange) | `#E2611B` | "Needs a buddy shift", stuck tickets (never used for the hire's mistakes) |
| `--rail` | `#8C8C8C` | Steel rail line, dividers on dark |
| `--muted` | `#6B6257` | Secondary text on paper (5.2:1 on `--paper`) |

Checked contrast: ink/paper 15.1:1, muted/paper 5.2:1, red/paper 6.8:1, gold/bg 8.3:1, rail/bg 5.5:1. All pass WCAG AA for body text. Re-check any new pair in T13.

**Type**
- Ticket text: **Courier Prime** (Google Fonts, monospace receipt feel).
- Display / column headers: **Bebas Neue** or **Anton** (bold condensed, kitchen-signage feel).
- CJK: **Noto Sans SC** (and **Noto Serif SC** for the stamp character). Always include it in the font stack so Chinese never falls back to a random system font.
- Hire screens body: **Atkinson Hyperlegible** (designed for low-vision readability), 20px minimum, 1.5 line height.

**UI language (kitchen pass vocabulary)**
- Columns: **ORDER IN** (posted), **ON THE BOARD** (applied), **FIRING** (training), **AT THE PASS** (review), **SHIFT-READY**.
- Buttons: **FIRE A POSTING**, **HIRE → FIRE TRAINING**, **STAMP READY**, **SEND BACK** (with kind note), **86 THIS POSTING** (close job, [DEMO ONLY] if not wired).
- Manager metric labels: "Tickets on the rail", "Avg time to ready", "Manager minutes saved (target)".
- Hire side drops the jargon: plain, warm, second-person. "Welcome, Lin. Let's get you ready for your first shift." Never "fail", "wrong", "test" or "quiz"; use "check", "almost", "let's look again".
- Accent detail: each ticket has a printed-style header `#0412 · SERVER · 中文` and a torn bottom edge.

### 6.2 Key screens

1. **The Rail (manager, /manager)**: full-width dark background, a horizontal steel rail across the top third with five labelled clips (columns). Tickets hang from the rail and stack downward. Each ticket shows name, role, language chip, module progress as punched holes (●●○), confidence emoji, and a one-line AI readiness summary. **Memorable element:** dropping a ticket into AT THE PASS rings a soft bell and the ticket swings slightly; STAMP READY slams a rotated gold 「可以」/READY chop onto it. **Live data:** ticket statuses, per-hire progress, confidence-gap flags, metrics strip along the bottom.
2. **Order In (manager, /manager/new)**: left half is a single paper ticket form (role, pay, shift, requirements, languages). Right half shows generated channel posts as receipts printing out one by one (staggered animation), each with a channel name, char-count badge, Copy, and an Export button for all. **Memorable element:** one entry printing out as five differently formatted receipts, including a bilingual one. **Live data:** AI-generated posts.
3. **First Shift lesson (hire, /t/:token)**: phone-first. Paper background, one card at a time, big icon, ≤25 words, large speaker button, Next. Progress shown as a ticket being filled in. **Memorable element:** the speaker button reads Mandarin/Spanish aloud naturally. **Live data:** this hire's modules in their language.
4. **First Shift check + done (hire)**: question card, large answer buttons; free-text box with mic [NICE]. Kind feedback card highlights the lesson line to revisit. Confidence picker at the end. Done screen: the hire's own ticket gets the gold stamp and the message "You're ready for your first shift" in their language, read aloud. **Memorable element:** the same stamp the manager pressed lands on the hire's phone.

### 6.3 The screenshot moment

Laptop and phone side by side. **Left (laptop):** The Rail, with Lin's ticket mid-slam: the gold READY/「可以」 chop rotated -8°, ink-splatter edges, ticket reads `#0412 · SERVER · 中文 · ●●● · 💪`. **Right (phone):** Lin's screen in Mandarin, same stamp landing, text "你已经准备好第一次上班了！" with the speaker button glowing. Design rule: the stamp must be the largest, brightest object on both screens at that moment; dim everything else to 60% for 1.2s around the stamp.

### 6.4 Non-working UI elements ([DEMO ONLY])

Mark each in code with `[DEMO ONLY]` and render disabled with tooltip "Coming in pilot":
- "Publish to Indeed / Craigslist" buttons (we offer Copy/Export instead).
- **86 THIS POSTING** (if not wired).
- "Schedule interview" on candidate tickets.
- Language chips beyond the three supported (e.g. 粵語, Tiếng Việt) shown greyed with "pilot".
- "Locations" switcher (Palo Alto / second location) in the header.
- Manager login avatar menu.

### 6.5 UI stack recommendation

React + Vite + Tailwind configured **only** with the tokens above (disable default palette in `tailwind.config` to stop generic colors leaking in). Animations with **Framer Motion** (stamp slam, ticket slide, receipt print) and CSS fallback for reduced motion. Fonts from Google Fonts: Courier Prime, Bebas Neue, Atkinson Hyperlegible, Noto Sans SC, Noto Serif SC. Paper texture via a small inline SVG noise filter, not an image.

---

## 7. Demo strategy

### 7.1 Two-minute demo script (video: aim for 2:30, max 3:00)

**0:00–0:15 Hook.** Black screen, a single sentence in three languages typed out: *"It's your first day. Everyone's speaking fast. You don't want to ask again."* Then: "At Imperial Treasure, managers re-explain the same procedures to every new hire, in whatever language they can manage. FirstShift fixes both sides."

**0:15–0:40 Order In.** Manager fills one ticket: "Server, weekends, Mandarin or Spanish welcome." Click **FIRE A POSTING**. Five receipts print: job-board, classifieds, a WeChat/WhatsApp-style message, an in-store flyer, a bilingual version. Click Export. "One entry, every channel, no copy-pasting across platforms."

**0:40–1:00 The Rail.** Cut to the Rail: tickets across ON THE BOARD, FIRING, AT THE PASS. Point at one ticket with 100% score but 😟 confidence and an orange "Needs a buddy shift" flag. "A quiz says she's ready. FirstShift tells you she's nervous."

**1:00–1:45 "Watch what happens when I..."** Click **HIRE → FIRE TRAINING** on Lin; QR appears; scan on phone. Language picker: tap 中文. Lesson card on allergies, tap speaker, Mandarin reads aloud. Answer a check slightly wrong: kind feedback "差一点。我们再看一下这一句。" with the line highlighted. Answer the free-text question in Mandarin; AI (Converge.AI) grades it and replies in Mandarin. Tap 💪. On the laptop, Lin's ticket slides to AT THE PASS with a bell.

**1:45–2:05 Result.** Manager clicks **STAMP READY**. Gold chop slams on the laptop and on Lin's phone at the same time; phone reads it aloud. (Screenshot moment.)

**2:05–2:30 Business close.** Metrics strip: manager minutes per opening, time to shift-ready, completion rate, top knowledge gap ("Allergy hand-off: 3 of 8 hires missed it"). "Every restaurant hires. Every restaurant trains. FirstShift is one link that works for any role, any language, any location. Built on Converge.AI."

**Fallback:** if live demo breaks on stage: switch to the 60-second silent backup clip (recorded in P3, saved locally and on the laptop desktop) plus three static screenshots: Order In receipts, Rail with confidence flag, the stamp moment.

### 7.2 Judging psychology

- **The one memory:** *"The app with the gold stamp that landed on the new hire's phone in Chinese."*
- **Engineered reaction:** warmth first ("that's kind"), then "that's clever" when the confidence gap shows up. Business Impact is carried by the metrics strip and the one-entry posting.
- **Scalability line for Q&A:** content is JSON per role and language; adding a role, language or location is data, not code. Any hospitality business with turnover has this problem.

### 7.3 Impact metrics (frame as targets, not claims)

Use the brief's own measures. Phrase them as "what we'll measure in a pilot", never as achieved results:
- Manager time spent per opening (one entry vs. re-writing per channel).
- Time from hire to shift-ready.
- Training completion and check results.
- Manager approvals with evidence attached.
- Recurring knowledge gaps across the team.

If you show a number in the demo, label it **"Target"** or **"In demo data"**. Do not present fabricated results as real outcomes.

### 7.4 Presentation assets checklist

- [ ] UI populated with realistic (fictional) seed data, no lorem ipsum, in all three languages
- [ ] Architecture diagram: one slide, boxes and arrows (from 3.1)
- [ ] One metric framed as a pilot target (e.g. "Target: cut manager time per opening by half")
- [ ] 60-second silent backup demo video (saved locally too)
- [ ] README: setup in ≤3 commands
- [ ] Every non-working button hidden or visibly disabled, none crash

---

## 8. Submission checklist (due 11:59 PM PT, submit by 11:30 PM)

From the Submission and Judging Rules and the kickoff deck:

- [ ] Team info: team number (33), team name, every member's name + email
- [ ] Company name + challenge: Imperial Treasure Palo Alto, "From Hiring to Shift-Ready: Streamlining Restaurant Recruitment and Multilingual Training"
- [ ] Converge.AI products used (named on the form)
- [ ] **Demo video** 2–3 min, product actually running (not only slides), YouTube unlisted / Loom / Drive, "Anyone with the link": `Team33_FirstShift`
- [ ] **Working prototype link** accessible to judges (web app URL and/or Converge.AI project link); wake it up before judging (Nov 18 evening to Nov 19 9 AM)
- [ ] **One-page overview**: problem, solution, day-to-day use at the restaurant, how it was built, results/targets, what it needs to go live, next steps: `Team33_FirstShift_Overview`
- [ ] Code repo (optional): public or shared with organizer: `Team33_FirstShift`
- [ ] Slides (optional, max 5 pages): `Team33_FirstShift_Slides`
- [ ] Disclose any code or project that existed before Nov 17
- [ ] Every builder has signed the participant agreement
- [ ] Only company-provided materials used; no internal info disclosed; mark anything confidential on the form
- [ ] Open every link in an incognito window after submitting

**If selected as a finalist (announced Thu Nov 19):** slides + 2–3 min backup video due **Thu Nov 19, 8:00 PM PT**; on-site equipment test **Fri Nov 20, 1:00–2:30 PM**; 10-minute slot = 1 min company pain point, **6 min live demo**, 3 min Q&A; 1–2 members do a 5–10 min interview after. Extend the demo script to 6 minutes by adding the Insights drawer and a Spanish-speaking kitchen hire.

---

## 9. Open questions (ask the human, don't guess)

1. Team size and who owns which lane?
2. Final languages: English + Mandarin + Spanish?
3. T00 result: which Converge.AI product is the core, and does it have an API?
4. Can someone reach the business owner (contact on the brief) for a 5-minute check that the flow matches how they hire? A quote from them strengthens Business Impact.
5. Hosting account available (Render/Railway/Fly), or is the Converge.AI project link the only prototype link?
