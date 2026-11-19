// Record real FirstShift interactions from the live Enter deployment for the launch film.
// Usage: node record.mjs <outDir> [clip,clip]
import { chromium } from "playwright-core";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://7ceaa6f9d4a2409ab7753ed1c9165da1.prod.enter.pro";
const API = "https://br-prime-seal-b67e3e22.supabase.aidap-global.ap-southeast-1.bytepluses.com/functions/v1/firstshift-api";
const OUT = process.argv[2];
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
mkdirSync(OUT, { recursive: true });

const post = async (path, body, sid) => (await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json", ...(sid ? { "x-fs-session": sid } : {}) }, body: JSON.stringify(body ?? {}) })).json();
const mgr = (await post("/api/auth/demo", { role: "manager" })).session;
const reset = () => post("/api/demo/reset", {}, mgr);

const HIDE = `(() => { const add = () => { if (document.getElementById('fs-hide-badge')) return; const css = document.createElement('style'); css.id = 'fs-hide-badge'; css.textContent = '#enter-badge,.build-with-container{display:none!important}'; (document.head || document.documentElement).appendChild(css); };
  document.addEventListener('DOMContentLoaded', add); new MutationObserver(() => { add(); const b = document.getElementById('enter-badge'); if (b) b.remove(); }).observe(document, { childList: true, subtree: true }); })();`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const DESK = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, recordVideo: { size: { width: 1440, height: 900 } } };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, recordVideo: { size: { width: 390, height: 844 } } };

async function clip(name, opts, sid, fn) {
  if (ONLY && !ONLY.includes(name)) return;
  const dir = join(OUT, "_tmp_" + name); rmSync(dir, { recursive: true, force: true });
  const ctx = await browser.newContext({ ...opts, recordVideo: { ...opts.recordVideo, dir } });
  await ctx.addInitScript(HIDE);
  if (sid) await ctx.addInitScript((s) => localStorage.setItem("fs_session", s), sid);
  const page = await ctx.newPage();
  const t0 = Date.now();
  const mark = (label) => console.log(`  ${name} @${((Date.now() - t0) / 1000).toFixed(2)}s ${label}`);
  try { await fn(page, mark); } catch (e) { console.log("  ERROR", name, e.message.split("\n")[0]); }
  const v = page.video();
  await ctx.close();
  const path = await v.path();
  renameSync(path, join(OUT, name + ".webm")); rmSync(dir, { recursive: true, force: true });
  console.log("saved", name);
}
const wait = (p, ms) => p.waitForTimeout(ms);

await reset();

// 1. Job posts: one entry, every channel (default form values are pre-cached in Enter AI's cache).
await clip("posts", DESK, mgr, async (p, mark) => {
  await p.goto(SITE + "/manager/new", { waitUntil: "networkidle" }); await wait(p, 1500); mark("form");
  await p.locator("form button[type=submit]").first().click(); mark("submit");
  await p.waitForSelector(".post", { timeout: 90000 }); mark("posts");
  await wait(p, 1500);
  await p.mouse.wheel(0, 500); await wait(p, 1500);
  await p.mouse.wheel(0, 500); await wait(p, 2000); mark("end");
});

// 2. Language + "how do you learn best" setup, as a fresh hire (practice course).
await clip("setup", PHONE, null, async (p, mark) => {
  await p.goto(SITE + "/learn/server", { waitUntil: "networkidle" }); await wait(p, 1800); mark("setup");
  await p.getByRole("button", { name: "中文", exact: true }).click(); mark("zh"); await wait(p, 1300);
  await p.mouse.wheel(0, 300); await wait(p, 700);
  for (const re of [/朗读|Read aloud/, /图片步骤|Picture steps/]) { await p.getByRole("button", { name: re }).first().click().catch(() => mark("miss " + re)); await wait(p, 800); }
  mark("prefs"); await wait(p, 1200);
});

// 3. Lin's allergy lesson, switching formats.
await clip("lesson", PHONE, null, async (p, mark) => {
  await p.goto(SITE + "/t/lin-demo", { waitUntil: "networkidle" }); await wait(p, 2000);
  mark("lesson"); await wait(p, 800);
  for (const re of [/视频/, /图片/, /听/, /阅读/]) { await p.getByRole("button", { name: re }).first().click().catch(() => mark("miss " + re)); mark("fmt " + re);
    if (String(re).includes("视频")) await p.evaluate(() => { const v = document.querySelector("video"); if (v) { v.muted = true; v.play(); } }).catch(() => {});
    await wait(p, 2400); }
});

// 4. Lin's quiz: answer, kind feedback, then "how sure are you?".
await clip("quiz", PHONE, null, async (p, mark) => {
  await p.goto(SITE + "/t/lin-demo", { waitUntil: "networkidle" }); await wait(p, 2000);
  await p.getByRole("button", { name: /课程目录/ }).click({ timeout: 5000 }); await wait(p, 700);
  await p.getByRole("button", { name: /小测验 3 道题/ }).click({ timeout: 5000 }).catch(() => mark("no quiz")); await wait(p, 2000); mark("quiz");
  await p.getByRole("button", { name: /我去问一下厨房/ }).first().click({ timeout: 5000 }).catch(() => mark("no option")); mark("answer"); await wait(p, 2200);
  await p.locator(".conf-btn").nth(2).click({ timeout: 5000 }).catch(() => mark("no conf")); mark("conf"); await wait(p, 2500);
});

