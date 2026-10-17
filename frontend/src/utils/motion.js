// Motion preference, read fresh each time (the user can change it mid-session).
export const prefersReducedMotion = () =>
  !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
