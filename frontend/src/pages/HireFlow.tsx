import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ConfidencePicker } from "../components/ConfidencePicker";
import { SpeakButton } from "../components/SpeakButton";
import { api, type HireModule, type Lang, type Meta, type Training } from "../lib/api";
import { HTML_LANG, tr } from "../lib/i18n";
import { HireCheck } from "./HireCheck";
import { HireDone } from "./HireDone";
import { HireLanguage } from "./HireLanguage";
import { HireLesson } from "./HireLesson";

type View =
  | { k: "loading" } | { k: "error" } | { k: "lang" } | { k: "home" }
  | { k: "lesson"; mid: number; i: number }
  | { k: "check"; mid: number; qi: number }
  | { k: "confidence"; mid: number }
  | { k: "moduleDone"; mid: number }
  | { k: "ready" };

const NATIVE: Record<Lang, string> = { en: "English", zh: "中文", es: "Español" };

export default function HireFlow() {
  const { token = "" } = useParams();
  const [data, setData] = useState<Training | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<View>({ k: "loading" });
  const [big, setBig] = useState(false);
  const [busy, setBusy] = useState(false);
  const langRef = useRef<Lang>("en");
  const sentBackKey = useRef<string>("");

  const load = useCallback(async (l?: Lang) => {
    const d = await api.training(token, l);
    setData(d);
    setLang(d.lang);
    langRef.current = d.lang;
    sentBackKey.current = JSON.stringify(d.hire.sent_back);
    return d;
  }, [token]);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => undefined);
    load()
      .then((d) => setView(d.hire.status === "SHIFT_READY" ? { k: "ready" } : { k: "lang" }))
      .catch(() => setView({ k: "error" }));
  }, [load]);

  // Poll every 3 s for the manager's stamp or a send-back note.
  useEffect(() => {
    const id = window.setInterval(async () => {
      try {
        const s = await api.status(token);
        if (s.status === "SHIFT_READY") {
          await load(langRef.current);
          setView((v) => (v.k === "ready" ? v : { k: "ready" }));
        } else if (JSON.stringify(s.sent_back) !== sentBackKey.current) {
          await load(langRef.current);
        }
      } catch { /* offline for a moment; try again next tick */ }
    }, 3000);
    return () => window.clearInterval(id);
  }, [token, load]);

  useEffect(() => { document.documentElement.lang = HTML_LANG[lang]; }, [lang]);
  useEffect(() => { document.title = "FirstShift"; }, []);

  const pickLang = async (l: Lang) => {
    setBusy(true);
    try {
      await api.setLang(token, l);
      await load(l);
      setView({ k: "home" });
    } finally { setBusy(false); }
  };

  const mod = (mid: number): HireModule | undefined => data?.modules.find((m) => m.id === mid);
  const nextModule = data?.modules.find((m) => !m.passed);

  const startChecks = (m: HireModule) => {
    const first = m.questions.findIndex((q) => !m.answered.includes(q.id));
    setView({ k: "check", mid: m.id, qi: first === -1 ? 0 : first });
  };

  const pickConfidence = async (mid: number, v: number) => {
    setBusy(true);
    try {
      await api.confidence(token, mid, v);
      await load(lang);
      setView({ k: "moduleDone", mid });
    } catch {
      await load(lang);
      setView({ k: "home" });
    }
    setBusy(false);
  };

  let body: JSX.Element | null = null;
  if (view.k === "loading") body = <p className="lead" style={{ marginTop: 40 }}><span className="spinner-dots">FirstShift</span></p>;
  else if (view.k === "error" || !data) {
    body = (
      <div style={{ marginTop: 30 }}>
        {(["en", "zh", "es"] as Lang[]).map((l) => <p key={l} lang={HTML_LANG[l]} className="lead" style={{ marginBottom: 14 }}>{tr("linkInactive", l)}</p>)}
      </div>
    );
  } else if (view.k === "lang") {
    body = <HireLanguage current={lang} onPick={pickLang} meta={meta} />;
  } else if (view.k === "home") {
    const sb = data.hire.sent_back;
    const waiting = data.hire.status === "REVIEW" && data.modules.every((m) => m.passed);
    body = (
      <div lang={HTML_LANG[lang]}>
        <h1>{tr("welcome", lang, { name: data.hire.first_name })}</h1>
        <p className="lead">{tr("welcomeSub", lang)}</p>
        <p className="muted" style={{ marginTop: 10, fontSize: 16 }}>{tr("yourRole", lang)}: <b style={{ color: "var(--ink)" }}>{data.hire.role_title}</b></p>
        <div style={{ marginTop: 12 }}>
          <SpeakButton text={`${tr("welcome", lang, { name: data.hire.first_name })} ${tr("welcomeSub", lang)}`} lang={lang} />
        </div>

        {sb && (
          <div className="note-card" role="status">
            <div className="k">✉ {tr("managerNote", lang)}</div>
            <p style={{ margin: "6px 0 10px", fontWeight: 700 }}>{sb.note}</p>
            {sb.note !== sb.original && <p className="muted" style={{ fontSize: 15, margin: "0 0 10px" }} lang="en">{tr("original", lang)}: {sb.original}</p>}
            <SpeakButton text={sb.note} lang={lang} />
          </div>
        )}

        {waiting && (
          <div className="note-card" style={{ borderLeftColor: "var(--secondary)" }} role="status" aria-live="polite">
            <p style={{ margin: 0, fontWeight: 700 }}>{tr("allDone", lang)}</p>
            <p style={{ margin: "6px 0 0" }} className="spinner-dots">{tr("allDoneSub", lang)}</p>
          </div>
        )}

        <h2>{tr("steps", lang)}</h2>
        <ol className="steps">
          {data.modules.map((m, idx) => {
            const redo = sb?.module_id === m.id;
            const isNext = nextModule?.id === m.id;
            return (
              <li key={m.id} className={`step ${m.passed ? "done" : ""} ${redo ? "redo" : ""}`}>
                <span className="ico" aria-hidden="true">{m.passed ? "✓" : m.icon}</span>
                <span>
                  <span className="t" style={{ display: "block" }}>{m.title}</span>
                  <span className="s">{tr("stepOf", lang, { n: idx + 1, total: data.modules.length })} · {m.passed ? tr("stepDone", lang) : redo ? tr("stepRedo", lang) : isNext ? tr("stepNext", lang) : ""}</span>
                </span>
                <button type="button" className="mini" onClick={() => setView({ k: "lesson", mid: m.id, i: 0 })} aria-label={`${tr("open", lang)}: ${m.title}`}>
                  {tr("open", lang)}
                </button>
              </li>
            );
          })}
        </ol>
        {nextModule && (
          <div className="row-gap">
            <button type="button" className="hbtn primary" onClick={() => setView({ k: "lesson", mid: nextModule.id, i: 0 })}>
              {tr("start", lang)}: {nextModule.title} →
            </button>
          </div>
        )}
      </div>
    );
  } else if (view.k === "lesson") {
    const m = mod(view.mid)!;
    body = <HireLesson m={m} i={view.i} lang={lang} onIndex={(i) => setView({ k: "lesson", mid: m.id, i })}
      onChecks={() => startChecks(m)} onHome={() => setView({ k: "home" })} />;
  } else if (view.k === "check") {
    const m = mod(view.mid)!;
    body = <HireCheck key={`${m.id}-${view.qi}`} token={token} m={m} qi={view.qi} lang={lang}
      onNext={(complete) => {
        if (complete || view.qi + 1 >= m.questions.length) setView({ k: "confidence", mid: m.id });
        else setView({ k: "check", mid: m.id, qi: view.qi + 1 });
      }} />;
  } else if (view.k === "confidence") {
    const mid = view.mid;
    body = <ConfidencePicker lang={lang} busy={busy} onPick={(v) => pickConfidence(mid, v)} />;
  } else if (view.k === "moduleDone") {
    const m = mod(view.mid);
    const all = data.modules.every((x) => x.passed);
    body = (
      <div lang={HTML_LANG[lang]} className="center">
        <div className="big-ico" style={{ fontSize: 80, marginTop: 30 }} aria-hidden="true">{m?.icon}</div>
        <h1 tabIndex={-1} ref={(el) => el?.focus()}>{tr("moduleDone", lang, { module: m?.title ?? "" })}</h1>
        {all ? (
          <div className="note-card" style={{ borderLeftColor: "var(--secondary)", textAlign: "left" }} role="status" aria-live="polite">
            <p style={{ margin: 0, fontWeight: 700 }}>{tr("allDone", lang)}</p>
            <p style={{ margin: "6px 0 0" }} className="spinner-dots">{tr("allDoneSub", lang)}</p>
          </div>
        ) : null}
        <div className="row-gap">
          {!all && nextModule ? (
            <button type="button" className="hbtn primary" onClick={() => setView({ k: "lesson", mid: nextModule.id, i: 0 })}>
              {tr("nextStep", lang)}: {nextModule.title} →
            </button>
          ) : (
            <button type="button" className="hbtn ghost" onClick={() => setView({ k: "home" })}>{tr("home", lang)}</button>
          )}
        </div>
      </div>
    );
  } else if (view.k === "ready") {
    body = <HireDone data={data} lang={lang} />;
  }

  const showTop = data && view.k !== "loading" && view.k !== "error";
  return (
    <div className="hire paper" style={{ ["--hire-size" as string]: big ? "24px" : "20px" }}>
      <div className="hire-inner">
        {showTop && (
          <div className="hire-top">
            <span><b>#{String(data!.hire.ticket_no).padStart(4, "0")}</b> · <span lang={HTML_LANG[lang]}>{data!.hire.role_title}</span></span>
            <span className="hire-top-tools">
              {view.k !== "lang" && view.k !== "ready" && (
                <button type="button" className="mini" onClick={() => setView({ k: "lang" })} aria-label={tr("language", lang)}>
                  🌐 <span lang={HTML_LANG[lang]}>{NATIVE[lang]}</span>
                </button>
              )}
              <button type="button" className="mini" aria-pressed={big} onClick={() => setBig(!big)} aria-label={tr("bigger", lang)}>
                A<span style={{ fontSize: "1.3em" }}>A</span>
              </button>
            </span>
          </div>
        )}
        <main id="main" aria-busy={busy}>{body}</main>
        <footer className="hire-foot" lang={HTML_LANG[lang]}>{tr("sample", lang)} · FirstShift</footer>
      </div>
    </div>
  );
}
