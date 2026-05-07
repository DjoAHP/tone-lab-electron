import React, { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import type { SetlistSong } from "../types";

const LARGEUR_MIN = 180;
const LARGEUR_MAX = 400;

// Tonalités courantes (majeures et mineures)
const TONALITES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
  "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm",
];

const inputStyle = {
  background: "transparent",
  border: "1px solid hsl(220, 15%, 22%)",
  color: "white",
  outline: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  width: "100%",
  transition: "border-color 0.15s",
};

export function SetlistSidebar() {
  const {
    projet,
    setBandName,
    addSetlistSong,
    updateSetlistSong,
    deleteSetlistSong,
    reorderSetlistSong,
    importerSetlist,
    initialiserProjet,
    setlistSidebarWidth,
    setSetlistSidebarWidth,
  } = useApp();

  // Style commun pour les select de temps
  const timeSelectStyle: React.CSSProperties = {
    width: "46px",
    background: "hsl(222, 18%, 14%)",
    border: "1px solid hsl(220, 15%, 22%)",
    borderRadius: "4px",
    color: "hsl(220, 15%, 50%)",
    fontSize: "11px",
    padding: "2px 2px",
    textAlign: "center",
    flexShrink: 0,
    cursor: "pointer",
  };

  const [newSongTitle, setNewSongTitle] = useState("");
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [draggedSongId, setDraggedSongId] = useState<string | null>(null);
  const [dragOverSongId, setDragOverSongId] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);
  const enTrainDeRedimensionner = useRef(false);
  const xDepart = useRef(0);
  const largeurDepart = useRef(0);

  const songs = [...(projet?.setlistSongs ?? [])].sort(
    (a, b) => a.position - b.position
  );
  const songCount = songs.length;

  const handleAddSong = useCallback(() => {
    if (newSongTitle.trim()) {
      addSetlistSong(newSongTitle.trim());
      setNewSongTitle("");
    }
  }, [newSongTitle, addSetlistSong]);

  const handleStartEdit = useCallback((song: SetlistSong) => {
    setEditingSongId(song.id);
    setEditTitle(song.title);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingSongId && editTitle.trim()) {
      updateSetlistSong(editingSongId, { title: editTitle.trim() });
    }
    setEditingSongId(null);
  }, [editingSongId, editTitle, updateSetlistSong]);

  const handleCancelEdit = useCallback(() => {
    setEditingSongId(null);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, songId: string) => {
    dragItemId.current = songId;
    setDraggedSongId(songId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", songId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, songId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSongId(songId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSongId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetSongId: string) => {
      e.preventDefault();
      const sourceSongId = dragItemId.current;
      if (!sourceSongId || sourceSongId === targetSongId) return;
      const targetSong = songs.find((s) => s.id === targetSongId);
      if (targetSong) {
        reorderSetlistSong(sourceSongId, targetSong.position);
      }
      setDraggedSongId(null);
      setDragOverSongId(null);
      dragItemId.current = null;
    },
    [songs, reorderSetlistSong]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedSongId(null);
    setDragOverSongId(null);
    dragItemId.current = null;
  }, []);

  const handleImporter = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".tl,.json";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const fichier = target.files?.[0];
      if (!fichier) return;
      const lecteur = new FileReader();
      lecteur.onload = (ev) => {
        const contenu = (ev.target as FileReader).result as string;
        const success = importerSetlist(contenu);
        if (!success) {
          window.alert("Fichier invalide. Vérifiez que c'est un fichier Setlist (.tl)");
        }
      };
      lecteur.readAsText(fichier);
    };
    input.click();
  }, [importerSetlist]);
  // ── Redimensionnement ───────────────────────────────────
  const demarrerRedimensionnement = useCallback(
    (e: React.MouseEvent) => {
      enTrainDeRedimensionner.current = true;
      xDepart.current = e.clientX;
      largeurDepart.current = setlistSidebarWidth;
      e.preventDefault();
    },
    [setlistSidebarWidth],
  );

  useEffect(() => {
    function surMouvement(e: MouseEvent) {
      if (!enTrainDeRedimensionner.current) return;
      const delta = e.clientX - xDepart.current;
      const nouvelleLargeur = Math.min(Math.max(largeurDepart.current + delta, LARGEUR_MIN), LARGEUR_MAX);
      setSetlistSidebarWidth(nouvelleLargeur);
    }
    function surRelachement() { enTrainDeRedimensionner.current = false; }
    document.addEventListener("mousemove", surMouvement);
    document.addEventListener("mouseup", surRelachement);
    return () => {
      document.removeEventListener("mousemove", surMouvement);
      document.removeEventListener("mouseup", surRelachement);
    };
  }, [setSetlistSidebarWidth]);

  // Formater les secondes en mm:ss
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Extraire minutes/secondes depuis un temps en secondes
  const getMinutes = (secs: number | undefined): string => secs ? Math.floor(secs / 60).toString() : "";
  const getSeconds = (secs: number | undefined): string => secs ? (secs % 60).toString() : "";


  return (
    <div
      className="flex flex-col h-full flex-shrink-0 relative"
      style={{
      width: `${setlistSidebarWidth}px`,
      flexShrink: 0,
      height: "100%",
      background: "hsl(222, 20%, 11%)",
      borderRight: "1px solid hsl(220, 15%, 18%)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* En-tête - FIXE en haut */}
      <div style={{
        padding: "10px 12px",
        borderBottom: "1px solid hsl(220, 15%, 16%)",
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "hsl(220, 15%, 45%)",
        }}>
          Setlist
        </span>
      </div>

      {/* Zone défilable (contenu du milieu) */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Input Band Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", color: "hsl(220, 15%, 50%)" }}>
              Groupe
            </label>
            <input
              type="text"
              value={projet?.bandName ?? ""}
              onChange={(e) => {
                initialiserProjet();
                setBandName(e.target.value);
              }}
              placeholder="Nom du groupe..."
              style={inputStyle}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "hsl(var(--tl-accent-princ))";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "hsl(220, 15%, 22%)";
              }}
            />
          </div>

          {/* Séparateur visuel */}
          <div style={{ height: "1px", background: "hsl(220, 15%, 18%)" }} />

          {/* Input Nouveau morceau + Bouton Ajouter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", color: "hsl(220, 15%, 50%)" }}>
              Morceau
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={newSongTitle}
                onChange={(e) => {
                  initialiserProjet();
                  setNewSongTitle(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAddSong()}
                placeholder="Titre du morceau..."
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "hsl(var(--tl-accent-princ))";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "hsl(220, 15%, 22%)";
                }}
              />
              <button
                onClick={handleAddSong}
                disabled={!newSongTitle.trim()}
                style={{
                  width: "40px",
                  height: "40px",
                  minWidth: "40px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: !newSongTitle.trim() ? "hsl(222, 18%, 14%)" : "hsl(var(--tl-accent-button))",
                  border: "1px solid hsl(220, 15%, 22%)",
                  color: !newSongTitle.trim() ? "hsl(220, 15%, 30%)" : "hsl(var(--tl-accent-text))",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: !newSongTitle.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  opacity: !newSongTitle.trim() ? 0.5 : 1,
                }}
                title={!newSongTitle.trim() ? "Saisissez un titre de morceau" : "Ajouter à la setlist"}
              >
                +
              </button>
            </div>
          </div>

          {/* Nombre de morceaux */}
          <div style={{
            textAlign: "center",
            fontSize: "11px",
            color: "hsl(220, 15%, 40%)",
            padding: "4px 0",
          }}>
            {songCount} morceau{songCount > 1 ? "x" : ""}
          </div>

          {/* Liste des morceaux (avec drag & drop) */}
          {songCount > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {songs.map((song) => (
                <div
                  key={song.id}
                  draggable="true"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background:
                      dragOverSongId === song.id
                        ? "rgba(255,255,255,0.05)"
                        : draggedSongId === song.id
                        ? "rgba(255,255,255,0.02)"
                        : "transparent",
                    cursor: draggedSongId === song.id ? "grabbing" : "grab",
                    opacity: draggedSongId === song.id ? 0.5 : 1,
                    transition: "background 0.15s",
                    border: "1px solid transparent",
                    borderColor: dragOverSongId === song.id ? "hsl(var(--tl-accent-princ))" : "transparent",
                  }}
                  onDragStart={(e) => handleDragStart(e, song.id)}
                  onDragOver={(e) => handleDragOver(e, song.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, song.id)}
                  onDragEnd={handleDragEnd}
              >

                {/* Icône drag (tout à gauche) */}
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" style={{ color: "hsl(220, 15%, 30%)", flexShrink: 0, cursor: editingSongId === song.id ? "default" : "grab" }}>
                  <circle cx="2" cy="2" r="1" />
                  <circle cx="6" cy="2" r="1" />
                  <circle cx="2" cy="6" r="1" />
                  <circle cx="6" cy="6" r="1" />
                  <circle cx="2" cy="10" r="1" />
                  <circle cx="6" cy="10" r="1" />
                </svg>

                {/* Sélecteur de tonalité */}
                <select
                  value={song.tonality ?? ""}
                  onChange={(e) => {
                    const val = e.target.value || undefined;
                    updateSetlistSong(song.id, { tonality: val });
                  }}
                  title="Tonalité"
                  style={{
                    width: "42px",
                    background: "hsl(222, 18%, 14%)",
                    border: song.tonality ? "1px solid hsl(220, 15%, 25%)" : "1px solid hsl(220, 15%, 18%)",
                    borderRadius: "4px",
                    color: song.tonality ? "hsl(220, 15%, 70%)" : "hsl(220, 15%, 30%)",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    textAlign: "center",
                    flexShrink: 0,
                    outline: "none",
                    cursor: "pointer",
                    padding: "2px 0",
                    transition: "all 0.15s",
                  }}
                >
                  <option value="">-</option>
                  {TONALITES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Titre (éditable) + Temps */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                  {editingSongId === song.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        borderBottom: "2px solid #333",
                        color: "white",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => handleStartEdit(song)}
                      style={{
                        flex: 1,
                        fontSize: "12px",
                        color: "hsl(220, 15%, 70%)",
                        cursor: "pointer",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {song.title}
                    </span>
                  )}

                  {/* Select temps (min & sec) */}
                  <div style={{ display: "flex", gap: "2px", flexShrink: 0, alignItems: "center" }}>
                    <select
                      value={getMinutes(song.time)}
                      onChange={(e) => {
                        const m = parseInt(e.target.value, 10);
                        const s = song.time ? song.time % 60 : 0;
                        updateSetlistSong(song.id, { time: m * 60 + s });
                      }}
                      title="Minutes"
                      style={timeSelectStyle}
                    >
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i} value={i}>{i} min</option>
                      ))}
                    </select>
                    <span style={{ color: "hsl(220, 15%, 30%)", fontSize: "11px" }}>:</span>
                    <select
                      value={getSeconds(song.time)}
                      onChange={(e) => {
                        const s = parseInt(e.target.value, 10);
                        const m = song.time ? Math.floor(song.time / 60) : 0;
                        updateSetlistSong(song.id, { time: m * 60 + s });
                      }}
                      title="Secondes"
                      style={timeSelectStyle}
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>{i}s</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bouton supprimer */}
                <button
                  onClick={() => deleteSetlistSong(song.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "hsl(220, 15%, 30%)",
                    cursor: "pointer",
                    padding: "2px",
                    fontSize: "10px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.color = "hsl(0, 70%, 60%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.color = "hsl(220, 15%, 30%)";
                  }}
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
      </div>

      {/* Bouton Importer - FIXE en bas, hors de la zone scrollable */}
      <div style={{
        padding: "10px",
        borderTop: "1px solid hsl(220, 15%, 18%)",
        flexShrink: 0,
      }}>
        <button
          onClick={handleImporter}
          style={{
            background: "hsl(222, 18%, 17%)",
            border: "1px solid hsl(220, 15%, 22%)",
            color: "hsl(220, 15%, 50%)",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.15s",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "hsl(220, 15%, 35%)";
            (e.target as HTMLButtonElement).style.color = "hsl(220, 15%, 70%)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "hsl(220, 15%, 22%)";
            (e.target as HTMLButtonElement).style.color = "hsl(220, 15%, 50%)";
          }}
          title="Importer une setlist (.tl)"
        >
          Importer
        </button>
      </div>

      {/* Poignée redimensionnement */}
      <div
        onMouseDown={demarrerRedimensionnement}
        className="absolute top-0 right-0 h-full transition-colors"
        style={{ width: "4px", cursor: "col-resize", background: "transparent", zIndex: 10 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--tl-accent-princ) / 0.3)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
      />
    </div>
  );
}
