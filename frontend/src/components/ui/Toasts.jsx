import { Icon } from "./Icon.jsx";

export function Toasts({ toasts }) {
  return (
    <div
      className="fixed z-[960] top-24 left-3 right-3 sm:left-auto sm:right-4 sm:w-[360px] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pop-in pointer-events-auto glass rounded-xl px-3.5 py-2.5 text-xs font-medium text-tx flex items-start gap-2.5 shadow-xl ${
            t.tone === "error" ? "!border-bad/50" : "!border-ok/40"
          }`}
        >
          <span
            className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
              t.tone === "error" ? "bg-bad text-white" : "bg-ok text-bg"
            }`}
          >
            <Icon name={t.tone === "error" ? "x" : "check"} className="w-3 h-3" />
          </span>
          <span className="min-w-0">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
