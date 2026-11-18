# Converge.AI notes (T00 / T08)

Status: **resolved. Enter is the live AI core.** Verified Nov 18 at about 12:30 PM PT.

## What's live

| Item | Value |
|---|---|
| Converge.AI product | **Enter** (enter.pro), driven from Claude Code via `enter-cli` 0.4.4 and the skill in `.claude/skills/enter` |
| Enter project | **FirstShift AI Core**, project id `7ceaa6f9d4a2409ab7753ed1c9165da1`, in *Parth Panchal's Workspace* (Pro) |
| Published console | `https://7ceaa6f9d4a2409ab7753ed1c9165da1.prod.enter.pro` (title: "FirstShift AI Core, built on Enter by Converge.AI") |
| AI endpoint | An Enter-managed backend function, `.../functions/v1/firstshift-ai`. The full URL is in `.env` as `CONVERGE_API_URL` and on the console home page. It's not committed: there's no login, so anyone with the URL can spend the workspace's AI credits. |
| Contract | `POST {"task", "prompt", "response_format": "json"}` → `{"output": "<json string>"}`. Unknown task or a prompt over 8000 chars → 400. Unparseable model reply → one retry, then 502. CORS is open. |
| Model | Enter's built-in AI ("included, economical generative model"). No external API keys. |

## The 4 questions

1. **Which product generates text?** Enter (built-in AI capability on a project).
2. **API?** Yes, through a backend function on the Enter project, as above.
3. **Credits/limits?** The Pro workspace had 5,100 credits at build time. Our guards are `FS_LIVE_BUDGET` (20 in `.env`), the disk cache in `backend/cache/`, and readiness summaries always running on the mock.
4. **Judge access without an account?** The endpoint works with no credentials (checked: CORS preflight 200, invalid task 400). **VERIFY** in an incognito window that the published console loads logged out. At publish time its hostname had no DNS record yet, and Enter's own check also reported "not reachable".

## Live calls spent (budget: grade_answer max 20)

| # | Method | Input | Result |
|---|---|---|---|
| 1 | grade_answer | zh: "我会马上告诉厨房，还要写在点菜单上。" (allergy, free text) | passed. Warm feedback in Mandarin. Matched kitchen + write-on-order. |
| 2 | grade_answer | es: "Le pido disculpas y le traigo otro plato." | not passed. Kind feedback in Spanish naming the key step: tell the kitchen. |

Both are cached in `backend/cache/converge-grade_answer-*.json` and committed. The Mandarin answer is the demo script's answer, so the demo replays it instantly with zero credits.

## Gotchas we hit

- `enable_ai_capability` can't be approved with an API key (HTTP 403). The **workspace owner has to click "Enable AI" on enter.pro**.
- The first attempt went into a different (free) workspace, *Team33_FirstShift* in Yug's own workspace. It's abandoned and can be deleted.
- An Enter project serves static files, so the endpoint is a separate backend-function URL, not `/api/ai` on the same domain.

## Modes

- `FS_MODE=live` (local demo, via `.env`): grading, translation and job posts go to Enter. Every response is cached. Any error falls back to the mock.
- `FS_MODE=mock` (default, judge deploy): zero network calls.

## Framia (training media)

- Installed plugin `framia-plugin-claude.zip` 1.0.19 (remote HTTP MCP, checksum-verified) and authorized on a **Pro** Framia workspace. Read-only check passed: `framia_guide` + `framia_projects_list` (0 projects).
- Allergy lesson, Nov 18: **5 picture cards** generated (GPT Image 2, 2K, about 54 credits each). I reviewed each one: no text, on-topic. They're resized to 1024px JPEG in `media/` and wired in through `backend/seed/media.json`.
- The **allergy video** (Seedance 2.5 Flash, 30 s, 720p, quoted at 555 credits) ended with `generation_failed` and no detail. It hasn't been retried; Framia only retries when the user asks. Until then the Video tab uses the captioned walkthrough with the Framia cards.
- The guide's "upgrade available (≤1.0.14)" notice is wrong. The remote package doesn't report its version, and 1.0.19 is the latest.
