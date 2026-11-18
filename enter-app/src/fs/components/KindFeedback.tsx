import type { Lang } from "../lib/api";
import { HTML_LANG, tr } from "../lib/i18n";
import { SpeakButton } from "./SpeakButton";

interface Props {
  lang: Lang;
  passed: boolean;
  feedback: string;
  hint?: string | null;
}

/** Never a red X. "Almost" + the exact lesson line to look at, readable aloud. */
export function KindFeedback({ lang, passed, feedback, hint }: Props) {
  const spoken = hint ? `${feedback} ${hint}` : feedback;
  return (
    <div className={`kind ${passed ? "good" : "almost"}`} lang={HTML_LANG[lang]} role="status" aria-live="polite">
      <p className="fb">{passed ? "✓ " : ""}{feedback}</p>
      {hint && (
        <>
          <p className="sr-only">{tr("stepRedo", lang)}</p>
          <mark>{hint}</mark>
        </>
      )}
      <div style={{ marginTop: 12 }}>
        <SpeakButton text={spoken} lang={lang} />
      </div>
    </div>
  );
}
