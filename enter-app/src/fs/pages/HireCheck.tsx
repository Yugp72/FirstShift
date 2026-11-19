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
  visual: boolean;
  onNext: (moduleComplete: boolean) => void;
}

const SURE = [
  { v: 1, e: "🤔", k: "sure1" },
  { v: 2, e: "🙂", k: "sure2" },
  { v: 3, e: "💯", k: "sure3" },
] as const;

/** Untimed checks. Tap a picture or an answer, say how sure you are, get kind feedback. Free text can be typed or spoken. */
export function HireCheck({ token, m, qi, lang, visual, onNext }: Props) {
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

  const submit = async (answer: string, confidence?: number) => {
    setBusy(true);
    setErr("");
    try {
      const r = await api.answer(token, m.id, q.id, answer, confidence);
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
  const pics = visual && q.options.every((o) => o.icon);

  return (
    <div lang={HTML_LANG[lang]}>
      <p className="muted" style={{ margin: "18px 0 0", fontSize: 15, fontFamily: "var(--font-ui)" }}>
        {m.icon} {m.title} · {tr("checkOf", lang, { n: qi + 1, total: m.questions.length })} · {tr("noTimer", lang)}
      </p>
      <h1 ref={head} tabIndex={-1} id="q-title" style={{ marginTop: 8 }}>{q.prompt}</h1>
      <SpeakButton text={q.type === "mc" ? `${q.prompt} ${q.options.map((o, i) => `${i + 1}. ${o.text}`).join(". ")}` : q.prompt} lang={lang} />

      {!res && hint && (
        <div className="kind almost"><p className="fb">{tr("stepRedo", lang)}</p><mark>{hint}</mark></div>
      )}

      {q.type === "mc" ? (
        <>
          <p className="muted" style={{ marginBottom: 0 }}>{tr("chooseOne", lang)}</p>
          <div className={`options ${pics ? "pics" : ""}`} role="group" aria-labelledby="q-title">
            {q.options.map((o) => (
              <button key={o.id} type="button"
                className={`option ${passed && sel === o.id ? "right" : ""}`}
                aria-pressed={sel === o.id}
                disabled={busy || !!res}
                onClick={() => setSel(o.id)}>
                <span className="oi" aria-hidden="true">{o.icon}</span>
                <span>{o.text}</span>
              </button>
            ))}
          </div>
          {sel && !res && (
            <div className="sure" role="group" aria-labelledby="sure-title">
              <p id="sure-title">{tr("howSure", lang)}</p>
              <div className="row-gap">
                {SURE.map((s) => (
                  <button key={s.v} type="button" disabled={busy} onClick={() => submit(sel, s.v)}>
                    <span className="e" aria-hidden="true">{s.e}</span>{tr(s.k, lang)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <label htmlFor="free" className="muted" style={{ display: "block", marginTop: 14 }}>{tr("inYourWords", lang)}</label>
          <textarea id="free" className="free" value={text} onChange={(e) => setText(e.target.value)}
            placeholder={tr("placeholder", lang)} disabled={busy || passed} />
          <div className="row-gap" style={{ marginTop: 12 }}>
            {mic.supported && !passed && (
              <button type="button" className="hbtn" aria-pressed={mic.listening} onClick={mic.listening ? mic.stop : mic.start} disabled={busy}>
                🎤 {mic.listening ? tr("listening", lang) : tr("speakAnswer", lang)}
              </button>
            )}
            {!passed && (
              <button type="button" className="hbtn primary" disabled={busy || text.trim().length < 2} onClick={() => submit(text)}>
                {busy ? <span className="spinner-dots">{tr("reading", lang)}</span> : tr("send", lang)}
              </button>
            )}
          </div>
          {busy && <p className="muted" role="status" style={{ fontSize: 14, margin: "10px 0 0" }}>{tr("readingSlow", lang)}</p>}
        </>
      )}

      {err && <p role="alert" style={{ color: "var(--danger)", fontWeight: 700 }}>{err}</p>}
      {res && <KindFeedback lang={lang} passed={res.passed} feedback={res.feedback} hint={res.passed ? null : hint} />}

      {res && !res.passed && q.type === "mc" && (
        <div className="row-gap"><button type="button" className="hbtn" onClick={retry}>{tr("tryAgain", lang)}</button></div>
      )}
      {res && passed && (
        <div className="row-gap"><button type="button" className="hbtn primary" onClick={() => onNext(res.module_complete)} autoFocus>{tr("next", lang)} →</button></div>
      )}
    </div>
  );
}
