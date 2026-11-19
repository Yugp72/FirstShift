# FirstShift on Enter (deployed)

**Live app:** https://7ceaa6f9d4a2409ab7753ed1c9165da1.prod.enter.pro (works logged out)
Enter project: **FirstShift AI Core** `7ceaa6f9d4a2409ab7753ed1c9165da1` in Parth Panchal's Workspace (Pro).

## How it is built

```
Enter frontend (this folder: Vite 7 + React 19)          Enter-managed Supabase
  src/App.tsx  -> src/fs/** (FirstShift UI)   ──fetch──►  edge function firstshift-api  ──►  table public.fs_state
  session in localStorage, sent as x-fs-session            (port of ../backend, one file)      (one JSON row, versioned)
                                                                    │
                                                                    └──► Enter AI (Converge.AI built-in model)
                                                                         grading, translation, job posts, task cards
```

- `supabase/functions/firstshift-api/core.ts` is a faithful TypeScript port of the FastAPI backend (`../backend`): auth, careers, jobs, the Rail, training, readiness flags, insights and the seed. Every AI call is cached in the state row and falls back to the deterministic mock if Enter AI fails.
- **Enter's function upload only takes the entry file**, so `index.ts` is GENERATED: `python bundle.py` inlines `seed_data.ts`, `core.ts`, `enter_ai.ts` and `server.ts` into one file with no imports. Edit the sources, then re-run `bundle.py`.
- `local_dev.ts` runs the same core in Node 22 for testing: `node --experimental-strip-types local_dev.ts` (port 8787, state file in your temp dir). Point the frontend at it with `VITE_FS_API=http://localhost:8787` in `.env.local`.
- Framia media (allergy video + picture cards) is served from this repo's `media/` folder via jsDelivr (`cdn.jsdelivr.net/gh/Yugp72/FirstShift@8738124/media/`). Captions are built in the browser from each lesson's cards, in the hire's language.
- Live updates on the manager pipeline poll every 3 s (serverless, so no SSE).

## Redeploying

1. Edit, then `python supabase/functions/firstshift-api/bundle.py`, `npx eslint .` (Enter's build fails on lint errors) and `npx tsc --noEmit -p tsconfig.app.json`.
2. Push changed files in one turn through Enter's `edit-code` API (the CLI's `proj edit-file` does one file per turn).
3. If the function changed, ask Enter's agent (`enter-cli thread chat --file msg.txt`) to "redeploy firstshift-api from index.ts exactly as committed, do not edit files", then `enter-cli thread wait`.
4. `enter-cli proj publish 7ceaa6f9d4a2409ab7753ed1c9165da1`.

Reset demo data before each take with **↺ Reset demo** on the pipeline (manager only). Reset keeps accounts and the AI cache.
