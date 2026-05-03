import { useState, useCallback } from "react";
import { PianoKeyboard, OscType } from "./PianoKeyboard";
import { LedDisplay } from "./led-display/LedDisplay";
import LedOverlayDiapa from "./led-display/assets/led-overlay-diapa.svg?react";
import {
  detectChord,
  formatChord,
  COMMON_SCALES,
  Scale,
  getNoteName,
} from "../utils/musicTheory";

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

// ─── Composant DiapaTool ─────────────────
export function DiapaTool() {
  const [oscType, setOscType] = useState<OscType>("sine");
  const [volume, setVolume] = useState(0.5);
  const [activeNote, setActiveNote] = useState<string>("---");
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);

  // Détecter l'accord courant
  const detectedChord = activeNotes.length >= 2 ? detectChord(activeNotes) : null;
  const chordLabel = formatChord(detectedChord);

  // Gérer le jeu d'une note
  const handleNotePlay = useCallback((note: string) => {
    setActiveNote(note);
    const noteName = getNoteName(note);
    setActiveNotes(prev => {
      if (prev.some(n => getNoteName(n) === noteName)) {
        return prev;
      }
      return [...prev, note];
    });
  }, []);

  // Gérer l'arrêt d'une note
  const handleNoteStop = useCallback((note: string) => {
    setActiveNotes(prev => prev.filter(n => getNoteName(n) !== getNoteName(note)));
  }, []);

  const handleScaleSelect = useCallback((scale: Scale | null) => {
    setSelectedScale(scale);
  }, []);

  const scaleNotes = selectedScale?.notes;

  // Boutons de sélection du type d'oscillateur
  const oscTypes: { type: OscType; label: string }[] = [
    { type: "sine", label: "Sine" },
    { type: "triangle", label: "Triangle" },
    { type: "square", label: "Square" },
    { type: "sawtooth", label: "Sawtooth" },
  ];

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: "hsl(222, 22%, 9%)" }}
    >
      <div style={{ width: "100%", padding: "16px 24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* ─── SECTION 1: LED + ACCORD ─────────────── */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={sectionTitle}>Note actuelle / Accord</div>
          <div style={{
            ...card,
            display: "inline-block",
            padding: "20px 40px",
            marginBottom: "8px",
          }}>
            <LedDisplay value={activeNote} digits={4} overlay={LedOverlayDiapa} />
          </div>
          {detectedChord && (
            <div style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "hsl(var(--tl-accent-princ))",
              marginTop: "8px",
              fontFamily: "'Courier New', monospace",
            }}>
              {chordLabel}
            </div>
          )}
        </div>

        {/* ─── SECTION 2: CONTRÔLES ─────────────── */}
        <div style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}>
          {/* Timbre */}
          <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
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

          {/* Volume */}
          <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
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

          {/* Sélecteur de gamme */}
          <div style={{ flex: "1 1 250px", minWidth: "200px" }}>
            <div style={sectionTitle}>Gamme / Tonalité</div>
            <select
              value={selectedScale?.name ?? ""}
              onChange={(e) => {
                const scale = COMMON_SCALES.find(s => s.name === e.target.value) ?? null;
                handleScaleSelect(scale);
              }}
              style={{
                width: "100%",
                background: "hsl(222, 18%, 17%)",
                border: "1px solid hsl(220, 15%, 22%)",
                borderRadius: "8px",
                color: "hsl(220, 15%, 70%)",
                fontSize: "11px",
                padding: "8px 12px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">Aucune</option>
              <optgroup label="Majeures">
                {COMMON_SCALES.filter(s => s.name.includes('major')).map(scale => (
                  <option key={scale.name} value={scale.name}>{scale.label}</option>
                ))}
              </optgroup>
              <optgroup label="Mineures">
                {COMMON_SCALES.filter(s => s.name.includes('minor')).map(scale => (
                  <option key={scale.name} value={scale.name}>{scale.label}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* ─── SECTION 3: CLAVIER ─────────────── */}
        <div style={{ marginBottom: "20px" }}>
          <div style={sectionTitle}>Clavier (C4 - C6, AZERTY)</div>
          <div style={{ width: "100%", marginTop: "8px" }}>
            <PianoKeyboard
              oscType={oscType}
              volume={volume}
              onNotePlay={handleNotePlay}
              onNoteStop={handleNoteStop}
            />
          </div>
          {selectedScale && (
            <div style={{
              marginTop: "8px",
              fontSize: "10px",
              color: "hsl(220, 15%, 40%)",
              textAlign: "center",
            }}>
              Gamme : {selectedScale.label} — Notes : {selectedScale.notes.join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
