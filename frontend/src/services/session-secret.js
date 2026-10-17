// Offline-mode check-in secret. The server keeps its own secret; when the app runs
// without the API it mints a random secret per browser session instead, so no secret
// is ever baked into the bundle.

const KEY = "collabsphere_v3_totp_secret";
let cached = null;

export function localTotpSecret() {
  if (cached) return cached;
  try {
    cached = sessionStorage.getItem(KEY);
  } catch {
    /* storage blocked */
  }
  if (!cached) {
    let hex = "";
    try {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    } catch {
      hex = String(Date.now()) + Math.random().toString(16).slice(2);
    }
    cached = hex;
    try {
      sessionStorage.setItem(KEY, cached);
    } catch {
      /* storage blocked */
    }
  }
  return cached;
}
