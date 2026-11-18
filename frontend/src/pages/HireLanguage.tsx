import type { Lang, Meta } from "../lib/api";
import { HTML_LANG, tr } from "../lib/i18n";

const LANGS: { code: Lang; native: string; name: string }[] = [
  { code: "en", native: "English", name: "English" },
  { code: "zh", native: "中文", name: "Chinese (Mandarin)" },
  { code: "es", native: "Español", name: "Spanish" },
];

export function HireLanguage({ current, onPick, meta }: { current: Lang; onPick: (l: Lang) => void; meta: Meta | null }) {
  return (
    <div>
      <div className="lang-titles" style={{ marginTop: 26 }} id="lang-title">
        {LANGS.map((l) => <p key={l.code} lang={HTML_LANG[l.code]}>{tr("chooseLang", l.code)}</p>)}
      </div>
      <div className="lang-list" role="group" aria-labelledby="lang-title">
        {LANGS.map((l) => (
          <button key={l.code} type="button" className="lang-btn" aria-pressed={current === l.code} onClick={() => onPick(l.code)}>
            <span>
              <span className="native" lang={HTML_LANG[l.code]} style={{ display: "block" }}>{l.native}</span>
              <span className="en">{l.name}</span>
            </span>
            <span aria-hidden="true" style={{ fontSize: 30 }}>→</span>
          </button>
        ))}
        {/* [DEMO ONLY] languages beyond the three supported */}
        {(meta?.pilot_languages ?? [{ native: "粵語", name: "Cantonese" }, { native: "Tiếng Việt", name: "Vietnamese" }]).map((l) => (
          <button key={l.native} type="button" className="lang-btn pilot demo-only" disabled title="Coming in pilot" aria-label={`${l.name}, coming in pilot`}>
            <span>
              <span className="native" style={{ display: "block" }}>{l.native}</span>
              <span className="en">{l.name} · Coming in pilot</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
