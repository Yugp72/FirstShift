import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SpeakButton } from "../components/SpeakButton";
import { api, type Format, type HireModule, type Lang } from "../lib/api";
import { BCP47, HTML_LANG, tr } from "../lib/i18n";
import { speak, stopSpeaking, ttsSupported } from "../lib/speak";

interface Props {
  token: string; m: HireModule; i: number; lang: Lang; format: Format; prefs: string[];
  onFormat: (f: Format) => void; onIndex: (i: number) => void; onChecks: () => void; onHome: () => void;
}

const TABS: { id: Format; i: string; k: "fmt_read" | "fmt_pictures" | "fmt_video" | "fmt_listen" }[] = [
  { id: "video", i: "🎬", k: "fmt_video" },
  { id: "pictures", i: "🖼️", k: "fmt_pictures" },
  { id: "listen", i: "🔊", k: "fmt_listen" },
  { id: "read", i: "📄", k: "fmt_read" },
];

export function defaultFormat(prefs: string[]): Format {
  if (prefs.includes("captions")) return "video";
  if (prefs.includes("visual")) return "pictures";
  if (prefs.includes("read_aloud")) return "listen";
  return "read";
}

/** One lesson, four ways in: captioned video, picture steps, read-aloud, or text. */
export function HireLesson({ token, m, i, lang, format, prefs, onFormat, onIndex, onChecks, onHome }: Props) {
  useEffect(() => { api.usedFormat(token, m.id, format).catch(() => undefined); }, [token, m.id, format]);
  useEffect(() => () => stopSpeaking(), [format]);

  return (
    <div lang={HTML_LANG[lang]}>
      <p className="muted" style={{ margin: "16px 0 0", fontSize: 15, fontFamily: "var(--font-ui)" }}>{m.icon} {m.title}</p>
      <div className="tabs" role="tablist" aria-label={tr("formatLabel", lang)}>
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={format === t.id} onClick={() => onFormat(t.id)}>
            <span className="i" aria-hidden="true">{t.i}</span>{tr(t.k, lang)}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {format === "read" && <ReadCards m={m} i={i} lang={lang} onIndex={onIndex} onChecks={onChecks} onHome={onHome} />}
        {format === "pictures" && <PictureSteps m={m} lang={lang} />}
        {format === "video" && <VideoLesson m={m} lang={lang} voice={!prefs.includes("captions")} />}
        {format === "listen" && <ListenLesson m={m} lang={lang} />}
      </div>

      {format !== "read" && (
        <div className="row-gap">
          <button type="button" className="hbtn" onClick={onHome}>← {tr("home", lang)}</button>
          <button type="button" className="hbtn primary" onClick={onChecks}>{tr("toChecks", lang)} →</button>
        </div>
      )}
    </div>
  );
}

function ReadCards({ m, i, lang, onIndex, onChecks, onHome }: { m: HireModule; i: number; lang: Lang; onIndex: (i: number) => void; onChecks: () => void; onHome: () => void }) {
  const reduce = useReducedMotion();
  const card = m.cards[i];
  const last = i === m.cards.length - 1;
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus(); }, [i]);
  return (
    <>
      <div className="lesson-progress" aria-label={tr("cardOf", lang, { n: i + 1, total: m.cards.length })}>
        {m.cards.map((c, idx) => <i key={c.id} className={idx <= i ? "on" : ""} />)}
      </div>
      <AnimatePresence mode="wait">
        <motion.section key={card.id} className="card"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
          <div className="module-label">{tr("cardOf", lang, { n: i + 1, total: m.cards.length })}</div>
          <div className="big-ico" aria-hidden="true">{card.icon}</div>
          <h1 ref={ref} tabIndex={-1} className="ctext">{card.text}</h1>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}><SpeakButton text={card.text} lang={lang} /></div>
        </motion.section>
      </AnimatePresence>
      <div className="row-gap">
        <button type="button" className="hbtn" onClick={() => (i === 0 ? onHome() : onIndex(i - 1))}>← {i === 0 ? tr("home", lang) : tr("back", lang)}</button>
        <button type="button" className="hbtn primary" onClick={() => (last ? onChecks() : onIndex(i + 1))}>{last ? tr("toChecks", lang) : tr("next", lang)} →</button>
      </div>
    </>
  );
}

function PictureSteps({ m, lang }: { m: HireModule; lang: Lang }) {
  return (
    <ol className="pic-grid" style={{ listStyle: "none", padding: 0 }}>
      {m.cards.map((c, idx) => {
        const img = m.media?.steps?.[c.id];
        return (
          <li key={c.id} className="pic">
            <div className="art">
              <span className="num" aria-hidden="true">{idx + 1}</span>
              {img ? <img src={img} alt="" /> : <span aria-hidden="true">{c.icon}</span>}
            </div>
            <p>{c.text}</p>
            <SpeakButton text={c.text} lang={lang} compact />
          </li>
        );
      })}
      {m.media?.steps && <li className="media-credit" style={{ gridColumn: "1 / -1" }}>{tr("framiaCredit", lang)}</li>}
    </ol>
  );
}

