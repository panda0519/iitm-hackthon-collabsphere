// Entry point. Styles first (Tailwind base + the app's layers), then the ambient
// scripts (lighting, backdrop, hero headline, intro overlay) which set up globals
// and window.__csGate. The React app mounts only after the intro resolves.
import "./styles/tokens.css";
import "./styles/index.css";
import "./styles/effects.css";
import "./styles/map.css";

import "./legacy/lighting.js";
import "./legacy/backdrop.js";
import "./legacy/heroWriter.js";
import "./legacy/intro.js";

import { createRoot } from "react-dom/client";
import { AppProvider } from "./state/AppContext.jsx";
import { App } from "./App.jsx";

Promise.resolve(window.__csGate).then(() => {
  createRoot(document.getElementById("root")).render(
    <AppProvider>
      <App />
    </AppProvider>
  );
});
