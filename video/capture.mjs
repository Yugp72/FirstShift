// Capture real FirstShift screens from the live Enter deployment for video planning.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const SITE = "https://7ceaa6f9d4a2409ab7753ed1c9165da1.prod.enter.pro";
const API = "https://br-prime-seal-b67e3e22.supabase.aidap-global.ap-southeast-1.bytepluses.com/functions/v1/firstshift-api";
const OUT = new URL("./reference/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const hideBadge = async (page) => page.evaluate(() => {
  for (const el of document.querySelectorAll("body *")) {
    if (/^\s*Build with/.test(el.textContent || "") && el.getBoundingClientRect().width < 400) {
      let n = el; while (n.parentElement && n.parentElement !== document.body) n = n.parentElement; n.style.display = "none";
    }
  }
});
const shot = async (page, name, full = false) => { await hideBadge(page); await page.waitForTimeout(400); await page.screenshot({ path: OUT + name + ".png", fullPage: full }); console.log("saved", name); };

const login = await (await fetch(API + "/api/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "manager" }) })).json();
const sid = login.session;

// Manager, desktop
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await desk.addInitScript((s) => localStorage.setItem("fs_session", s), sid);
const m = await desk.newPage();
await m.goto(SITE + "/manager", { waitUntil: "networkidle" });
await m.waitForSelector(".pcard", { timeout: 20000 });
await shot(m, "m1-pipeline");
await m.getByRole("button", { name: "Daniel Reyes" }).first().click();
await m.waitForTimeout(1500);
await shot(m, "m2-passport-daniel");
await m.keyboard.press("Escape"); await m.waitForTimeout(1200);
await m.getByRole("button", { name: "Mei Huang" }).first().click();
await m.waitForTimeout(1500);
await shot(m, "m3-passport-mei");
await m.keyboard.press("Escape"); await m.waitForTimeout(1200);
await m.getByRole("button", { name: /Team knowledge gaps/ }).click();
await m.waitForTimeout(2500);
await shot(m, "m4-gaps");
await m.keyboard.press("Escape"); await m.waitForTimeout(1000);

// Job posts (default form values are pre-cached in Enter AI's cache)
await m.goto(SITE + "/manager/new", { waitUntil: "networkidle" });
await shot(m, "m5-orderin-form");
const submit = m.locator("form button[type=submit]").first();
await submit.click();
await m.waitForSelector(".post", { timeout: 90000 });
await m.waitForTimeout(2000);
await shot(m, "m6-posts", true);

// Hire, phone
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await phone.newPage();
for (const [name, path] of [["p1-daniel-lesson", "/t/daniel-demo"], ["p2-lin-lesson", "/t/lin-demo"], ["p4-ana-ready", "/t/ana-demo"], ["p5-kevin-ready", "/t/kevin-demo"]]) {
  await p.goto(SITE + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(3500);
  await shot(p, name);
}
// Lin's quiz
await p.goto(SITE + "/t/lin-demo", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
await p.getByRole("button", { name: /菜单|Menu/ }).first().click().catch(() => {});
await p.waitForTimeout(600);
const quiz = p.locator(".item").filter({ hasText: "小测验" }).last();
await quiz.click().catch(() => {});
await p.waitForTimeout(2000);
await shot(p, "p3-lin-quiz");
// Job page in Chinese for Lin
const lin = await (await fetch(API + "/api/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "applicant" }) })).json();
const phone2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await phone2.addInitScript((s) => localStorage.setItem("fs_session", s), lin.session);
const j = await phone2.newPage();
await j.goto(SITE + "/jobs/2", { waitUntil: "networkidle" }); await j.waitForTimeout(3000);
await shot(j, "p6-lin-job", true);

// Clean up demo data
const r = await fetch(API + "/api/demo/reset", { method: "POST", headers: { "Content-Type": "application/json", "x-fs-session": sid }, body: "{}" });
console.log("reset", r.status);
await browser.close();
