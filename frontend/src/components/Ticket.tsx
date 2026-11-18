import { motion, useReducedMotion } from "framer-motion";
import { CONF_EMOJI, LANG_CHIP, ago, hireUrl, type Ticket } from "../lib/api";
import { DemoOnly } from "./DemoOnly";
import { QR } from "./QR";
import { Stamp } from "./Stamp";

interface Props {
  t: Ticket;
  publicBase: string | null;
  linkOpen?: boolean;
  swing?: boolean;
  busy?: boolean;
  large?: boolean;
  onToggleLink?: () => void;
  onHire?: () => void;
  onStamp?: () => void;
  onSendBack?: () => void;
}

export function TicketHeader({ t }: { t: Ticket }) {
  return (
    <div className="tkt-head">
      <span><b>#{String(t.ticket_no).padStart(4, "0")}</b> · {t.role === "server" ? "SERVER" : "KITCHEN"} · <span lang={t.lang === "zh" ? "zh-CN" : undefined}>{LANG_CHIP[t.lang]}</span></span>
      {t.hire?.confidence ? <span className="conf" aria-label={`Confidence ${t.hire.confidence} of 3`}>{CONF_EMOJI[t.hire.confidence]}</span> : null}
    </div>
  );
}

export function Holes({ t }: { t: Ticket }) {
  if (!t.hire) return null;
  const redo = t.hire.sent_back?.module_id;
  return (
    <div className="holes" aria-label={`${t.hire.modules.filter((m) => m.passed).length} of ${t.hire.modules.length} steps passed`}>
      {t.hire.modules.map((m) => (
        <span key={m.id} className={`hole ${m.passed ? "on" : ""} ${redo === m.id ? "redo" : ""}`} title={`${m.title}${m.passed ? " · passed" : ""}`} />
      ))}
    </div>
  );
}

export function TicketCard({ t, publicBase, linkOpen, swing, busy, onToggleLink, onHire, onStamp, onSendBack }: Props) {
  const reduce = useReducedMotion();
  const tilt = (((t.id * 37) % 11) - 5) / 9;
  const h = t.hire;
  const link = h ? hireUrl(h.path, publicBase) : "";

  return (
    <motion.article
      layout={!reduce}
      layoutId={`t-${t.id}`}
      className="tkt paper"
      initial={false}
      animate={swing && !reduce ? { rotate: [tilt, 6, -4, 2.5, -1, tilt] } : { rotate: tilt }}
      transition={swing ? { duration: 1.5, ease: "easeOut" } : { type: "spring", stiffness: 260, damping: 28 }}
      aria-label={`Ticket ${t.ticket_no}: ${t.name}`}
    >
      <TicketHeader t={t} />
      <div className="tkt-name">{t.name}</div>
      <div className="tkt-meta">{t.job_title} · via {t.source_channel} · {ago(t.applied_at)}</div>

      {h && (
        <div className="tkt-row">
          <Holes t={t} />
          {h.modules.some((m) => m.passed) && <span className="tkt-meta">first try {h.first_try_pct}%</span>}
        </div>
      )}

      {t.status === "REVIEW" && h && (
        <ul className="evidence" aria-label="Evidence">
          {h.modules.map((m) => (
            <li key={m.id}>
              <span aria-hidden="true">{m.icon}</span>
              <span>{m.title}</span>
              <span>{m.score !== null ? `${Math.round(m.score * 100)}%` : "–"}</span>
              <span aria-label={m.confidence ? `confidence ${m.confidence}` : "no confidence"}>{m.confidence ? CONF_EMOJI[m.confidence] : ""}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="tkt-summary"><span className="ai">AI read</span>{t.summary}</p>

      {h?.flags.map((f) => (
        <div key={f.kind}>
          <span className="flag">⚑ {f.label}</span>
          <div className="flag-detail">{f.detail}</div>
        </div>
      ))}

      {h?.sent_back && (
        <div className="sentback">Sent back: <b>{h.sent_back.module}</b>. “{h.sent_back.note}”</div>
      )}

      <div className="tkt-actions">
        {t.status === "APPLIED" && (
          <>
            <button type="button" className="tbtn primary wide" onClick={onHire} disabled={busy}>HIRE → FIRE TRAINING</button>
            {/* [DEMO ONLY] */}
            <DemoOnly className="tbtn">SCHEDULE INTERVIEW</DemoOnly>
          </>
        )}
        {t.status === "TRAINING" && h && (
          <button type="button" className="tbtn" onClick={onToggleLink} aria-expanded={linkOpen}>
            {linkOpen ? "HIDE LINK" : "HIRE LINK + QR"}
          </button>
        )}
        {t.status === "REVIEW" && h && (
          <>
            <button type="button" className="tbtn gold wide" onClick={onStamp} disabled={busy}>STAMP READY</button>
            <button type="button" className="tbtn" onClick={onSendBack} disabled={busy}>SEND BACK</button>
          </>
        )}
      </div>

      {linkOpen && h && (
        <div className="linkbox">
          <QR value={link} />
          <div>
            <code>{link}</code>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <a href={h.path} target="_blank" rel="noreferrer">Open hire view ↗</a>
            </div>
          </div>
        </div>
      )}

      {t.status === "SHIFT_READY" && (
        <Stamp size="sm" style={{ right: 12, top: 52 }} />
      )}
    </motion.article>
  );
}
