import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { CONF_EMOJI, LANG_CHIP, hireUrl, type Ticket } from "../lib/api";
import { QR } from "./QR";
import { Seal } from "./Stamp";
import { initials } from "./Ticket";

const FMT: Record<string, string> = { read: "Text", pictures: "Pictures", video: "Video", listen: "Audio" };
const STATUS: Record<string, string> = { APPLIED: "Applied", TRAINING: "In training", REVIEW: "Ready for review", SHIFT_READY: "Shift-ready" };

/** The readiness passport: evidence behind one approval. */
export function Passport({ t, publicBase, onClose, onApprove, onSendBack }: {
  t: Ticket | null; publicBase: string | null; onClose: () => void; onApprove: (t: Ticket) => void; onSendBack: (t: Ticket) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!t) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [t, onClose]);

  const h = t?.hire;
  return (
    <AnimatePresence>
      {t && h && (
        <>
          <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="pp-title"
            initial={{ x: 560 }} animate={{ x: 0 }} exit={{ x: 560 }} transition={{ type: "spring", stiffness: 320, damping: 34 }}>
            <button ref={closeRef} type="button" className="close-x" onClick={onClose} aria-label="Close">×</button>
            <div className="row" style={{ gap: 12 }}>
              <span className="initials" style={{ width: 44, height: 44, fontSize: 15 }} aria-hidden="true">{initials(t.name)}</span>
              <div>
                <h2 id="pp-title">{t.name}</h2>
                <div className="muted" style={{ fontSize: 13.5 }}>{t.job_title} · {LANG_CHIP[t.lang]} · {STATUS[t.status]}</div>
              </div>
              {t.status === "SHIFT_READY" && <span style={{ marginLeft: "auto", marginRight: 44 }}><Seal size="sm" /></span>}
            </div>
            <p className="sub" style={{ marginTop: 12 }}>Readiness passport: what they learned, how they learned it, and how sure they feel.</p>

            {h.flags.map((f) => (
              <div key={f.kind} className={`flagline ${f.kind === "allergen_risk" ? "danger" : "warn"}`} style={{ display: "block" }}>
                <div>{f.kind === "allergen_risk" ? "⚠ " : ""}{f.label}</div>
                <div style={{ fontWeight: 400, marginTop: 2 }}>{f.detail}</div>
              </div>
            ))}

            <h3>Training steps</h3>
            <table className="table">
              <thead><tr><th>Step</th><th>First try</th><th>Feels</th><th>Learned with</th></tr></thead>
              <tbody>
                {h.modules.map((m) => (
                  <tr key={m.id}>
                    <td>{m.icon} {m.title}{h.sent_back?.module_id === m.id ? <div className="badge badge-warn" style={{ marginTop: 4 }}>Sent back</div> : null}</td>
                    <td>{m.score !== null ? `${Math.round(m.score * 100)}%` : <span className="muted">Not yet</span>}</td>
                    <td>{m.confidence ? CONF_EMOJI[m.confidence] : "–"}</td>
                    <td>{(m.formats ?? []).length ? (m.formats ?? []).map((f) => <span key={f} className="badge" style={{ marginRight: 4 }}>{FMT[f] ?? f}</span>) : <span className="muted">–</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>How they learn best</h3>
            {h.prefs.length ? (
              <div className="row">{h.prefs.map((p) => <span key={p.id} className="badge badge-accent">{p.label}</span>)}</div>
            ) : <p className="muted" style={{ margin: 0, fontSize: 14 }}>No preferences shared.</p>}

            <h3>Work setup notes for the first shift</h3>
            {h.setup_notes.length ? (
              <ul className="notes">{h.setup_notes.map((n) => <li key={n}>{n}</li>)}</ul>
            ) : <p className="muted" style={{ margin: 0, fontSize: 14 }}>Standard setup.</p>}
            <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Shared by the hire as work preferences. This is not a medical or disability record.</p>

            <h3>AI read</h3>
            <p style={{ margin: 0, fontSize: 14 }}>{t.summary}</p>

            {t.status === "TRAINING" && (
              <>
                <h3>Training link</h3>
                <div className="linkbox"><QR value={hireUrl(h.path, publicBase)} /><code>{hireUrl(h.path, publicBase)}</code></div>
              </>
            )}

            {t.status === "REVIEW" && (
              <div className="row" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-success" onClick={() => onApprove(t)}>Approve for shift</button>
                <button type="button" className="btn" onClick={() => onSendBack(t)}>Send back a step</button>
              </div>
            )}
            {t.status === "SHIFT_READY" && h.stamped_at && (
              <p className="muted" style={{ marginTop: 20, fontSize: 13.5 }}>Approved {new Date(h.stamped_at).toLocaleString()}.</p>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
