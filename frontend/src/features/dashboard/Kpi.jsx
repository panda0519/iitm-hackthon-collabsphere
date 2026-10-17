import { Icon } from "../../components/ui/Icon.jsx";
import { Counter } from "../../components/ui/Counter.jsx";

export function Kpi({ icon, label, value, suffix, sub }) {
  return (
    <div className="neon hover-lift rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-mu">{label}</span>
        <span className="w-8 h-8 rounded-xl btn-flame flex items-center justify-center">
          <Icon name={icon} className="w-4 h-4" />
        </span>
      </div>
      <div className="font-display font-extrabold text-3xl text-tx mt-2 tabular-nums">
        <Counter value={value} />
        {suffix && <span className="text-base font-bold text-mu ml-1">{suffix}</span>}
      </div>
      <div className="text-xs text-mu mt-1">{sub}</div>
    </div>
  );
}
