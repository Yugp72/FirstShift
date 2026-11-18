import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { SpeakButton } from "../components/SpeakButton";
import type { HireModule, Lang } from "../lib/api";
import { HTML_LANG, tr } from "../lib/i18n";

interface Props { m: HireModule; i: number; lang: Lang; onIndex: (i: number) => void; onChecks: () => void; onHome: () => void }

/** One idea per card, big icon, one tap to listen. */
export function HireLesson({ m, i, lang, onIndex, onChecks, onHome }: Props) {
  const reduce = useReducedMotion();
  const card = m.cards[i];
  const last = i === m.cards.length - 1;
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus(); }, [i]);

  return (
    <div lang={HTML_LANG[lang]}>
      <div className="lesson-progress" aria-label={tr("cardOf", lang, { n: i + 1, total: m.cards.length })}>
        {m.cards.map((c, idx) => <i key={c.id} className={idx <= i ? "on" : ""} />)}
      </div>
      <AnimatePresence mode="wait">
        <motion.section
          key={card.id}
          className="card"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40 }}
          transition={{ duration: 0.22 }}
          aria-labelledby="card-text"
        >
          <div className="module-label">{m.icon} {m.title} · {tr("cardOf", lang, { n: i + 1, total: m.cards.length })}</div>
          <div className="big-ico" aria-hidden="true">{card.icon}</div>
          <h1 id="card-text" ref={ref} tabIndex={-1} className="ctext" style={{ fontWeight: 400 }}>{card.text}</h1>
          <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
            <SpeakButton text={card.text} lang={lang} />
          </div>
        </motion.section>
      </AnimatePresence>
      <div className="row-gap">
        <button type="button" className="hbtn ghost" onClick={() => (i === 0 ? onHome() : onIndex(i - 1))}>
          ← {i === 0 ? tr("home", lang) : tr("back", lang)}
        </button>
        <button type="button" className="hbtn primary" onClick={() => (last ? onChecks() : onIndex(i + 1))}>
          {last ? tr("toChecks", lang) : tr("next", lang)} →
        </button>
      </div>
    </div>
  );
}
