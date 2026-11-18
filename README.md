# FirstShift

**Team33_FirstShift** · Stanford 30x30 "We Mean Business" · Imperial Treasure Palo Alto
*From Hiring to Shift-Ready: streamlining restaurant recruitment and multilingual training.*

A new hire opens one link, picks a language (English / 中文 / Español) and works through their role one card at a time. Every card can be read aloud. Checks are kind: a missed answer gets "Almost", never "wrong". The manager watches each hire's ticket move down the rail and stamps them shift-ready with one tap. The same gold stamp then lands on the hire's phone.

## Run it (3 commands)

```bash
make setup     # python venv + npm install
make seed      # build the demo DB (also happens automatically on first boot)
make dev       # API :8000 + web :5173. Open http://localhost:5173
```

One-URL production mode: `make serve PORT=8090` (FastAPI serves `frontend/dist`; port 8080 is often taken on Macs), or `docker build -t firstshift . && docker run -p 8000:8000 firstshift`.

Tests: `make test`. Reset demo data before each take: `make demo-reset` (or the **↺ Reset demo** button on the Rail).

## Demo path (about 2:30)

| URL | Who | What to show |
|---|---|---|
| `/manager/new` | Manager | **ORDER IN.** Describe the role once, press **FIRE A POSTING**, and 7 receipts print: job board, classifieds, WeChat (中文), WhatsApp (ES), flyer, bilingual and easy-read. Each has a character-limit badge and Copy. Export the lot as CSV or JSON. |
| `/t/hana-demo` | Hana, on her phone | Pick English, then captions and picture steps. The lesson opens on captioned Video. Switch to Pictures, tap a picture answer, and say how sure you are. |
| `/manager` | Manager | **Pipeline.** Open Daniel's passport (Deaf, learns visually): captioned video and picture steps, with a seated station in his setup notes. |
| `/manager` | Manager | **Pipeline.** People move Job posts → Applied → In training → Ready for review → Shift-ready. Mei scored 100% but feels 😟, so she's flagged **Needs a buddy shift**. Jorge felt 💪 but missed allergy checks, so he's flagged **Double-check**. |
| `/t/lin-demo` | Lin, on her phone | Tap 中文, then open the allergy lesson and hit 听一听 to hear it read aloud. Miss a check to get kind feedback ("差一点…") with the lesson line highlighted. Type a free-text answer in Mandarin and the AI grades it in Mandarin. Then tap 💪. |
| `/manager` | Manager | Lin's ticket swings into AT THE PASS. Turn the bell on to hear it ring. Press **STAMP READY** and the gold 可以/READY chop slams down, and lands on Lin's phone too, read aloud. |

Other parts: **SEND BACK** sends a kind note, translated into the hire's language, and reopens one step. **TEAM KNOWLEDGE GAPS** lists the most-missed checks across all hires. Use **HIRE → FIRE TRAINING** on any applicant to get a link and QR code. For phone testing on your LAN, set `FS_PUBLIC_URL=http://<your-ip>:5173` so the QR code points at your machine.

## Accounts and roles

- **Applicants** create an account at `/login` (name, email, password, language). From there they browse `/jobs`, apply in one tap, and follow their application at `/me` (Applied → Training → Manager review → Shift-ready).
- **Managers** sign in to see `/manager` (pipeline, passports, approvals) and `/manager/new` (post a job). All manager APIs return 401/403 to anyone else.
- **Demo:** the sign-in page has one-click **Demo manager** and **Demo applicant (Lin)** buttons, so judges never need a password. The seeded test accounts and their test-only password are in `backend/seed/people.json`. Set `FS_DEMO_LOGIN=0` to turn the buttons off.
- Passwords are hashed with PBKDF2-SHA256 and sessions use an httpOnly cookie.

## Training (one course player for everyone)

