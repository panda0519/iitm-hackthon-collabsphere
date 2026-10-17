// Tailwind theme extension lifted from the original inline `tailwind.config`.
// Colours are CSS variables (see src/styles/tokens.css) so a theme swap is one
// attribute on <html>.

export default {
  fontFamily: {
    sans: [
      '"Figtree"',
      '"Noto Sans JP"',
      "system-ui",
      "-apple-system",
      '"Segoe UI"',
      '"Hiragino Sans"',
      '"Yu Gothic"',
      '"Microsoft YaHei"',
      "sans-serif"
    ],
    display: [
      '"Figtree"',
      '"Figtree"',
      '"Noto Sans JP"',
      "system-ui",
      '"Hiragino Sans"',
      '"Yu Gothic"',
      '"Microsoft YaHei"',
      "sans-serif"
    ],
    mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
  },
  colors: {
    bg: "rgb(var(--bg) / <alpha-value>)",
    s1: "rgb(var(--s1) / <alpha-value>)",
    s2: "rgb(var(--s2) / <alpha-value>)",
    line: "rgb(var(--line) / <alpha-value>)",
    tx: "rgb(var(--tx) / <alpha-value>)",
    mu: "rgb(var(--mu) / <alpha-value>)",
    pri: "rgb(var(--pri) / <alpha-value>)",
    pritx: "rgb(var(--pritx) / <alpha-value>)",
    priink: "rgb(var(--priink) / <alpha-value>)",
    ok: "rgb(var(--ok) / <alpha-value>)",
    bad: "rgb(var(--bad) / <alpha-value>)",
    info: "rgb(var(--info) / <alpha-value>)"
  }
};
