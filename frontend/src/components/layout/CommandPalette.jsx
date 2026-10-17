import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../ui/Icon.jsx";

export function CommandPalette({ open, onClose, commands }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setIdx(0);
    const t = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [open]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return commands.filter((c) => terms.every((t) => `${c.group} ${c.label} ${c.hint || ""}`.toLowerCase().includes(t)));
  }, [q, commands]);

  useEffect(() => {
    setIdx(0);
  }, [q]);
  useEffect(() => {
    const el = listRef.current && listRef.current.querySelector('[data-active="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [idx, results]);

  if (!open) return null;

  const run = (c) => {
    onClose();
    c.run();
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[idx]) run(results[idx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-start justify-center px-3 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative pop-in w-full max-w-xl glass rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
          <Icon name="search" className="w-4 h-4 text-mu" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            aria-label="Command palette search"
            className="flex-1 bg-transparent text-sm text-tx placeholder:text-mu focus:outline-none"
            placeholder="Jump to a tab, event, city or house"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded-md border border-line bg-s2 text-mu font-sans">Esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto scroll-thin p-2">
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-mu">Nothing matches “{q}”.</div>
          ) : (
            results.map((c, i) => (
              <Fragment key={c.id}>
                {(i === 0 || results[i - 1].group !== c.group) && (
                  <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-mu">{c.group}</div>
                )}
                <button
                  type="button"
                  data-active={i === idx}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => run(c)}
                  className={`w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm text-left text-tx ${i === idx ? "bg-pri/15" : ""}`}
                >
                  <Icon name={c.icon} className={`w-4 h-4 shrink-0 ${i === idx ? "text-pritx" : "text-mu"}`} />
                  <span className="flex-1 truncate">{c.label}</span>
                  {c.hint && <span className="text-[11px] text-mu shrink-0">{c.hint}</span>}
                </button>
              </Fragment>
            ))
          )}
        </div>
        <div className="px-4 h-10 border-t border-line flex items-center gap-4 text-[11px] text-mu">
          <span>Up and down to move</span>
          <span>Enter to run</span>
          <span className="ml-auto hidden sm:inline">Press 1 to 4 anywhere to switch tabs, / to search events</span>
        </div>
      </div>
    </div>
  );
}
