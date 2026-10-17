import { useRef, useState } from "react";

// Drag the dot to rehearse being at the venue, nearby, or spoofing from far away.
export function GeoRadar({ distanceM, limit, max = 5000, onChange }) {
  const R0 = 38,
    R1 = 92,
    C = 100;
  const [ang, setAng] = useState(-Math.PI / 4);
  const svgRef = useRef(null);
  const toPx = (d) => (d <= limit ? (d / limit) * R0 : R0 + Math.min(1, Math.log(d / limit) / Math.log(max / limit)) * (R1 - R0));
  const toM = (px) => (px <= R0 ? (px / R0) * limit : limit * Math.pow(max / limit, (px - R0) / (R1 - R0)));
  const r = toPx(distanceM);
  const x = C + r * Math.cos(ang),
    y = C + r * Math.sin(ang);
  const inside = distanceM <= limit;
  const label = distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${distanceM} m`;
  const drag = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 200 - C;
    const py = ((e.clientY - rect.top) / rect.height) * 200 - C;
    setAng(Math.atan2(py, px));
    onChange(Math.min(max, Math.round(toM(Math.min(R1, Math.hypot(px, py))) / 10) * 10));
  };
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`You are ${label} from the venue. The geofence is ${limit} metres.`}
      className="w-full max-w-[210px] touch-none select-none cursor-pointer shrink-0"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons) drag(e);
      }}
    >
      <circle cx={C} cy={C} r={R1} className="fill-s2 stroke-line" strokeWidth="1" />
      <circle cx={C} cy={C} r={(R0 + R1) / 2 + 8} className="fill-none stroke-line" strokeWidth="1" strokeDasharray="2 5" />
      <circle cx={C} cy={C} r={R0} className={inside ? "fill-ok/15 stroke-ok" : "fill-bad/10 stroke-bad"} strokeWidth="1.5" strokeDasharray="5 4" />
      <circle cx={C} cy={C} r="4" className="fill-pri" />
      <line x1={C} y1={C} x2={x} y2={y} className={inside ? "stroke-ok" : "stroke-bad"} strokeWidth="1" strokeOpacity=".5" />
      <circle cx={x} cy={y} r="7" className={inside ? "fill-ok" : "fill-bad"} stroke="#fff" strokeWidth="2" />
      <text x={x > 130 ? x - 11 : x + 11} y={y - 9} textAnchor={x > 130 ? "end" : "start"} className="fill-tx" style={{ font: "600 11px 'Figtree', system-ui, sans-serif" }}>
        {label}
      </text>
      <text x={C} y={C + R0 + 13} textAnchor="middle" className="fill-mu" style={{ font: "500 9px 'Figtree', system-ui, sans-serif" }}>
        {limit} m geofence
      </text>
    </svg>
  );
}
