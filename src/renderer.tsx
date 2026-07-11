// src/main.tsx
// Point d'entrée de l'application

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { HelpWindow } from "./components/HelpWindow";
import "./index.css";

// Détecte si le renderer est chargé dans la fenêtre d'aide séparée
// (URL du type index.html?win=help&tool=stack)
const params = new URLSearchParams(window.location.search);
const isHelpWindow = params.get("win") === "help";
const helpTool = params.get("tool") === "setlist" ? "setlist" : "stack";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isHelpWindow ? (
      // Fenêtre d'aide : contenu autonome, sans le shell principal
      <HelpWindow tool={helpTool} />
    ) : (
      // App principale
      <AppProvider>
        <App></App>
      </AppProvider>
    )}
  </React.StrictMode>,
);