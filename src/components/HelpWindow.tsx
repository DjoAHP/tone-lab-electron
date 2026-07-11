// src/components/HelpWindow.tsx
// Fenêtre d'aide séparée (chargée dans une BrowserWindow indépendante via
// index.html?win=help&tool=...). Présente un outil par étapes, sous forme
// d'onglets horizontaux, avec un lien vidéo en bas.

import React, { useState } from "react";

import SetlistChronoSvg from "../assets/icons/setlist-chrono.svg?react";

type HelpTool = "stack" | "setlist";

interface HelpStep {
  label: string; // Court libellé d'onglet (ex : "Étape 1")
  title: string; // Titre de l'étape
  body: string; // Explication (placeholder pour l'instant)
}

interface HelpData {
  toolName: string;
  subtitle: string;
  steps: HelpStep[];
  videoUrl: string;
}

// ── Contenu d'aide (texte placeholder, à affiner ensemble ensuite) ──
const HELP_CONTENT: Record<HelpTool, HelpData> = {
  stack: {
    toolName: "StackTool",
    subtitle: "Recherche et sauvegarde de tes réglages sonores par morceau",
    steps: [
      {
        label: "Étape 1",
        title: "Introduction",
        body:
          "Dans la barre de gauche, tu peux créer des :\n- \"Stack\" (nom d'artiste, projet de recherche musicale…).\n- Des \"sous-Stack\" (nom d'album, groupe d'instruments…).\n- Des \"sous/sous-Stack\" (nom d'un titre, ou ce qu'il vous plaira…).\n\nDans ces titres, c'est ici que tu indiques le résultat de tes recherches sous forme de carte informative via la galerie de plugins connectée, \"Home (plugins)\".",
      },
      {
        label: "Étape 2",
        title: "Créer un Stack",
        body:
          "- Double-clique sur \"Nouveau Stack\" dans la StackBar pour le renommer (ex : Jimi Hendrix).\n- Clique sur le petit \"+\" à droite du Stack pour créer un sous-Stack (ex : Axis: Bold as Love).\n- Clique encore sur le petit \"+\" à droite du sous-Stack pour créer le sous/sous-Stack (ex : Spanish Castle Magic).",
      },
      {
        label: "Étape 3",
        title: "Ajouter une recherche (sous/sous-Stack)",
        body:
          "- Clique sur le petit \"+\" à droite du sous/sous-Stack.\n↳ Une fenêtre de recherche s'ouvre.\n- Ajoute : Artiste, instruments, le plugin utilisé, des infos/réglages textuels, des notes, ou éventuellement importer une capture d'écran du plugin avec tes propres réglages.\n- Clique sur \"Sauvegarder\" : vous avez créé votre premier Stack de recherche musical, ce qui vous permet de répertorier vos propres réglages d'un plugin en particulier.\n- Vous pouvez modifier ou supprimer vos Stack.",
      },
    ],
    videoUrl: "https://www.youtube.com/watch?v=PLACEHOLDER_STACK",
  },
  setlist: {
    toolName: "SetlistTool",
    subtitle: "Compose et organise l'ordre de tes morceaux sur scène",
    steps: [
      {
        label: "Étape 1",
        title: "Ajout d'un nom de groupe",
        body:
          "- Clique sur le champ pour inscrire le nom du groupe.\n- Le nom s'inscrit automatiquement sur la setlist.",
      },
      {
        label: "Étape 2",
        title: "Ajout d'un titre",
        body:
          "- Clique sur le champ pour ajouter un titre.\n- Appui sur Entrée pour l'ajouter ou le bouton \"+\".",
      },
      {
        label: "Étape 3",
        title: "Ajout d'informations",
        body:
          "- Indique : Tonalité et Temps de jeux.\n(Cet outil est connecté à l'outil Chrono)",
      },
    ],
    videoUrl: "https://www.youtube.com/watch?v=PLACEHOLDER_SETLIST",
  },
};

interface HelpWindowProps {
  tool: HelpTool;
}

