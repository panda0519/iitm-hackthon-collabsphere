import { Icon } from "../../components/ui/Icon.jsx";

export function Ticker({ items }) {
  const row = items.map((it, i) => (
    <span key={i} className="inline-flex items-center gap-2 px-5 text-xs text-tx whitespace-nowrap">
      <Icon name={it.icon} className="w-3.5 h-3.5 text-pritx" />
      {it.text}
    </span>
  ));
  return (
    <div className="marquee rounded-2xl border border-line bg-s1/70" role="region" aria-label="Live updates">
      <div className="marquee-track py-2.5">
        <div className="flex">{row}</div>
        <div className="flex" aria-hidden="true">
          {row}
        </div>
      </div>
    </div>
  );
}
