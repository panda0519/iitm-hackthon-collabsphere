import { Logo } from "../ui/Logo.jsx";
import { Icon } from "../ui/Icon.jsx";
import { Ring } from "../ui/Ring.jsx";
import { Avatar } from "../ui/Avatar.jsx";
import { Counter } from "../ui/Counter.jsx";
import { houseColor } from "@collabsphere/shared";

export const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || "");

export function TopBar({ title, subtitle, user, lvl, theme, onTheme, onPalette, onProfile }) {
  return (
    <header className="sticky top-3 z-30 mx-3 sm:mx-5 mt-3 h-16 rounded-full bg-s1/70">
      <div className="h-full pl-4 pr-2.5 sm:pl-5 sm:pr-3 flex items-center gap-3">
        <span className="lg:hidden shrink-0">
          <Logo id="lg-top" size={30} />
        </span>
        <div className="min-w-0 hidden sm:block">
          <h1 className="font-display font-bold text-[17px] leading-tight text-tx truncate">{title}</h1>
          <p className="text-[11px] text-mu truncate">{subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPalette}
            className="h-10 rounded-full border border-line bg-s2 text-mu hover:text-tx px-3 flex items-center gap-2 text-xs"
            aria-label="Open command palette"
          >
            <Icon name="search" className="w-4 h-4" />
            <span className="hidden md:inline">Search or jump to</span>
            <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded-md border border-line bg-s1 font-sans">
              {IS_MAC ? "⌘K" : "Ctrl K"}
            </kbd>
          </button>
          <button
            type="button"
            onClick={onTheme}
            className="w-10 h-10 rounded-full border border-line bg-s2 text-mu hover:text-tx flex items-center justify-center"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title="Toggle theme"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onProfile}
            className="flex items-center gap-2 rounded-xl pl-1 pr-1 md:pr-2.5 py-0.5 hover:bg-s2 transition"
            title="Your level and XP"
          >
            <Ring pct={lvl.pct} size={38} stroke={3}>
              <Avatar name={user.name} house={user.house} size={28} />
            </Ring>
            <span className="hidden md:block text-left leading-tight">
              <span className="block text-xs font-semibold text-tx">{user.name}</span>
              <span className="block text-[11px] text-ok font-semibold">
                <Counter value={user.xp} /> XP, {lvl.name}
              </span>
            </span>
          </button>
          <div
            className="flex items-center gap-2 rounded-full border border-line bg-s2 px-3 h-10"
            title={`Your house: ${user.house}`}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: houseColor(user.house) }} />
            <span className="text-xs font-semibold text-tx whitespace-nowrap">{user.house}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
