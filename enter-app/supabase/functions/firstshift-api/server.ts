// Runtime wiring for the Enter-managed Supabase edge runtime (bundled into index.ts by bundle.py).
// No npm imports: the state row is read/written over PostgREST with the service role key.
const PUBLIC_SUPABASE_URL = "https://br-prime-seal-b67e3e22.supabase.aidap-global.ap-southeast-1.bytepluses.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || PUBLIC_SUPABASE_URL;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const REST = `${SUPABASE_URL}/rest/v1/fs_state`;
const H = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };

// Framia-generated training media (images + captioned allergy video), served from the project's public repo via CDN.
const MEDIA_BASE = Deno.env.get("FS_MEDIA_BASE") || "https://cdn.jsdelivr.net/gh/Yugp72/FirstShift@8738124/media/";

const store: Store = {
  async load() {
    const r = await fetch(`${REST}?id=eq.main&select=data,version`, { headers: H });
    if (!r.ok) throw new Error(`load ${r.status}: ${await r.text()}`);
    const rows = await r.json();
    return rows.length ? { state: rows[0].data as State, version: rows[0].version as number } : null;
  },
  async save(state, version) {
    if (version === 0) {
      const r = await fetch(REST, { method: "POST", headers: { ...H, Prefer: "return=minimal" },
        body: JSON.stringify({ id: "main", data: state, version: 1 }) });
      return r.ok;
    }
    const r = await fetch(`${REST}?id=eq.main&version=eq.${version}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify({ data: state, version: version + 1, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) throw new Error(`save ${r.status}: ${await r.text()}`);
    return (await r.json()).length > 0;
  },
};

const fsMode = (Deno.env.get("FS_MODE") || "live").toLowerCase();
// Enter AI goes through the project's firstshift-ai function (same model, proven stable under load).
// Set FS_AI_DIRECT=1 to call the Enter AI gateway directly with the project token instead.
const direct = Deno.env.get("FS_AI_DIRECT") === "1";
const aiCall = fsMode === "mock" ? null : enterAi({
  token: Deno.env.get("AI_API_TOKEN_7ceaa6f9d4a2"),
  aiFunctionUrl: direct ? null : `${PUBLIC_SUPABASE_URL}/functions/v1/firstshift-ai`,
});

Deno.serve(createHandler({ store, ai: aiCall, mediaBase: MEDIA_BASE, publicBase: Deno.env.get("FS_PUBLIC_URL") || null }));
