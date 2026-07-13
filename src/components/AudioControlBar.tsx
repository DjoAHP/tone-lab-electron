// Barre de contrôles de lecture audio partagée entre le lecteur YouTube
// et le lecteur de fichier local. Présentation pure : toutes les actions
// sont déléguées via props.

import React from "react";

interface AudioControlBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (delta: number) => void;
  onSeekTo: (ratio: number) => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function AudioControlBar({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onSeekTo,
}: AudioControlBarProps) {
  return (
    <div
      style={{
        background: "hsl(222, 18%, 16%)",
        borderRadius: "8px",
        padding: "16px",
        border: "1px solid hsl(220, 15%, 20%)",
      }}
    >
      {/* Bouton Play/Pause */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <button
          onClick={onPlayPause}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "hsl(var(--tl-accent-button))",
            border: "none",
            color: "hsl(var(--tl-accent-text))",
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>

      {/* Temps */}
      <div
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: "hsl(220, 15%, 70%)",
          fontFamily: "monospace",
          marginBottom: 12,
        }}
      >
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      {/* Barre de progression */}
      <div
        style={{
          width: "100%",
          height: 4,
          background: "hsl(220, 15%, 20%)",
          borderRadius: 2,
          marginBottom: 12,
          cursor: "pointer",
          position: "relative",
        }}
        onClick={(e) => {
          if (duration === 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          onSeekTo(ratio);
        }}
      >
        <div
          style={{
            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            height: "100%",
            background: "hsl(var(--tl-accent-princ))",
            borderRadius: 2,
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {/* Boutons Seek +/- 10s */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        <button
          onClick={() => onSeek(-10)}
          title="Reculer 10s (←)"
          style={{
            padding: "6px 16px",
            background: "hsl(222, 20%, 18%)",
            border: "1px solid hsl(220, 15%, 24%)",
            borderRadius: "6px",
            color: "hsl(220, 15%, 70%)",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          ◀ -10s
        </button>
        <button
          onClick={() => onSeek(10)}
          title="Avancer 10s (→)"
          style={{
            padding: "6px 16px",
            background: "hsl(222, 20%, 18%)",
            border: "1px solid hsl(220, 15%, 24%)",
            borderRadius: "6px",
            color: "hsl(220, 15%, 70%)",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          +10s ▶
        </button>
      </div>

      {/* Raccourcis info */}
      <div
        style={{
          marginTop: 12,
          fontSize: "10px",
          color: "hsl(220, 15%, 40%)",
          textAlign: "center",
        }}
      >
        Espace: play/pause • ← →: seek +/- 10s
      </div>
    </div>
  );
}