// 5. Passports: Mei (100% but unsure), then Jorge (confident but wrong).
await clip("passport", DESK, mgr, async (p, mark) => {
  await p.goto(SITE + "/manager", { waitUntil: "networkidle" }); await p.waitForSelector(".pcard", { timeout: 20000 }); await wait(p, 1500); mark("board");
  await p.getByRole("button", { name: "Mei Huang" }).first().click(); mark("mei"); await wait(p, 4000);
  await p.keyboard.press("Escape"); await wait(p, 1000);
  await p.getByRole("button", { name: "Jorge Castillo" }).first().click(); mark("jorge"); await wait(p, 4000);
});

// 6. Approve Mei for shift.
await clip("approve", DESK, mgr, async (p, mark) => {
  await p.goto(SITE + "/manager", { waitUntil: "networkidle" }); await p.waitForSelector(".pcard", { timeout: 20000 }); await wait(p, 1200);
  await p.getByRole("button", { name: "Mei Huang" }).first().click(); await wait(p, 1500); mark("passport");
  await p.getByRole("dialog").getByRole("button", { name: "Approve for shift" }).click({ timeout: 8000 }); mark("approve"); await wait(p, 4500); mark("end");
});

// 7. Mei's phone: the seal lands, in her language.
await clip("seal", PHONE, null, async (p, mark) => {
  await p.goto(SITE + "/t/mei-demo", { waitUntil: "networkidle" }); mark("load"); await wait(p, 5000);
});

// 8. Accessibility setup in English: captions + read aloud + extra time, then the roomier lesson.
await clip("a11ysetup", PHONE, null, async (p, mark) => {
  await p.goto(SITE + "/learn/server", { waitUntil: "networkidle" }); await wait(p, 1500); mark("setup");
  await p.mouse.wheel(0, 260); await wait(p, 600);
  for (const re of [/Captions on videos/, /Read aloud/, /Extra time/]) { await p.getByRole("button", { name: re }).first().click({ timeout: 5000 }).catch(() => mark("miss " + re)); mark("tick " + re); await wait(p, 900); }
  await wait(p, 600);
  await p.getByRole("button", { name: /Continue/ }).first().click({ timeout: 5000 }).catch(() => mark("no continue")); mark("continue"); await wait(p, 2200);
  await p.evaluate(() => { const v = document.querySelector("video"); if (v) { v.muted = true; v.play(); } }).catch(() => {});
  await wait(p, 4000); mark("video");
  await p.getByRole("button", { name: /Pictures/ }).first().click({ timeout: 5000 }).catch(() => mark("no pictures")); mark("pictures"); await wait(p, 2600);
  await p.getByRole("button", { name: /Listen/ }).first().click({ timeout: 5000 }).catch(() => mark("no listen")); mark("listen"); await wait(p, 2600);
  mark("end");
});

// 9. Daniel (Deaf, learns visually): captioned video, then picture steps.
await clip("daniel", PHONE, null, async (p, mark) => {
  await p.goto(SITE + "/t/daniel-demo", { waitUntil: "networkidle" }); await wait(p, 1800); mark("load");
  await p.getByRole("button", { name: /Video/ }).first().click({ timeout: 5000 }).catch(() => mark("no video tab"));
  await p.evaluate(() => { const v = document.querySelector("video"); if (v) { v.muted = true; v.play(); } }).catch(() => {});
  mark("video"); await wait(p, 4000);
  await p.getByRole("button", { name: /Pictures/ }).first().click({ timeout: 5000 }).catch(() => mark("no pictures")); mark("pictures"); await wait(p, 2500);
});

// 10. Keyboard only: focus ring moves across Daniel's card, Enter opens his passport, Esc closes it.
await clip("keys", DESK, mgr, async (p, mark) => {
  await p.goto(SITE + "/manager", { waitUntil: "networkidle" }); await p.waitForSelector(".pcard", { timeout: 20000 }); await wait(p, 1200);
  await p.keyboard.press("Tab"); await wait(p, 300);
  const card = p.locator(".pcard", { hasText: "Daniel Reyes" }).first();
  await card.getByRole("button").first().focus(); mark("focus"); await wait(p, 700);
  for (let k = 0; k < 3; k++) { await p.keyboard.press("Tab"); await wait(p, 650); }
  mark("tabs");
  await card.getByRole("button", { name: /Review passport/ }).focus(); await wait(p, 600);
  await p.keyboard.press("Enter"); mark("enter"); await wait(p, 3800);
  await p.keyboard.press("Tab"); await wait(p, 700); await p.keyboard.press("Tab"); await wait(p, 700);
  await p.keyboard.press("Escape"); mark("esc"); await wait(p, 1500);
});

await reset();
console.log("reset done");
await browser.close();
