import { motion, useReducedMotion } from "framer-motion";
import { CONF_EMOJI, LANG_CHIP, ago, hireUrl, type Ticket } from "../lib/api";
import { DemoOnly } from "./DemoOnly";
import { QR } from "./QR";
import { Seal } from "./Stamp";

export function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function Progress({ t }: { t: Ticket }) {
  if (!t.hire) return null;
  const redo = t.hire.sent_back?.module_id;
  const done = t.hire.modules.filter((m) => m.passed).length;
  return (
    <div className="progress" role="img" aria-label={`${done} of ${t.hire.modules.length} training steps passed`}>
      {t.hire.modules.map((m) => <i key={m.id} className={m.passed ? "on" : redo === m.id ? "redo" : ""} title={m.title} />)}
    </div>
  );
}

interface Props {
  t: Ticket;
  publicBase: string | null;
  linkOpen?: boolean;
  highlight?: boolean;
  busy?: boolean;
  onOpen?: () => void;
  onToggleLink?: () => void;
  onHire?: () => void;
  onApprove?: () => void;
  onSendBack?: () => void;
}

export function PersonCard({ t, publicBase, linkOpen, highlight, busy, onOpen, onToggleLink, onHire, onApprove, onSendBack }: Props) {
  const reduce = useReducedMotion();
  const h = t.hire;
  const link = h ? hireUrl(h.path, publicBase) : "";
  const flag = h?.flags[0];
  const done = h?.modules.filter((m) => m.passed).length ?? 0;

  return (
    <motion.article
      layout={!reduce}
      layoutId={`p-${t.id}`}
      className="pcard"
      initial={false}
      animate={highlight && !reduce ? { boxShadow: ["0 0 0 0 rgba(51,70,196,0)", "0 0 0 6px rgba(51,70,196,.25)", "0 0 0 0 rgba(51,70,196,0)"] } : {}}
      transition={highlight ? { duration: 1.6 } : { type: "spring", stiffness: 300, damping: 30 }}
      aria-label={t.name}
    >
      <div className="pcard-top">
        <span className="initials" aria-hidden="true">{initials(t.name)}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          {h ? <button type="button" className="pcard-name" onClick={onOpen}>{t.name}</button> : <div className="pcard-name">{t.name}</div>}
          <div className="pcard-sub">{t.role === "server" ? "Server" : "Kitchen prep"} · {t.source_channel} · {ago(t.applied_at)}</div>
        </div>
        {t.status === "SHIFT_READY" && <Seal size="sm" />}
      </div>

      <div className="pcard-meta">
        <span className="badge" lang={t.lang === "zh" ? "zh-CN" : t.lang === "yue" ? "zh-HK" : undefined}>{LANG_CHIP[t.lang]}</span>
        {h?.prefs.slice(0, 2).map((p) => <span key={p.id} className="badge badge-accent">{p.label}</span>)}
        {h?.confidence ? <span className="badge" aria-label={`Feels ${h.confidence} of 3`}>{CONF_EMOJI[h.confidence]}</span> : null}
      </div>

      {h && (
        <div className="row" style={{ marginTop: 10 }}>
          <Progress t={t} />
          <span className="muted" style={{ fontSize: 12 }}>{done}/{h.modules.length}</span>
        </div>
      )}

      <p className="pcard-summary">{t.summary}</p>

      {flag && (
        <div className={`flagline ${flag.kind === "allergen_risk" ? "danger" : "warn"}`}>
          <span aria-hidden="true">{flag.kind === "allergen_risk" ? "⚠" : "●"}</span>{flag.label}
        </div>
      )}
      {h?.sent_back && <div className="flagline warn">Sent back: {h.sent_back.module}</div>}

      <div className="pcard-actions">
        {t.status === "APPLIED" && (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={onHire} disabled={busy}>Hire &amp; send training</button>
            {/* [DEMO ONLY] */}
            <DemoOnly className="btn btn-sm">Schedule interview</DemoOnly>
          </>
        )}
        {t.status === "TRAINING" && h && (
          <>
            <button type="button" className="btn btn-sm" onClick={onToggleLink} aria-expanded={linkOpen}>{linkOpen ? "Hide link" : "Training link"}</button>
            <button type="button" className="btn btn-sm" onClick={onOpen}>Passport</button>
          </>
        )}
        {t.status === "REVIEW" && h && (
          <>
            <button type="button" className="btn btn-success btn-sm" onClick={onApprove} disabled={busy}>Approve for shift</button>
            <button type="button" className="btn btn-sm" onClick={onOpen}>Review passport</button>
            <button type="button" className="btn btn-sm" onClick={onSendBack} disabled={busy}>Send back</button>
          </>
        )}
        {t.status === "SHIFT_READY" && h && (
          <button type="button" className="btn btn-sm" onClick={onOpen}>Passport</button>
        )}
      </div>

      {linkOpen && h && (
        <div className="linkbox">
          <QR value={link} />
          <div>
            <code>{link}</code>
            <div style={{ marginTop: 6, fontSize: 13 }}><a href={h.path} target="_blank" rel="noreferrer">Open hire view ↗</a></div>
          </div>
        </div>
      )}
    </motion.article>
  );
}
