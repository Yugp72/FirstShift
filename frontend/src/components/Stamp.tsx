import { motion, useReducedMotion } from "framer-motion";
import type { MotionStyle } from "framer-motion";

interface Props {
  size?: "lg" | "sm";
  animate?: boolean;
  delay?: number;
  onDark?: boolean;
  style?: MotionStyle;
}

/** The gold 可以 / READY chop. Slams in with a spring; a plain fade when reduced motion is on. */
export function Stamp({ size = "lg", animate = false, delay = 0, onDark, style }: Props) {
  const reduce = useReducedMotion();
  const cls = `stamp ${size === "sm" ? "sm" : ""} ${onDark ? "on-dark" : ""}`;
  const body = (
    <>
      <span className="zh" lang="zh-CN" aria-hidden="true">可以</span>
      <span className="en" aria-hidden="true">READY</span>
    </>
  );
  if (!animate) {
    return <div className={cls} style={style as React.CSSProperties} role="img" aria-label="Stamped shift-ready">{body}</div>;
  }
  return (
    <motion.div
      className={cls}
      style={style}
      role="img"
      aria-label="Stamped shift-ready"
      initial={reduce ? { opacity: 0, rotate: -8 } : { scale: 2.8, opacity: 0, rotate: -22 }}
      animate={{ scale: 1, opacity: 1, rotate: -8 }}
      transition={reduce ? { duration: 0.4, delay } : { type: "spring", stiffness: 700, damping: 20, mass: 1.2, delay }}
    >
      {body}
    </motion.div>
  );
}

/** SVG filter that roughens the stamp's edges like ink on paper. Render once. */
export function RoughFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <filter id="rough">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
      </filter>
    </svg>
  );
}
