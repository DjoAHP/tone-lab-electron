// src/components/Metronome.tsx
// Métronome premium — Web Audio API, pas de dépendances externes

import React, { useState, useEffect, useRef, useCallback } from "react";
import { LedDisplay } from "./led-display/LedDisplay";

// ─── Types ───────────────────────────────────────────────────
type SoundType = "click" | "woodblock" | "beep" | "sine" | "rimshot";
type SubdivisionType = "none" | "8th" | "triplet" | "16th";

interface BeatConfig {
  // 0 = muet, 1 = faible, 2 = fort
  accent: 0 | 1 | 2;
}

interface PolyTrack {
  id: string;
  label: string;
  numerator: number;
  beats: BeatConfig[];
  sound: SoundType;
  volume: number;
  active: boolean;
}

// ─── Constantes ───────────────────────────────────────────────
const BPM_MIN = 20;
const BPM_MAX = 300;

const TIME_SIGS = [
  { num: 2, den: 4 },
  { num: 3, den: 4 },
  { num: 4, den: 4 },
  { num: 5, den: 4 },
  { num: 6, den: 4 },
  { num: 7, den: 4 },
  { num: 6, den: 8 },
  { num: 7, den: 8 },
  { num: 9, den: 8 },
  { num: 12, den: 8 },
];

const SUBDIVISIONS: { id: SubdivisionType; label: string; ratio: number }[] = [
  { id: "none", label: "♩", ratio: 1 },
  { id: "8th", label: "♩♪", ratio: 2 },
  { id: "triplet", label: "3", ratio: 3 },
  { id: "16th", label: "♬", ratio: 4 },
];

const SOUND_LABELS: Record<SoundType, string> = {
  click: "Clic",
  woodblock: "Wood",
  beep: "Bip",
  sine: "Sine",
  rimshot: "Rim",
};

// ─── Web Audio — synthèse de sons ────────────────────────────
function createAudioContext(): AudioContext {
  return new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  )();
}

function playSound(
  ctx: AudioContext,
  type: SoundType,
  isAccent: boolean,
  isSub: boolean,
  volume: number,
  time: number,
) {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  const vol = isSub ? volume * 0.35 : isAccent ? volume * 1.0 : volume * 0.65;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.002);

  if (type === "click" || type === "rimshot") {
    // Bruit filtré court
    const bufSize = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = isAccent ? "bandpass" : "highpass";
    filter.frequency.value =
      type === "rimshot" ? (isAccent ? 900 : 700) : isAccent ? 1800 : 2400;
    filter.Q.value = isAccent ? 3 : 1.5;
    src.connect(filter);
    filter.connect(gain);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + (isAccent ? 0.06 : 0.04),
    );
    src.start(time);
    src.stop(time + 0.08);
  } else if (type === "woodblock") {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(isAccent ? 800 : 600, time);
    osc.frequency.exponentialRampToValueAtTime(
      isAccent ? 400 : 300,
      time + 0.04,
    );
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.start(time);
    osc.stop(time + 0.08);
  } else if (type === "beep") {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = isAccent ? 1200 : isSub ? 600 : 900;
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + (isAccent ? 0.06 : 0.04),
    );
    osc.start(time);
    osc.stop(time + 0.08);
  } else if (type === "sine") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = isAccent ? 880 : isSub ? 440 : 660;
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + (isAccent ? 0.08 : 0.05),
    );
    osc.start(time);
    osc.stop(time + 0.1);
  }
}

