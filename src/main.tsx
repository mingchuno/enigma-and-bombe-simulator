import { Tooltip } from "@base-ui/react/tooltip";
import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/newsreader/latin-400.css";
import "@fontsource/newsreader/latin-400-italic.css";
import { App } from "./App.tsx";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Tooltip.Provider delay={350} closeDelay={100}>
      <App />
    </Tooltip.Provider>
  </React.StrictMode>,
);

import "./learning.css";
