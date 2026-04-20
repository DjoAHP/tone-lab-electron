// src/main.tsx
// Point d'entrée de l'application

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* AppProvider enveloppe toute l'app pour partager les données */}
    <AppProvider>
      <App></App>
    </AppProvider>
  </React.StrictMode>,
);