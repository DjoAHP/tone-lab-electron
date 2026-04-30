// src/components/SetlistTool.tsx
// Outil Setlist - Affiche la feuille A4
// La feuille A4 REMPLIT TOUTE LA HAUTEUR entre MenuBar et BottomBar

import { useApp } from "../context/AppContext";

export function SetlistTool() {
  const { projet } = useApp();

  // Songs triées par position
  const songs = [...(projet?.setlistSongs ?? [])].sort(
    (a, b) => a.position - b.position
  );
  const songCount = songs.length;

  return (
    <div
      className="flex-1 overflow-hidden"
      style={{ background: "hsl(222, 22%, 9%)" }}
    >
      {/* Conteneur principal : prend toute la hauteur disponible et centre horizontalement */}
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
        {/* FEUILLE A4 - REMPLIT TOUTE LA HAUTEUR DISPONIBLE */}
        <div
          className="setlist-a4-container"
          style={{
            width: "595px",
            maxWidth: "100%",
            flex: "1 1 auto",
            minHeight: 0,
            height: "100%",
            maxHeight: "100%",
            background: "white",
            borderRadius: "4px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            padding: "30px 50px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Band Name - GROSSE POLICE */}
          <h1
            style={{
              textAlign: "center",
              fontSize: "42px",
              fontWeight: "bold",
              color: "black",
              marginBottom: "14px",
              fontFamily: "serif",
              flexShrink: 0,
            }}
          >
            {projet?.bandName || "Nom du groupe"}
          </h1>

          {/* Séparation stylisée (TRAIT UNIQUE + visible à l'impression) */}
          <div
            style={{
              margin: "0 0 14px 0",
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

          {/* Nombre de morceaux (discret) */}
          <div
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#888",
              marginBottom: "14px",
              flexShrink: 0,
            }}
          >
            {songCount} morceau{songCount > 1 ? "x" : ""}
          </div>

          {/* Liste des morceaux - REMPLIT TOUTE LA HAUTEUR RESTANTE */}
          <div
            style={{
              flex: 1, // ← Clef : prend tout l'espace restant
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
                    borderBottom:
                      song.position < songCount ? "2px solid #ccc" : "none",
                    minHeight: 0, // Important pour flex
                  }}
                >
                  <span
                    style={{
                      fontSize: "32px",
                      color: "black",
                      fontWeight: "600",
                      textAlign: "center",
                      padding: "0 30px",
                      fontFamily: "sans-serif",
                      lineHeight: "1.2",
                    }}
                  >
                    {song.title}
                  </span>
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
                  fontSize: "16px",
                  fontStyle: "italic",
                }}
              >
                Ajoutez des morceaux via le panneau de gauche
              </div>
            )}
          </div>
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
