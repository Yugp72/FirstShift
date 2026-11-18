import { useEffect, useState } from "react";
import type { Lang } from "../lib/api";
import { BCP47, tr } from "../lib/i18n";
import { speak, stopSpeaking, ttsSupported, useVoice } from "../lib/speak";

interface Props { text: string; lang: Lang; uiLang?: Lang; glow?: boolean; compact?: boolean }

/** One tap to hear the text in the hire's language. Hidden when the device has no voice for it. */
export function SpeakButton({ text, lang, uiLang, glow, compact }: Props) {
  const has = useVoice(BCP47[lang]);
  const [on, setOn] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => { setOn(false); stopSpeaking(); }, [text]);
  if (!ttsSupported || !has) return null;
  const ui = uiLang || lang;
  const toggle = () => {
    if (on) { stopSpeaking(); setOn(false); return; }
    setOn(true);
    speak(text, BCP47[lang], () => setOn(false));
  };
  return (
    <button type="button" className={`speak ${glow && !on ? "glow" : ""}`} aria-pressed={on} onClick={toggle}
      aria-label={on ? tr("stop", ui) : tr("listen", ui)}>
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        {on ? <path d="M17 9l4 6M21 9l-4 6" /> : <><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19.5 5.5a9 9 0 0 1 0 13" /></>}
      </svg>
      {!compact && <span>{on ? tr("stop", ui) : tr("listen", ui)}</span>}
    </button>
  );
}
