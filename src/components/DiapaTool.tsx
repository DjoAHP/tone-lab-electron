import { useState, useCallback } from "react";
import { PianoKeyboard, OscType } from "./PianoKeyboard";
import { LedDisplay } from "./led-display/LedDisplay";
import LedOverlayDiapa from "./led-display/assets/led-overlay-diapa.svg?react";

// ─── Style Card ─────────────────
const card = {
  background: "hsl(222, 20%, 12%)",
  border: "1px solid hsl(220, 15%, 18%)",
  borderRadius: "12px",
  padding: "16px",
};

// ─── Style Titre de section ─────────────────
const sectionTitle = {
  fontSize: "10px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  color: "hsl(220, 15%, 42%)",
  marginBottom: "8px",
};

// ─── Boutons de sélection du type d'oscillateur
const oscTypes: { type: OscType; label: string }[] = [
  { type: "sine", label: "Sine" },
  { type: "triangle", label: "Triangle" },
  { type: "square", label: "Square" },
  { type: "sawtooth", label: "Sawtooth" },
];

// ─── Composant DiapaTool ─────────────────
export function DiapaTool() {
  const [oscType, setOscType] = useState<OscType>("triangle");
  const [volume, setVolume] = useState(0.5);
  const [activeNote, setActiveNote] = useState<string>("---");

  // Gérer le jeu d'une note
  const handleNotePlay = useCallback((note: string) => {
    setActiveNote(note);
  }, []);

  const handleNoteStop = useCallback((note: string) => {
    setActiveNote("---");
  }, []);

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: "hsl(222, 22%, 9%)" }}
    >
      <div style={{ width: "100%", padding: "16px 24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* ─── SECTION 1: LED ─────────────── */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={sectionTitle}>Note actuelle</div>
          <div style={{
            ...card,
            display: "inline-block",
            padding: "20px 40px",
            marginBottom: "8px",
          }}>
            <LedDisplay value={activeNote} digits={3} overlay={LedOverlayDiapa} />
          </div>
        </div>

        {/* ─── SECTION 2: VOLUME ─────────────── */}
        <div style={{ marginBottom: "20px", maxWidth: "580px", margin: "0 auto 20px" }}>
          <div style={sectionTitle}>Volume</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "38px" }}>
            <div className="flex-1 relative h-5 flex items-center">
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
            <span
              className="text-[10px] font-mono font-bold min-w-[32px] text-right"
              style={{ color: "hsl(var(--tl-accent-text))" }}
            >
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* ─── SECTION 3: TIMBRE ─────────────── */}
        <div style={{ marginBottom: "20px", maxWidth: "580px", margin: "0 auto 20px" }}>
          <div style={sectionTitle}>Timbre</div>
          <div style={{ display: "flex", gap: "4px" }}>
            {oscTypes.map(({ type, label }) => {
              const isActive = oscType === type;
              return (
                <button
                  key={type}
                  onClick={() => setOscType(type)}
                  className="px-3 py-2 rounded-lg text-[10px] font-semibold transition-all uppercase tracking-wider"
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
                    flex: 1,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── SECTION 4: CLAVIER ─────────────── */}
        <div style={{ marginBottom: "20px", maxWidth: "900px", margin: "0 auto 20px" }}>
          <div style={{ ...sectionTitle }}>Clavier (C4 - C6, AZERTY)</div>
          <div style={{ width: "100%", marginTop: "8px" }}>
            <PianoKeyboard
              oscType={oscType}
              volume={volume}
              onNotePlay={handleNotePlay}
              onNoteStop={handleNoteStop}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
