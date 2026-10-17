import { useMemo } from "react";

const BURST_COLORS = ["#ff7a45", "#22b8a0", "#8a7dff", "#e05fd0", "#5cc8f0", "#b4d84a", "#ff9d7a"];

export function Burst() {
  const parts = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const a = Math.random() * Math.PI * 2;
        const d = 120 + Math.random() * 260;
        return {
          dx: Math.cos(a) * d,
          dy: Math.sin(a) * d - 80,
          rot: Math.round(Math.random() * 720 - 360) + "deg",
          c: BURST_COLORS[i % BURST_COLORS.length],
          s: 6 + Math.random() * 6,
          delay: Math.round(Math.random() * 120)
        };
      }),
    []
  );
  return (
    <div className="fixed inset-0 z-[950] pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-[42%]">
        {parts.map((p, i) => (
          <span
            key={i}
            className="burst-p"
            style={{
              "--dx": p.dx + "px",
              "--dy": p.dy + "px",
              "--rot": p.rot,
              width: p.s,
              height: p.s * 0.6,
              background: p.c,
              animationDelay: p.delay + "ms"
            }}
          />
        ))}
      </div>
    </div>
  );
}
