import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { InsightsDrawer } from "../components/InsightsDrawer";
import { ManagerHeader } from "../components/ManagerHeader";
import { MetricsStrip } from "../components/MetricsStrip";
import { SendBackDialog } from "../components/SendBackDialog";
import { Stamp } from "../components/Stamp";
import { Holes, TicketCard, TicketHeader } from "../components/Ticket";
import { DemoOnly } from "../components/DemoOnly";
import { api, LANG_CHIP, type Board, type Meta, type Status, type Ticket } from "../lib/api";
import { bell } from "../lib/sound";
import { subscribeBoard } from "../lib/sse";

const COLS: { key: "ORDER_IN" | Status; label: string; sub: string }[] = [
  { key: "ORDER_IN", label: "ORDER IN", sub: "Postings out" },
  { key: "APPLIED", label: "ON THE BOARD", sub: "Applied" },
  { key: "TRAINING", label: "FIRING", sub: "In training" },
  { key: "REVIEW", label: "AT THE PASS", sub: "Ready for your check" },
  { key: "SHIFT_READY", label: "SHIFT-READY", sub: "Stamped" },
];

export default function ManagerRail() {
  const [board, setBoard] = useState<Board | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [err, setErr] = useState("");
  const [sound, setSound] = useState(false);
  const soundRef = useRef(false);
  soundRef.current = sound;
  const [swing, setSwing] = useState<Set<number>>(new Set());
  const [openLink, setOpenLink] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [stamping, setStamping] = useState<Ticket | null>(null);
  const [sendBack, setSendBack] = useState<Ticket | null>(null);
  const [gapsOpen, setGapsOpen] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [live, setLive] = useState<string>("");
  const loading = useRef(false);
  const pending = useRef(false);

  const load = useCallback(async () => {
    if (loading.current) { pending.current = true; return; }
    loading.current = true;
    try {
      setBoard(await api.board());
      setErr("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
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
        setSwing((s) => new Set(s).add(id));
        setLive("A ticket just arrived at the pass.");
        window.setTimeout(() => setSwing((s) => { const n = new Set(s); n.delete(id); return n; }), 1700);
      }
      load();
    });
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 5200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const hire = async (t: Ticket) => {
    setBusy(t.id);
    try {
      await api.hire(t.id);
      setOpenLink(t.id);
      await load();
    } catch (e) { setToast((e as Error).message); }
    setBusy(null);
  };

  const stamp = async (t: Ticket) => {
    if (!t.hire) return;
    setBusy(t.id);
    setStamping(t);
    try {
      await api.stamp(t.hire.id);
    } catch (e) { setToast((e as Error).message); }
    window.setTimeout(() => {
      setStamping(null);
      setBusy(null);
      setLive(`${t.name} is stamped shift-ready.`);
      load();
    }, 1900);
  };

  const reset = async () => {
    await api.reset();
    setOpenLink(null);
    setToast("Demo data reset.");
    load();
  };

  const colItems = (key: string): Ticket[] => (board && key !== "ORDER_IN" ? board.columns[key as Status] : []);

  return (
    <div className="mgr">
      <ManagerHeader>
        <button type="button" className="tool" aria-pressed={sound} onClick={() => { setSound(!sound); if (!sound) bell(); }}>
          {sound ? "🔔 Bell on" : "🔕 Bell off"}
        </button>
        <button type="button" className="tool" onClick={reset}>↺ Reset demo</button>
      </ManagerHeader>

      <main id="main" className="rail-page">
        <div className="rail-title">
          <h1>THE RAIL</h1>
          <p>Every new hire is a ticket. Watch it move from posting to shift-ready, then stamp it.</p>
        </div>
        {err && <p role="alert" className="col-empty" style={{ marginBottom: 16 }}>Can't reach the kitchen: {err}</p>}

        <div className="rail">
          <div className="rail-bar" aria-hidden="true" />
          <LayoutGroup>
            <div className="cols">
              {COLS.map((c) => {
                const items = colItems(c.key);
                const count = c.key === "ORDER_IN" ? board?.jobs.length ?? 0 : items.length;
                return (
                  <section key={c.key} className="col" data-col={c.key} aria-labelledby={`col-${c.key}`}>
                    <div className="clip">
                      <h2 id={`col-${c.key}`}>{c.label}</h2>
                      <small>{c.sub}</small>
                      <span className="count" aria-label={`${count} tickets`}>{count}</span>
                    </div>

                    {c.key === "ORDER_IN" && board?.jobs.map((j) => (
                      <article key={`job-${j.id}`} className="tkt paper job-tkt" aria-label={`Posting: ${j.title}`}>
                        <div className="tkt-head"><span><b>POSTING</b> · {j.role === "server" ? "FRONT" : "KITCHEN"}</span><span>{j.channels} CH</span></div>
                        <div className="tkt-name">{j.title}</div>
                        <div className="tkt-meta">{j.schedule}</div>
                        <div className="pay">{j.pay_range}</div>
                        <div className="lang-chips">{j.languages.map((l) => <span className="chip-s" key={l}>{LANG_CHIP[l]}</span>)}</div>
                        <div className="tkt-meta" style={{ marginTop: 8 }}>{j.applicants} applicants</div>
                        <div className="tkt-actions">
                          <Link className="tbtn" to={`/manager/new?job=${j.id}`} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>VIEW POSTS</Link>
                          {/* [DEMO ONLY] */}
                          <DemoOnly className="tbtn">86 THIS POSTING</DemoOnly>
                        </div>
                      </article>
                    ))}
                    {c.key === "ORDER_IN" && (
                      <Link to="/manager/new" className="col-empty" style={{ textDecoration: "none", color: "var(--paper)" }}>+ FIRE A NEW POSTING</Link>
                    )}

                    <AnimatePresence initial={false}>
                      {items.map((t) => (
                        <TicketCard
                          key={t.id}
                          t={t}
                          publicBase={board?.public_base ?? null}
                          linkOpen={openLink === t.id}
                          swing={swing.has(t.id)}
                          busy={busy === t.id}
                          onToggleLink={() => setOpenLink(openLink === t.id ? null : t.id)}
                          onHire={() => hire(t)}
                          onStamp={() => stamp(t)}
                          onSendBack={() => setSendBack(t)}
                        />
                      ))}
                    </AnimatePresence>
                    {c.key !== "ORDER_IN" && board && items.length === 0 && (
                      <div className="col-empty">{c.key === "REVIEW" ? "Nobody at the pass yet." : "Empty."}</div>
                    )}
                  </section>
                );
              })}
            </div>
          </LayoutGroup>
        </div>
      </main>

      <p className="footer-note" style={{ paddingBottom: 110 }}>Sample training content · All people are DEMO DATA · AI: {meta?.ai.provider ?? "…"} mode</p>

      {board && <MetricsStrip m={board.metrics} onGaps={() => setGapsOpen(true)} />}
      <InsightsDrawer open={gapsOpen} onClose={() => setGapsOpen(false)} />

      {sendBack && (
        <SendBackDialog t={sendBack} meta={meta} onClose={() => setSendBack(null)}
          onSent={(r) => {
            setSendBack(null);
            setToast(r.translated ? `Sent in ${r.lang.toUpperCase()}: “${r.note}”` : `Sent (shown in English; live AI translates custom notes): “${r.note}”`);
            load();
          }} />
      )}

      <AnimatePresence>
        {stamping && (
          <motion.div className="stamp-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div className="tkt paper" initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}>
              <TicketHeader t={{ ...stamping, hire: stamping.hire && { ...stamping.hire } }} />
              <div className="tkt-name">{stamping.name}</div>
              <div className="tkt-meta">{stamping.job_title}</div>
              <div className="tkt-row"><Holes t={stamping} /><span className="tkt-meta">first try {stamping.hire?.first_try_pct}%</span></div>
              <p className="tkt-summary" style={{ minHeight: 150 }}>Approved by manager<br />{new Date().toLocaleString()}</p>
              <Stamp animate delay={0.25} style={{ right: 26, top: 96, width: 180, height: 180 }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && <div className="toast paper" role="status">{toast}</div>}
      <div className="sr-only" aria-live="polite">{live}</div>
    </div>
  );
}
