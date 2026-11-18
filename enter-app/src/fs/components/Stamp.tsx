import { motion, useReducedMotion } from "framer-motion";

/** The shift-ready seal. Scales in gently; fades when reduced motion is on. */
export function Seal({ size = "lg", animate = false, label = "Shift-ready", delay = 0 }: {
  size?: "lg" | "sm"; animate?: boolean; label?: string; delay?: number;
}) {
  const reduce = useReducedMotion();
  const body = (
    <>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      <span className="t">{label}</span>
    </>
  );
  const cls = `seal ${size === "sm" ? "sm" : ""}`;
  if (!animate) return <span className={cls} role="img" aria-label={label}>{body}</span>;
  return (
    <motion.span className={cls} role="img" aria-label={label}
      initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={reduce ? { duration: 0.3, delay } : { type: "spring", stiffness: 380, damping: 22, delay }}>
      {body}
    </motion.span>
  );
}
