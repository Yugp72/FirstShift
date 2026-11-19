import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { DemoOnly } from "../components/DemoOnly";
import { ManagerHeader } from "../components/ManagerHeader";
import { api, download, type ChannelPost, type Job, type Lang, type Meta } from "../lib/api";

const LANG_ATTR: Record<string, string | undefined> = { zh: "zh-CN", es: "es", en: "en" };
export const TASK_ICON: Record<string, string> = { seated: "🪑", standing: "🧍", lifting: "📦", customer: "🙂", language: "🗣️", detail: "🔎" };

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
      className="post"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: i * 0.08 }}
      aria-label={`${p.label} post`}
    >
      <div className="post-head">
        <div>
          <h3>{p.label}</h3>
          <small>{kind}</small>
        </div>
        <span className={`badge ${over ? "badge-danger" : ""}`} title="Characters used / channel limit">{n} / {p.limit}</span>
      </div>
      <pre lang={LANG_ATTR[p.lang.split("+")[0]]}>{p.text}</pre>
      <div className="fmt">{p.format_note}</div>
      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={copy} aria-live="polite">{copied ? "Copied ✓" : "Copy"}</button>
        {/* [DEMO ONLY] Real platform publishing needs accounts we don't assume access to. */}
        <DemoOnly className="btn btn-sm">Publish</DemoOnly>
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
      <main id="main" className="page">
        <div className="page-head"><div><h1>Post a job</h1><p>Describe the role once. FirstShift writes it for every channel and language.</p></div></div>
        <div className="order-grid">
        <form className="panel" onSubmit={submit} aria-labelledby="order-title">
                    <h2 id="order-title">Role details</h2>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 13.5 }}>One entry, every channel.</p>

          <span className="field-label" id="role-l">Role</span>
          <div className="seg" role="group" aria-labelledby="role-l">
            {(["server", "kitchen"] as const).map((r) => (
              <button type="button" key={r} aria-pressed={role === r} onClick={() => {
                setRole(r);
                setTitle(r === "server" ? "Weekend server" : "Weekend dumpling prep");
                setReqs(r === "server" ? ["no_experience", "weekends", "standing"] : ["no_experience", "standing", "lifting", "food_handler"]);
              }}>
                {r === "server" ? "Server" : "Kitchen prep"}
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="f-title">Job title</label>
          <input id="f-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label className="field-label" htmlFor="f-pay">Pay range</label>
          <input id="f-pay" className="input" value={pay} onChange={(e) => setPay(e.target.value)} placeholder="e.g. $20–$24/hr + tips" />

          <label className="field-label" htmlFor="f-sched">Shifts</label>
          <input id="f-sched" className="input" value={schedule} onChange={(e) => setSchedule(e.target.value)} />

          <span className="field-label" id="req-l">What you need</span>
          <div className="row" role="group" aria-labelledby="req-l">
            {meta && Object.entries(meta.requirements).map(([k, v]) => (
              <button type="button" key={k} className="chip" aria-pressed={reqs.includes(k)} onClick={() => setReqs(toggle(reqs, k))}>{v.en}</button>
            ))}
          </div>

          <span className="field-label" id="lang-l">Languages welcome (training in each)</span>
          <div className="row" role="group" aria-labelledby="lang-l">
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

          {err && <p role="alert" style={{ color: "var(--danger)", fontWeight: 600 }}>{err}</p>}
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20, minHeight: 46 }} disabled={busy}>{busy ? "Writing posts…" : "Generate posts"}</button>
        </form>

        <section aria-labelledby="out-title" aria-live="polite">
          <div className="row" style={{ marginBottom: 14 }}>
            <h2 id="out-title" style={{ margin: 0, fontSize: 18 }}>{job ? `${job.posts.length} channel posts · ${job.title}` : "Channel posts"}</h2>
            {job && (
              <>
                <button type="button" className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={() => download(`/api/jobs/${job.id}/export?fmt=csv`, `firstshift-job-${job.id}.csv`).catch((e) => setErr((e as Error).message))}>Export CSV</button>
                <button type="button" className="btn btn-sm" onClick={() => download(`/api/jobs/${job.id}/export?fmt=json`, `firstshift-job-${job.id}.json`).catch((e) => setErr((e as Error).message))}>Export JSON</button>
              </>
            )}
            <p className="muted" style={{ flexBasis: "100%", margin: 0, fontSize: 13.5 }}>Copy each post to its channel, or export them all. Publishing straight to job boards comes in the pilot.</p>
          </div>
          {!job && !busy && (
            <div className="empty">
              <b>No posts yet</b>
              Fill in the role and press Generate posts. One entry writes a job-board listing, a classifieds ad,
              WeChat and WhatsApp messages, an in-store flyer, a bilingual post and an easy-read version.
            </div>
          )}
          {busy && (
            <div className="empty" role="status">
              <b>Enter AI is writing your posts…</b>
              Seven channels in English, 中文 and Español, plus task cards. This takes about 30–45 seconds.
            </div>
          )}
          {job && !busy && (
            <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5 }}>
              {job.posts_by === "enter-ai" ? "✦ Written by Enter AI (Converge.AI) from your one entry." : "Written from the FirstShift templates (AI was unavailable)."}
            </p>
          )}
          {job && !busy && !!job.task_cards?.length && (
            <div className="panel" style={{ marginBottom: 16 }} aria-label="Task cards">
              <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Task cards</h3>
              <p className="muted" style={{ margin: "0 0 10px", fontSize: 13.5 }}>What the job involves, so candidates can see which stations fit how they work best. Shown on the job board.</p>
              <div className="row" style={{ alignItems: "stretch" }}>
                {job.task_cards.map((tc, i) => (
                  <div key={i} className="chip" style={{ display: "block", textAlign: "left", maxWidth: 260, whiteSpace: "normal", padding: "10px 14px", height: "auto" }}>
                    <b>{TASK_ICON[tc.kind] || "•"} {tc.title}</b>
                    <div className="muted" style={{ fontSize: 13 }}>{tc.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {job && !busy && (
            <div className="posts" key={printKey}>
              {job.posts.map((p, i) => <ChannelPostCard key={p.channel} p={p} i={i} meta={meta} />)}
            </div>
          )}
        </section>
        </div>
      </main>
      <p className="footer-note">AI: {meta?.ai.mode === "live" ? "Enter AI by Converge.AI (live, cached)" : "offline templates"} · Posts are drafts to check before posting.</p>
    </div>
  );
}
