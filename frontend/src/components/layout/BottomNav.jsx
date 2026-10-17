import { Icon } from "../ui/Icon.jsx";

export function BottomNav({ tabs, active, onSelect }) {
  return (
    <nav
      className="lg:hidden fixed inset-x-3 z-40 grid grid-cols-6 gap-0.5 p-1.5 rounded-full bg-s1/75"
      style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
      aria-label="Sections"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          aria-current={active === t.id ? "page" : undefined}
          style={active === t.id ? { background: "var(--fill-strong)", boxShadow: "inset 0 1px 0 var(--rim)" } : undefined}
          className={`relative h-14 rounded-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
            active === t.id ? "text-tx" : "text-mu"
          }`}
        >
          <Icon name={t.icon} className="w-5 h-5" />
          {t.label}
          {t.locked ? (
            <span
              aria-hidden="true"
              className="absolute top-1 left-1/2 ml-1.5 w-4 h-4 rounded-full bg-s2 border border-line text-mu flex items-center justify-center"
            >
              <Icon name="lock" className="w-2.5 h-2.5" />
            </span>
          ) : t.badge ? (
            <span className="absolute top-1 left-1/2 ml-1.5 min-w-[16px] h-4 px-1 rounded-full bg-pri text-priink text-[10px] font-bold flex items-center justify-center">
              {t.badge}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}
