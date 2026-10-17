import { Logo } from "../ui/Logo.jsx";
import { Icon } from "../ui/Icon.jsx";

export function Rail({ tabs, active, onSelect, onTour, onReset }) {
  const idx = Math.max(
    0,
    tabs.findIndex((t) => t.id === active)
  );
  const lab =
    "pointer-events-none whitespace-nowrap text-[13px] font-semibold opacity-0 -translate-x-1 transition duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0";
  const small =
    "relative h-12 flex items-center gap-3.5 pl-[19px] pr-4 rounded-full text-mu hover:text-tx hover:bg-s2 transition-colors text-left";
  return (
    <aside
      className="group hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col gap-1 p-2 w-[72px] hover:w-[190px] focus-within:w-[190px] max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden no-scrollbar rounded-[36px] bg-s1/70 transition-[width] duration-300 ease-out"
      aria-label="Primary"
    >
      <div className="h-12 shrink-0 flex items-center pl-[10px]" title="CollabSphere">
        <Logo id="lg-rail" size={32} />
      </div>
      <nav className="relative flex flex-col gap-1 shrink-0" aria-label="Sections">
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-14 w-full rounded-full transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${idx * 60}px)`,
            background: "var(--fill-strong)",
            boxShadow: "inset 0 1px 0 var(--rim), 0 0 28px -8px rgb(var(--pri) / .7)"
          }}
        />
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-current={active === t.id ? "page" : undefined}
            aria-label={t.label}
            className={`relative z-[1] h-14 flex items-center gap-3.5 pl-[17px] pr-4 rounded-full text-left transition-colors ${
              active === t.id ? "text-tx" : "text-mu hover:text-tx"
            }`}
          >
            <Icon name={t.icon} className="w-[22px] h-[22px] shrink-0" />
            <span className={lab}>{t.label}</span>
            {t.locked ? (
              <span
                aria-hidden="true"
                className="absolute top-2 left-9 w-[18px] h-[18px] rounded-full bg-s2 border border-line text-mu flex items-center justify-center"
              >
                <Icon name="lock" className="w-2.5 h-2.5" />
              </span>
            ) : t.badge ? (
              <span className="absolute top-2 left-9 min-w-[18px] h-[18px] px-1 rounded-full bg-pri text-priink text-[10px] font-bold flex items-center justify-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
      <div className="mt-1 pt-2 border-t border-line flex flex-col gap-1 shrink-0">
        <button type="button" onClick={onTour} className={small} aria-label="Take the guided tour">
          <Icon name="sparkles" className="w-5 h-5 shrink-0" />
          <span className={lab}>Guided tour</span>
        </button>
        <button type="button" onClick={onReset} className={small} aria-label="Reset demo data">
          <Icon name="refresh" className="w-5 h-5 shrink-0" />
          <span className={lab}>Reset demo</span>
        </button>
      </div>
    </aside>
  );
}
