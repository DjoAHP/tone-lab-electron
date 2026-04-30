import React, { useState, useCallback, useRef } from "react";
import { useApp } from "../context/AppContext";
import type { SetlistSong } from "../types";

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
  } = useApp();

  const [newSongTitle, setNewSongTitle] = useState("");
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [draggedSongId, setDraggedSongId] = useState<string | null>(null);
  const [dragOverSongId, setDragOverSongId] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);

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
      updateSetlistSong(editingSongId, editTitle.trim());
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

  return (
    <div style={{
      width: "220px",
      flexShrink: 0,
      height: "100%",
      background: "hsl(222, 20%, 11%)",
      borderRight: "1px solid hsl(220, 15%, 18%)",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }}>
      {/* En-tête */}
      <div style={{
        padding: "10px 12px",
        borderBottom: "1px solid hsl(220, 15%, 16%)",
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

      {/* Contenu */}
      <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        {/* Input Band Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "hsl(220, 15%, 50%)" }}>
            Groupe
          </label>
          <input
            type="text"
            value={projet?.bandName ?? ""}
            onChange={(e) => setBandName(e.target.value)}
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

        {/* Input Nouveau morceau */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "hsl(220, 15%, 50%)" }}>
            Morceau
          </label>
          <input
            type="text"
            value={newSongTitle}
            onChange={(e) => setNewSongTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSong()}
            placeholder="Titre du morceau..."
            style={inputStyle}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "hsl(var(--tl-accent-princ))";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "hsl(220, 15%, 22%)";
            }}
          />
        </div>

        {/* Bouton Ajouter */}
        <button
          onClick={handleAddSong}
          style={{
            background: "hsl(var(--tl-accent-button))",
            border: "1px solid hsl(var(--tl-accent-button-border))",
            color: "hsl(var(--tl-accent-text))",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          + Ajouter à la setlist
        </button>

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
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, overflowY: "auto" }}>
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
                {/* Icône drag */}
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" style={{ color: "hsl(220, 15%, 30%)", flexShrink: 0 }}>
                  <circle cx="2" cy="2" r="1" />
                  <circle cx="6" cy="2" r="1" />
                  <circle cx="2" cy="6" r="1" />
                  <circle cx="6" cy="6" r="1" />
                  <circle cx="2" cy="10" r="1" />
                  <circle cx="6" cy="10" r="1" />
                </svg>

                {/* Titre (éditable) */}
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

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bouton Importer */}
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
    </div>
  );
}
