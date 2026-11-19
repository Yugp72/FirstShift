import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfidencePicker } from "../components/ConfidencePicker";
import { GlobalNav } from "../components/GlobalNav";
import { SpeakButton } from "../components/SpeakButton";
import { api, captionsUrl, type Format, type HireModule, type Lang, type Training } from "../lib/api";
import { useAuth } from "../lib/auth";
import { BCP47, HTML_LANG, tr, type Key } from "../lib/i18n";
import { HireCheck } from "./HireCheck";
import { HireDone } from "./HireDone";
import { HirePrefs, PREFS } from "./HirePrefs";
import { setSlowSpeech, speak, stopSpeaking } from "../lib/speak";

type Pos =
  | { kind: "setup" } | { kind: "done" }
  | { kind: "lesson"; mid: number; i: number }
  | { kind: "quiz"; mid: number; qi: number; conf?: boolean };

const LANGS: { code: Lang; native: string }[] = [{ code: "en", native: "English" }, { code: "zh", native: "中文" }, { code: "es", native: "Español" }];
const TABS: { id: Format; i: string; k: Key }[] = [
  { id: "video", i: "▶︎", k: "fmt_video" }, { id: "pictures", i: "◧", k: "fmt_pictures" },
  { id: "listen", i: "♪", k: "fmt_listen" }, { id: "read", i: "¶", k: "fmt_read" },
];

