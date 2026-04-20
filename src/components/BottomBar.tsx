// src/components/BottomBar.tsx
// Barre d'outils en bas — icônes multi-couleurs, fond actif pleine hauteur

import { useApp } from "../context/AppContext";
import StackIcon from "../assets/icons/Bottombar/stack-tool.svg?react";
import MetroIcon from "../assets/icons/Bottombar/metro-tool.svg?react";
import LogoIcon from "../assets/icons/Menubar/logo.svg?react";



import React from "react";

// ─── Définition des outils ────────────────────────────────────
// Chaque outil a : id (= ongletActif), label, icône
const OUTILS: {
  id: "stack" | "metro";
  label: string;
  icone: React.ReactNode;
}[] = [
  {
    id: "stack",
    label: "Stack",
    icone: (
      <StackIcon
        width="40"
        height="40"
        style={{ color: "hsl(var(--tl-accent-princ))" }}
      />
    ),
  },
  {
    id: "metro",
    label: "Metro",
    icone: (
      <MetroIcon
        width="35"
        height="35"
        style={{ color: "hsl(var(--tl-accent-princ))" }}
      />
    ),
  },
];

// ─── Largeur du fond actif de chaque côté de l'icône ─────────
const PADDING_FOND_ACTIF = 30; // px

// ─────────────────────────────────────────────────────────────
export function BottomBar() {
  const {
    sidebarOuverte,
    toggleSidebar,
    ongletActif,
    setOngletActif,
    setVueActive,
  } = useApp();

  function handleOutil(id: "stack" | "metro") {
    setOngletActif(id);
    // "stack" conserve la vueActive courante (home ou stack)
    // "metro" force une vue dédiée
    if (id === "metro") setVueActive("metro");
    // Si on revient sur Stack, on repasse en "home" par défaut
    // (sauf si une entrée est déjà sélectionnée — géré dans SoundResearchTool)
    if (id === "stack") setVueActive("home");
  }

  return (
    <div
      className="flex items-center flex-shrink-0"
      style={{
        height: "72px",
        background: "hsl(222, 25%, 8%)",
        borderTop: "1px solid hsl(220, 15%, 14%)",
      }}
    >
      {/* ── Bouton toggle sidebar (gauche) ── */}
      <div className="flex items-center h-full px-3">
        <button
          onClick={toggleSidebar}
          title={sidebarOuverte ? "Masquer la sidebar" : "Afficher la sidebar"}
          className="flex items-center justify-center w-7 h-7 rounded transition-colors"
          style={{
            color: sidebarOuverte
              ? "hsl(var(--tl-accent-princ))"
              : "hsl(220, 15%, 40%)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect
              x="0"
              y="0"
              width="5"
              height="14"
              rx="1"
              opacity={sidebarOuverte ? "1" : "0.4"}
            />
            <rect x="7" y="0" width="7" height="2" rx="1" />
            <rect x="7" y="4" width="7" height="2" rx="1" />
            <rect x="7" y="8" width="7" height="2" rx="1" />
            <rect x="7" y="12" width="7" height="2" rx="1" />
          </svg>
        </button>
      </div>

      {/* ── Zone outils (centre) ── */}
      <div className="flex items-center h-full flex-1 justify-center">
        {OUTILS.map((outil) => {
          const estActif = ongletActif === outil.id;

          return (
            <button
              key={outil.id}
              title={outil.label}
              onClick={() => handleOutil(outil.id)}
              className="flex items-center justify-center h-full transition-all duration-150"
              style={{
                paddingLeft: `${PADDING_FOND_ACTIF}px`,
                paddingRight: `${PADDING_FOND_ACTIF}px`,
                background: estActif ? "hsl(222, 25%, 14%)" : "transparent",
                border: "none",
                borderRadius: "0",
                // Trait de soulignement haut pour l'outil actif
                borderTop: estActif
                  ? "2px solid hsl(var(--tl-accent-princ))"
                  : "2px solid transparent",
                filter: estActif ? "none" : "grayscale(1) opacity(0.4)",
              }}
              onMouseEnter={(e) => {
                if (!estActif) {
                  (e.currentTarget as HTMLButtonElement).style.filter =
                    "grayscale(0.5) opacity(0.7)";
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "hsl(222, 25%, 11%)";
                }
              }}
              onMouseLeave={(e) => {
                if (!estActif) {
                  (e.currentTarget as HTMLButtonElement).style.filter =
                    "grayscale(1) opacity(0.4)";
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }
              }}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                {/* Icône */}
                <div style={{ transform: "translateY(-4px)" }}>
                  {outil.icone}
                </div>
                {/* Label */}
                <span
                  className="text-[11px]"
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    color: estActif
                      ? "hsl(var(--tl-accent-princ))"
                      : "hsl(220, 15%, 65%)",
                    transform: "translateY(-2px)",
                  }}
                >
                  {outil.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Version (droite) ── */}
      <div className="flex items-center h-full px-3 gap-1">
        <LogoIcon
          width="14"
          height="14"
          style={{
            color: "hsl(220, 15%, 30%)",
            flexShrink: 0,
          }}
        />
        <span className="text-[11px]" style={{ color: "hsl(220, 15%, 30%)" }}>
          ToneLab v1.0.5
        </span>
      </div>
    </div>
  );
}