// ─── Hook métronome ───────────────────────────────────────────
function useMetronome(params: {
  bpm: number;
  numerator: number;
  denominator: number;
  subdivision: SubdivisionType;
  beats: BeatConfig[];
  sound: SoundType;
  masterVolume: number;
  accentVolume: number;
  weakVolume: number;
  polyTracks: PolyTrack[];
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [currentSub, setCurrentSub] = useState(-1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const currentSubRef = useRef(0);
  const schedulerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const scheduleNote = useCallback(
    (beatIndex: number, subIndex: number, time: number) => {
      const p = paramsRef.current;
      const ctx = audioCtxRef.current!;
      const subRatio = SUBDIVISIONS.find((s) => s.id === p.subdivision)!.ratio;
      const isMainBeat = subIndex === 0;
      const isSub = !isMainBeat;

      if (isMainBeat) {
        const beatCfg = p.beats[beatIndex % p.numerator];
        const isAccent = beatCfg?.accent === 2;
        const isMuted = beatCfg?.accent === 0;
        if (!isMuted) {
          const vol = isAccent
            ? p.accentVolume * p.masterVolume
            : p.weakVolume * p.masterVolume;
          playSound(ctx, p.sound, isAccent, false, vol, time);
        }
      } else {
        // Subdivision
        playSound(ctx, p.sound, false, true, p.masterVolume * 0.3, time);
      }

      // Poly tracks
      if (isMainBeat) {
        p.polyTracks.forEach((track) => {
          if (!track.active) return;
          const tBeat = p.beats.length > 0 ? beatIndex % track.numerator : 0;
          const tCfg = track.beats[tBeat % track.beats.length];
          const isAccent = tCfg?.accent === 2;
          const isMuted = tCfg?.accent === 0;
          if (!isMuted) {
            playSound(
              ctx,
              track.sound,
              isAccent,
              false,
              track.volume * p.masterVolume,
              time,
            );
          }
        });
      }

      // Mise à jour visuelle (approximation via setTimeout)
      const delay = (time - ctx.currentTime) * 1000;
      setTimeout(
        () => {
          if (isMainBeat)
            setCurrentBeat(beatIndex % paramsRef.current.numerator);
          setCurrentSub(subIndex);
        },
        Math.max(0, delay),
      );
    },
    [],
  );

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const p = paramsRef.current;
    const subRatio = SUBDIVISIONS.find((s) => s.id === p.subdivision)!.ratio;
    const secPerBeat = 60.0 / p.bpm;
    const secPerSub = secPerBeat / subRatio;
    const scheduleAhead = 0.1; // secondes

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAhead) {
      scheduleNote(
        currentBeatRef.current,
        currentSubRef.current,
        nextNoteTimeRef.current,
      );

      nextNoteTimeRef.current += secPerSub;
      currentSubRef.current++;
      if (currentSubRef.current >= subRatio) {
        currentSubRef.current = 0;
        currentBeatRef.current = (currentBeatRef.current + 1) % p.numerator;
      }
    }

    schedulerTimerRef.current = setTimeout(scheduler, 25);
  }, [scheduleNote]);

  const start = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioContext();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    currentBeatRef.current = 0;
    currentSubRef.current = 0;
    nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
    setCurrentBeat(0);
    setCurrentSub(0);
    setIsPlaying(true);
    scheduler();
  }, [scheduler]);

  const stop = useCallback(() => {
    if (schedulerTimerRef.current) clearTimeout(schedulerTimerRef.current);
    setIsPlaying(false);
    setCurrentBeat(-1);
    setCurrentSub(-1);
    currentBeatRef.current = 0;
    currentSubRef.current = 0;
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else start();
  }, [isPlaying, start, stop]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current) clearTimeout(schedulerTimerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  return { isPlaying, currentBeat, currentSub, toggle, start, stop };
}

// ─── Composants UI ────────────────────────────────────────────

// Slider stylisé
interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  color?: string;
  label?: string;
  showValue?: boolean;
}
function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  color,
  label,
  showValue,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1 w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <span
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: "hsl(220, 15%, 45%)" }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              className="text-[11px] font-mono font-bold"
              style={{ color: color ?? "hsl(var(--tl-accent-text))" }}
            >
              {value}
            </span>
          )}
        </div>
      )}
      <div className="relative h-5 flex items-center">
        <div
          className="w-full h-1.5 rounded-full relative"
          style={{ background: "hsl(222, 20%, 22%)" }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-none"
            style={{
              width: `${pct}%`,
              background: color ?? "hsl(var(--tl-accent-princ))",
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ margin: 0 }}
        />
      </div>
    </div>
  );
}

