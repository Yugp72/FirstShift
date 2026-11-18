# Porting FirstShift onto Enter (in progress)

Target Enter project: **FirstShift AI Core** `7ceaa6f9d4a2409ab7753ed1c9165da1` (Parth's Pro workspace). It already has Enter AI enabled and the `firstshift-ai` function.

## Done
- Pulled the Enter project source into this folder (commit `1292d21f…`). The template is Vite 7, React 19, react-router 7, Tailwind 3 and managed Supabase.
- Copied the FirstShift frontend into `src/fs/` (lib, components, pages, styles). `src/fs/styles/tokens.css` is now plain CSS, with the Tailwind 4 directives removed.
- Checked that the template's build plugins (`vite-plugin-enter-dev`, `@enter-pro/analytics-sdk`) are on public npm, so `npm install && npm run build` can run locally.

## Left to do
1. **Frontend wiring.** In `src/router.tsx`, register the FirstShift routes. In `src/App.tsx`, wrap the RouterProvider in `AuthProvider` and import `fs/styles/*.css`. In `src/fs/lib/api.ts`, point the base URL to `${SUPABASE_URL}/functions/v1/firstshift-api` and send the session in an `x-fs-session` header saved in localStorage (cookies won't work across domains). Change exports from `<a href>` links to fetch-and-blob downloads, and switch `sse.ts` to polling only. Add `qrcode` to package.json.
2. **Backend.** Write `supabase/functions/firstshift-api/index.ts` (Deno, using supabase-js with the service role) and port every route from `../backend`. Add `supabase/functions/firstshift-api/seed.ts`, generated from `../backend/seed/*.json`. Add `supabase/migrations/<ts>_firstshift.sql` with `fs_*` tables, RLS enabled and no policies, so only the function can access them. Set `[functions.firstshift-api] verify_jwt = false` in `supabase/config.toml`. For live AI, use the same gateway and token env as `firstshift-ai`, with a cache table and the mock as fallback.
3. **Media.** Upload `../framia/web/*` to a public Storage bucket `fs-media` through a manager-only upload route, and store the URLs in a key/value table.
4. **Push.** `npm run build` locally, then push the changed files with `enter-cli proj edit-file`. Then use `enter-cli thread chat` to ask Enter to apply the migration, deploy `firstshift-api` and install packages. Wait for the turn to finish with `thread wait`.
5. **Publish.** `enter-cli proj publish`, set visibility to public, and test logged out in incognito.
