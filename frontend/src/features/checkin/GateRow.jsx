import { Icon } from "../../components/ui/Icon.jsx";

// One row of the four-step check-in gate (eligibility, time, place, presence).
export function GateRow({ state, title, detail, children }) {
  const tone = { pass: "border-ok/40 bg-ok/5", fail: "border-bad/40 bg-bad/5", wait: "border-line bg-s2/40" }[state];
  const dot = { pass: "bg-ok text-bg", fail: "bg-bad text-white", wait: "bg-line text-mu" }[state];
  return (
    <div className={`rounded-2xl border p-3.5 transition-colors ${tone}`}>
      <div className="flex items-start gap-3">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${dot}`}>
          <Icon name={state === "pass" ? "check" : state === "fail" ? "x" : "clock"} className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-tx">{title}</div>
          <div className={`text-xs mt-0.5 ${state === "fail" ? "text-bad" : "text-mu"}`}>{detail}</div>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}
