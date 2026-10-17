import { Icon } from "../../components/ui/Icon.jsx";

// What happens after "Send": a real sequence, so a stepper is the right shape.
export function FlowSteps({ steps }) {
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => (
        <li key={s} className="flex-1 min-w-0">
          <div className="flex items-center">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                i === 0 ? "bg-ok text-bg" : "bg-line text-mu"
              }`}
            >
              {i === 0 ? <Icon name="check" className="w-3 h-3" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-line mx-1.5" />}
          </div>
          <div className="text-[11px] text-mu mt-1.5 pr-2 leading-snug">{s}</div>
        </li>
      ))}
    </ol>
  );
}
