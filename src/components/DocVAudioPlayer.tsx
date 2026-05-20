// Composant interne de lecteur audio YouTube (iframe masquée)
// Utilise react-youtube pour contrôler la lecture via l'API YouTube IFrame

import React, { useRef, useEffect, useCallback, useState } from "react";
import YouTube from "react-youtube";

interface DocVAudioPlayerProps {
  videoId: string;
  onRegisterPlayer: (player: any) => void;
  onPlayingChange: (playing: boolean) => void;
  onTimeUpdate: (time: number, duration?: number) => void;
}

export function DocVAudioPlayer({
  videoId,
  onRegisterPlayer,
  onPlayingChange,
  onTimeUpdate,
}: DocVAudioPlayerProps) {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Options YouTube (audio-only : masquer la vidéo)
  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  // Callbacks YouTube
  const onReady = useCallback((event: any) => {
    playerRef.current = event.target;
    onRegisterPlayer(event.target);
    const dur = event.target.getDuration();
    setDuration(dur);
    onTimeUpdate(0, dur);
  }, [onRegisterPlayer, onTimeUpdate]);

  const onStateChange = useCallback((event: any) => {
    // YT.PlayerState: UNSTARTED=-1, ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
    const playing = event.data === 1;
    setIsPlaying(playing);
    onPlayingChange(playing);
  }, [onPlayingChange]);

  // Polling pour la position (toutes les 500ms)
  useEffect(() => {
    if (!playerRef.current) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate(time);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [onTimeUpdate]);

  // Contrôles
  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (delta: number) => {
    if (!playerRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + delta));
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
    onTimeUpdate(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: "12px" }}>
      {/* Iframe YouTube (masqué) */}
      <div style={{ height: 0, overflow: "hidden" }}>
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
        />
      </div>

      {/* Contrôles personnalisés */}
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
            onClick={handlePlayPause}
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
            if (!playerRef.current || duration === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            const newTime = percent * duration;
            playerRef.current.seekTo(newTime, true);
            setCurrentTime(newTime);
            onTimeUpdate(newTime);
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
            onClick={() => handleSeek(-10)}
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
            onClick={() => handleSeek(10)}
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
    </div>
  );
}