function store(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function save(key: string, v: string) { try { localStorage.setItem(key, v); } catch { /* private mode */ } }

/** Text descriptions of the Framia step pictures, so screen-reader users get what the picture shows. */
const STEP_ALT: Record<string, Record<Lang, string>> = {
  "allergy-c1": { en: "A server stands at a table with a notepad, listening as two guests ask about allergies.", zh: "服务员拿着点菜本站在桌边，认真听两位客人询问过敏的问题。", es: "Una mesera con libreta escucha en la mesa a dos clientes que preguntan por alergias." },
  "allergy-c2": { en: "Common allergens laid out: peanuts, tree nuts, shrimp and shellfish, fish, eggs, milk, wheat, soybeans and sesame.", zh: "常见过敏原：花生、坚果、虾和贝类、鱼、鸡蛋、牛奶、小麦、大豆和芝麻。", es: "Alérgenos comunes: cacahuates, nueces, camarones y mariscos, pescado, huevos, leche, trigo, soya y ajonjolí." },
  "allergy-c3": { en: "The server writes on her notepad while checking with the chef at the kitchen pass.", zh: "服务员在出菜口一边和厨师确认，一边在点菜本上记录。", es: "La mesera anota en su libreta mientras confirma con el chef en el pase de cocina." },
  "allergy-c4": { en: "Two scenes: a server unsure of the answer, then the same server walking into the kitchen to ask the chefs.", zh: "两个画面：服务员不确定答案，然后走进厨房去问厨师。", es: "Dos escenas: una mesera con dudas y luego la misma mesera entrando a la cocina para preguntar a los chefs." },
  "allergy-c5": { en: "A server smiles and sets down a dish for a happy guest, after confirming it is safe.", zh: "确认安全后，服务员微笑着把菜端给开心的客人。", es: "Tras confirmar que es seguro, una mesera sonríe y sirve el plato a una clienta contenta." },
};
const altFor = (src: string | undefined, lang: Lang) => {
  const key = src?.split("/").pop()?.replace(/\.\w+$/, "") ?? "";
  return STEP_ALT[key]?.[lang] ?? "";
};

function defaultFormat(prefs: string[]): Format {
  if (prefs.includes("captions")) return "video";
  if (prefs.includes("visual")) return "pictures";
  if (prefs.includes("read_aloud")) return "listen";
  return "video";
}

/** One course player for everyone: hired staff (progress counts) and practice learners. */
export default function CoursePlayer() {
  const { role, token: routeToken } = useParams();
  const { account } = useAuth();
  const [token, setToken] = useState<string | null>(routeToken ?? null);
  const [data, setData] = useState<Training | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [pos, setPos] = useState<Pos | null>(null);
  const [fmt, setFmt] = useState<Format | null>(null);
  const [viewed, setViewed] = useState<Set<string>>(new Set());
  const [openSecs, setOpenSecs] = useState<Set<number>>(new Set());
  const [toc, setToc] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const sentBackKey = useRef("");

  // Resolve which training session to use.
  useEffect(() => {
    if (routeToken) { setToken(routeToken); return; }
    if (!role) return;
    const key = `fs-practice-${role}`;
    api.learnSession(role, store(key))
      .then((r) => { setToken(r.token); if (r.mode === "practice") save(key, r.token); })
      .catch((e) => setErr((e as Error).message));
  }, [role, routeToken, account?.id]);

  const load = useCallback(async (l?: Lang) => {
    const d = await api.training(token!, l);
    setData(d);
    setLang(d.lang);
    sentBackKey.current = JSON.stringify(d.hire.sent_back);
    return d;
  }, [token]);

  const firstOpen = useCallback((d: Training, seen: Set<string>): Pos => {
    for (const m of d.modules) {
      if (m.passed) continue;
      const i = m.cards.findIndex((c) => !seen.has(`${m.id}:${c.id}`));
      return i === -1 ? { kind: "quiz", mid: m.id, qi: Math.max(0, m.questions.findIndex((q) => !m.answered.includes(q.id))) } : { kind: "lesson", mid: m.id, i };
    }
    return { kind: "done" };
  }, []);

  useEffect(() => {
    if (!token) return;
    load().then((d) => {
      const seen = new Set<string>(JSON.parse(store(`fs-viewed-${token}`) || "[]"));
      setViewed(seen);
      const setupDone = store(`fs-setup-${token}`) || d.hire.prefs.length > 0;
      const p = d.hire.status === "SHIFT_READY" ? { kind: "done" as const } : !setupDone ? { kind: "setup" as const } : firstOpen(d, seen);
      setPos(p);
      if ("mid" in p) setOpenSecs(new Set([p.mid]));
      else setOpenSecs(new Set([d.modules[0]?.id]));
    }).catch(() => setErr(tr("linkInactive", "en")));
  }, [token, load, firstOpen]);

  // Hired learners: watch for the manager's approval or a send-back note.
  useEffect(() => {
    if (!token || !data || data.hire.mode !== "hired") return;
    const id = window.setInterval(async () => {
      try {
        const s = await api.status(token);
        if (s.status === "SHIFT_READY" && data.hire.status !== "SHIFT_READY") { await load(lang); setPos({ kind: "done" }); }
        else if (JSON.stringify(s.sent_back) !== sentBackKey.current) await load(lang);
      } catch { /* retry next tick */ }
    }, 4000);
    return () => window.clearInterval(id);
  }, [token, data, lang, load]);

  useEffect(() => { document.documentElement.lang = HTML_LANG[lang]; }, [lang]);

  const markViewed = useCallback((mid: number, cid: string) => {
    setViewed((v) => {
      const k = `${mid}:${cid}`;
      if (v.has(k)) return v;
      const n = new Set(v).add(k);
      save(`fs-viewed-${token}`, JSON.stringify([...n]));
      return n;
    });
  }, [token]);

  const mod = (mid: number) => data?.modules.find((m) => m.id === mid);
  const format: Format = fmt ?? defaultFormat(data?.hire.prefs ?? []);
  const prefs = data?.hire.prefs ?? [];
  const roomy = prefs.includes("extra_time");
  const [readOff, setReadOff] = useState(false);
  const autoRead = prefs.includes("read_aloud") && !readOff;
  useEffect(() => { setSlowSpeech(roomy); return () => setSlowSpeech(false); }, [roomy]);

  const progress = useMemo(() => {
    if (!data) return 0;
    let total = 0, done = 0;
    for (const m of data.modules) {
      total += m.cards.length + 1;
      done += m.passed ? m.cards.length + 1 : m.cards.filter((c) => viewed.has(`${m.id}:${c.id}`)).length;
    }
    return total ? Math.round((100 * done) / total) : 0;
  }, [data, viewed]);

  const go = (p: Pos) => { setPos(p); setToc(false); if ("mid" in p) setOpenSecs((s) => new Set(s).add(p.mid)); window.scrollTo({ top: 0 }); };

  const nextAfterLesson = (m: HireModule, i: number): Pos =>
    i + 1 < m.cards.length ? { kind: "lesson", mid: m.id, i: i + 1 } : { kind: "quiz", mid: m.id, qi: Math.max(0, m.questions.findIndex((q) => !m.answered.includes(q.id))) };
  const prevOf = (m: HireModule, i: number): Pos | null => {
    if (i > 0) return { kind: "lesson", mid: m.id, i: i - 1 };
    const idx = data!.modules.findIndex((x) => x.id === m.id);
    if (idx === 0) return null;
    const pm = data!.modules[idx - 1];
    return { kind: "quiz", mid: pm.id, qi: 0 };
  };
  const nextSection = (mid: number): Pos => {
    const idx = data!.modules.findIndex((x) => x.id === mid);
    const nm = data!.modules[idx + 1];
    return nm ? { kind: "lesson", mid: nm.id, i: 0 } : { kind: "done" };
  };

  const saveSetup = async (l: Lang, prefs: string[]) => {
    setBusy(true);
    try {
      await api.setLang(token!, l);
      await api.setPrefs(token!, prefs);
      save(`fs-setup-${token}`, "1");
      const d = await load(l);
      setFmt(defaultFormat(prefs));
      go(firstOpen(d, viewed));
    } finally { setBusy(false); }
  };

  const pickConfidence = async (mid: number, v: number) => {
    setBusy(true);
    try { await api.confidence(token!, mid, v); } catch { /* the reload shows the true state */ }
    await load(lang);
    setBusy(false);
    go(nextSection(mid));
  };

  if (err) {
    return (<><GlobalNav /><main className="auth-wrap"><div className="auth center"><h1>Training unavailable</h1><p className="sub">{err}</p><Link className="btn btn-primary" to="/learn">All courses</Link></div></main></>);
  }
  if (!data || !pos) return (<><GlobalNav /><main className="auth-wrap"><p className="muted">Loading…</p></main></>);

  const title = tr(`title_${data.hire.role}` as Key, lang);
  const practice = data.hire.mode === "practice";

  return (
    <>
      <GlobalNav />
      <div className="player">
        <aside className={`curriculum ${toc ? "open" : ""}`} aria-label={tr("courseContent", lang)} lang={HTML_LANG[lang]}>
          <div className="curriculum-head">
            <h2>{title}</h2>
            <div className="pbar" role="progressbar" aria-label={tr("courseContent", lang)} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress}%` }} /></div>
            <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: 13 }}>{progress}%</span>
              <button type="button" className="btn btn-plain btn-sm" onClick={() => go({ kind: "setup" })}>{tr("settings", lang)}</button>
            </div>
          </div>
          {data.modules.map((m, si) => {
            const isOpen = openSecs.has(m.id);
            const seenN = m.passed ? m.cards.length : m.cards.filter((c) => viewed.has(`${m.id}:${c.id}`)).length;
            return (
              <div key={m.id} className="sec">
                <button type="button" className="sec-head" aria-expanded={isOpen}
                  onClick={() => setOpenSecs((s) => { const n = new Set(s); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })}>
                  <span>
                    <small>{tr("sectionN", lang, { n: si + 1 })}</small>
                    <b>{m.icon} {m.title}</b>
                    <small>{seenN} / {m.cards.length} · {m.passed ? `${tr("quiz", lang)} ✓` : tr("quiz", lang)}</small>
                  </span>
                  <span className="chev" aria-hidden="true">›</span>
                </button>
                {isOpen && (
                  <ul className="items">
                    {m.cards.map((c, i) => {
                      const cur = pos.kind === "lesson" && pos.mid === m.id && pos.i === i;
                      const on = m.passed || viewed.has(`${m.id}:${c.id}`);
                      return (
                        <li key={c.id}>
                          <button type="button" className="item" aria-current={cur} onClick={() => go({ kind: "lesson", mid: m.id, i })}>
                            <span className={`tick ${on ? "on" : ""}`} aria-hidden="true">{on ? "✓" : ""}</span>
                            <span>{si + 1}.{i + 1} {c.text.length > 54 ? c.text.slice(0, 52) + "…" : c.text}</span>
                            <small>{m.media?.video ? "▶︎" : ""}</small>
                          </button>
                        </li>
                      );
                    })}
                    <li>
                      <button type="button" className="item" aria-current={pos.kind === "quiz" && pos.mid === m.id}
                        onClick={() => go({ kind: "quiz", mid: m.id, qi: Math.max(0, m.questions.findIndex((q) => !m.answered.includes(q.id))) })}>
                        <span className={`tick ${m.passed ? "on" : ""}`} aria-hidden="true">{m.passed ? "✓" : ""}</span>
                        <span><b>{tr("quiz", lang)}</b></span>
                        <small>{tr("quizQs", lang, { n: m.questions.length })}</small>
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            );
          })}
        </aside>

        <main id="main" className={`stage hire ${roomy ? "roomy" : ""}`} lang={HTML_LANG[lang]}>
          <div className="row" style={{ marginBottom: 12 }}>
            <button type="button" className="btn btn-sm mobile-toc" onClick={() => setToc(!toc)} aria-expanded={toc}>☰ {tr("menu", lang)} · {progress}%</button>
          </div>
          {practice && pos.kind !== "setup" && (
            <div className="banner"><span style={{ flex: 1 }}>{tr("practiceMode", lang)}</span><Link className="btn btn-sm" to="/jobs">{tr("seeJobs", lang)}</Link></div>
          )}
          {data.hire.sent_back && (
            <div className="banner warn" role="status">
              <span style={{ flex: 1 }}><b>{tr("managerNote", lang)}:</b> {data.hire.sent_back.note}</span>
              <SpeakButton text={data.hire.sent_back.note} lang={lang} compact />
            </div>
          )}

          {prefs.length > 0 && (pos.kind === "lesson" || pos.kind === "quiz") && (
            <div className="setup-strip" role="group" aria-label={tr("yourSetup", lang)}>
              <span className="muted">{tr("yourSetup", lang)}:</span>
              {PREFS.filter((p) => prefs.includes(p.id)).map((p) => (
                <span key={p.id} className="badge badge-accent"><span aria-hidden="true">{p.ico}</span> {tr(`pref_${p.id}` as Key, lang)}</span>
              ))}
              {prefs.includes("read_aloud") && (
                <button type="button" className="btn btn-sm" aria-pressed={autoRead} onClick={() => { setReadOff(autoRead); if (autoRead) stopSpeaking(); }}>
                  <span aria-hidden="true">{autoRead ? "🔊" : "🔈"}</span> {tr("autoRead", lang)}
                </button>
              )}
              <button type="button" className="btn btn-plain btn-sm" onClick={() => go({ kind: "setup" })}>{tr("change", lang)}</button>
              {roomy && <p className="take-time">{tr("takeTime", lang)}</p>}
            </div>
          )}

          {pos.kind === "setup" && (
            <Setup lang={lang} prefs={data.hire.prefs} busy={busy} onSave={saveSetup} firstName={practice ? "" : data.hire.first_name} />
          )}

          {pos.kind === "lesson" && (() => {
            const m = mod(pos.mid)!;
            return (
              <Lesson key={`${m.id}-${pos.i}`} token={token!} m={m} i={pos.i} lang={lang} fmt={format} onFmt={setFmt}
                autoRead={autoRead} slow={roomy}
                onSeen={(cid) => markViewed(m.id, cid)}
                prev={prevOf(m, pos.i)} next={nextAfterLesson(m, pos.i)} go={go} />
            );
          })()}

          {pos.kind === "quiz" && (() => {
            const m = mod(pos.mid)!;
            if (m.passed && !pos.conf) {
              return (
                <div>
                  <p className="muted" style={{ margin: 0, fontSize: 15 }}>{m.icon} {m.title} · {tr("quiz", lang)}</p>
                  <h1>{tr("quizPassed", lang)}</h1>
                  <div className="row" style={{ marginTop: 18 }}>
                    <button type="button" className="btn btn-primary" onClick={() => go(nextSection(m.id))}>{tr("nextSection", lang)} ›</button>
                  </div>
                </div>
              );
            }
            if (pos.conf) {
              return <ConfidencePicker lang={lang} busy={busy} onPick={(v) => pickConfidence(m.id, v)} />;
            }
            return (
              <HireCheck key={`${m.id}-${pos.qi}`} token={token!} m={m} qi={pos.qi} lang={lang} visual={data.hire.prefs.includes("visual")} autoRead={autoRead}
                onNext={async (complete) => {
                  if (complete || pos.qi + 1 >= m.questions.length) { await load(lang); setPos({ kind: "quiz", mid: m.id, qi: pos.qi, conf: true }); }
                  else setPos({ kind: "quiz", mid: m.id, qi: pos.qi + 1 });
                }} />
            );
          })()}

          {pos.kind === "done" && (
            data.hire.status === "SHIFT_READY" ? <HireDone data={data} lang={lang} /> : (
              <div className="ready-wrap">
                <div style={{ fontSize: 64 }} aria-hidden="true">🎉</div>
                <h1>{tr("courseDone", lang)}</h1>
                {practice ? (
                  <>
                    <p className="lead">{tr("practiceMode", lang)}</p>
                    <Link className="btn btn-primary btn-lg" style={{ marginTop: 18 }} to="/jobs">{tr("seeJobs", lang)}</Link>
                  </>
                ) : <p className="lead spinner-dots" role="status">{tr("reviewing", lang)}</p>}
              </div>
            )
          )}
        </main>
      </div>
    </>
  );
}

function Setup({ lang, prefs, busy, onSave, firstName }: { lang: Lang; prefs: string[]; busy: boolean; onSave: (l: Lang, p: string[]) => void; firstName: string }) {
  const [l, setL] = useState<Lang>(lang);
  return (
    <div>
      <h1>{firstName ? tr("welcome", l, { name: firstName }) : tr("settings", l)}</h1>
      <p className="lead muted">{tr("welcomeSub", l)}</p>
      <div className="lang-titles" style={{ marginTop: 18 }}>
        {LANGS.map((x) => <p key={x.code} lang={HTML_LANG[x.code]} style={{ margin: 0, fontWeight: 600 }}>{tr("chooseLang", x.code)}</p>)}
      </div>
      <div className="seg" role="group" aria-label={tr("language", l)} style={{ marginTop: 12, maxWidth: 420 }}>
        {LANGS.map((x) => <button key={x.code} type="button" aria-pressed={l === x.code} onClick={() => setL(x.code)} lang={HTML_LANG[x.code]}>{x.native}</button>)}
      </div>
      <HirePrefs lang={l} initial={prefs} busy={busy} onDone={(p) => onSave(l, p)} />
    </div>
  );
}

function Lesson({ token, m, i, lang, fmt, onFmt, onSeen, prev, next, go, autoRead, slow }: {
  token: string; m: HireModule; i: number; lang: Lang; fmt: Format; onFmt: (f: Format) => void;
  autoRead: boolean; slow: boolean;
  onSeen: (cid: string) => void; prev: Pos | null; next: Pos; go: (p: Pos) => void;
}) {
  const card = m.cards[i];
  const per = m.seconds_per_card || 6;
  const vref = useRef<HTMLVideoElement>(null);
  const img = m.media?.steps?.[card.id];
  useEffect(() => { onSeen(card.id); }, [card.id, onSeen]);
  useEffect(() => { api.usedFormat(token, m.id, fmt).catch(() => undefined); }, [token, m.id, fmt]);
  // "Read aloud": each step is spoken when it opens. Stops when the hire moves on.
  useEffect(() => {
    if (!autoRead) return;
    const t = window.setTimeout(() => speak(card.text, BCP47[lang]), 350);
    return () => { window.clearTimeout(t); stopSpeaking(); };
  }, [autoRead, card.text, lang]);
  // Captions are always on for the video; "Extra time" plays it slower.
  const onVideoReady = (v: HTMLVideoElement) => {
    for (const tt of Array.from(v.textTracks)) tt.mode = "showing";
    v.playbackRate = slow ? 0.75 : 1;
  };

  const start = i * per, end = (i + 1) * per;
  const toQuiz = next.kind === "quiz";

  return (
    <article>
      <p className="muted" style={{ margin: 0, fontSize: 15 }}>{m.icon} {m.title} · {tr("lessonOf", lang, { n: i + 1, total: m.cards.length })}</p>
      <div className="tabs" role="group" aria-label={tr("formatLabel", lang)}>
        {TABS.map((t) => (
          <button key={t.id} type="button" aria-pressed={fmt === t.id} onClick={() => onFmt(t.id)}>
            <span aria-hidden="true">{t.i}</span>{tr(t.k, lang)}
          </button>
        ))}
      </div>

      {fmt === "video" && m.media?.video ? (
        <>
          <div className="media">
            <video ref={vref} key={`${m.id}-${i}-${lang}`} controls playsInline preload="metadata" poster={i === 0 ? m.media.poster : undefined}
              aria-label={tr("videoOf", lang, { title: m.title, n: i + 1 })} aria-describedby="lesson-text"
              onLoadedMetadata={(e) => onVideoReady(e.currentTarget)}
              src={`${m.media.video}#t=${start},${end}`}
              onTimeUpdate={(e) => { const v = e.currentTarget; if (v.currentTime >= end - 0.3) { v.pause(); v.currentTime = Math.max(start, end - 0.3); } }}>
              <track kind="captions" src={captionsUrl(m.cards, m.seconds_per_card)} srcLang={HTML_LANG[lang]} label={tr("captionsToggle", lang)} default />
            </video>
          </div>
          <p className="media-credit">{tr("framiaCredit", lang)}</p>
        </>
      ) : fmt === "read" ? null : (
        <div className="media pic">
          {img ? <img src={img} alt={altFor(img, lang)} /> : <span aria-hidden="true">{card.icon}</span>}
          {fmt === "video" && <div className="cap" aria-hidden="true">{card.text}</div>}
        </div>
      )}

      <p className="lesson-text" id="lesson-text">{fmt === "read" && <span aria-hidden="true" style={{ marginRight: 8 }}>{card.icon}</span>}{card.text}</p>
      <div style={{ marginTop: 14 }}><SpeakButton text={card.text} lang={lang} glow={fmt === "listen"} /></div>

      <nav className="lesson-nav" aria-label="Lesson navigation">
        {prev ? <button type="button" className="btn" onClick={() => go(prev)}>‹ {tr("prevLesson", lang)}</button> : <span />}
        <button type="button" className="btn btn-primary" onClick={() => go(next)}>{toQuiz ? tr("startQuiz", lang) : tr("nextLesson", lang)} ›</button>
      </nav>
    </article>
  );
}
