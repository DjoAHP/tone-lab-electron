// src/components/Metronome.tsx
// Métronome premium — Web Audio API, pas de dépendances externes

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { LedDisplay } from "./led-display/LedDisplay";
import metronomeService from "../services/metronomeService";
import type { MetronomeServiceState } from "../types";

// ─── Types ───────────────────────────────────────────────────
type SoundType = "click" | "woodblock" | "beep" | "sine" | "rimshot";
type SubdivisionType = "none" | "8th" | "triplet" | "16th";

interface BeatConfig {
  // 0 = muet, 1 = faible, 2 = fort
  accent: 0 | 1 | 2;
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
  // Initialisation depuis le service (persistance)
  const initialState = metronomeService.getState();

  // ── État principal ────────────────────────────────────────
  const [bpm, setBpm] = useState(initialState.bpm ?? 120);
  const [bpmInput, setBpmInput] = useState(String(initialState.bpm ?? 120));
  const [numerator, setNumerator] = useState(initialState.numerator ?? 4);
  const [denominator, setDenominator] = useState(initialState.denominator ?? 4);
  const [subdivision, setSubdivision] = useState<SubdivisionType>(initialState.subdivision ?? "none");
  const [sound, setSound] = useState<SoundType>(initialState.sound ?? "click");
  const [masterVolume, setMasterVolume] = useState(initialState.masterVolume ?? 0.8);
  const [accentVolume, setAccentVolume] = useState(initialState.accentVolume ?? 1.0);
  const [weakVolume, setWeakVolume] = useState(initialState.weakVolume ?? 0.65);

  // Beats configuration - initialisation depuis le service
  const [beats, setBeats] = useState<BeatConfig[]>(() => {
    if (initialState.beats && initialState.beats.length > 0) return initialState.beats;
    return Array.from(
      { length: numerator },
      (_, i) => ({ accent: i === 0 ? 2 : 1 }) as BeatConfig,
    );
  });

  // État local synchronisé avec le service
  const [isPlaying, setIsPlaying] = useState(metronomeService.getState().isPlaying);
  const [currentBeat, setCurrentBeat] = useState(metronomeService.getState().currentBeat);
  const [currentSub, setCurrentSub] = useState(metronomeService.getState().currentSub);

  // Écouter les changements du service
  useEffect(() => {
    const listener = (state: MetronomeServiceState) => {
      setIsPlaying(state.isPlaying);
      setCurrentBeat(state.currentBeat);
      setCurrentSub(state.currentSub);
    };
    metronomeService.onStateChange(listener);
    return () => { metronomeService.offStateChange(listener); };
  }, []);

  // Synchronisation avec le service
  useEffect(() => { metronomeService.setBpm(bpm); }, [bpm]);
  useEffect(() => { metronomeService.setNumerator(numerator); }, [numerator]);
  useEffect(() => { metronomeService.setDenominator(denominator); }, [denominator]);
  useEffect(() => { metronomeService.setSubdivision(subdivision); }, [subdivision]);
  useEffect(() => { metronomeService.setBeats(beats); }, [beats]);
  useEffect(() => { metronomeService.setSound(sound); }, [sound]);
  useEffect(() => { metronomeService.setMasterVolume(masterVolume); }, [masterVolume]);
  useEffect(() => { metronomeService.setAccentVolume(accentVolume); }, [accentVolume]);
  useEffect(() => { metronomeService.setWeakVolume(weakVolume); }, [weakVolume]);
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

  const { ongletActif } = useApp();

  // ── Raccourci clavier Espace (uniquement si onglet Metro actif) ──────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (ongletActif !== "metro") return;
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        metronomeService.toggle();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ongletActif]);

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
            onClick={() => metronomeService.toggle()}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: isPlaying
                ? "hsl(0, 55%, 30%)"
                : "hsl(var(--tl-accent-button))",
              border: isPlaying
                ? "1px solid hsl(0, 55%, 45%)"
                : "1px solid hsl(var(--tl-accent-button-border))",
              color: isPlaying
                ? "hsl(0, 80%, 85%)"
                : "hsl(var(--tl-accent-text))",
              boxShadow: isPlaying
                ? "0 0 20px hsl(0, 55%, 30%)66"
                : "0 0 16px hsl(var(--tl-accent-h) 60% 35% / 0.4)",
            }}
          >
            {isPlaying ? (
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
                  currentBeat={currentBeat}
                  currentSub={currentSub}
                  numerator={numerator}
                  isPlaying={isPlaying}
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
                    isActive={isPlaying && currentBeat === i}
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
          </div>
        </div>
      </div>
    </div>
  );
}
