// src/components/SetlistTool.tsx
// Outil Setlist - Affiche la feuille A4
// La feuille A4 s'adapte à l'espace disponible entre MenuBar et BottomBar

import { useApp } from "../context/AppContext";
import { useRef, useEffect, useState, useCallback } from "react";

export function SetlistTool() {
  const { projet } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 794, height: 1123 }); // A4 par défaut en px

  // Songs triées par position
  const songs = [...(projet?.setlistSongs ?? [])].sort(
    (a, b) => a.position - b.position
  );
  const songCount = songs.length;

  // Formater les secondes en mm:ss
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculer le temps total
  const tempsTotal = songs.reduce((acc, song) => acc + (song.time ?? 0), 0);

  // Calculer les dimensions pour que la feuille A4 rentre dans le conteneur
  const calculerDimensions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Ratio A4 (largeur/hauteur)
    const a4Ratio = 210 / 297; // ≈ 0.707

    // Espace disponible (avec padding)
    const paddingX = 32;
    const paddingY = 16;
    const espaceDispoLargeur = container.clientWidth - paddingX;
    const espaceDispoHauteur = container.clientHeight - paddingY;

    // Calculer les dimensions qui respectent le ratio A4
    let newWidth = espaceDispoLargeur;
    let newHeight = newWidth / a4Ratio;

    // Si la hauteur dépasse, on ajuste selon la hauteur
    if (newHeight > espaceDispoHauteur) {
      newHeight = espaceDispoHauteur;
      newWidth = newHeight * a4Ratio;
    }

    // Limiter à la taille réelle A4 en pixels (pour ne pas agrandir trop)
    const a4PxLargeur = 210 * 3.78;
    const a4PxHauteur = 297 * 3.78;
    if (newWidth > a4PxLargeur || newHeight > a4PxHauteur) {
      newWidth = a4PxLargeur;
      newHeight = a4PxHauteur;
    }

    // Minimum pour rester lisible
    const minWidth = 300;
    if (newWidth < minWidth) {
      const ratio = minWidth / newWidth;
      newWidth = minWidth;
      newHeight = newHeight * ratio;
    }

    setDimensions({ width: Math.floor(newWidth), height: Math.floor(newHeight) });
  }, []);

  // Observer les changements de taille du conteneur
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    calculerDimensions();

    const resizeObserver = new ResizeObserver(() => {
      calculerDimensions();
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [calculerDimensions]);

  return (
    <div
      ref={containerRef}
      className="setlist-content-area overflow-auto"
      style={{ background: "hsl(222, 22%, 9%)" }}
    >
      {/* Conteneur principal : centre la feuille A4 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          minHeight: 0,
          padding: "8px 16px",
        }}
      >
        {/* FEUILLE A4 - DIMENSIONS DYNAMIQUES */}
        <div
          className="setlist-a4-container"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            background: "white",
            borderRadius: "4px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            padding: `${Math.max(20, dimensions.height * 0.03)}px ${Math.max(30, dimensions.width * 0.06)}px`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Band Name */}
          <h1
            style={{
              textAlign: "center",
              fontSize: `${Math.max(24, dimensions.height * 0.04)}px`,
              fontWeight: "bold",
              color: "black",
              marginBottom: `${Math.max(10, dimensions.height * 0.015)}px`,
              fontFamily: "serif",
              flexShrink: 0,
            }}
          >
            {projet?.bandName || "Nom du groupe"}
          </h1>

          {/* Séparation stylisée */}
          <div
            style={{
              margin: `0 0 ${Math.max(10, dimensions.height * 0.015)}px 0`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                height: "2px",
                background: "black",
              }}
            />
          </div>

          {/* Nombre de morceaux */}
          <div
            style={{
              textAlign: "center",
              fontSize: `${Math.max(10, dimensions.height * 0.012)}px`,
              color: "#888",
              marginBottom: `${Math.max(10, dimensions.height * 0.015)}px`,
              flexShrink: 0,
            }}
          >
            {songCount} morceau{songCount > 1 ? "x" : ""}
          </div>

          {/* Liste des morceaux */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {songCount > 0 ? (
              songs.map((song) => (
                <div
                  key={song.id}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    borderBottom:
                      song.position < songCount ? "2px solid #ccc" : "none",
                    minHeight: 0,
                  }}
                >
                  {/* Tonalité (gauche) + Titre centré */}
                  <div style={{ position: "relative", width: "100%", textAlign: "center" }}>
                    {song.tonality !== undefined && (
                      <span
                        style={{
                          position: "absolute",
                          left: `${Math.max(10, dimensions.width * 0.02)}px`,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: `${Math.max(14, dimensions.height * 0.022)}px`,
                          color: "#666",
                          fontFamily: "monospace",
                          fontStyle: "italic",
                        }}
                      >
                        ({song.tonality})
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: `${Math.max(18, dimensions.height * 0.03)}px`,
                        color: "black",
                        fontWeight: "600",
                        textAlign: "center",
                        fontFamily: "sans-serif",
                        lineHeight: "1.2",
                      }}
                    >
                      {song.title}
                    </span>
                  </div>

                  {/* Durée à l'extrême droite */}
                  {song.time !== undefined && (
                    <span
                      style={{
                        position: "absolute",
                        right: `${Math.max(20, dimensions.width * 0.05)}px`,
                        fontSize: `${Math.max(12, dimensions.height * 0.02)}px`,
                        color: "#888",
                        fontFamily: "monospace",
                        flexShrink: 0,
                      }}
                    >
                      {formatTime(song.time)}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  fontSize: `${Math.max(14, dimensions.height * 0.015)}px`,
                  fontStyle: "italic",
                }}
              >
                Ajoutez des morceaux via le panneau de gauche
              </div>
            )}
          </div>

          {/* Temps total (discret en bas) */}
          {songCount > 0 && (
            <div
              style={{
                textAlign: "center",
                fontSize: `${Math.max(12, dimensions.height * 0.014)}px`,
                color: "#888",
                padding: `${Math.max(8, dimensions.height * 0.01)}px 0`,
                borderTop: "1px solid #eee",
                flexShrink: 0,
              }}
            >
              Temps total : {formatTime(tempsTotal)}
            </div>
          )}
        </div>
      </div>

      {/* CSS POUR PRINT */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .setlist-a4-container,
          .setlist-a4-container * {
            visibility: visible;
          }
          .setlist-controls {
            display: none !important;
          }
          .setlist-a4-container {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 210mm !important;
            height: 297mm !important;
            max-width: none !important;
            max-height: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 15mm 20mm !important;
            overflow: visible !important;
          }
          /* Assurer que le trait de séparation s'imprime */
          .setlist-a4-container > div:nth-child(2) > div {
            background: black !important;
            height: 2px !important;
          }
        }
      `}</style>
    </div>
  );
}
