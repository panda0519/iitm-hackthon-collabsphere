import { Icon } from "../../components/ui/Icon.jsx";

// Small square icon button used across the Admin event table and announcements list.
export function IconBtn({ icon, label, onClick, disabled, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={disabled ? `${label} (only for host houses)` : label}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition disabled:opacity-30 ${
        tone === "bad" ? "text-bad hover:bg-bad/15" : "text-mu hover:text-tx hover:bg-s2"
      }`}
    >
      <Icon name={icon} className="w-4 h-4" />
    </button>
  );
}
