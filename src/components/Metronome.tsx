
import React, { useEffect, useRef, useState } from "react";
import { LedDisplay } from "./led-display/LedDisplay";
import metronomeService from "../services/metronomeService";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type SoundType = "click" | "woodblock" | "beep" | "sine" | "rimshot";
type SubdivisionType = "none" | "8th" | "triplet" | "16th";

interface BeatConfig {
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

interface MetronomeState {
  isPlaying: boolean;
  currentBeat: number;
  currentSub: number;
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
}

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────

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
] as const;

const SUBDIVISIONS: {
  id: SubdivisionType;
  label: string;
  ratio: number;
}[] = [
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

// ─────────────────────────────────────────────────────────────
// Slider UI
// ─────────────────────────────────────────────────────────────

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
            className="absolute left-0 top-0 h-full rounded-full"
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
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat button
// ─────────────────────────────────────────────────────────────

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
      type="button"
      onClick={cycle}
      className="flex flex-col items-center gap-1 rounded-lg transition-all select-none"
      style={{
        flex: "1 1 0",
        minWidth: "28px",
        maxWidth: "52px",
        padding: "8px 4px",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
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
        className="w-2.5 h-2.5 rounded-full"
        style={{
          background: colors.dot,
          boxShadow: isActive ? `0 0 8px ${colors.dot}` : "none",
        }}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Tempo Visualizer
// ─────────────────────────────────────────────────────────────

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
  const subRatio =
    SUBDIVISIONS.find((s) => s.id === subdivision)?.ratio ?? 1;

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {Array.from({ length: numerator }).map((_, i) => {
        const isActive = isPlaying && currentBeat === i;

        return (
          <div key={i} className="relative flex items-center justify-center">
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
                  ? "0 0 12px rgba(255,255,255,.4)"
                  : "none",
              }}
            />

            {subRatio > 1 && isActive && (
              <div className="absolute -bottom-4 flex gap-0.5">
                {Array.from({ length: subRatio - 1 }).map((_, si) => (
                  <div
                    key={si}
                    className="rounded-full"
                    style={{
                      width: 4,
                      height: 4,
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

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function Metronome() {
  const initialState = metronomeService.getState() as MetronomeState;

  const [bpm, setBpm] = useState(initialState.bpm ?? 120);
  const [bpmInput, setBpmInput] = useState(String(initialState.bpm ?? 120));
  const [numerator, setNumerator] = useState(initialState.numerator ?? 4);
  const [denominator, setDenominator] = useState(
    initialState.denominator ?? 4,
  );
  const [subdivision, setSubdivision] = useState<SubdivisionType>(
    initialState.subdivision ?? "none",
  );
  const [sound, setSound] = useState<SoundType>(
    initialState.sound ?? "click",
  );

  const [masterVolume, setMasterVolume] = useState(
    initialState.masterVolume ?? 0.8,
  );

  const [accentVolume, setAccentVolume] = useState(
    initialState.accentVolume ?? 1,
  );

  const [weakVolume, setWeakVolume] = useState(
    initialState.weakVolume ?? 0.65,
  );

  const [beats, setBeats] = useState<BeatConfig[]>(
    initialState.beats ??
      Array.from({ length: 4 }, (_, i) => ({
        accent: i === 0 ? 2 : 1,
      })),
  );

  const [polyEnabled, setPolyEnabled] = useState(false);

  const [polyTracks, setPolyTracks] = useState<PolyTrack[]>(
    initialState.polyTracks ?? [
      {
        id: "poly1",
        label: "Voix B",
        numerator: 3,
        beats: [{ accent: 2 }, { accent: 1 }, { accent: 1 }],
        sound: "woodblock",
        volume: 0.6,
        active: true,
      },
    ],
  );

  const [isPlaying, setIsPlaying] = useState(
    initialState.isPlaying ?? false,
  );

  const [currentBeat, setCurrentBeat] = useState(
    initialState.currentBeat ?? 0,
  );

  const [currentSub, setCurrentSub] = useState(
    initialState.currentSub ?? 0,
  );

  const tapTimesRef = useRef<number[]>([]);
  const [tapFlash, setTapFlash] = useState(false);

  // ───────────────────────────────────────────────────────────
  // Sync beats when numerator changes
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    setBeats((prev) => {
      const next = Array.from({ length: numerator }, (_, i) => {
        return prev[i] ?? { accent: i === 0 ? 2 : 1 } as BeatConfig;
      });

      next[0] = { accent: 2 } as BeatConfig;
      return next;
    });
  }, [numerator]);

  // ───────────────────────────────────────────────────────────
  // Service sync
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    const listener = (state: MetronomeState) => {
      setIsPlaying(state.isPlaying);
      setCurrentBeat(state.currentBeat);
      setCurrentSub(state.currentSub);
    };

    metronomeService.onStateChange(listener);

    return () => {
      metronomeService.offStateChange(listener);
    };
  }, []);

  // ───────────────────────────────────────────────────────────
  // Keyboard shortcut
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        metronomeService.toggle();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // ───────────────────────────────────────────────────────────
  // Service updates
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    metronomeService.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    metronomeService.setNumerator(numerator);
    metronomeService.setDenominator(denominator);
  }, [numerator, denominator]);

  useEffect(() => {
    metronomeService.setSubdivision(subdivision);
  }, [subdivision]);

  useEffect(() => {
    metronomeService.setSound(sound);
  }, [sound]);

  useEffect(() => {
    metronomeService.setMasterVolume(masterVolume);
    metronomeService.setAccentVolume(accentVolume);
    metronomeService.setWeakVolume(weakVolume);
  }, [masterVolume, accentVolume, weakVolume]);

  useEffect(() => {
    metronomeService.setBeats(beats);
  }, [beats]);

  useEffect(() => {
    metronomeService.setPolyTracks(polyTracks);
  }, [polyTracks]);

  // ───────────────────────────────────────────────────────────
  // Tap Tempo
  // ───────────────────────────────────────────────────────────

  function handleTap() {
    const now = performance.now();

    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 80);

    const taps = tapTimesRef.current;

    if (taps.length > 0 && now - taps[taps.length - 1] > 3000) {
      tapTimesRef.current = [now];
      return;
    }

    taps.push(now);

    if (taps.length > 8) {
      taps.shift();
    }

    if (taps.length >= 2) {
      const intervals = taps.slice(1).map((t, i) => t - taps[i]);

      const avg =
        intervals.reduce((acc, value) => acc + value, 0) /
        intervals.length;

      const nextBpm = Math.round(60000 / avg);

      const clamped = Math.max(BPM_MIN, Math.min(BPM_MAX, nextBpm));

      setBpm(clamped);
      setBpmInput(String(clamped));
    }
  }

  // ───────────────────────────────────────────────────────────
  // BPM input
  // ───────────────────────────────────────────────────────────

  function handleBpmInput(value: string) {
    setBpmInput(value);

    const parsed = parseInt(value, 10);

    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(BPM_MIN, Math.min(BPM_MAX, parsed));
      setBpm(clamped);
    }
  }

  function handleBpmBlur() {
    const parsed = parseInt(bpmInput, 10);

    if (Number.isNaN(parsed)) {
      setBpmInput(String(bpm));
      return;
    }

    const clamped = Math.max(BPM_MIN, Math.min(BPM_MAX, parsed));

    setBpm(clamped);
    setBpmInput(String(clamped));
  }

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────

  function setBeatAccent(index: number, accent: 0 | 1 | 2) {
    setBeats((prev) =>
      prev.map((beat, i) => (i === index ? { accent } : beat)),
    );
  }

  function updatePolyTrack(id: string, patch: Partial<PolyTrack>) {
    setPolyTracks((prev) =>
      prev.map((track) =>
        track.id === id ? { ...track, ...patch } : track,
      ),
    );
  }

  function updatePolyBeat(
    trackId: string,
    beatIndex: number,
    accent: 0 | 1 | 2,
  ) {
    setPolyTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) {
          return track;
        }

        return {
          ...track,
          beats: track.beats.map((beat, i) =>
            i === beatIndex ? { accent } : beat,
          ),
        };
      }),
    );
  }

  function setPolyNumerator(trackId: string, nextNumerator: number) {
    setPolyTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) {
          return track;
        }

        const nextBeats = Array.from(
          { length: nextNumerator },
          (_, i) => track.beats[i] ?? { accent: i === 0 ? 2 : 1 } as BeatConfig,
        );

        nextBeats[0] = { accent: 2 } as BeatConfig;

        return {
          ...track,
          numerator: nextNumerator,
          beats: nextBeats,
        } as PolyTrack;
      }),
    );
  }

  function tempoLabel(value: number) {
    if (value < 40) return "Grave";
    if (value < 60) return "Largo";
    if (value < 66) return "Larghetto";
    if (value < 76) return "Adagio";
    if (value < 108) return "Andante";
    if (value < 120) return "Moderato";
    if (value < 156) return "Allegro";
    if (value < 176) return "Vivace";
    if (value < 200) return "Presto";

    return "Prestissimo";
  }

  const sectionTitle = {
    fontSize: "10px",
    fontWeight: 700,
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

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

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
              Appuyez sur Espace pour démarrer / arrêter
            </p>
          </div>

          <button
            type="button"
            onClick={() => metronomeService.toggle()}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: isPlaying
                ? "hsl(0, 55%, 30%)"
                : "hsl(var(--tl-accent-button))",
              color: isPlaying
                ? "hsl(0, 80%, 85%)"
                : "hsl(var(--tl-accent-text))",
            }}
          >
            {isPlaying ? "Stop" : "Jouer"}
          </button>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="flex flex-col gap-4">
            <div style={card}>
              <p style={sectionTitle}>Tempo</p>

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

              <Slider
                value={bpm}
                min={BPM_MIN}
                max={BPM_MAX}
                onChange={(value) => {
                  setBpm(value);
                  setBpmInput(String(value));
                }}
              />

              <button
                type="button"
                onClick={handleTap}
                className="w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: tapFlash
                    ? "hsl(var(--tl-accent-mid))"
                    : "hsl(222, 20%, 17%)",
                  color: tapFlash
                    ? "hsl(var(--tl-accent-text))"
                    : "hsl(215, 15%, 60%)",
                }}
              >
                ✦ Tap Tempo
              </button>
            </div>

            <div style={card}>
              <p style={sectionTitle}>Son & Volume</p>

              <div className="grid grid-cols-5 gap-1.5 mb-4">
                {(Object.keys(SOUND_LABELS) as SoundType[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSound(s)}
                    className="py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      background:
                        sound === s
                          ? "hsl(var(--tl-accent-dim))"
                          : "hsl(222, 18%, 17%)",
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
                />

                <Slider
                  value={Math.round(accentVolume * 100)}
                  min={0}
                  max={100}
                  onChange={(v) => setAccentVolume(v / 100)}
                  label="Accent"
                  showValue
                />

                <Slider
                  value={Math.round(weakVolume * 100)}
                  min={0}
                  max={100}
                  onChange={(v) => setWeakVolume(v / 100)}
                  label="Temps faible"
                  showValue
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div style={card}>
              <p style={sectionTitle}>Pulsation</p>

              <TempoVisualizer
                currentBeat={currentBeat}
                currentSub={currentSub}
                numerator={numerator}
                isPlaying={isPlaying}
                subdivision={subdivision}
              />

              <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
                {TIME_SIGS.map(({ num, den }) => {
                  const active = num === numerator && den === denominator;

                  return (
                    <button
                      key={`${num}/${den}`}
                      type="button"
                      onClick={() => {
                        setNumerator(num);
                        setDenominator(den);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{
                        background: active
                          ? "hsl(var(--tl-accent-dim))"
                          : "hsl(222, 18%, 17%)",
                        color: active
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(220, 15%, 50%)",
                      }}
                    >
                      {num}/{den}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-1.5">
                {SUBDIVISIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubdivision(item.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                    style={{
                      background:
                        subdivision === item.id
                          ? "hsl(var(--tl-accent-dim))"
                          : "hsl(222, 18%, 17%)",
                      color:
                        subdivision === item.id
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(220, 15%, 50%)",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={card}>
              <p style={sectionTitle}>Accents</p>

              <div className="flex gap-1.5 flex-wrap">
                {beats.map((beat, i) => (
                  <BeatBtn
                    key={i}
                    index={i}
                    accent={beat.accent}
                    isActive={isPlaying && currentBeat === i}
                    onChange={(accent) => setBeatAccent(i, accent)}
                  />
                ))}
              </div>
            </div>

            <div style={card}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ ...sectionTitle, marginBottom: 0 }}>Polymètre</p>

                <button
                  type="button"
                  onClick={() => setPolyEnabled((prev) => !prev)}
                  className="relative w-9 h-6 rounded-full"
                  style={{
                    background: polyEnabled
                      ? "hsl(var(--tl-accent-button))"
                      : "hsl(222, 18%, 22%)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{
                      left: polyEnabled ? "calc(100% - 18px)" : "2px",
                      background: "white",
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
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-xs font-bold"
                        style={{ color: "hsl(215, 15%, 65%)" }}
                      >
                        {track.label}
                      </span>

                      <div className="flex gap-1">
                        {[2, 3, 4, 5, 6, 7].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setPolyNumerator(track.id, n)}
                            className="w-6 h-6 rounded text-[10px] font-bold"
                            style={{
                              background:
                                track.numerator === n
                                  ? "hsl(var(--tl-accent-dim))"
                                  : "hsl(222, 18%, 20%)",
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
                    </div>

                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {track.beats.map((beat, i) => (
                        <BeatBtn
                          key={i}
                          index={i}
                          accent={beat.accent}
                          isActive={
                            isPlaying &&
                            currentBeat % track.numerator === i
                          }
                          onChange={(accent) =>
                            updatePolyBeat(track.id, i, accent)
                          }
                        />
                      ))}
                    </div>

                    <Slider
                      value={Math.round(track.volume * 100)}
                      min={0}
                      max={100}
                      onChange={(v) =>
                        updatePolyTrack(track.id, {
                          volume: v / 100,
                        })
                      }
                      label="Volume piste B"
                      showValue
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

