import { useState, useRef, useEffect } from "react";
import { ChronoLedDisplay } from "./led-display/ChronoLedDisplay";
import type { SVGProps } from "react";
import { useApp } from "../context/AppContext";
import SetlistChronoIcon from "../assets/icons/Bottombar/setlist-chrono-tool.svg?react";
import ChronoVisuel from "../assets/icons/ChonoTool/chrono-visuel.svg?react";
import "./led-display/chrono-led.css";

// Overlay personnalisé pour le chronomètre (rectangulaire, masqué en cercle par le conteneur parent)
import LedOverlayChrono from "./led-display/assets/led-overlay-chrono.svg?react";
import chronoService from "../services/chronoService";

export function ChronoTool() {
  const { isChronoRunning, chronoElapsedMs } = useApp();
  const [display, setDisplay] = useState({ minutes: 0, seconds: 0 });
  const [modalOuverte, setModalOuverte] = useState(false);
  const { projet, updateSetlistSong } = useApp();

  // Sync with chronoService
  useEffect(() => {
    const listener = (state: any) => {
      setDisplay(state.display);
    };

    chronoService.onUpdate(listener);

    return () => {
      chronoService.offUpdate(listener);
      // DO NOT stop the service on unmount
    };
  }, []);

  // Raccourci Espace pour démarrer/arrêter le chrono
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (isChronoRunning) {
          chronoService.stop();
        } else {
          chronoService.start();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isChronoRunning]);

  // ESC pour fermer la modal
  useEffect(() => {
    if (!modalOuverte) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOuverte(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalOuverte]);

  const buttonStyle = {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "1px solid",
    color: "hsl(var(--tl-accent-princ))",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Poppins, sans-serif",
    transition: "all 200ms ease-out",
  };

  return (
    <div style={{ height: "100%", overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "600px" }}>
        {/* CONTENEUR RELATIF POUR ARRIÈRE-PLAN */}
        <div style={{
          position: "relative",
        }}>
          {/* Visuel en arrière-plan */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", color: "hsl(var(--tl-accent-princ))" }}>
            <ChronoVisuel style={{ width: "85%", height: "85%", opacity: 0.15, marginTop: "-135px" }} />
          </div>

          {/* Contenu au-dessus */}
          <div style={{ position: "relative", zIndex: 10, paddingTop: "60px" }}>

            {/* Chronomètre au centre - CERCLE UNIQUEMENT POUR CHRONO */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "50px" }}>
              <div style={{
                width: "320px",
                height: "320px",
                borderRadius: "50%",
                border: "3px solid hsl(220, 15%, 25%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "hsl(222, 20%, 10%)",
                boxShadow: "0 0 60px rgba(29, 113, 149, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.3)",
                overflow: "hidden",
              }}>
                <ChronoLedDisplay
                  minutes={display.minutes}
                  seconds={display.seconds}
                  overlay={LedOverlayChrono}
                  className="chrono-led"
                />
              </div>
            </div>

          {/* Indication clavier */}
          <div style={{ textAlign: "center", color: "hsl(220, 15%, 40%)", fontSize: "12px", marginBottom: "16px", marginTop: "20px" }}>
            Barre espace : Démarrer / Arrêter
          </div>

          {/* Boutons de contrôle centrés */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            {!isChronoRunning ? (
              <button onClick={() => chronoService.start()} style={{ ...buttonStyle, background: "hsl(var(--tl-accent-button))", borderColor: "hsl(var(--tl-accent-button-border))" }}>
                ▶ Start
              </button>
            ) : (
              <button onClick={() => chronoService.stop()} style={{ ...buttonStyle, background: "hsl(0, 60%, 35%)", borderColor: "hsl(0, 60%, 45%)" }}>
                ⏸ Stop
              </button>
            )}
            <button onClick={() => chronoService.reset()} style={{ ...buttonStyle, background: "hsl(220, 15%, 20%)", borderColor: "hsl(220, 15%, 30%)" }}>
              ↺ Reset
            </button>

            {/* Bouton Setlist pour transferer le temps */}
            <button
              onClick={() => setModalOuverte(true)}
              disabled={isChronoRunning || chronoElapsedMs === 0 || !projet?.setlistSongs?.length}
              title={
                isChronoRunning
                  ? "Arrêtez le chronomètre d'abord"
                  : chronoElapsedMs === 0
                  ? "Aucun temps mesuré"
                  : !projet?.setlistSongs?.length
                  ? "Aucun morceau dans la setlist"
                  : "Transférer le temps vers la setlist"
              }
              style={{
                ...buttonStyle,
                background: (isChronoRunning || chronoElapsedMs === 0 || !projet?.setlistSongs?.length)
                  ? "hsl(220, 15%, 16%)"
                  : "hsl(var(--tl-accent-button))",
                borderColor: "hsl(220, 15%, 25%)",
                color: "hsl(var(--tl-accent-princ))",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                cursor: (isChronoRunning || chronoElapsedMs === 0 || !projet?.setlistSongs?.length)
                  ? "not-allowed"
                  : "pointer",
                opacity: (isChronoRunning || chronoElapsedMs === 0 || !projet?.setlistSongs?.length)
                  ? 0.5
                  : 1,
              }}
            >
              <SetlistChronoIcon width="16" height="16" />
              <span style={{ fontSize: "12px" }}>Setlist</span>
            </button>
          </div>
        </div>
        </div>

        {/* Modal de transfert vers Setlist */}
        {modalOuverte && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(10, 12, 20, 0.82)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOuverte(false);
            }}
          >
            <div
              className="relative flex flex-col rounded-xl shadow-2xl"
              style={{
                width: "480px",
                maxHeight: "80vh",
                background: "hsl(222, 22%, 12%)",
                border: "1px solid hsl(220, 15%, 22%)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid hsl(220, 15%, 18%)" }}
              >
                <h2
                  className="text-base font-semibold"
                  style={{ color: "hsl(210, 30%, 90%)" }}
                >
                  Transférer le temps vers...
                </h2>
                <button
                  onClick={() => setModalOuverte(false)}
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ color: "hsl(220, 15%, 45%)" }}
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

              {/* Temps actuel mesuré */}
              <div
                style={{
                  padding: "12px 24px",
                  background: "hsl(222, 18%, 14%)",
                  borderBottom: "1px solid hsl(220, 15%, 18%)",
                }}
              >
                <span style={{ fontSize: "11px", color: "hsl(220, 15%, 50%)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Temps mesuré :&nbsp;
                </span>
                <span style={{ fontSize: "14px", color: "hsl(var(--tl-accent-princ))", fontFamily: "monospace" }}>
                  {`${Math.floor(Math.floor(chronoElapsedMs / 1000) / 60).toString().padStart(2, '0')}:${(Math.floor(chronoElapsedMs / 1000) % 60).toString().padStart(2, '0')}`}
                </span>
              </div>

              {/* Liste des morceaux */}
              <div className="overflow-y-auto flex-1 px-4 py-3" style={{ minHeight: "200px" }}>
                {projet?.setlistSongs && projet.setlistSongs.length > 0 ? (
                  [...projet.setlistSongs]
                    .sort((a, b) => a.position - b.position)
                    .map((song) => (
                      <div
                        key={song.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          marginBottom: "4px",
                          background: "transparent",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = "hsl(220, 15%, 16%)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = "transparent";
                        }}
                      >
                        {/* Titre */}
                        <span
                          style={{
                            flex: 1,
                            fontSize: "13px",
                            color: "hsl(210, 30%, 85%)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {song.title}
                        </span>

                        {/* Durée actuelle */}
                        <span
                          style={{
                            fontSize: "12px",
                            fontFamily: "monospace",
                            color: song.time ? "hsl(220, 15%, 55%)" : "hsl(220, 15%, 35%)",
                            minWidth: "50px",
                            textAlign: "right",
                          }}
                        >
                          {song.time ? `${Math.floor(song.time / 60).toString().padStart(2, '0')}:${(song.time % 60).toString().padStart(2, '0')}` : "Non définie"}
                        </span>

                        {/* Bouton valider */}
                        <button
                          onClick={() => {
                            const newTime = Math.floor(chronoElapsedMs / 1000);
                            updateSetlistSong(song.id, { time: newTime });
                            setModalOuverte(false);
                          }}
                          title="Transférer ce temps"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            border: "1px solid hsl(220, 15%, 25%)",
                            background: "hsl(var(--tl-accent-button))",
                            color: "hsl(var(--tl-accent-text))",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--tl-accent-border))";
                            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(220, 15%, 25%)";
                            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2 7 5.5 10.5 12 3.5" />
                          </svg>
                        </button>
                      </div>
                    ))
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "150px",
                      color: "hsl(220, 15%, 45%)",
                      fontSize: "13px",
                      fontStyle: "italic",
                    }}
                  >
                    Ajoutez des morceaux via le panneau de gauche
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "10px 24px",
                  borderTop: "1px solid hsl(220, 15%, 18%)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "11px", color: "hsl(220, 15%, 35%)" }}>
                  ESC pour fermer
                </span>
                <button
                  onClick={() => setModalOuverte(false)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "6px",
                    border: "1px solid hsl(220, 15%, 24%)",
                    background: "hsl(222, 18%, 18%)",
                    color: "hsl(220, 15%, 60%)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