// Bouton beat accent (cycle muet → faible → fort)
interface BeatBtnProps {
  accent: 0 | 1 | 2;
  index: number;
  isActive: boolean;
  onChange: (a: 0 | 1 | 2) => void;
}
function BeatBtn({ accent, index, isActive, onChange }: BeatBtnProps) {
  const cycle = () => onChange(((accent + 1) % 3) as 0 | 1 | 2);
  const colors = {
    0: {
      bg: "hsl(222, 18%, 18%)",
      border: "hsl(220, 15%, 26%)",
      dot: "hsl(220, 15%, 30%)",
    },
    1: {
      bg: isActive ? "hsl(200, 55%, 28%)" : "hsl(200, 35%, 22%)",
      border: "hsl(200, 55%, 40%)",
      dot: "hsl(200, 70%, 65%)",
    },
    2: {
      bg: isActive
        ? "hsl(var(--tl-accent-h) 55% 30%)"
        : "hsl(var(--tl-accent-h) 35% 22%)",
      border: "hsl(var(--tl-accent-border))",
      dot: "hsl(var(--tl-accent-text))",
    },
  }[accent];

  return (
    <button
      onClick={cycle}
      className="flex flex-col items-center gap-1 rounded-lg transition-all select-none"
      style={{
        flex: "1 1 0",
        minWidth: "28px",
        maxWidth: "52px",
        padding: "8px 4px",
        background: colors.bg,
        border: `1px solid ${isActive ? colors.border : "hsl(220, 15%, 22%)"}`,
        boxShadow: isActive && accent > 0 ? `0 0 8px ${colors.dot}44` : "none",
        transform: isActive ? "scale(1.06)" : "scale(1)",
      }}
    >
      <span
        className="text-[9px] font-semibold"
        style={{ color: "hsl(220, 15%, 40%)" }}
      >
        {index + 1}
      </span>
      <div
        className="w-2.5 h-2.5 rounded-full transition-all"
        style={{
          background: colors.dot,
          boxShadow: isActive && accent > 0 ? `0 0 6px ${colors.dot}` : "none",
        }}
      />
    </button>
  );
}

