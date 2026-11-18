import { useState } from "react";
import type { Lang } from "../lib/api";
import { HTML_LANG, tr } from "../lib/i18n";

const OPTS = [
  { v: 1, e: "😟", k: "conf1" },
  { v: 2, e: "🙂", k: "conf2" },
  { v: 3, e: "💪", k: "conf3" },
] as const;

export function ConfidencePicker({ lang, onPick, busy }: { lang: Lang; onPick: (v: number) => void; busy?: boolean }) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div lang={HTML_LANG[lang]}>
      <h1 id="conf-title">{tr("howFeel", lang)}</h1>
      <p className="lead muted">{tr("feelNote", lang)}</p>
      <div className="conf-grid" role="group" aria-labelledby="conf-title">
        {OPTS.map((o) => (
          <button key={o.v} type="button" className="conf-btn" aria-pressed={sel === o.v} disabled={busy}
            onClick={() => { setSel(o.v); onPick(o.v); }}>
            <span className="e" aria-hidden="true">{o.e}</span>
            <span>{tr(o.k, lang)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
