// src/components/BottomBar.tsx
// Barre d'outils en bas — icônes multi-couleurs, fond actif pleine hauteur

import { useApp } from "../context/AppContext";
import StackIcon from "../assets/icons/Bottombar/stack-tool.svg?react";
import MetroIcon from "../assets/icons/Bottombar/metro-tool.svg?react";
import DiapaIcon from "../assets/icons/Bottombar/diapa-tool.svg?react";
import SetlistIcon from "../assets/icons/Bottombar/setlist-tool.svg?react";
import ChronoIcon from "../assets/icons/Bottombar/chrono-tool.svg?react";
import DocvIcon from "../assets/icons/Bottombar/docv-tool.svg?react";
import LogoIcon from "../assets/icons/Menubar/logo.svg?react";
import type { SubdivisionType } from "../types";

import React from "react";
import { APP_VERSION } from "@/version";

// ─── Définition des outils ──────────────────────────────────
// Chaque outil a : id (= ongletActif), label, icône
const OUTILS: {
  id: "stack" | "metro" | "diapa" | "setlist" | "chrono" | "docv";
  label: string;
  icone: React.ReactNode;
}[] = [
  {
    id: "diapa",
    label: "Diapa",
    icone: (
      <DiapaIcon
        width="35"
        height="35"
        style={{ color: "hsl(var(--tl-accent-princ))" }}
      />
    ),
  },
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
  {
    id: "setlist",
    label: "Setlist",
    icone: (
      <SetlistIcon
        width="35"
        height="35"
        style={{ color: "hsl(var(--tl-accent-princ))" }}
      />
    ),
  },
  {
    id: "chrono",
    label: "Chrono",
    icone: (
      <ChronoIcon
        width="35"
        height="35"
        style={{ color: "hsl(var(--tl-accent-princ))" }}
      />
    ),
  },
  {
    id: "docv",
    label: "DocV",
    icone: (
      <DocvIcon
        width="35"
        height="35"
        style={{ color: "hsl(var(--tl-accent-princ))" }}
      />
    ),
  },
];

// ─── Largeur du fond actif de chaque côté de l'icône ─────────
const PADDING_FOND_ACTIF = 30; // px

