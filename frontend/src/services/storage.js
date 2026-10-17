// localStorage adapter, used by the offline fallback (no VITE_USE_API). The server mode
// uses services/client.js instead; both expose the same shape, so the state layer picks
// one at startup and the components never know which.

import { STORE } from "@collabsphere/shared";

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(STORE + key);
    if (raw !== null) return JSON.parse(raw);
  } catch (e) {
    /* ignore malformed / unavailable storage */
  }
  return fallback;
}

export function save(key, value) {
  try {
    localStorage.setItem(STORE + key, JSON.stringify(value));
  } catch (e) {
    /* ignore quota / private-mode errors */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(STORE + key);
  } catch (e) {
    /* ignore */
  }
}

/** Drop every key this app owns. Used by "Reset demo data". */
export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORE))
      .forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    /* ignore */
  }
}

export function sessionGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function sessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    /* ignore */
  }
}

export function sessionRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
}
