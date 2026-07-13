// Composant interne de lecteur audio YouTube (iframe masquée)
// Utilise react-youtube pour contrôler la lecture via l'API YouTube IFrame

import React, { useRef, useEffect, useCallback, useState } from "react";
import YouTube from "react-youtube";
import { AudioControlBar } from "./AudioControlBar";

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

    // Démarrage du polling de position (une fois le player prêt)
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (p) {
        const time = p.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate(time);
      }
    }, 500);
  }, [onRegisterPlayer, onTimeUpdate]);

  const onError = useCallback((event: any) => {
    console.error("[DocV] YouTube onError code =", event?.data);
  }, []);

  const onStateChange = useCallback((event: any) => {
    // YT.PlayerState: UNSTARTED=-1, ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
    const playing = event.data === 1;
    setIsPlaying(playing);
    onPlayingChange(playing);
  }, [onPlayingChange]);

  // Nettoyage de l'intervalle de polling au démontage
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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

  const handleSeekTo = (ratio: number) => {
    if (!playerRef.current || duration === 0) return;
    const newTime = ratio * duration;
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
    onTimeUpdate(newTime);
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
          onError={onError}
        />
      </div>

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