// Indicateur de tempo animé
function TempoVisualizer({
  currentBeat,
  numerator,
  isPlaying,
  currentSub,
  subdivision,
}: {
  currentBeat: number;
  numerator: number;
  isPlaying: boolean;
  currentSub: number;
  subdivision: SubdivisionType;
}) {
  const subRatio = SUBDIVISIONS.find((s) => s.id === subdivision)!.ratio;

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {Array.from({ length: numerator }).map((_, i) => {
        const isActive = isPlaying && currentBeat === i;
        const isNext = isPlaying && (currentBeat + 1) % numerator === i;
        return (
          <div key={i} className="relative flex items-center justify-center">
            {/* Cercle principal */}
            <div
              className="rounded-full transition-all duration-75"
              style={{
                width: isActive ? "20px" : "14px",
                height: isActive ? "20px" : "14px",
                background: isActive
                  ? i === 0
                    ? "hsl(var(--tl-accent-text))"
                    : "hsl(200, 70%, 65%)"
                  : "hsl(222, 18%, 22%)",
                boxShadow: isActive
                  ? `0 0 12px ${i === 0 ? "hsl(var(--tl-accent-text))" : "hsl(200, 70%, 65%)"}88`
                  : "none",
                border: isActive
                  ? "none"
                  : `1.5px solid ${isNext ? "hsl(220, 15%, 35%)" : "hsl(220, 15%, 25%)"}`,
              }}
            />
            {/* Points de subdivision */}
            {subRatio > 1 && isActive && (
              <div className="absolute -bottom-4 flex gap-0.5">
                {Array.from({ length: subRatio - 1 }).map((_, si) => (
                  <div
                    key={si}
                    className="rounded-full transition-all duration-50"
                    style={{
                      width: "4px",
                      height: "4px",
                      background:
                        currentSub === si + 1
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(220, 15%, 28%)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────
export function Metronome() {
  // ── État principal ────────────────────────────────────────
  const [bpm, setBpm] = useState(120);
  const [bpmInput, setBpmInput] = useState("120");
  const [numerator, setNumerator] = useState(4);
  const [denominator, setDenominator] = useState(4);
  const [subdivision, setSubdivision] = useState<SubdivisionType>("none");
  const [sound, setSound] = useState<SoundType>("click");
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [accentVolume, setAccentVolume] = useState(1.0);
  const [weakVolume, setWeakVolume] = useState(0.65);

  // Beats configuration
  const [beats, setBeats] = useState<BeatConfig[]>(() =>
    Array.from(
      { length: 4 },
      (_, i) => ({ accent: i === 0 ? 2 : 1 }) as BeatConfig,
    ),
  );

  // Poly tracks
  const [polyEnabled, setPolyEnabled] = useState(false);
  const [polyTracks, setPolyTracks] = useState<PolyTrack[]>([
    {
      id: "poly1",
      label: "Voix B",
      numerator: 3,
      beats: [{ accent: 2 }, { accent: 1 }, { accent: 1 }],
      sound: "woodblock",
      volume: 0.6,
      active: true,
    },
  ]);

  // Tap tempo
  const tapTimesRef = useRef<number[]>([]);
  const [tapFlash, setTapFlash] = useState(false);

  // ── Synchro beats quand numerator change ────────────────
  useEffect(() => {
    setBeats((prev) => {
      const next = Array.from({ length: numerator }, (_, i) => {
        if (i < prev.length) return prev[i];
        return { accent: 1 } as BeatConfig;
      });
      if (next[0]?.accent !== 2) next[0] = { accent: 2 };
      return next;
    });
  }, [numerator]);

  // ── Métronome hook ────────────────────────────────────────
  const metro = useMetronome({
    bpm,
    numerator,
    denominator,
    subdivision,
    beats,
    sound,
    masterVolume,
    accentVolume,
    weakVolume,
    polyTracks: polyEnabled ? polyTracks : [],
  });

  // ── Raccourci clavier Espace ──────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        metro.toggle();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [metro]);

  // ── Tap Tempo ─────────────────────────────────────────────
  function handleTap() {
    const now = performance.now();
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 80);

    const taps = tapTimesRef.current;
    taps.push(now);

    // Garde max 8 taps, réinitialise si pause > 3s
    if (taps.length > 1 && now - taps[taps.length - 2] > 3000) {
      tapTimesRef.current = [now];
      return;
    }
    if (taps.length > 8) taps.shift();

    if (taps.length >= 2) {
      const intervals = taps.slice(1).map((t, i) => t - taps[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avg);
      const clamped = Math.min(Math.max(newBpm, BPM_MIN), BPM_MAX);
      setBpm(clamped);
      setBpmInput(String(clamped));
    }
  }

  // ── BPM input ──────────────────────────────────────────────
  function handleBpmInput(val: string) {
    setBpmInput(val);
    const n = parseInt(val);
    if (!isNaN(n) && n >= BPM_MIN && n <= BPM_MAX) setBpm(n);
  }

  function handleBpmBlur() {
    const n = parseInt(bpmInput);
    if (isNaN(n) || n < BPM_MIN || n > BPM_MAX) {
      setBpmInput(String(bpm));
    } else {
      setBpm(Math.min(Math.max(n, BPM_MIN), BPM_MAX));
      setBpmInput(String(Math.min(Math.max(n, BPM_MIN), BPM_MAX)));
    }
  }

  // ── Beat accent ────────────────────────────────────────────
  function setBeatAccent(i: number, accent: 0 | 1 | 2) {
    setBeats((prev) => prev.map((b, idx) => (idx === i ? { accent } : b)));
  }

  // ── Tempo label ────────────────────────────────────────────
  function tempoLabel(b: number) {
    if (b < 40) return "Grave";
    if (b < 60) return "Largo";
    if (b < 66) return "Larghetto";
    if (b < 76) return "Adagio";
    if (b < 108) return "Andante";
    if (b < 120) return "Moderato";
    if (b < 156) return "Allegro";
    if (b < 176) return "Vivace";
    if (b < 200) return "Presto";
    return "Prestissimo";
  }

  // ── Poly track helpers ─────────────────────────────────────
  function updatePolyTrack(id: string, patch: Partial<PolyTrack>) {
    setPolyTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }

  function updatePolyBeat(trackId: string, beatIdx: number, accent: 0 | 1 | 2) {
    setPolyTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? {
              ...t,
              beats: t.beats.map((b, i) => (i === beatIdx ? { accent } : b)),
            }
          : t,
      ),
    );
  }

  function setPolyNumerator(trackId: string, n: number) {
    setPolyTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const newBeats = Array.from({ length: n }, (_, i) =>
          i < t.beats.length ? t.beats[i] : ({ accent: 1 } as BeatConfig),
        );
        if (newBeats[0]?.accent !== 2) newBeats[0] = { accent: 2 };
        return { ...t, numerator: n, beats: newBeats };
      }),
    );
  }

  // ── Styles réutilisables ──────────────────────────────────
  const sectionTitle = {
    fontSize: "10px",
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: "hsl(220, 15%, 42%)",
    marginBottom: "10px",
  };

  const card = {
    background: "hsl(222, 20%, 12%)",
    border: "1px solid hsl(220, 15%, 18%)",
    borderRadius: "12px",
    padding: "16px",
  };

  // ── Rendu ─────────────────────────────────────────────────
  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: "hsl(222, 22%, 9%)" }}
    >
      <div
        style={{
          width: "100%",
          padding: "15px 100px",
        }}
      >
        {/* ══════════ HEADER ══════════ */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1
              className="text-lg font-bold"
              style={{ color: "hsl(210, 30%, 88%)" }}
            >
              Métronome
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "hsl(220, 15%, 42%)" }}
            >
              Appuyez sur{" "}
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  background: "hsl(222, 18%, 20%)",
                  border: "1px solid hsl(220, 15%, 28%)",
                  color: "hsl(220, 15%, 55%)",
                }}
              >
                Espace
              </kbd>{" "}
              pour démarrer / arrêter
            </p>
          </div>

          {/* Play / Stop */}
          <button
            onClick={metro.toggle}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: metro.isPlaying
                ? "hsl(0, 55%, 30%)"
                : "hsl(var(--tl-accent-button))",
              border: metro.isPlaying
                ? "1px solid hsl(0, 55%, 45%)"
                : "1px solid hsl(var(--tl-accent-button-border))",
              color: metro.isPlaying
                ? "hsl(0, 80%, 85%)"
                : "hsl(var(--tl-accent-text))",
              boxShadow: metro.isPlaying
                ? "0 0 20px hsl(0, 55%, 30%)66"
                : "0 0 16px hsl(var(--tl-accent-h) 60% 35% / 0.4)",
            }}
          >
            {metro.isPlaying ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                >
                  <rect x="2" y="2" width="4" height="10" rx="1" />
                  <rect x="8" y="2" width="4" height="10" rx="1" />
                </svg>
                Stop
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                >
                  <path d="M3 2l9 5-9 5V2z" />
                </svg>
                Jouer
              </>
            )}
          </button>
        </div>

        {/* ══════════ GRILLE PRINCIPALE ══════════ */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* ── COLONNE GAUCHE ── */}
          <div className="flex flex-col gap-4">
            {/* BPM */}
            <div style={card}>
              <p style={sectionTitle}>Tempo</p>

              {/* Grand affichage BPM */}
              <div className="flex items-baseline gap-3 mb-4">
                <div style={{ position: "relative" }}>
                  <LedDisplay value={bpm} />

                  <input
                    type="text"
                    value={bpmInput}
                    onChange={(e) => handleBpmInput(e.target.value)}
                    onBlur={handleBpmBlur}
                    className="absolute inset-0 opacity-0 cursor-text"
                  />
                </div>
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "hsl(220, 15%, 40%)" }}
                  >
                    BPM
                  </p>
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: "hsl(var(--tl-accent-terc))" }}
                  >
                    {tempoLabel(bpm)}
                  </p>
                </div>
              </div>

              {/* Slider BPM */}
              <Slider
                value={bpm}
                min={BPM_MIN}
                max={BPM_MAX}
                onChange={(v) => {
                  setBpm(v);
                  setBpmInput(String(v));
                }}
              />

              {/* Boutons rapides BPM */}
              <div className="flex gap-1.5 mt-3">
                {[60, 80, 100, 120, 140, 160].map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setBpm(b);
                      setBpmInput(String(b));
                    }}
                    className="flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      background:
                        bpm === b
                          ? "hsl(var(--tl-accent-dim))"
                          : "hsl(222, 18%, 18%)",
                      border:
                        bpm === b
                          ? "1px solid hsl(var(--tl-accent-border))"
                          : "1px solid hsl(220, 15%, 22%)",
                      color:
                        bpm === b
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(220, 15%, 45%)",
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* BPM ±1 ±5 */}
              <div className="flex gap-2 mt-3">
                {[-5, -1, +1, +5].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      const v = Math.min(Math.max(bpm + d, BPM_MIN), BPM_MAX);
                      setBpm(v);
                      setBpmInput(String(v));
                    }}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: "hsl(222, 18%, 16%)",
                      border: "1px solid hsl(220, 15%, 22%)",
                      color: "hsl(215, 15%, 65%)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "hsl(222, 18%, 22%)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "hsl(222, 18%, 16%)";
                    }}
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>

              {/* Tap Tempo */}
              <button
                onClick={handleTap}
                className="w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition-all select-none"
                style={{
                  background: tapFlash
                    ? "hsl(var(--tl-accent-mid))"
                    : "hsl(222, 20%, 17%)",
                  border: `1px solid ${tapFlash ? "hsl(var(--tl-accent-border))" : "hsl(220, 15%, 26%)"}`,
                  color: tapFlash
                    ? "hsl(var(--tl-accent-text))"
                    : "hsl(215, 15%, 60%)",
                  boxShadow: tapFlash
                    ? "0 0 16px hsl(var(--tl-accent-h) 60% 50% / 0.35)"
                    : "none",
                  transition: "background 0.05s, box-shadow 0.05s",
                }}
              >
                ✦ Tap Tempo
              </button>
            </div>

            {/* Son + Volume */}
            <div style={card}>
              <p style={sectionTitle}>Son & Volume</p>

              {/* Choix du son */}
              <div className="grid grid-cols-5 gap-1.5 mb-4">
                {(Object.keys(SOUND_LABELS) as SoundType[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSound(s)}
                    className="py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      background:
                        sound === s
                          ? "hsl(var(--tl-accent-dim))"
                          : "hsl(222, 18%, 17%)",
                      border:
                        sound === s
                          ? "1px solid hsl(var(--tl-accent-border))"
                          : "1px solid transparent",
                      color:
                        sound === s
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(220, 15%, 50%)",
                    }}
                  >
                    {SOUND_LABELS[s]}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Slider
                  value={Math.round(masterVolume * 100)}
                  min={0}
                  max={100}
                  onChange={(v) => setMasterVolume(v / 100)}
                  label="Volume général"
                  showValue
                  color="hsl(var(--tl-accent-princ))"
                />
                <Slider
                  value={Math.round(accentVolume * 100)}
                  min={0}
                  max={100}
                  onChange={(v) => setAccentVolume(v / 100)}
                  label="Accent (temps fort)"
                  showValue
                  color="hsl(var(--tl-accent-text))"
                />
                <Slider
                  value={Math.round(weakVolume * 100)}
                  min={0}
                  max={100}
                  onChange={(v) => setWeakVolume(v / 100)}
                  label="Temps faible"
                  showValue
                  color="hsl(200, 60%, 60%)"
                />
              </div>
            </div>
          </div>

          {/* ── COLONNE DROITE ── */}
          <div className="flex flex-col gap-2">
            {/* Visualiseur + Signature + Subdivisions */}
            <div style={card}>
              <p style={sectionTitle}>Pulsation</p>

              {/* Visualiseur */}
              <div className="mb-1 min-h-[40px]">
                <TempoVisualizer
                  currentBeat={metro.currentBeat}
                  currentSub={metro.currentSub}
                  numerator={numerator}
                  isPlaying={metro.isPlaying}
                  subdivision={subdivision}
                />
              </div>

              {/* Signature rythmique */}
              <p style={{ ...sectionTitle, marginBottom: "8px" }}>
                Signature rythmique
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {TIME_SIGS.map(({ num, den }) => {
                  const actif = num === numerator && den === denominator;
                  return (
                    <button
                      key={`${num}/${den}`}
                      onClick={() => {
                        setNumerator(num);
                        setDenominator(den);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: actif
                          ? "hsl(var(--tl-accent-dim))"
                          : "hsl(222, 18%, 17%)",
                        border: actif
                          ? "1px solid hsl(var(--tl-accent-border))"
                          : "1px solid transparent",
                        color: actif
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(220, 15%, 50%)",
                        fontFamily: "monospace",
                      }}
                    >
                      {num}/{den}
                    </button>
                  );
                })}
              </div>

              {/* Subdivisions */}
              <p style={{ ...sectionTitle, marginBottom: "8px" }}>
                Subdivision
              </p>
              <div className="flex gap-1.5">
                {SUBDIVISIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubdivision(s.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background:
                        subdivision === s.id
                          ? "hsl(var(--tl-accent-dim))"
                          : "hsl(222, 18%, 17%)",
                      border:
                        subdivision === s.id
                          ? "1px solid hsl(var(--tl-accent-border))"
                          : "1px solid transparent",
                      color:
                        subdivision === s.id
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(220, 15%, 50%)",
                      fontFamily: "monospace",
                      fontSize: "13px",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Éditeur de beats */}
            <div style={card}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ ...sectionTitle, marginBottom: 0 }}>
                  Accents par temps
                </p>
                <div
                  className="flex gap-2 text-[9px]"
                  style={{ color: "hsl(220, 15%, 35%)" }}
                >
                  <span>Clic = cycle muet / faible / fort</span>
                </div>
              </div>

              {/* Légende */}
              <div className="flex gap-2 mb-3 text-[9px]">
                {[
                  { accent: 0, label: "Muet" },
                  { accent: 1, label: "Faible" },
                  { accent: 2, label: "Fort" },
                ].map(({ accent, label }) => (
                  <div key={accent} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          accent === 0
                            ? "hsl(220, 15%, 28%)"
                            : accent === 1
                              ? "hsl(200, 70%, 65%)"
                              : "hsl(var(--tl-accent-text))",
                      }}
                    />
                    <span style={{ color: "hsl(220, 15%, 40%)" }}>{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {beats.map((b, i) => (
                  <BeatBtn
                    key={i}
                    index={i}
                    accent={b.accent}
                    isActive={metro.isPlaying && metro.currentBeat === i}
                    onChange={(a) => setBeatAccent(i, a)}
                  />
                ))}
              </div>

              {/* Boutons rapides accent */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    setBeats(
                      beats.map(
                        (_, i) => ({ accent: i === 0 ? 2 : 1 }) as BeatConfig,
                      ),
                    )
                  }
                  className="flex-1 py-1 rounded-lg text-[10px]"
                  style={{
                    background: "hsl(222, 18%, 17%)",
                    border: "1px solid hsl(220, 15%, 22%)",
                    color: "hsl(220, 15%, 50%)",
                  }}
                >
                  Défaut
                </button>
                <button
                  onClick={() =>
                    setBeats(beats.map(() => ({ accent: 2 }) as BeatConfig))
                  }
                  className="flex-1 py-1 rounded-lg text-[10px]"
                  style={{
                    background: "hsl(222, 18%, 17%)",
                    border: "1px solid hsl(220, 15%, 22%)",
                    color: "hsl(220, 15%, 50%)",
                  }}
                >
                  Tout fort
                </button>
                <button
                  onClick={() =>
                    setBeats(beats.map(() => ({ accent: 1 }) as BeatConfig))
                  }
                  className="flex-1 py-1 rounded-lg text-[10px]"
                  style={{
                    background: "hsl(222, 18%, 17%)",
                    border: "1px solid hsl(220, 15%, 22%)",
                    color: "hsl(220, 15%, 50%)",
                  }}
                >
                  Flat
                </button>
                <button
                  onClick={() =>
                    setBeats(beats.map(() => ({ accent: 0 }) as BeatConfig))
                  }
                  className="flex-1 py-1 rounded-lg text-[10px]"
                  style={{
                    background: "hsl(222, 18%, 17%)",
                    border: "1px solid hsl(220, 15%, 22%)",
                    color: "hsl(220, 15%, 50%)",
                  }}
                >
                  Tout muet
                </button>
              </div>
            </div>

            {/* ══════════ POLYMÈTRE ══════════ */}
            <div style={{ ...card, marginTop: "1px" }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p style={{ ...sectionTitle, marginBottom: 0 }}>Polymètre</p>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "hsl(var(--tl-accent-dim))",
                      color: "hsl(var(--tl-accent-text))",
                      border: "1px solid hsl(var(--tl-accent-border))",
                    }}
                  >
                    Piste B indépendante
                  </span>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => setPolyEnabled(!polyEnabled)}
                  className="relative w-9 h-6 rounded-full transition-all"
                  style={{
                    background: polyEnabled
                      ? "hsl(var(--tl-accent-button))"
                      : "hsl(222, 18%, 22%)",
                    border: polyEnabled
                      ? "1px solid hsl(var(--tl-accent-button-border))"
                      : "1px solid hsl(220, 15%, 28%)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{
                      left: polyEnabled ? "calc(100% - 18px)" : "2px",
                      background: polyEnabled
                        ? "hsl(var(--tl-accent-text))"
                        : "hsl(220, 15%, 40%)",
                    }}
                  />
                </button>
              </div>

              {polyEnabled &&
                polyTracks.map((track) => (
                  <div
                    key={track.id}
                    className="rounded-xl p-3 mt-2"
                    style={{
                      background: "hsl(222, 18%, 15%)",
                      border: "1px solid hsl(220, 15%, 20%)",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="text-xs font-bold"
                        style={{ color: "hsl(215, 15%, 65%)" }}
                      >
                        {track.label}
                      </span>

                      {/* Nombre de temps */}
                      <div className="flex items-center gap-1">
                        <span
                          className="text-[10px]"
                          style={{ color: "hsl(220, 15%, 40%)" }}
                        >
                          Temps :
                        </span>
                        {[2, 3, 4, 5, 6, 7].map((n) => (
                          <button
                            key={n}
                            onClick={() => setPolyNumerator(track.id, n)}
                            className="w-6 h-6 rounded text-[10px] font-bold transition-all"
                            style={{
                              background:
                                track.numerator === n
                                  ? "hsl(var(--tl-accent-dim))"
                                  : "hsl(222, 18%, 20%)",
                              border:
                                track.numerator === n
                                  ? "1px solid hsl(var(--tl-accent-border))"
                                  : "1px solid transparent",
                              color:
                                track.numerator === n
                                  ? "hsl(var(--tl-accent-text))"
                                  : "hsl(220, 15%, 45%)",
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>

                      {/* Son piste B */}
                      <div className="flex items-center gap-1 ml-auto">
                        <span
                          className="text-[10px]"
                          style={{ color: "hsl(220, 15%, 40%)" }}
                        >
                          Son :
                        </span>
                        {(Object.keys(SOUND_LABELS) as SoundType[]).map((s) => (
                          <button
                            key={s}
                            onClick={() =>
                              updatePolyTrack(track.id, { sound: s })
                            }
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all"
                            style={{
                              background:
                                track.sound === s
                                  ? "hsl(var(--tl-accent-dim))"
                                  : "transparent",
                              color:
                                track.sound === s
                                  ? "hsl(var(--tl-accent-text))"
                                  : "hsl(220, 15%, 40%)",
                            }}
                          >
                            {SOUND_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Beats piste B */}
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {track.beats.map((b, i) => (
                        <BeatBtn
                          key={i}
                          index={i}
                          accent={b.accent}
                          isActive={
                            metro.isPlaying &&
                            metro.currentBeat % track.numerator === i
                          }
                          onChange={(a) => updatePolyBeat(track.id, i, a)}
                        />
                      ))}
                    </div>

                    {/* Volume piste B */}
                    <Slider
                      value={Math.round(track.volume * 100)}
                      min={0}
                      max={100}
                      onChange={(v) =>
                        updatePolyTrack(track.id, { volume: v / 100 })
                      }
                      label="Volume piste B"
                      showValue
                      color="hsl(200, 60%, 60%)"
                    />
                  </div>
                ))}

              {!polyEnabled && (
                <p
                  className="text-xs text-center py-3"
                  style={{ color: "hsl(220, 15%, 32%)" }}
                >
                  Activez pour superposer une deuxième pulsation avec une
                  signature différente
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
