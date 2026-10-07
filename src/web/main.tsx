import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "./style.css";
import "./inbox.css";
import "./congress.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // La aplicación sigue disponible en línea cuando el navegador no admite SW.
    });
  });
}

import './ui/game.css';
