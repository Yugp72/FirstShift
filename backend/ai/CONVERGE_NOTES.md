# Converge.AI notes (T00)

Status: **partly resolved. A human must log in to confirm the open items.** The agent that built this
repo can't log in to Converge.AI accounts (logins go through a browser window only).

## What we know (from the kickoff docs and `plan_converge.md`)

| Product | What it is | How we use it |
|---|---|---|
| **Enter** (enter.pro) | AI app builder, driven from Claude Code through the enter.pro CLI skill (`https://github.com/enter-pro/CLI`). Apps built in Enter get built-in model access, so they need no separate API keys. | **Core.** Host the grading, translation and job-post AI as an Enter project (`Team33_FirstShift`), and expose it to FirstShift as a JSON endpoint. |
| **Framia** (framia.converge.ai) | Media generation (images, short captioned videos) through an agent plugin at `https://framia.converge.ai/plugin`. | Picture-step cards and a captioned video for each lesson (pilot: a "format toggle" on each lesson card). |
| Covey, Combos | Not evaluated. | — |

## The 4 questions

1. **Which product generates or understands text?** Enter (built-in model access inside Enter apps).
2. **API or hosted builder?** Hosted builder. **VERIFY:** whether a published Enter app can expose an HTTP endpoint (webhook/function). If it can, point `CONVERGE_API_URL` at it.
3. **Credit and rate limits?** **Unknown. Ask in Discord `#converge-ai-help`.** Our own guard is `FS_LIVE_BUDGET` (default 50) in `backend/ai/cache.py`, plus the disk cache.
4. **Can a judge open a Converge.AI project link without an account?** **VERIFY** after publishing (open it in an incognito window).

## Decision (per plan section 4.2)

- The app always talks to `backend/ai/` (`AIProvider`). The default is `MockProvider`, which works offline and is what the judge deploy uses.
- `ConvergeProvider` (`backend/ai/converge.py`) sends `POST {CONVERGE_API_URL}` with `{"task", "prompt", "response_format": "json"}` and expects JSON back. Build that endpoint in Enter.
- If Enter can't expose an endpoint, submit the Enter project link as the Converge.AI prototype. Then capture its outputs and paste them into `backend/seed/mock_ai.json` / `backend/cache/` so the web app replays them.

## Steps for the human (about 10 minutes)

1. In Claude Code, run: `Install the enter.pro CLI skill from https://github.com/enter-pro/CLI and log me in.` Then log in through the browser window it opens.
2. Then run: `Create a new enter.pro project called Team33_FirstShift with one JSON endpoint that takes {task, prompt} and returns the model's JSON reply.`
3. Put the endpoint URL in `.env` as `CONVERGE_API_URL`, set `FS_MODE=live`, and grade **one** Mandarin and **one** Spanish free-text answer (task T08). The cache files land in `backend/cache/`. Review them, then commit them with `git add -f`.
4. Framia: install the plugin from `https://framia.converge.ai/plugin`, then generate 5 picture-step cards for the allergy lesson.
