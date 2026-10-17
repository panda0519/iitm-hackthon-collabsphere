import { useState, useRef } from "react";

/**
 * Toast state + `notify(msg, tone)`. Keeps at most the last three toasts, each for
 * ~3.8s. Extracted from the app shell so any feature can raise one.
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const notify = (msg, tone = "ok") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

  return { toasts, notify };
}
