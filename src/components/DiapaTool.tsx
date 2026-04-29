import { useState, useCallback } from "react";
import { PianoKeyboard, OscType } from "./PianoKeyboard";
import { LedDisplay } from "./led-display/LedDisplay";

// ─── Style Card (réutilisé de Metronome.tsx) ─────────
const card = {
  background: "hsl(222, 20%, 12%)",
  border: "1px solid hsl(220, 15%, 18%)",
  borderRadius: "12px",
  padding: "16px",
};

// ─── Style Titre de section ───────────────────────────
const sectionTitle = {
  fontSize: "10px" as const,
  fontWeight: "700" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  color: "hsl(220, 15%, 42%)",
  marginBottom: "10px",
};

// ─── Composant DiapaTool ──────────────────────────────
export function DiapaTool() {
  const [oscType, setOscType] = useState<OscType>("sine");
  const [volume, setVolume] = useState(0.5);
  const [sustain, setSustain] = useState(false);
  const [activeNote, setActiveNote] = useState<string>("---");

  const handleNotePlay = useCallback((note: string) => {
    setActiveNote(note);
  }, []);

  // Boutons de sélection du type d'oscillateur
  const oscTypes: { type: OscType; label: string }[] = [
    { type: "sine", label: "Sine" },
    { type: "triangle", label: "Triangle" },
    { type: "square", label: "Square" },
    { type: "sawtooth", label: "Saw" },
  ];

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: "hsl(222, 22%, 9%)" }}
    >
      <div style={{ width: "100%", padding: "15px 100px" }}>
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-lg font-bold"
              style={{ color: "hsl(210, 30%, 88%)" }}
            >
              Diapa
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "hsl(220, 15%, 42%)" }}
            >
              Clavier de piano virtuel - 2 octaves (C4 à C6)
            </p>
          </div>
        </div>

        {/* Grille 2 colonnes comme Metronome */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {/* COLONNE GAUCHE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Card LedDisplay */}
            <div style={card}>
              <div style={sectionTitle}>Note active</div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <LedDisplay value={activeNote} digits={4} />
              </div>
            </div>

            {/* Card Timbre */}
            <div style={card}>
              <div style={sectionTitle}>Timbre</div>
              <div style={{ display: "flex", gap: "6px" }}>
                {oscTypes.map(({ type, label }) => {
                  const isActive = oscType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setOscType(type)}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                      style={{
                        background: isActive
                          ? "hsl(var(--tl-accent-dim))"
                          : "hsl(222, 18%, 17%)",
                        border: isActive
                          ? "1px solid hsl(var(--tl-accent-border))"
                          : "1px solid hsl(220, 15%, 22%)",
                        color: isActive
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(220, 15%, 50%)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Volume */}
            <div style={card}>
              <div style={sectionTitle}>Volume</div>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center">
                  <span
                    className="text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: "hsl(220, 15%, 45%)" }}
                  >
                    Master
                  </span>
                  <span
                    className="text-[11px] font-mono font-bold"
                    style={{ color: "hsl(var(--tl-accent-text))" }}
                  >
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <div className="relative h-5 flex items-center">
                  <div
                    className="w-full h-1.5 rounded-full relative"
                    style={{ background: "hsl(222, 20%, 22%)" }}
                  >
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{
                        width: `${volume * 100}%`,
                        background: "hsl(var(--tl-accent-princ))",
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={e => setVolume(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  />
                </div>
              </div>
            </div>

            {/* Card Sustain */}
            <div style={card}>
              <div style={sectionTitle}>Sustain</div>
              <button
                onClick={() => setSustain(!sustain)}
                className="w-full py-2 rounded-lg text-[10px] font-semibold transition-all uppercase tracking-widest"
                style={{
                  background: sustain
                    ? "hsl(var(--tl-accent-dim))"
                    : "hsl(222, 18%, 17%)",
                  border: sustain
                    ? "1px solid hsl(var(--tl-accent-border))"
                    : "1px solid hsl(220, 15%, 22%)",
                  color: sustain
                    ? "hsl(var(--tl-accent-text))"
                    : "hsl(220, 15%, 50%)",
                }}
              >
                {sustain ? "Activé" : "Désactivé"}
              </button>
              <p
                className="text-[9px] mt-1.5"
                style={{ color: "hsl(220, 15%, 35%)" }}
              >
                Maintenir la note après relâchement de la touche
              </p>
            </div>
          </div>

          {/* COLONNE DROITE - Clavier */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={card}>
              <div style={{ ...sectionTitle, marginBottom: "12px" }}>
                Clavier (AZERTY)
              </div>
              <PianoKeyboard
                oscType={oscType}
                volume={volume}
                sustain={sustain}
                onNotePlay={handleNotePlay}
              />
            </div>

            {/* Aide clavier */}
            <div
              style={{
                ...card,
                padding: "12px",
                background: "hsl(222, 20%, 10%)",
              }}
            >
              <div style={{ ...sectionTitle, marginBottom: "6px" }}>
                Raccourcis
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px",
                  fontSize: "9px",
                  color: "hsl(220, 15%, 40%)",
                }}
              >
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>A</kbd> C4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>Q</kbd> C#4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>Z</kbd> D4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>S</kbd> D#4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>E</kbd> E4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>R</kbd> F4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>D</kbd> F#4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>T</kbd> G4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>F</kbd> G#4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>Y</kbd> A4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>G</kbd> A#4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>U</kbd> B4
                </span>
                <span>
                  <kbd style={{ color: "hsl(220, 15%, 60%)" }}>I</kbd> C5 → C6
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