function VideoLesson({ m, lang, voice }: { m: HireModule; lang: Lang; voice: boolean }) {
  if (m.media?.video) {
    return (
      <>
        <div className="player">
          <video controls playsInline preload="metadata" poster={m.media.poster} src={m.media.video} crossOrigin="anonymous">
            <track kind="captions" src={`/api/media/${m.id}/captions.vtt?lang=${lang}`} srcLang={HTML_LANG[lang]} label={tr("captionsToggle", lang)} default />
          </video>
        </div>
        <p className="media-credit">{tr("framiaCredit", lang)}</p>
      </>
    );
  }
  return <Walkthrough m={m} lang={lang} voice={voice} />;
}

/** Captioned step-by-step walkthrough on the same timing as the caption track. Used until a Framia video exists. */
function Walkthrough({ m, lang, voice }: { m: HireModule; lang: Lang; voice: boolean }) {
  const per = (m.seconds_per_card || 6) * 1000;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [caps, setCaps] = useState(true);
  const [sound, setSound] = useState(voice && ttsSupported);
  const [t0, setT0] = useState(0);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!playing) return;
    if (sound) speak(m.cards[idx].text, BCP47[lang]);
    setT0(Date.now());
    const id = window.setTimeout(() => {
      if (idx + 1 < m.cards.length) setIdx(idx + 1);
      else { setPlaying(false); stopSpeaking(); }
    }, per);
    const t = window.setInterval(() => tick((n) => n + 1), 250);
    return () => { window.clearTimeout(id); window.clearInterval(t); };
  }, [playing, idx, per, sound, lang, m.cards]);

  const card = m.cards[idx];
  const img = m.media?.steps?.[card.id];
  const frac = playing ? Math.min(1, (Date.now() - t0) / per) : 0;
  const total = ((idx + frac) / m.cards.length) * 100;

  return (
    <>
      <div className="player" aria-label={tr("fmt_video", lang)}>
        <div className="walk">
          <div className="bar" style={{ width: `${total}%` }} />
          {img ? <img src={img} alt="" style={{ maxHeight: "65%", borderRadius: 10 }} /> : <div className="big" aria-hidden="true">{card.icon}</div>}
          {caps && <div className="cap" aria-live="polite">{card.text}</div>}
        </div>
        <div className="player-ctrl">
          <button type="button" onClick={() => { if (!playing && idx === m.cards.length - 1) setIdx(0); setPlaying(!playing); if (playing) stopSpeaking(); }}>
            {playing ? `❚❚ ${tr("pause", lang)}` : `▶ ${tr("play", lang)}`}
          </button>
          <span>{idx + 1} / {m.cards.length}</span>
          <span style={{ flex: 1 }} />
          <label><input type="checkbox" checked={caps} onChange={(e) => setCaps(e.target.checked)} /> {tr("captionsToggle", lang)}</label>
          {ttsSupported && <label><input type="checkbox" checked={sound} onChange={(e) => { setSound(e.target.checked); if (!e.target.checked) stopSpeaking(); }} /> 🔊</label>}
        </div>
      </div>
      <p className="media-credit">{tr("walkthrough", lang)}</p>
    </>
  );
}

function ListenLesson({ m, lang }: { m: HireModule; lang: Lang }) {
  const [now, setNow] = useState<number | null>(null);
  const run = useRef(0);
  useEffect(() => () => { run.current++; }, []);
  const playFrom = (k: number, r: number) => {
    if (r !== run.current) return;
    if (k >= m.cards.length) { setNow(null); return; }
    setNow(k);
    speak(m.cards[k].text, BCP47[lang], () => playFrom(k + 1, r));
  };
  const start = () => { run.current++; playFrom(0, run.current); };
  const halt = () => { run.current++; stopSpeaking(); setNow(null); };
  return (
    <>
      {ttsSupported && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="hbtn primary" onClick={() => (now === null ? start() : halt())}>
            {now === null ? `▶ ${tr("listenAll", lang)}` : `■ ${tr("stop", lang)}`}
          </button>
        </div>
      )}
      <ol className="listen-list">
        {m.cards.map((c, k) => (
          <li key={c.id} className={now === k ? "now" : ""} aria-current={now === k ? "step" : undefined}>
            <span className="i" aria-hidden="true">{c.icon}</span>
            <span>{c.text}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
