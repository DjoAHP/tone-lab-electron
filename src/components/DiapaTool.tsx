import { useState, useCallback } from "react";
import { PianoKeyboard, OscType } from "./PianoKeyboard";
import { LedDisplay } from "./led-display/LedDisplay";
import LedOverlayDiapa from "./led-display/assets/led-overlay-diapa.svg?react";

// ─── Style Card (réutilisé de Metronome.tsx) ───────────
const card = {
  background: "hsl(222, 20%, 12%)",
  border: "1px solid hsl(220, 15%, 18%)",
  borderRadius: "12px",
  padding: "16px",
};

// ─── Style Titre de section ────────────────────
const sectionTitle = {
  fontSize: "10px" as const,
  fontWeight: "700" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  color: "hsl(220, 15%, 42%)",
  marginBottom: "10px",
};

// ─── Composant DiapaTool ────────────────────────
export function DiapaTool() {
  const [oscType, setOscType] = useState<OscType>("sine");
  const [volume, setVolume] = useState(0.5);
  const [activeNote, setActiveNote] = useState<string>("---");

  const handleNotePlay = useCallback((note: string) => {
    setActiveNote(note);
  }, []);

  // Boutons de sélection du type d'oscillateur
  const oscTypes: { type: OscType; label: string }[] = [
    { type: "sine", label: "Sine" },
    { type: "triangle", label: "Tri" },
    { type: "square", label: "Sq" },
    { type: "sawtooth", label: "Saw" },
  ];

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: "hsl(222, 22%, 9%)" }}
    >
      <div style={{ width: "100%", padding: "12px 100px" }}>
        {/* ─── TOP SECTION: Controls line ─────────────── */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "10px",
            flexShrink: 0,
          }}
        >
          {/* LEFT: LED */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
            <div style={sectionTitle}>Note</div>
            <div style={{ ...card, padding: "12px", display: "flex", justifyContent: "center" }}>
              <LedDisplay value={activeNote} digits={4} overlay={LedOverlayDiapa} />
            </div>
          </div>

          {/* CENTER: Timbre + Volume (même ligne) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, justifyContent: "center" }}>
            <div style={sectionTitle}>Timbre</div>
            <div style={{ display: "flex", gap: "4px" }}>
              {oscTypes.map(({ type, label }) => {
                const isActive = oscType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setOscType(type)}
                    className="px-2 py-1 rounded-lg text-[9px] font-semibold transition-all uppercase tracking-widest"
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

          {/* RIGHT: Volume (horizontal slider) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "220px", flexShrink: 0 }}>
            <div style={{ ...sectionTitle, textAlign: "right" as const }}>Vol</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                className="text-[10px] font-mono font-bold"
                style={{ color: "hsl(var(--tl-accent-text))" }}
              >
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM SECTION: Keyboard (full width) ─────── */}
        <div
          style={{
            flex: 1,
            background: "hsl(222, 20%, 12%)",
            border: "1px solid hsl(220, 15%, 18%)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ ...sectionTitle, marginBottom: "8px" }}>
            Clavier (AZERTY) - 2 octaves C4 à C6
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 0,
            }}
          >
            <PianoKeyboard
              oscType={oscType}
              volume={volume}
              onNotePlay={handleNotePlay}
            />
          </div>

          {/* Note display */}
          <div
            className="text-[11px] text-center mt-1.5"
            style={{ color: "hsl(220, 15%, 45%)" }}
          >
            Note: <span style={{ color: "hsl(var(--tl-accent-text))", fontWeight: "700" }}>{activeNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
