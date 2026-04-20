// src/components/HomeButton.tsx

import { useApp } from "../context/AppContext";
import HomeIcon from "../assets/icons/Sidebar/home.svg?react";

export function HomeButton() {
  const { vueActive, setVueActive, selectionnerEntree } = useApp();
  const estActif = vueActive === "home";

  function handleClick() {
    selectionnerEntree(null);
    setVueActive("home");
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md transition-all duration-150"
      style={{
        background: estActif ? "hsl(222, 25%, 14%)" : "transparent",
        border: "none",
        filter: estActif ? "none" : "grayscale(1) opacity(0.45)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!estActif) {
          (e.currentTarget as HTMLButtonElement).style.filter =
            "grayscale(0.4) opacity(0.75)";
        }
      }}
      onMouseLeave={(e) => {
        if (!estActif) {
          (e.currentTarget as HTMLButtonElement).style.filter =
            "grayscale(1) opacity(0.45)";
        }
      }}
    >
      {/* ── Icône maison — REMPLACE ce bloc par ton SVG importé ── */}
      {/* Exemple quand ton SVG sera prêt :
          import HomeIcon from '../assets/icons/Sidebar/home.svg?react';
          <HomeIcon width="14" height="14" style={{ color: estActif ? 'hsl(var(--tl-accent-princ))' : 'hsl(220,15%,55%)' }} />
      */}

      <HomeIcon
        width="14"
        height="14"
        style={{
          color: estActif ? "hsl(var(--tl-accent-princ))" : "hsl(220,15%,55%)",
          flexShrink: 0,
        }}
      />

      {/* Label */}
      <span
        className="text-xs font-medium"
        style={{
          color: estActif ? "hsl(210, 30%, 90%)" : "hsl(215, 15%, 60%)",
          fontFamily: "Geist Variable, sans-serif",
        }}
      >
        Home (plugins)
      </span>
    </button>
  );
}
