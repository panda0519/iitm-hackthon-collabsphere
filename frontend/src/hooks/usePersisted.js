import { useState, useEffect } from "react";
import { load, save } from "../services/storage.js";

/**
 * useState that persists to localStorage under the app's STORE prefix.
 * Reads once on mount, writes on every change. Storage failures are silent.
 */
export function usePersisted(key, initial) {
  const [value, setValue] = useState(() => load(key, initial));
  useEffect(() => {
    save(key, value);
  }, [key, value]);
  return [value, setValue];
}
