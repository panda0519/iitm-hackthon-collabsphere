export const FIELD =
  "w-full bg-s2 border border-line rounded-xl px-3 h-10 text-sm text-tx placeholder:text-mu/70 focus:outline-none focus:border-pri/70 focus:ring-2 focus:ring-pri/25";

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-mu">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="block text-[11px] text-mu mt-1">{hint}</span>}
    </label>
  );
}
