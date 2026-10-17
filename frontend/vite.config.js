import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";

const CDN = "https://cdnjs.cloudflare.com";
const FONTS_CSS = "https://fonts.googleapis.com";
const FONTS_FILES = "https://fonts.gstatic.com";
// Static hosts the app loads images/tiles from (map tiles, three.js earth textures).
const IMG_HOSTS = [
  CDN,
  "https://cdn.jsdelivr.net",
  "https://threejs.org",
  "https://server.arcgisonline.com",
  "https://tile.openstreetmap.org"
];

/**
 * Build a Content-Security-Policy for the production HTML.
 *
 * Inline <script> blocks (the pre-paint theme snippet and the splash timeout) are
 * allow-listed by hash, so no blanket 'unsafe-inline' is needed for scripts. Styles
 * still need 'unsafe-inline' because React writes inline style attributes and Leaflet
 * styles its own DOM. The policy is only injected into the build output; the dev
 * server is left open so HMR keeps working.
 */
function buildCsp(html, apiOrigin) {
  const hashes = [];
  const inline = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = inline.exec(html))) {
    const body = m[1];
    if (!body.trim()) continue;
    hashes.push(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  const connect = ["'self'", ...IMG_HOSTS.slice(3), apiOrigin].filter(Boolean).join(" ");
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src 'self' ${CDN} ${hashes.join(" ")}`.trim(),
    `style-src 'self' 'unsafe-inline' ${CDN} ${FONTS_CSS}`,
    `font-src 'self' ${FONTS_FILES} data:`,
    `img-src 'self' data: blob: ${IMG_HOSTS.join(" ")}`,
    `connect-src ${connect}`,
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "manifest-src 'self'"
  ].join("; ");
}

function cspPlugin(apiOrigin) {
  return {
    name: "collabsphere-csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const csp = buildCsp(html, apiOrigin);
        return html.replace(/<head>/i, `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`);
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiOrigin = env.VITE_API_BASE_URL ? new URL(env.VITE_API_BASE_URL).origin : "";
  return {
    plugins: [react(), cspPlugin(apiOrigin)],
    server: {
      port: 5173,
      open: false,
      // Dev serves the same origin as the built app: /api is proxied to the Express API.
      proxy: {
        "/api": { target: env.VITE_API_PROXY || "http://localhost:4000", changeOrigin: true }
      }
    },
    // `npm run preview` serves the built app; proxy /api the same way so the CSP-injected
    // bundle can be exercised against the real backend.
    preview: {
      port: 4173,
      proxy: {
        "/api": { target: env.VITE_API_PROXY || "http://localhost:4000", changeOrigin: true }
      }
    },
    build: {
      outDir: "dist",
      sourcemap: true
    }
  };
});
