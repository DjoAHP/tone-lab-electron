import React, { useRef, useState, useCallback, useEffect } from "react";

// ─── Dimensions des touches ────────────────────────
const WHITE_KEY_WIDTH = 60;
const BLACK_KEY_WIDTH = 36;
const WHITE_KEY_HEIGHT = 200;
const BLACK_KEY_HEIGHT = 130;

// ─── Mapping des fréquences (C4 à C6) ─────
const WHITE_KEYS = [
  { note: "C4", freq: 261.63 },
  { note: "D4", freq: 293.66 },
  { note: "E4", freq: 329.63 },
  { note: "F4", freq: 349.23 },
  { note: "G4", freq: 392.0 },
  { note: "A4", freq: 440.0 },
  { note: "B4", freq: 493.88 },
  { note: "C5", freq: 523.25 },
  { note: "D5", freq: 587.33 },
  { note: "E5", freq: 659.25 },
  { note: "F5", freq: 698.46 },
  { note: "G5", freq: 783.99 },
  { note: "A5", freq: 880.0 },
  { note: "B5", freq: 987.77 },
  { note: "C6", freq: 1046.5 },
];

const BLACK_KEYS = [
  { note: "C#4", freq: 277.18, afterWhiteIndex: 0 },
  { note: "D#4", freq: 311.13, afterWhiteIndex: 1 },
  { note: "F#4", freq: 369.99, afterWhiteIndex: 3 },
  { note: "G#4", freq: 415.3, afterWhiteIndex: 4 },
  { note: "A#4", freq: 466.16, afterWhiteIndex: 5 },
  { note: "C#5", freq: 554.37, afterWhiteIndex: 7 },
  { note: "D#5", freq: 622.25, afterWhiteIndex: 8 },
  { note: "F#5", freq: 739.99, afterWhiteIndex: 10 },
  { note: "G#5", freq: 830.61, afterWhiteIndex: 11 },
  { note: "A#5", freq: 932.33, afterWhiteIndex: 12 },
];

// ─── Mapping clavier AZERTY ────────────────────────
const WHITE_KEY_MAP: Record<string, string> = {
  'a': "C4", 'z': "D4", 'e': "E4", 'r': "F4", 't': "G4",
  'y': "A4", 'u': "B4", 'i': "C5", 'o': "D5", 'p': "E5",
  '^': "F5", '$': "G5", ']': "A5",
};

const BLACK_KEY_MAP: Record<string, string> = {
  'q': "C#4", 's': "D#4", 'd': "F#4", 'f': "G#4", 'g': "A#4",
  'h': "C#5", 'j': "D#5", 'k': "F#5", 'l': "G#5", 'm': "A#5"
};

// ─── Types de sons disponibles ────────────────────────
export type OscType = "sine" | "triangle" | "square" | "sawtooth";

// ─── Initialisation AudioContext ────────────────────────
function createAudioContext(): AudioContext {
  return new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  )();
}

// ─── Props du composant ────────────────────────
interface PianoKeyboardProps {
  oscType: OscType;
  volume: number;      // 0 à 1
  onNotePlay: (note: string) => void;
  onNoteStop?: (note: string) => void;
}

