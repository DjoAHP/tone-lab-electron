// src/App.tsx

import { useState } from "react";
import { MenuBar } from "./components/MenuBar";
import { Sidebar } from "./components/Sidebar";
import { SoundResearchTool } from "./components/SoundResearchTool";
import { Metronome } from "./components/Metronome";
import { BottomBar } from "./components/BottomBar";
import { NewStackModal } from "./components/NewStackModal";
import { useApp } from "./context/AppContext";

function AppInner() {
  const [modalSousStackOuverte, setModalSousStackOuverte] = useState(false);
  const [stackIdCible, setStackIdCible] = useState<string | null>(null);
  const { projet, stackSelectionne, ongletActif } = useApp();

  function handleOuvrirModalStack(stackId?: string) {
    const id = stackId ?? stackSelectionne ?? projet?.stacks[0]?.id ?? null;
    setStackIdCible(id);
    setModalSousStackOuverte(true);
  }

  return (
    <div
      className="dark h-screen flex flex-col overflow-hidden"
      style={{ background: "hsl(222, 25%, 8%)" }}
    >
      <MenuBar />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar visible uniquement sur l'outil Stack */}
        {ongletActif === "stack" && (
          <Sidebar onOuvrirModalStack={handleOuvrirModalStack} />
        )}

        <main
          className="flex-1 flex min-w-0"
          style={{ background: "hsl(222, 22%, 9%)" }}
        >
          {ongletActif === "metro" ? <Metronome /> : <SoundResearchTool />}
        </main>
      </div>

      <BottomBar />

      {modalSousStackOuverte && stackIdCible && (
        <NewStackModal
          stackId={stackIdCible}
          onFermer={() => setModalSousStackOuverte(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return <AppInner />;
}
