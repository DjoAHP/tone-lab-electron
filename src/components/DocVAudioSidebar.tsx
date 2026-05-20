// Sidebar droite fixe pour le lecteur audio YouTube dans DocV
// Toujours visible quand on est dans l'outil DocV
// Largeur fixe 280px, pas de redimensionnement, pas de bouton fermeture

import React, { useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { extractYouTubeId } from "../utils/youtube.utils";
import { DocVAudioPlayer } from "./DocVAudioPlayer";

const SIDEBAR_WIDTH = 280;

export function DocVAudioSidebar() {
  const {
    docvAudioUrl,
    setDocvAudioUrl,
    setDocvAudioPlaying,
    setDocvAudioTime,
  } = useApp();

  const [inputUrl, setInputUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Référence globale du player YouTube
  const playerRef = React.useRef<any>(null);

  const handleRegisterPlayer = useCallback((player: any) => {
    playerRef.current = player;
  }, []);

  // Charger la vidéo
  const handleLoadVideo = () => {
    const id = extractYouTubeId(inputUrl);
    if (!id) {
      setError("URL YouTube invalide");
      return;
    }
    setError(null);
    setVideoId(id);
    setDocvAudioUrl(inputUrl);
  };

  // Vider le lecteur
  const handleClear = () => {
    setVideoId(null);
    setInputUrl("");
    setDocvAudioUrl(null);
    setDocvAudioPlaying(false);
    setDocvAudioTime(0, 0);
    playerRef.current = null;
  };

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: `${SIDEBAR_WIDTH}px`,
        background: "hsl(222, 20%, 11%)",
        borderLeft: "1px solid hsl(220, 15%, 18%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* En-tête (sans bouton fermeture) */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid hsl(220, 15%, 16%)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "hsl(220, 15%, 45%)",
          }}
        >
          Lecteur Audio
        </span>
      </div>

      {/* Zone URL */}
      <div style={{ padding: "12px", flexShrink: 0 }}>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => { setInputUrl(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleLoadVideo(); }}
          placeholder="URL YouTube..."
          style={{
            width: "100%",
            padding: "6px 10px",
            fontSize: "12px",
            background: "hsl(222, 20%, 16%)",
            border: `1px solid ${error ? "hsl(0, 70%, 50%)" : "hsl(220, 15%, 24%)"}`,
            borderRadius: "6px",
            color: "hsl(210, 30%, 88%)",
            outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--tl-accent-princ))"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(220, 15%, 24%)"; }}
        />
        {error && (
          <div style={{ fontSize: "11px", color: "hsl(0, 70%, 60%)", marginTop: 4 }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={handleLoadVideo}
            disabled={!inputUrl.trim()}
            style={{
              flex: 1,
              padding: "6px 12px",
              fontSize: "12px",
              background: inputUrl.trim() ? "hsl(var(--tl-accent-button))" : "hsl(var(--tl-accent-dim))",
              color: inputUrl.trim() ? "hsl(var(--tl-accent-text))" : "hsl(220, 15%, 40%)",
              border: "none",
              borderRadius: "6px",
              cursor: inputUrl.trim() ? "pointer" : "default",
            }}
          >
            Charger
          </button>
          {videoId && (
            <button
              onClick={handleClear}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                background: "hsl(222, 18%, 18%)",
                color: "hsl(220, 15%, 60%)",
                border: "1px solid hsl(220, 15%, 24%)",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Vider
            </button>
          )}
        </div>
      </div>

      {/* Lecteur audio */}
      {videoId && (
        <div style={{ flex: 1, overflow: "auto" }}>
          <DocVAudioPlayer
            videoId={videoId}
            onRegisterPlayer={handleRegisterPlayer}
            onPlayingChange={(playing) => setDocvAudioPlaying(playing)}
            onTimeUpdate={(time, duration) => setDocvAudioTime(time, duration)}
          />
        </div>
      )}

      {/* Message d'aide si aucune vidéo chargée */}
      {!videoId && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            fontSize: "12px",
            color: "hsl(220, 15%, 40%)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Collez une URL YouTube ci-dessus et cliquez sur "Charger" pour écouter l'audio tout en lisant votre partition.
        </div>
      )}
    </div>
  );
}
