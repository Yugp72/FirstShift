import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { DemoOnly } from "../components/DemoOnly";
import { ManagerHeader } from "../components/ManagerHeader";
import { api, type ChannelPost, type Job, type Lang, type Meta } from "../lib/api";

const LANG_ATTR: Record<string, string | undefined> = { zh: "zh-CN", es: "es", en: "en" };

function ChannelPostCard({ p, i, meta }: { p: ChannelPost; i: number; meta: Meta | null }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const n = [...p.text].length;
  const over = n > p.limit;
  const kind = meta?.channels[p.channel]?.kind ?? "";
  const copy = async () => {
    try { await navigator.clipboard.writeText(p.text); } catch { /* clipboard blocked */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <motion.article
      className="receipt paper torn"
      initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)", y: -14 }}
      animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 -12px 0)", y: 0 }}
      transition={{ duration: reduce ? 0.2 : 0.75, delay: i * 0.28, ease: [0.2, 0.7, 0.2, 1] }}
      aria-label={`${p.label} post`}
    >
      <div className="receipt-head">
        <div>
          <h3>{p.label.toUpperCase()}</h3>
          <small>{kind}</small>
        </div>
        <span className={`count-badge ${over ? "over" : ""}`} title="Characters used / channel limit">{n} / {p.limit}</span>
      </div>
      <pre lang={LANG_ATTR[p.lang.split("+")[0]]}>{p.text}</pre>
      <div className="fmt">{p.format_note}</div>
      <div className="tkt-actions">
        <button type="button" className="tbtn primary" onClick={copy} aria-live="polite">{copied ? "COPIED ✓" : "COPY"}</button>
        {/* [DEMO ONLY] Real platform publishing needs accounts we don't assume access to. */}
        <DemoOnly className="tbtn">PUBLISH</DemoOnly>
      </div>
    </motion.article>
  );
}

export default function ManagerOrderIn() {
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [role, setRole] = useState<"server" | "kitchen">("server");
  const [title, setTitle] = useState("Weekend server");
  const [pay, setPay] = useState("");
  const [schedule, setSchedule] = useState("Sat–Sun evenings, 4 shifts a week");
  const [reqs, setReqs] = useState<string[]>(["no_experience", "weekends", "standing"]);
  const [langs, setLangs] = useState<Lang[]>(["en", "zh", "es"]);
  const [notes, setNotes] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [printKey, setPrintKey] = useState(0);

  useEffect(() => { api.meta().then(setMeta).catch(() => undefined); }, []);
  useEffect(() => {
    const id = Number(params.get("job"));
    if (id) api.job(id).then((j) => { setJob(j); setPrintKey((k) => k + 1); }).catch(() => undefined);
  }, [params]);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const j = await api.createJob({ role, title, location: "Palo Alto, CA", pay_range: pay, schedule, requirements: reqs, languages: langs.includes("en") ? langs : ["en", ...langs], notes });
      setJob(j);
      setPrintKey((k) => k + 1);
      setParams({ job: String(j.id) }, { replace: true });
    } catch (e2) {
      setErr((e2 as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="mgr">
      <ManagerHeader />
      <main id="main" className="order-page">
        <form className="order-form paper torn" onSubmit={submit} aria-labelledby="order-title">
          <div className="tkt-head"><span><b>NEW ORDER</b> · ONE ENTRY</span><span>{new Date().toLocaleDateString()}</span></div>
          <h1 id="order-title" style={{ marginTop: 14 }}>DESCRIBE THE ROLE ONCE</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--muted)" }}>We print it for every channel, in every language you pick.</p>

          <span className="field-label" id="role-l">Role</span>
          <div className="seg" role="group" aria-labelledby="role-l">
            {(["server", "kitchen"] as const).map((r) => (
              <button type="button" key={r} aria-pressed={role === r} onClick={() => {
                setRole(r);
                setTitle(r === "server" ? "Weekend server" : "Weekend dumpling prep");
                setReqs(r === "server" ? ["no_experience", "weekends", "standing"] : ["no_experience", "standing", "lifting", "food_handler"]);
              }}>
                {r === "server" ? "SERVER · FRONT" : "KITCHEN PREP · BACK"}
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="f-title">Job title</label>
          <input id="f-title" className="uline" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label className="field-label" htmlFor="f-pay">Pay range</label>
          <input id="f-pay" className="uline" value={pay} onChange={(e) => setPay(e.target.value)} placeholder="e.g. $20–$24/hr + tips" />

          <label className="field-label" htmlFor="f-sched">Shifts</label>
          <input id="f-sched" className="uline" value={schedule} onChange={(e) => setSchedule(e.target.value)} />

          <span className="field-label" id="req-l">What you need</span>
          <div className="chips" role="group" aria-labelledby="req-l">
            {meta && Object.entries(meta.requirements).map(([k, v]) => (
              <button type="button" key={k} className="chip" aria-pressed={reqs.includes(k)} onClick={() => setReqs(toggle(reqs, k))}>{v.en}</button>
            ))}
          </div>

          <span className="field-label" id="lang-l">Languages welcome (training in each)</span>
          <div className="chips" role="group" aria-labelledby="lang-l">
            {meta?.languages.map((l) => (
              <button type="button" key={l.code} className="chip" aria-pressed={langs.includes(l.code)}
                disabled={l.code === "en"} title={l.code === "en" ? "English is always included" : undefined}
                onClick={() => setLangs(toggle(langs, l.code))} lang={LANG_ATTR[l.code]}>
                {l.native}
              </button>
            ))}
            {/* [DEMO ONLY] pilot languages */}
            {meta?.pilot_languages.map((l) => (
              <DemoOnly key={l.native} className="chip" label={l.name}>{l.native} · pilot</DemoOnly>
            ))}
          </div>

          <label className="field-label" htmlFor="f-notes">Anything else (optional)</label>
          <textarea id="f-notes" className="ta" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Staff meal included" />

          {err && <p role="alert" style={{ color: "var(--primary)", fontWeight: 700 }}>{err}</p>}
          <button type="submit" className="fire" disabled={busy}>{busy ? "PRINTING…" : "FIRE A POSTING"}</button>
        </form>

        <section aria-labelledby="out-title" aria-live="polite">
          <div className="receipts-head">
            <h2 id="out-title">{job ? `${job.posts.length} CHANNELS · ${job.title.toUpperCase()}` : "THE PRINTER"}</h2>
            {job && (
              <>
                <a className="tool" href={`/api/jobs/${job.id}/export?fmt=csv`} download>⤓ Export CSV</a>
                <a className="tool" href={`/api/jobs/${job.id}/export?fmt=json`} download>⤓ Export JSON</a>
              </>
            )}
            <p>Copy each post to its channel, or export them all. Publishing straight to job boards comes in the pilot.</p>
          </div>
          {!job && (
            <div className="empty-receipts">
              <b>NOTHING PRINTING YET</b>
              Fill in the ticket and press FIRE A POSTING. One entry prints a job-board listing, a classifieds ad,
              WeChat and WhatsApp messages, an in-store flyer, a bilingual post and an easy-read version.
            </div>
          )}
          {job && (
            <div className="receipts" key={printKey}>
              {job.posts.map((p, i) => <ChannelPostCard key={p.channel} p={p} i={i} meta={meta} />)}
            </div>
          )}
        </section>
      </main>
      <p className="footer-note">AI: {meta?.ai.provider ?? "…"} mode · Posts are drafts for the manager to check before posting.</p>
    </div>
  );
}