// ─── Composant PianoKeyboard ────────────────────────
export function PianoKeyboard({
  oscType, volume, onNotePlay, onNoteStop
}: PianoKeyboardProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  // Gestion polyphonique : Map des notes actives -> { osc, gain }
  const activeOscsRef = useRef<Map<string, { osc: OscillatorNode, gain: GainNode }>>(new Map());
  const pressedKeysRef = useRef<Set<string>>(new Set());

  // Obtenir ou créer le contexte audio
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Jouer une note
  const playNote = useCallback(
    (frequency: number, note: string) => {
      const ctx = getAudioContext();

      // Feedback visuel
      setActiveNote(note);
      onNotePlay(note);

      // Création du son
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = oscType;
      osc.frequency.value = frequency;

      // Enveloppe d'attaque
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.01);

      // Arrêt automatique après 0.5s
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);

      // Nettoyage après arrêt
      setTimeout(() => {
        activeOscsRef.current.delete(note);
        if (activeNote === note) {
          setActiveNote(null);
        }
      }, 600);
    },
    [getAudioContext, oscType, volume, onNotePlay, activeNote],
  );

  // Arrêter une note
  const stopNote = useCallback(
    (note: string) => {
      const entry = activeOscsRef.current.get(note);
      if (!entry) return;

      const now = entry.gain.context.currentTime;
      entry.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      entry.osc.stop(now + 0.1);

      activeOscsRef.current.delete(note);
      if (activeNote === note) {
        setActiveNote(null);
      }

      if (onNoteStop) {
        onNoteStop(note);
      }
    },
    [activeNote, onNoteStop],
  );

  // Gestion du clavier physique (AZERTY)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const note = WHITE_KEY_MAP[key] ?? BLACK_KEY_MAP[key];
      if (!note) return;

      // Éviter les répétitions de touches
      if (pressedKeysRef.current.has(key)) return;

      e.preventDefault();
      pressedKeysRef.current.add(key);

      const allKeys = [...WHITE_KEYS, ...BLACK_KEYS];
      const keyData = allKeys.find(k => k.note === note);
      if (keyData) playNote(keyData.freq, keyData.note);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const note = WHITE_KEY_MAP[key] ?? BLACK_KEY_MAP[key];
      if (!note) return;

      pressedKeysRef.current.delete(key);
      // On ne fait rien d'autre, la note s'arrête après 0.5s
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [playNote]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      activeOscsRef.current.forEach(entry => {
        try { entry.osc.stop(); } catch { /* ignore */ }
      });
      activeOscsRef.current.clear();
      audioCtxRef.current?.close();
    };
  }, []);

  const totalWidth = WHITE_KEYS.length * WHITE_KEY_WIDTH;

  // Fonction pour générer les touches blanches
  const renderWhiteKey = (key: typeof WHITE_KEYS[0], index: number) => {
    const isActive = activeNote === key.note;

    return (
      <button
        key={key.note}
        onMouseDown={() => playNote(key.freq, key.note)}
        onMouseUp={() => stopNote(key.note)}
        onMouseLeave={() => stopNote(key.note)}
        className="absolute flex flex-col items-center justify-end pb-2"
        style={{
          left: `${index * WHITE_KEY_WIDTH}px`,
          width: `${WHITE_KEY_WIDTH}px`,
          height: `${WHITE_KEY_HEIGHT}px`,
          background: isActive
            ? "hsl(var(--tl-accent-dim))"
            : "hsl(222, 15%, 16%)",
          border: `1px solid ${
            isActive
              ? "hsl(var(--tl-accent-border))"
              : "hsl(220, 15%, 22%)"
          }`,
          borderBottomLeftRadius: "4px",
          borderBottomRightRadius: "4px",
          cursor: "pointer",
          color: "hsl(220, 15%, 45%)",
          fontSize: "10px",
          fontFamily: "'Courier New', monospace",
          transition: "background 0.1s, border-color 0.1s",
          zIndex: 1,
          userSelect: "none",
        }}
      >
        {key.note}
      </button>
    );
  };

  // Fonction pour générer les touches noires
  const renderBlackKey = (key: typeof BLACK_KEYS[0]) => {
    const isActive = activeNote === key.note;
    const left = (key.afterWhiteIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;

    return (
      <button
        key={key.note}
        onMouseDown={() => playNote(key.freq, key.note)}
        onMouseUp={() => stopNote(key.note)}
        onMouseLeave={() => stopNote(key.note)}
        className="absolute flex flex-col items-center justify-end pb-1.5"
        style={{
          left: `${left}px`,
          top: "0",
          width: `${BLACK_KEY_WIDTH}px`,
          height: `${BLACK_KEY_HEIGHT}px`,
          background: isActive
            ? "hsl(var(--tl-accent-dim))"
            : "hsl(222, 25%, 7%)",
          border: `1px solid ${
            isActive
              ? "hsl(var(--tl-accent-border))"
              : "hsl(220, 15%, 14%)"
          }`,
          borderBottomLeftRadius: "3px",
          borderBottomRightRadius: "3px",
          cursor: "pointer",
          color: "hsl(220, 15%, 35%)",
          fontSize: "9px",
          fontFamily: "'Courier New', monospace",
          transition: "background 0.1s, border-color 0.1s",
          zIndex: 2,
          userSelect: "none",
        }}
      >
        {key.note}
      </button>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: `${totalWidth}px`,
        height: `${WHITE_KEY_HEIGHT}px`,
        margin: "0 auto",
      }}
    >
      {/* Touches blanches */}
      {WHITE_KEYS.map((key, index) => renderWhiteKey(key, index))}

      {/* Touches noires */}
      {BLACK_KEYS.map(key => renderBlackKey(key))}
    </div>
  );
}
