import { useEffect, useRef, useState } from "react";
import { KindFeedback } from "../components/KindFeedback";
import { SpeakButton } from "../components/SpeakButton";
import { api, type AnswerResult, type HireModule, type Lang } from "../lib/api";
import { BCP47, HTML_LANG, tr } from "../lib/i18n";
import { useListen } from "../lib/listen";

interface Props {
  token: string;
  m: HireModule;
  qi: number;
  lang: Lang;
  onNext: (moduleComplete: boolean) => void;
}

export function HireCheck({ token, m, qi, lang, onNext }: Props) {
  const q = m.questions[qi];
  const [sel, setSel] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const head = useRef<HTMLHeadingElement>(null);
  const mic = useListen(BCP47[lang], setText);

  useEffect(() => { head.current?.focus(); }, [qi]);

  const submit = async (answer: string) => {
    setBusy(true);
    setErr("");
    try {
      const r = await api.answer(token, m.id, q.id, answer);
      setRes(r);
      if (r.passed) setHint(null);
      else if (r.hint_text) setHint(r.hint_text);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };

  const retry = () => { setRes(null); setSel(null); };
  const passed = !!res?.passed;

  return (
    <div lang={HTML_LANG[lang]}>
      <p className="muted" style={{ margin: "18px 0 0", fontSize: 16 }}>{m.icon} {m.title} · {tr("checkOf", lang, { n: qi + 1, total: m.questions.length })}</p>
      <h1 ref={head} tabIndex={-1} id="q-title" style={{ marginTop: 8 }}>{q.prompt}</h1>
      <SpeakButton text={q.type === "mc" ? `${q.prompt} ${q.options.map((o, i) => `${"ABC"[i]}. ${o.text}`).join(". ")}` : q.prompt} lang={lang} />

      {!res && hint && (
        <div className="kind almost"><p className="fb">{tr("stepRedo", lang)}</p><mark>{hint}</mark></div>
      )}

      {q.type === "mc" ? (
        <>
          <p className="muted" style={{ marginBottom: 0 }}>{tr("chooseOne", lang)}</p>
          <div className="options" role="group" aria-labelledby="q-title">
            {q.options.map((o, i) => (
              <button key={o.id} type="button"
                className={`option ${passed && sel === o.id ? "right" : ""}`}
                aria-pressed={sel === o.id}
                disabled={busy || passed || (!!res && !res.passed)}
                onClick={() => { setSel(o.id); submit(o.id); }}>
                <span className="letter" aria-hidden="true">{"ABC"[i]}</span>
                <span>{o.text}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <label htmlFor="free" className="muted" style={{ display: "block", marginTop: 14 }}>{tr("inYourWords", lang)}</label>
          <textarea id="free" className="free" value={text} onChange={(e) => setText(e.target.value)}
            placeholder={tr("placeholder", lang)} disabled={busy || passed} />
          <div className="row-gap" style={{ marginTop: 12 }}>
            {mic.supported && !passed && (
              <button type="button" className="hbtn ghost" aria-pressed={mic.listening} onClick={mic.listening ? mic.stop : mic.start} disabled={busy}>
                🎤 {mic.listening ? tr("listening", lang) : tr("speakAnswer", lang)}
              </button>
            )}
            {!passed && (
              <button type="button" className="hbtn primary" disabled={busy || text.trim().length < 2} onClick={() => submit(text)}>
                {busy ? <span className="spinner-dots">{tr("reading", lang)}</span> : tr("send", lang)}
              </button>
            )}
          </div>
        </>
      )}

      {err && <p role="alert" style={{ color: "var(--primary)", fontWeight: 700 }}>{err}</p>}
      {res && <KindFeedback lang={lang} passed={res.passed} feedback={res.feedback} hint={res.passed ? null : hint} />}

      {res && !res.passed && q.type === "mc" && (
        <div className="row-gap"><button type="button" className="hbtn ghost" onClick={retry}>{tr("tryAgain", lang)}</button></div>
      )}
      {res && passed && (
        <div className="row-gap"><button type="button" className="hbtn primary" onClick={() => onNext(res.module_complete)} autoFocus>{tr("next", lang)} →</button></div>
      )}
    </div>
  );
}
