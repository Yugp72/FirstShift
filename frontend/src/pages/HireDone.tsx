import { useEffect } from "react";
import { SpeakButton } from "../components/SpeakButton";
import { Seal } from "../components/Stamp";
import type { Lang, Training } from "../lib/api";
import { BCP47, HTML_LANG, tr } from "../lib/i18n";
import { speak } from "../lib/speak";

const SEAL_LABEL: Record<Lang, string> = { en: "Ready", zh: "可以上班", es: "Listo" };

/** The manager's approval lands on the hire's phone, and is read aloud. */
export function HireDone({ data, lang }: { data: Training; lang: Lang }) {
  const msg = tr("ready", lang);
  useEffect(() => {
    const id = window.setTimeout(() => speak(`${msg} ${tr("readySub", lang)}`, BCP47[lang]), 700);
    return () => window.clearTimeout(id);
  }, [msg, lang]);

  return (
    <div lang={HTML_LANG[lang]} className="ready-wrap" role="status" aria-live="polite">
      <Seal animate delay={0.2} label={SEAL_LABEL[lang]} />
      <h1>{msg}</h1>
      <p className="lead">{tr("readySub", lang)}</p>
      <ul className="steps" style={{ marginTop: 22, textAlign: "left" }}>
        {data.modules.map((m) => (
          <li key={m.id} className="step done">
            <span className="ico" aria-hidden="true">✓</span>
            <span className="t">{m.title}</span>
            <span />
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
        <SpeakButton text={`${msg} ${tr("readySub", lang)}`} lang={lang} glow />
      </div>
    </div>
  );
}