- `/learn` lists two courses, *Server essentials* and *Kitchen prep essentials*. Each is laid out Udemy-style: **sections**, each with short **lessons**, ending in a **quiz**. A progress bar and curriculum sidebar sit alongside.
- Anyone can start training without an account; that's **practice mode**, kept per device. Once a manager hires someone, the same course switches to their real training and progress counts toward approval. The old `/t/<link>` training links still open the same player.
- Every lesson has **Video** (its own slice of the Framia video, with captions in the learner's language), **Pictures**, **Listen** and **Read** tabs.

## Accessibility: every language, every ability

- **"How do you learn best?"** comes after the language picker. Hires can pick captions, picture steps, read aloud, a seated station, or extra time. These are framed as work preferences, not a disability disclosure.
- **Every lesson has four formats:** captioned **Video**, **Pictures** (picture steps), **Listen** (plays every step aloud, highlighting the current one), and **Read** (text cards). The default follows the hire's preferences. Captions come from `/api/media/{module}/captions.vtt?lang=` in all three languages, so one video works for every language.
- **Checks have no time limit.** Answers can be tapped as pictures or as text, and free-text answers can be typed or spoken. After each answer, the hire says how sure they were. A confidently wrong answer on an allergen check raises a red flag for the manager.
- **The readiness passport** (on the manager's pipeline) shows, for each step, the first-try score, how the hire felt, and which formats they used. It also shows their preferences and setup notes for the first shift (e.g. "Offer a seated prep station"). Approval is one click.
- **Framia media:** follow [framia/brief.md](framia/brief.md), then run `python -m backend.import_media framia/out`. Until then, lessons use a captioned walkthrough.

## How it's built

```
React (Vite, TS, Tailwind tokens only, Framer Motion) ──REST + SSE──► FastAPI ──► services (grading, readiness)
                                                                        │              │
                                                         SQLite (seeded from JSON)   backend/ai/  ← the ONLY place AI is called
                                                                                      ├─ MockProvider (default, offline)
                                                                                      ├─ ConvergeProvider (live, Converge.AI Enter)
                                                                                      └─ cache.py (disk cache + live-call budget)
```

- `FS_MODE=mock` (the default) makes zero network calls, so the judge deploy can't run out of credits.
- `FS_MODE=live` sends grading, translation and job posts through `ConvergeProvider`. Every response is cached by hash, and `FS_LIVE_BUDGET` caps live calls per process. Any failure falls back to the mock. See [backend/ai/CONVERGE_NOTES.md](backend/ai/CONVERGE_NOTES.md).
- Multiple-choice checks are graded locally. Free-text answers are graded on meaning, in any language.
- Read-aloud uses the browser's `speechSynthesis`, and voice answers use `SpeechRecognition` where the browser supports it. The speaker button is hidden when the device has no voice for that language.
- Accessibility: 20px Atkinson Hyperlegible body text with a 24px option, tap targets of 48px or more, `lang` set on every block, `aria-live` feedback, a full keyboard path, and `prefers-reduced-motion` support (the stamp fades in instead of slamming).

## Scalability

Content is JSON per role and language (`backend/seed/modules_*.json`). Adding a role, a language or a location is a data change, not a code change.

## Honesty notes

- **Sample training content.** Lessons are generic restaurant and food-safety practice, not Imperial Treasure policy. All people are fictional demo data. Pay figures in the seed are labelled "Sample".
- Metrics on the Rail are computed from demo data and labelled that way. "Manager minutes per opening" is a **pilot target**, not a result.
- Publishing straight to job boards, scheduling interviews, Cantonese and Vietnamese, the location switcher and manager login are **[DEMO ONLY]**. They're visibly disabled and marked "Coming in pilot".
- No code in this repo existed before Nov 17.

## Sharing a public link

The app runs on your machine. To let judges or a phone on cellular open it, run the one-URL server and put a tunnel in front of it.

```bash
make build && .venv/bin/uvicorn backend.app:app --host 0.0.0.0 --port 8090
cloudflared tunnel --url http://localhost:8090     # prints a temporary https://….trycloudflare.com link
```

Set `FS_PUBLIC_URL` to that link before starting the server, so the QR codes point to it. For a permanent link, deploy the `Dockerfile` to Render or Railway (one web service).
