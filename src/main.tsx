import { Tooltip } from "@base-ui/react/tooltip";
import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import { applyTheme, readTheme } from "./theme.ts";
import "@fontsource/special-elite/latin-400.css";
import "@fontsource/oswald/latin-500.css";
import { App } from "./App.tsx";
import "./styles.css";

applyTheme(readTheme());

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Tooltip.Provider delay={350} closeDelay={100}>
      <App />
    </Tooltip.Provider>
  </React.StrictMode>,
);

import "./learning.css";
import "./themes.css";
import "./appearance.css";
