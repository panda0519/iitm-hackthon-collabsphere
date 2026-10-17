import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";

export function Modal({ open, title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative pop-in w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto scroll-thin rounded-2xl neon p-5`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-display font-bold text-lg text-tx">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-mu hover:text-tx hover:bg-s2 flex items-center justify-center shrink-0"
            aria-label="Close dialog"
          >
            <Icon name="x" />
          </button>
        </div>
        {children}
        {footer && <div className="flex flex-wrap justify-end gap-2 mt-5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
