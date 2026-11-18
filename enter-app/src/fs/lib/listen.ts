import { useCallback, useEffect, useRef, useState } from "react";

/** Voice answers via SpeechRecognition (Chrome/Edge/Safari). Hidden when unsupported. Typing always works. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = any;

function ctor(): (new () => Rec) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as (new () => Rec) | null;
}

export function useListen(bcp47: string, onText: (text: string) => void) {
  const supported = typeof window !== "undefined" && !!ctor();
  const [listening, setListening] = useState(false);
  const rec = useRef<Rec>(null);
  const cb = useRef(onText);
  cb.current = onText;

  const stop = useCallback(() => {
    rec.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const C = ctor();
    if (!C) return;
    const r = new C();
    r.lang = bcp47;
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: Rec) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      cb.current(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }, [bcp47]);

  useEffect(() => () => rec.current?.abort?.(), []);
  return { supported, listening, start, stop };
}
