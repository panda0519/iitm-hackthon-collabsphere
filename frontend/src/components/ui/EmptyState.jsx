import { Icon } from "./Icon.jsx";

export function EmptyState({ icon = "info", title, children }) {
  return (
    <div className="text-center px-4 py-8">
      <div className="mx-auto w-10 h-10 rounded-full bg-s2 border border-line flex items-center justify-center text-mu">
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="font-display font-semibold text-tx mt-3">{title}</div>
      <div className="text-xs text-mu mt-1 max-w-xs mx-auto">{children}</div>
    </div>
  );
}
