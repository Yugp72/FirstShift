import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { SpeakButton } from "../components/SpeakButton";
import { Stamp } from "../components/Stamp";
import type { Lang, Training } from "../lib/api";
import { BCP47, HTML_LANG, tr } from "../lib/i18n";
import { speak } from "../lib/speak";

/** The same gold chop the manager pressed lands on the hire's own ticket, then reads the news aloud. */
export function HireDone({ data, lang }: { data: Training; lang: Lang }) {
  const reduce = useReducedMotion();
  const [dim, setDim] = useState(true);
  const msg = tr("ready", lang);

  useEffect(() => {
    const a = window.setTimeout(() => setDim(false), 1200);
    // The hire has already tapped through the flow, so the browser allows speech here.
    const b = window.setTimeout(() => speak(`${msg} ${tr("readySub", lang)}`, BCP47[lang]), 900);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [msg, lang]);

  return (
    <div lang={HTML_LANG[lang]}>
      {dim && <motion.div className="dim-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      <div className="my-ticket paper torn ready-msg">
        <div className="tkt-head">
          <span><b>#{String(data.hire.ticket_no).padStart(4, "0")}</b> · {data.hire.role_title}</span>
          <span>{data.modules.map(() => "●").join("")}</span>
        </div>
        <div className="tkt-name">{data.hire.name}</div>
        <div style={{ minHeight: 150, fontSize: 15 }}>
          {data.modules.map((m) => <div key={m.id}>✓ {m.title}</div>)}
        </div>
        <Stamp animate delay={reduce ? 0 : 0.35} style={{ right: 18, bottom: 26, width: 140, height: 140 }} />
      </div>
      <div className="ready-msg center" role="status" aria-live="polite">
        <h1>{msg}</h1>
        <p className="lead">{tr("readySub", lang)}</p>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <SpeakButton text={`${msg} ${tr("readySub", lang)}`} lang={lang} glow />
        </div>
      </div>
    </div>
  );
}
