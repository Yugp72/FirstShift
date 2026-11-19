import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type Gap } from "../lib/api";
import { useDialog } from "../lib/useDialog";

export function InsightsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [gaps, setGaps] = useState<Gap[] | null>(null);
  const ref = useDialog<HTMLElement>(open, onClose);
  useEffect(() => {
    if (!open) return;
    api.insights().then((r) => setGaps(r.gaps)).catch(() => setGaps([]));
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside ref={ref} className="drawer" role="dialog" aria-modal="true" aria-labelledby="gaps-title"
            initial={{ x: 460 }} animate={{ x: 0 }} exit={{ x: 460 }} transition={{ type: "spring", stiffness: 320, damping: 34 }}>
            <button data-autofocus type="button" className="close-x" onClick={onClose} aria-label="Close">×</button>
            <h2 id="gaps-title">Team knowledge gaps</h2>
            <p className="sub">Most-missed checks on first try, across every hire. Fix the lesson once, not the person every time.</p>
            {gaps === null && <p className="sub" role="status">Loading…</p>}
            {gaps?.length === 0 && <p className="sub">No gaps yet. Every check passed on first try.</p>}
            {gaps?.map((g, i) => (
              <div className="gap" key={i}>
                <div className="big">{g.missed} of {g.attempted}</div>
                <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  hires missed it · {g.module_icon} {g.module} · {g.role === "server" ? "Front of house" : "Kitchen"}
                </div>
                <div className="q">{g.question}</div>
                {g.lesson_line && <div className="line">Lesson line: “{g.lesson_line}”</div>}
                <div className="bar" aria-hidden="true"><i style={{ width: `${(100 * g.missed) / g.attempted}%` }} /></div>
              </div>
            ))}
            <p className="sub" style={{ marginTop: 20 }}>In demo data. In a pilot this becomes a weekly note to the manager.</p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
