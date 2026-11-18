import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DemoOnly } from "../components/DemoOnly";
import { InsightsDrawer } from "../components/InsightsDrawer";
import { ManagerHeader } from "../components/ManagerHeader";
import { MetricsStrip } from "../components/MetricsStrip";
import { Passport } from "../components/Passport";
import { SendBackDialog } from "../components/SendBackDialog";
import { Seal } from "../components/Stamp";
import { PersonCard } from "../components/Ticket";
import { api, LANG_CHIP, type Board, type Meta, type Status, type Ticket } from "../lib/api";
import { bell } from "../lib/sound";
import { subscribeBoard } from "../lib/sse";

const COLS: { key: "POSTED" | Status; label: string }[] = [
  { key: "POSTED", label: "Job posts" },
  { key: "APPLIED", label: "Applied" },
  { key: "TRAINING", label: "In training" },
  { key: "REVIEW", label: "Ready for review" },
  { key: "SHIFT_READY", label: "Shift-ready" },
];

export default function ManagerRail() {
  const [board, setBoard] = useState<Board | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [err, setErr] = useState("");
  const [sound, setSound] = useState(false);
  const soundRef = useRef(false);
  soundRef.current = sound;
  const [glow, setGlow] = useState<Set<number>>(new Set());
  const [openLink, setOpenLink] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [approving, setApproving] = useState<Ticket | null>(null);
  const [sendBack, setSendBack] = useState<Ticket | null>(null);
  const [passportId, setPassportId] = useState<number | null>(null);
  const [gapsOpen, setGapsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [live, setLive] = useState("");
  const loading = useRef(false);
  const pending = useRef(false);

  const load = useCallback(async () => {
    if (loading.current) { pending.current = true; return; }
    loading.current = true;
    try { setBoard(await api.board()); setErr(""); }
    catch (e) { setErr((e as Error).message); }
    finally {
      loading.current = false;
      if (pending.current) { pending.current = false; load(); }
    }
  }, []);

  useEffect(() => {
    load();
    api.meta().then(setMeta).catch(() => undefined);
    return subscribeBoard((ev) => {
      if (ev.type === "hello") return;
      if (ev.type === "ticket.moved" && ev.to === "REVIEW" && ev.candidate_id) {
        const id = ev.candidate_id;
        if (soundRef.current) bell();
        setGlow((s) => new Set(s).add(id));
        setLive("Someone just finished training and is ready for review.");
        window.setTimeout(() => setGlow((s) => { const n = new Set(s); n.delete(id); return n; }), 1800);
      }
      load();
    });
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 5200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const all = board ? Object.values(board.columns).flat() : [];
  const passport = all.find((t) => t.id === passportId) ?? null;

  const hire = async (t: Ticket) => {
    setBusy(t.id);
    try { await api.hire(t.id); setOpenLink(t.id); await load(); }
    catch (e) { setToast((e as Error).message); }
    setBusy(null);
  };

  const approve = async (t: Ticket) => {
    if (!t.hire) return;
    setBusy(t.id);
    setPassportId(null);
    setApproving(t);
    try { await api.stamp(t.hire.id); } catch (e) { setToast((e as Error).message); }
    window.setTimeout(() => {
      setApproving(null);
      setBusy(null);
      setLive(`${t.name} is approved for their first shift.`);
      load();
    }, 1800);
  };

  const reset = async () => {
    await api.reset();
    setOpenLink(null);
    setPassportId(null);
    setToast("Demo data reset.");
    load();
  };

  return (
    <div className="mgr">
      <ManagerHeader>
        <button type="button" className="btn btn-sm hide-sm" aria-pressed={sound} onClick={() => { setSound(!sound); if (!sound) bell(); }}>
          {sound ? "Sound on" : "Sound off"}
        </button>
        <button type="button" className="btn btn-sm" onClick={reset}>Reset demo</button>
      </ManagerHeader>

      <main id="main" className="page">
        <div className="page-head">
          <div>
            <h1>Hiring pipeline</h1>
            <p>From job post to first shift. Open anyone's passport to see what they learned, how, and how sure they feel.</p>
          </div>
          <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={() => setGapsOpen(true)}>Team knowledge gaps</button>
        </div>

        {board && <MetricsStrip m={board.metrics} />}
        {err && <p role="alert" className="col-empty" style={{ marginBottom: 16 }}>Can't reach the server: {err}</p>}

        <div className="board-wrap">
          <LayoutGroup>
            <div className="board">
              {COLS.map((c) => {
                const items = board && c.key !== "POSTED" ? board.columns[c.key] : [];
                const count = c.key === "POSTED" ? board?.jobs.length ?? 0 : items.length;
                return (
                  <section key={c.key} className="col" data-col={c.key} aria-labelledby={`col-${c.key}`}>
                    <div className="col-head">
                      <span className="dot" aria-hidden="true" />
                      <h2 id={`col-${c.key}`}>{c.label}</h2>
                      <span className="count" aria-label={`${count} items`}>{count}</span>
                    </div>

                    {c.key === "POSTED" && board?.jobs.map((j) => (
                      <article key={`job-${j.id}`} className="pcard job-card" aria-label={`Job post: ${j.title}`}>
                        <div className="pcard-name">{j.title}</div>
                        <div className="pcard-sub">{j.schedule}</div>
                        <div className="pay">{j.pay_range}</div>
                        <div className="pcard-meta">
                          {j.languages.map((l) => <span className="badge" key={l}>{LANG_CHIP[l]}</span>)}
                          <span className="badge">{j.channels} channels</span>
                        </div>
                        <div className="pcard-sub" style={{ marginTop: 8 }}>{j.applicants} applicants</div>
                        <div className="pcard-actions">
                          <Link className="btn btn-sm" to={`/manager/new?job=${j.id}`}>View posts</Link>
                          {/* [DEMO ONLY] */}
                          <DemoOnly className="btn btn-sm">Close post</DemoOnly>
                        </div>
                      </article>
                    ))}
                    {c.key === "POSTED" && <Link to="/manager/new" className="col-empty">+ Post a new job</Link>}

                    <AnimatePresence initial={false}>
                      {items.map((t) => (
                        <PersonCard key={t.id} t={t} publicBase={board?.public_base ?? null}
                          linkOpen={openLink === t.id} highlight={glow.has(t.id)} busy={busy === t.id}
                          onOpen={() => setPassportId(t.id)}
                          onToggleLink={() => setOpenLink(openLink === t.id ? null : t.id)}
                          onHire={() => hire(t)} onApprove={() => approve(t)} onSendBack={() => setSendBack(t)} />
                      ))}
                    </AnimatePresence>
                    {c.key !== "POSTED" && board && items.length === 0 && <div className="col-empty">No one here yet.</div>}
                  </section>
                );
              })}
            </div>
          </LayoutGroup>
        </div>
      </main>

      <p className="footer-note">Sample training content · All people are demo data · AI: {meta?.ai.provider === "converge+fallback" ? "Converge.AI Enter (live, cached)" : "offline mock"}</p>

      <Passport t={passport} publicBase={board?.public_base ?? null} onClose={() => setPassportId(null)}
        onApprove={approve} onSendBack={(t) => { setPassportId(null); setSendBack(t); }} />
      <InsightsDrawer open={gapsOpen} onClose={() => setGapsOpen(false)} />

      {sendBack && (
        <SendBackDialog t={sendBack} meta={meta} onClose={() => setSendBack(null)}
          onSent={(r) => {
            setSendBack(null);
            setToast(r.translated ? `Sent in ${r.lang.toUpperCase()}: “${r.note}”` : `Sent: “${r.note}”`);
            load();
          }} />
      )}

      <AnimatePresence>
        {approving && (
          <motion.div className="approve-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="approve-card" initial={{ y: 16, scale: 0.97 }} animate={{ y: 0, scale: 1 }}>
              <Seal animate delay={0.1} />
              <h2>{approving.name} is shift-ready</h2>
              <p className="muted" style={{ margin: 0 }}>Approved with evidence · their phone updates now</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && <div className="toast" role="status">{toast}</div>}
      <div className="sr-only" aria-live="polite">{live}</div>
    </div>
  );
}
