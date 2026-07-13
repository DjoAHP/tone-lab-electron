// Lecteur audio pour fichier local (mp3/wav/flac).
// Le fichier arrive déjà sous forme d'objectURL (Blob) depuis la sidebar ;
// on l'utilise comme source d'un élément <audio> HTML5 (FLAC décodé
// nativement par Chromium/Electron). Réutilise la barre de contrôles partagée.

import React, { useRef, useEffect, useCallback, useState } from "react";
import { AudioControlBar } from "./AudioControlBar";

interface DocVLocalAudioPlayerProps {
  objectUrl: string;
  fileName: string;
  onRegisterController: (controller: any) => void;
  onPlayingChange: (playing: boolean) => void;
  onTimeUpdate: (time: number, duration?: number) => void;
}

export function DocVLocalAudioPlayer({
  objectUrl,
  fileName,
  onRegisterController,
  onPlayingChange,
  onTimeUpdate,
}: DocVLocalAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const registerController = useCallback((): void => {
    onRegisterController({
      toggle: () => {
        const a = audioRef.current;
        if (!a) return;
        if (a.paused) a.play().catch(() => {});
        else a.pause();
      },
      seek: (delta: number) => {
        const a = audioRef.current;
        if (!a || !a.duration) return;
        a.currentTime = Math.max(0, Math.min(a.duration, a.currentTime + delta));
      },
      getCurrentTime: () => audioRef.current?.currentTime ?? 0,
      getDuration: () => audioRef.current?.duration ?? 0,
    });
  }, [onRegisterController]);

  // Enregistre le contrôleur dès que les métadonnées sont disponibles
  useEffect(() => {
    registerController();
  }, [registerController]);

  const handlePlayPause = (): void => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const handleSeek = (delta: number): void => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    a.currentTime = Math.max(0, Math.min(a.duration, a.currentTime + delta));
    setCurrentTime(a.currentTime);
    onTimeUpdate(a.currentTime);
  };

  const handleSeekTo = (ratio: number): void => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    a.currentTime = ratio * a.duration;
    setCurrentTime(a.currentTime);
    onTimeUpdate(a.currentTime);
  };

  return (
    <div style={{ padding: "12px" }}>
      {/* Nom du fichier */}
      <div
        style={{
          fontSize: "12px",
          color: "hsl(220, 15%, 65%)",
          marginBottom: 10,
          wordBreak: "break-all",
        }}
        title={fileName}
      >
        {fileName}
      </div>

      {/* Élément audio (invisible, piloté par la barre de contrôles) */}
      <audio
        ref={audioRef}
        src={objectUrl}
        style={{ display: "none" }}
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          setDuration(a.duration || 0);
          setError(null);
          onTimeUpdate(0, a.duration || 0);
          registerController();
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setCurrentTime(a.currentTime);
          onTimeUpdate(a.currentTime);
        }}
        onPlay={() => {
          setIsPlaying(true);
          onPlayingChange(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          onPlayingChange(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          onPlayingChange(false);
        }}
        onError={() => {
          setError("Impossible de lire ce fichier audio.");
          setIsPlaying(false);
          onPlayingChange(false);
        }}
      />

      {error && (
        <div style={{ fontSize: "12px", color: "hsl(0, 70%, 60%)", marginBottom: 8 }}>
          {error}
        </div>
      )}

      {/* Contrôles personnalisés (partagés) */}
      <AudioControlBar
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onSeekTo={handleSeekTo}
      />
    </div>
  );
}
