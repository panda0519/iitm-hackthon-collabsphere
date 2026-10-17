export function Segmented({ options, value, onChange, className = "" }) {
  return (
    <div role="tablist" className={`inline-flex p-1 rounded-full bg-s2 border border-line gap-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 h-8 text-[13px] font-semibold whitespace-nowrap transition ${
            value === o.value ? "bg-s1 text-tx shadow-sm ring-1 ring-line" : "text-mu hover:text-tx"
          }`}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={`text-[10px] px-1.5 rounded-full ${
                value === o.value ? "bg-pri/20 text-pritx" : "bg-line/60 text-mu"
              }`}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
