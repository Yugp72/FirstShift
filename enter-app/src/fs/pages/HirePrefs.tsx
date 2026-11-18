import { useState } from "react";
import type { Lang } from "../lib/api";
import { HTML_LANG, tr, type Key } from "../lib/i18n";

export const PREFS: { id: string; ico: string }[] = [
  { id: "captions", ico: "💬" },
  { id: "visual", ico: "🖼️" },
  { id: "read_aloud", ico: "🔊" },
  { id: "seated", ico: "🪑" },
  { id: "extra_time", ico: "⏳" },
];

/** Work preferences, not disability disclosure: the hire chooses how they learn and work best. */
export function HirePrefs({ lang, initial, onDone, busy }: { lang: Lang; initial: string[]; onDone: (prefs: string[]) => void; busy?: boolean }) {
  const [sel, setSel] = useState<string[]>(initial);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <div lang={HTML_LANG[lang]}>
      <h1 id="prefs-title">{tr("howWork", lang)}</h1>
      <p className="lead muted">{tr("howWorkSub", lang)}</p>
      <div className="pref-grid" role="group" aria-labelledby="prefs-title">
        {PREFS.map((p) => (
          <button key={p.id} type="button" className="pref" aria-pressed={sel.includes(p.id)} onClick={() => toggle(p.id)}>
            <span className="ico" aria-hidden="true">{p.ico}</span>
            <span>
              <span className="t">{tr(`pref_${p.id}` as Key, lang)}</span>
              <span className="s">{tr(`pref_${p.id}_s` as Key, lang)}</span>
            </span>
            <span className="tick" aria-hidden="true">{sel.includes(p.id) ? "✓" : ""}</span>
          </button>
        ))}
      </div>
      <div className="row-gap">
        <button type="button" className="hbtn" onClick={() => onDone([])} disabled={busy}>{tr("skip", lang)}</button>
        <button type="button" className="hbtn primary" onClick={() => onDone(sel)} disabled={busy}>{tr("continue", lang)} →</button>
      </div>
    </div>
  );
}
