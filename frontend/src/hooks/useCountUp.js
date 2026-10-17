import { useState, useRef, useEffect } from "react";
import { prefersReducedMotion } from "../utils/motion.js";

/** Animate a number toward `target` (easeOutCubic). Jumps instantly under reduced motion. */
export function useCountUp(target, ms = 700) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (prefersReducedMotion() || from.current === target) {
      from.current = target;
      setV(target);
      return;
    }
    const a = from.current;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      const val = Math.round(a + (target - a) * (1 - Math.pow(1 - p, 3)));
      from.current = val;
      setV(val);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