export function HelpWindow({ tool }: HelpWindowProps) {
  const data = HELP_CONTENT[tool];
  const [etapeActive, setEtapeActive] = useState(0);
  const etape = data.steps[etapeActive];

  function handleFermer() {
    // La fenêtre d'aide est autonome : on la ferme directement
    window.close();
  }

  function handleVideo() {
    if (window.electronAPI) {
      // Mode Electron : ouvre le navigateur système
      window.electronAPI.openExternal(data.videoUrl);
    } else {
      // Mode web / PWA : nouvel onglet navigateur
      window.open(data.videoUrl, "_blank", "noopener");
    }
  }

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{
        background: "hsl(222, 25%, 8%)",
        color: "hsl(210, 30%, 90%)",
        fontFamily: "'Geist Variable', system-ui, sans-serif",
      }}
    >
      {/* ── Barre de titre ── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid hsl(220, 15%, 16%)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              background: "hsl(var(--tl-accent-dim))",
              color: "hsl(var(--tl-accent-text))",
            }}
          >
            Aide
          </span>
          <h1 className="text-base font-semibold">{data.toolName}</h1>
        </div>
        <button
          onClick={handleFermer}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{ color: "hsl(220, 15%, 50%)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "hsl(210,30%,90%)";
            (e.currentTarget as HTMLButtonElement).style.background = "hsl(222,18%,18%)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "hsl(220,15%,50%)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
          title="Fermer la fenêtre d'aide"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M1 1l10 10M11 1L1 11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {tool === "setlist" && (
        <p
          className="px-5 pt-2 text-[11px] tracking-wide flex items-center gap-1.5"
          style={{ color: "hsl(220, 15%, 42%)" }}
        >
          Setlist
          <SetlistChronoSvg
            width={14}
            height={14}
            style={{ color: "hsl(220, 15%, 42%)" }}
          />
          Chrono
        </p>
      )}

      {/* ── Onglets (une étiquette par étape) ── */}
      <div
        className="flex items-stretch gap-1 px-5 pt-3 flex-shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid hsl(220, 15%, 16%)" }}
      >
        {data.steps.map((s, i) => {
          const actif = i === etapeActive;
          return (
            <button
              key={s.label}
              onClick={() => setEtapeActive(i)}
              className="px-4 py-2 text-sm rounded-t-lg transition-colors whitespace-nowrap"
              style={{
                background: actif ? "hsl(222, 22%, 13%)" : "transparent",
                color: actif ? "hsl(210, 30%, 92%)" : "hsl(220, 15%, 45%)",
                border: actif
                  ? "1px solid hsl(220, 15%, 22%)"
                  : "1px solid transparent",
                borderBottom: actif
                  ? "1px solid hsl(222, 22%, 13%)"
                  : "1px solid transparent",
                marginBottom: actif ? "-1px" : "0",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ── Bloc d'explication (presque plein écran, scrollable) ── */}
      <div className="flex-1 min-h-0 p-6">
        <div
          className="h-full rounded-xl flex flex-col overflow-hidden"
          style={{
            background: "hsl(222, 22%, 12%)",
            border: "1px solid hsl(220, 15%, 22%)",
          }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto px-8 py-7">
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "hsl(var(--tl-accent-terc))" }}
            >
              {etape.label} / {data.steps.length}
            </p>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: "hsl(210, 30%, 92%)" }}
            >
              {etape.title}
            </h2>
            <p
              className="text-sm leading-relaxed max-w-3xl"
              style={{ color: "hsl(215, 15%, 70%)", whiteSpace: "pre-line" }}
            >
              {etape.body}
            </p>

            <p
              className="text-sm leading-relaxed max-w-3xl mt-4"
              style={{ color: "hsl(220, 15%, 42%)" }}
            >
              {data.subtitle}
            </p>
          </div>

          {/* ── Pied de bloc : lien vidéo YouTube ── */}
          <div
            className="flex items-center justify-between px-8 py-4 flex-shrink-0"
            style={{ borderTop: "1px solid hsl(220, 15%, 18%)" }}
          >
            <span className="text-xs" style={{ color: "hsl(220, 15%, 45%)" }}>
              Besoin de plus de détails ? Regarde la vidéo explicative.
            </span>
            <button
              onClick={handleVideo}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: "hsl(var(--tl-accent-button))",
                color: "hsl(var(--tl-accent-text))",
                border: "1px solid hsl(var(--tl-accent-button-border))",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect
                  x="1"
                  y="2.5"
                  width="12"
                  height="9"
                  rx="2.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path d="M6 5l3 2-3 2V5z" fill="currentColor" />
              </svg>
              Voir la vidéo (YouTube)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
