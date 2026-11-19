// Local test harness (Node 22+: node --experimental-strip-types local_dev.ts). Not used on Enter.
// File-backed store; AI goes to the live firstshift-ai function unless FS_MODE=mock.
import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHandler, type Store } from "./core.ts";
import { enterAi } from "./enter_ai.ts";

const FILE = process.env.FS_STATE_FILE || `${(await import("node:os")).tmpdir()}/firstshift_state.local.json`;
const store: Store = {
  async load() { return existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf-8")) : null; },
  async save(state, version) {
    const cur = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf-8")).version : 0;
    if (cur !== version) return false;
    writeFileSync(FILE, JSON.stringify({ state, version: version + 1 }));
    return true;
  },
};
const ai = process.env.FS_MODE === "mock" ? null : enterAi({
  aiFunctionUrl: "https://br-prime-seal-b67e3e22.supabase.aidap-global.ap-southeast-1.bytepluses.com/functions/v1/firstshift-ai",
});
const handle = createHandler({ store, ai, mediaBase: "https://cdn.jsdelivr.net/gh/Yugp72/FirstShift@8738124/media/" });
const port = Number(process.env.PORT || 8787);
createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const ch of req) chunks.push(ch as Buffer);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const r = await handle(new Request(`http://localhost:${port}${req.url}`, {
    method: req.method, headers: req.headers as Record<string, string>, body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
  }));
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(port, () => console.log(`firstshift-api local on :${port} (ai=${ai ? "live" : "mock"})`));
