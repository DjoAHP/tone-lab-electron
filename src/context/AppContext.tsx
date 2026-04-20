// src/context/AppContext.tsx
// Le Context est un "bus de données" qui traverse toute l'application

import React, { createContext, useContext } from "react";
import { useAppStore } from "../store/useAppStore";

// On crée le type du context à partir de ce que retourne useAppStore
type AppContextType = ReturnType<typeof useAppStore>;

// createContext crée le "bus" - undefined par défaut
const AppContext = createContext<AppContextType | undefined>(undefined);

// AppProvider est un composant "enveloppe" qui fournit les données à ses enfants
export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useAppStore(); // On crée le store une seule fois ici

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

// useApp est le hook que tous les composants utiliseront pour accéder aux données
// Ex: const { projet, ajouterEntree } = useApp();
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    // Cette erreur ne devrait jamais apparaître si AppProvider est bien en place
    throw new Error("useApp doit être utilisé à l'intérieur de AppProvider");
  }
  return context;
}