// ────────────────────────────────────────────────────────────
export function BottomBar() {
  const {
    sidebarOuverte,
    toggleSidebar,
    toggleSetlistSidebar,
    setlistSidebarOuverte,
    docvSidebarOuverte,
    toggleDocvSidebar,
    ongletActif,
    setOngletActif,
    setVueActive,
    isMetronomePlaying,
    metronomeBpm,
    isChronoRunning,
    chronoElapsedMs,
  } = useApp();

  function handleOutil(id: "stack" | "metro" | "diapa" | "setlist" | "chrono" | "docv") {
    setOngletActif(id);

    // Vue active
    if (id === "metro") setVueActive("metro");
    else if (id === "stack") setVueActive("home");
    else if (id === "diapa") setVueActive("diapa");
    else if (id === "setlist") setVueActive("setlist");
    else if (id === "chrono") setVueActive("chrono");
    else if (id === "docv") setVueActive("docv");

    // Gestion des sidebars : utiliser requestAnimationFrame pour laisser React mettre à jour
    requestAnimationFrame(() => {
      if (id === "setlist") {
        if (!setlistSidebarOuverte) toggleSetlistSidebar();
        if (sidebarOuverte) toggleSidebar();
      } else if (id === "stack") {
        if (!sidebarOuverte) toggleSidebar();
        if (setlistSidebarOuverte) toggleSetlistSidebar();
      } else if (id === "docv") {
        if (!docvSidebarOuverte) toggleDocvSidebar();
        if (sidebarOuverte) toggleSidebar();
      } else {
        // chrono, diapa, metro : pas de sidebar → tout fermer
        if (sidebarOuverte) toggleSidebar();
        if (setlistSidebarOuverte) toggleSetlistSidebar();
        if (docvSidebarOuverte) toggleDocvSidebar();
      }
    });
  }

  // Supprimer l'useEffect de gestion des sidebars (déplacé dans handleOutil avec requestAnimationFrame)

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
        {ongletActif === "setlist" ? (
          <button
            onClick={toggleSetlistSidebar}
            title={setlistSidebarOuverte ? "Masquer la sidebar" : "Afficher la sidebar"}
            className="flex items-center justify-center w-7 h-7 rounded transition-colors"
            style={{
              color: setlistSidebarOuverte
                ? "hsl(var(--tl-accent-princ))"
                : "hsl(220, 15%, 40%)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="0" width="5" height="14" rx="1" opacity={setlistSidebarOuverte ? "1" : "0.4"} />
              <rect x="7" y="0" width="7" height="2" rx="1" />
              <rect x="7" y="4" width="7" height="2" rx="1" />
              <rect x="7" y="8" width="7" height="2" rx="1" />
              <rect x="7" y="12" width="7" height="2" rx="1" />
            </svg>
          </button>
        ) : ongletActif === "diapa" || ongletActif === "metro" || ongletActif === "chrono" ? (
          // Icône grisée pour Diapa/Metro (pas de sidebar)
          <div
            title="Aucune sidebar disponible"
            className="flex items-center justify-center w-7 h-7 rounded"
            style={{ color: "hsl(220, 10%, 30%)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="0" width="5" height="14" rx="2" opacity="0.3" />
              <rect x="7" y="0" width="7" height="2" rx="1" opacity="0.3" />
              <rect x="7" y="4" width="7" height="2" rx="1" opacity="0.3" />
              <rect x="7" y="8" width="7" height="2" rx="1" opacity="0.3" />
              <rect x="7" y="12" width="7" height="2" rx="1" opacity="0.3" />
            </svg>
          </div>
        ) : ongletActif === "docv" ? (
          <button
            onClick={toggleDocvSidebar}
            title={docvSidebarOuverte ? "Masquer la sidebar" : "Afficher la sidebar"}
            className="flex items-center justify-center w-7 h-7 rounded transition-colors"
            style={{
              color: docvSidebarOuverte
                ? "hsl(var(--tl-accent-princ))"
                : "hsl(220, 15%, 40%)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="0" width="5" height="14" rx="1" opacity={docvSidebarOuverte ? "1" : "0.4"} />
              <rect x="7" y="0" width="7" height="2" rx="1" />
              <rect x="7" y="4" width="7" height="2" rx="1" />
              <rect x="7" y="8" width="7" height="2" rx="1" />
              <rect x="7" y="12" width="7" height="2" rx="1" />
            </svg>
          </button>
        ) : (
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
              <rect x="0" y="0" width="5" height="14" rx="1" opacity={sidebarOuverte ? "1" : "0.4"} />
              <rect x="7" y="0" width="7" height="2" rx="1" />
              <rect x="7" y="4" width="7" height="2" rx="1" />
              <rect x="7" y="8" width="7" height="2" rx="1" />
              <rect x="7" y="12" width="7" height="2" rx="1" />
            </svg>
          </button>
        )}
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
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center justify-center h-full transition-all duration-150"
              style={{
                paddingLeft: `${PADDING_FOND_ACTIF}px`,
                paddingRight: `${PADDING_FOND_ACTIF}px`,
                background: estActif ? "hsl(222, 25%, 14%)" : "transparent",
                border: "none",
                borderRadius: "0",
                borderTop: estActif
                  ? "2px solid hsl(var(--tl-accent-princ))"
                  : "2px solid transparent",
                filter: estActif ? "none" : "grayscale(1) opacity(0.4)",
                outline: "none",
                position: "relative",
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
                <div style={{ transform: "translateY(-4px)", position: "relative" }}>
                  {outil.icone}
                  {/* Indicateur Metronome */}
                  {outil.id === "metro" && isMetronomePlaying && (
                    <div
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#22c55e",
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                  )}
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
              {/* Indicateur Chrono — dans le coin supérieur droit de l'onglet */}
              {outil.id === "chrono" && isChronoRunning && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    fontSize: "9px",
                    color: "#4ade80",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    padding: "1px 3px 0 0",
                  }}
                >
                  {`${Math.floor(chronoElapsedMs / 60000).toString().padStart(2, '0')}:${Math.floor((chronoElapsedMs / 1000) % 60).toString().padStart(2, '0')}`}
                </div>
              )}
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
            color: "hsl(var(--tl-accent-princ))",
          }}
        />
        <span className="text-[11px]" style={{ color: "hsl(220, 15%, 30%)" }}>
          ToneLab v{APP_VERSION}
        </span>
      </div>
    </div>
  );
}
