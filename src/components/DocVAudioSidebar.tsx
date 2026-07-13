// Sidebar droite fixe pour le lecteur audio dans DocV
// Toujours visible quand on est dans l'outil DocV
// Largeur fixe 280px, pas de redimensionnement, pas de bouton fermeture
//
// Deux sources possibles (une seule active à la fois) :
//  - URL YouTube (iframe masquée)
//  - fichier local (mp3/wav/flac) via dialogue natif Electron

import React, { useState, useCallback, useRef, useEffect } from "react";
import { FileVolume } from "lucide-react";
import { useApp } from "../context/AppContext";
import { extractYouTubeId } from "../utils/youtube.utils";
import { DocVAudioPlayer } from "./DocVAudioPlayer";
import { DocVLocalAudioPlayer } from "./DocVLocalAudioPlayer";

const SIDEBAR_WIDTH = 280;

type AudioMode = "youtube" | "file" | null;

interface FileInfo {
  name: string;
  objectUrl: string;
}

export function DocVAudioSidebar() {
  const {
    setDocvAudioUrl,
    setDocvAudioPlaying,
    setDocvAudioTime,
    registerYouTubePlayer,
    registerAudioController,
    clearAudioController,
  } = useApp();

  const [inputUrl, setInputUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AudioMode>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);

  // Référence vers l'objectURL courant (pour le révoquer proprement)
  const fileInfoRef = useRef<FileInfo | null>(null);
  fileInfoRef.current = fileInfo;

  // Référence globale du player YouTube
  const playerRef = React.useRef<any>(null);

  const handleRegisterPlayer = useCallback((player: any) => {
    playerRef.current = player;
    registerYouTubePlayer(player);
  }, [registerYouTubePlayer]);

  // Libère l'objectURL au démontage de la sidebar
  useEffect(() => {
    return () => {
      if (fileInfoRef.current?.objectUrl) {
        URL.revokeObjectURL(fileInfoRef.current.objectUrl);
      }
    };
  }, []);

  // Charger la vidéo YouTube
  const handleLoadVideo = () => {
    const id = extractYouTubeId(inputUrl);
    if (!id) {
      setError("URL YouTube invalide");
      return;
    }
    setError(null);
    // Bascule vers le mode YouTube (révoque un éventuel fichier)
    if (fileInfoRef.current?.objectUrl) {
      URL.revokeObjectURL(fileInfoRef.current.objectUrl);
    }
    setFileInfo(null);
    clearAudioController();
    setVideoId(id);
    setMode("youtube");
    setDocvAudioUrl(inputUrl);
  };

  // Applique une source fichier (révoque l'objectURL précédent)
  const setFileSource = useCallback((name: string, objectUrl: string) => {
    if (fileInfoRef.current?.objectUrl) {
      URL.revokeObjectURL(fileInfoRef.current.objectUrl);
    }
    setFileInfo({ name, objectUrl });
    setVideoId(null);
    setInputUrl("");
    setError(null);
    setMode("file");
    registerAudioController(null); // sera remplacé par le contrôleur fichier
  }, [registerAudioController]);

  // Charger un fichier audio local (mp3/wav/flac)
  // En Electron : dialogue natif via le preload. Sinon (npm run dev, navigateur) :
  // repli sur un <input type="file"> classique.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadFile = async () => {
    if (window.electronAPI && typeof window.electronAPI.openAudioFile === "function") {
      const result = await window.electronAPI.openAudioFile();
      if (!result) return;
      const blob = new Blob([result.buffer], { type: result.mime });
      const url = URL.createObjectURL(blob);
      setFileSource(result.name, url);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de re-sélectionner le même fichier
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileSource(file.name, url);
  };

  // Vider le lecteur (les deux sources)
  const handleClear = () => {
    if (fileInfoRef.current?.objectUrl) {
      URL.revokeObjectURL(fileInfoRef.current.objectUrl);
    }
    setFileInfo(null);
    setVideoId(null);
    setInputUrl("");
    setError(null);
    setMode(null);
    setDocvAudioUrl(null);
    setDocvAudioPlaying(false);
    setDocvAudioTime(0, 0);
    playerRef.current = null;
    clearAudioController();
  };

  const afficheLecteur = mode === "youtube" || mode === "file";

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

      {/* Zone URL YouTube */}
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
        </div>
      </div>

      {/* Bouton fichier local */}
      <div style={{ padding: "0 12px 12px", flexShrink: 0 }}>
        <button
          onClick={handleLoadFile}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "12px",
            background: "hsl(222, 18%, 18%)",
            color: "hsl(220, 15%, 75%)",
            border: "1px solid hsl(220, 15%, 24%)",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <FileVolume size={15} style={{ color: "hsl(var(--tl-accent-princ))" }} />
          Charger un fichier (mp3/wav/flac)
        </button>
      </div>

      {/* Input fichier caché (repli pour npm run dev / navigateur) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac,audio/*"
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      {/* Lecteur audio */}
      {afficheLecteur && (
        <div style={{ flex: 1, overflow: "auto" }}>
          {mode === "youtube" && videoId && (
            <DocVAudioPlayer
              videoId={videoId}
              onRegisterPlayer={handleRegisterPlayer}
              onPlayingChange={(playing) => setDocvAudioPlaying(playing)}
              onTimeUpdate={(time, duration) => setDocvAudioTime(time, duration)}
            />
          )}
          {mode === "file" && fileInfo && (
            <DocVLocalAudioPlayer
              objectUrl={fileInfo.objectUrl}
              fileName={fileInfo.name}
              onRegisterController={registerAudioController}
              onPlayingChange={(playing) => setDocvAudioPlaying(playing)}
              onTimeUpdate={(time, duration) => setDocvAudioTime(time, duration)}
            />
          )}
        </div>
      )}

      {/* Message d'aide si aucune source chargée */}
      {!afficheLecteur && (
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
          Collez une URL YouTube ci-dessus ou chargez un fichier audio local pour écouter
          pendant la lecture de votre partition.
        </div>
      )}

      {/* Bouton Vider (si une source est chargée) */}
      {afficheLecteur && (
        <div style={{ padding: "12px", flexShrink: 0 }}>
          <button
            onClick={handleClear}
            style={{
              width: "100%",
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
        </div>
      )}
    </div>
  );
}
