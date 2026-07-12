// src/App.tsx

import { useState } from "react";
import { MenuBar } from "./components/MenuBar";
import { Sidebar } from "./components/Sidebar";
import { SetlistSidebar } from "./components/SetlistSidebar";
import { DocVSidebar } from "./components/DocVSidebar";
import { SoundResearchTool } from "./components/SoundResearchTool";
import { Metronome } from "./components/Metronome";
import { DiapaTool } from "./components/DiapaTool";
import { SetlistTool } from "./components/SetlistTool";
import { ChronoTool } from "./components/ChronoTool";
import { DocVTool } from "./components/DocVTool";
import { DocVAudioSidebar } from "./components/DocVAudioSidebar";
import { BottomBar } from "./components/BottomBar";
import { NewTitreModal } from "./components/NewTitreModal";
import { useApp } from "./context/AppContext";

function AppInner() {
  const [modalTitreOuverte, setModalTitreOuverte] = useState(false);
  const [albumIdCible, setAlbumIdCible] = useState<string | null>(null);
  const { projet, ongletActif, setlistSidebarOuverte, docvSidebarOuverte } = useApp();

  function handleOuvrirModalTitre(albumId?: string) {
    setAlbumIdCible(albumId ?? null);
    setModalTitreOuverte(true);
  }

  return (
    <div
      className="dark h-screen flex flex-col overflow-hidden"
      style={{ background: "hsl(222, 25%, 8%)" }}
    >
      <MenuBar />

      <div className="flex flex-1 min-h-0">
        {/* GAUCHE : Sidebar Stack (outil Stack) */}
        {ongletActif === "stack" && (
          <Sidebar onOuvrirModalTitre={handleOuvrirModalTitre} />
        )}

        {/* GAUCHE : Sidebar Setlist (outil Setlist) */}
        {ongletActif === "setlist" && setlistSidebarOuverte && <SetlistSidebar />}

        {/* GAUCHE : Sidebar fichiers DocV (outil DocV) */}
        {ongletActif === "docv" && docvSidebarOuverte && <DocVSidebar />}

        {/* CENTRE : Zone principale */}
        <main
          className="flex-1 flex min-w-0 setlist-full-height"
          style={{ background: "hsl(222, 22%, 9%)", position: "relative" }}
        >
          {/* Metronome toujours monté pour continuer le son quand on change d'outil */}
          <div style={{ display: ongletActif === "metro" ? "block" : "none", width: "100%", height: "100%" }}>
            <Metronome />
          </div>
          {ongletActif === "diapa" && projet && <DiapaTool />}
          {ongletActif === "setlist" && projet && <SetlistTool />}
          {ongletActif === "chrono" && projet && <ChronoTool />}
          {ongletActif === "docv" && projet && <DocVTool />}
          {ongletActif === "stack" && projet && <SoundResearchTool />}
        </main>

        {/* DROITE : Sidebar lecteur audio YouTube (uniquement DocV) */}
        {ongletActif === "docv" && <DocVAudioSidebar />}
      </div>

      <BottomBar />

      {modalTitreOuverte && albumIdCible && (
        <NewTitreModal
          albumId={albumIdCible}
          onFermer={() => setModalTitreOuverte(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return <AppInner />;
}
