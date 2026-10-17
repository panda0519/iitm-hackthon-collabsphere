import { useState, useEffect } from "react";

/** Flips to true just after first paint so bars can grow from zero. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setM(true), 40);
    return () => clearTimeout(t);
  }, []);
  return m;
}
