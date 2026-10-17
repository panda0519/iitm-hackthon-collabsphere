import { Icon } from "./Icon.jsx";

export function Btn({ variant = "soft", size = "md", icon, className = "", children, ...rest }) {
  const v = {
    primary: "btn-flame hover:brightness-110",
    soft: "bg-s2 border border-line text-tx hover:border-mu/60",
    ghost: "text-mu hover:text-tx hover:bg-s2",
    ok: "bg-ok text-bg hover:brightness-110",
    danger: "bg-bad/15 text-bad border border-bad/30 hover:bg-bad hover:text-white"
  }[variant];
  const s = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-5 text-[15px] gap-2"
  }[size];
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full font-semibold transition active:scale-[.97] disabled:opacity-40 disabled:pointer-events-none ${v} ${s} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}
