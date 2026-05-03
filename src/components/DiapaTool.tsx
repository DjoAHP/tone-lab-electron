import { useState, useCallback, useRef } from "react";
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

// ─── Interface pour l'historique ─────────────────
interface HistoryEntry {
  id: number;
  note: string;
  timestamp: number;
  chord: string | null;
}

// ─── Composant DiapaTool ─────────────────
export function DiapaTool() {
  const [oscType, setOscType] = useState<OscType>("sine");
  const [volume, setVolume] = useState(0.5);
  const [activeNote, setActiveNote] = useState<string>("---");
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [sustain, setSustain] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const historyIdRef = useRef(0);

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

    // Détection d'accord immédiate avec la note ajoutée
    const newActiveNotes = [...activeNotes, note];
    const chord = detectChord(newActiveNotes);
    const entry: HistoryEntry = {
      id: ++historyIdRef.current,
      note,
      timestamp: Date.now(),
      chord: chord ? `${chord.root} ${chord.label}` : null,
    };
    setHistory(prev => [entry, ...prev].slice(0, 50));
  }, [activeNotes]);

  // Gérer l'arrêt d'une note (quand sustain OFF ou relâchement)
  const handleNoteStop = useCallback((note: string) => {
    setActiveNotes(prev => prev.filter(n => getNoteName(n) !== getNoteName(note)));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleScaleSelect = useCallback((scale: Scale | null) => {
    setSelectedScale(scale);
  }, []);

  const replayNote = useCallback((note: string) => {
    setActiveNote(note);
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

          {/* Sustain */}
          <div style={{ flex: "0 0 auto" }}>
            <div style={sectionTitle}>Sustain</div>
            <button
              onClick={() => setSustain(!sustain)}
              className="px-4 py-2 rounded-lg text-[10px] font-semibold transition-all uppercase"
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
              {sustain ? "ON" : "OFF"}
            </button>
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
              sustain={sustain}
              onNotePlay={handleNotePlay}
              onNoteStop={handleNoteStop}
              scaleNotes={scaleNotes}
              activeNotes={activeNotes}
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

        {/* ─── SECTION 4: HISTORIQUE ─────────────── */}
        <div>
          <div style={{ ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Historique ({history.length})</span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  background: "none",
                  border: "none",
                  color: "hsl(220, 15%, 35%)",
                  fontSize: "9px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                Effacer
              </button>
            )}
          </div>
          <div style={{
            background: "hsl(222, 20%, 12%)",
            border: "1px solid hsl(220, 15%, 18%)",
            borderRadius: "8px",
            maxHeight: "150px",
            overflowY: "auto",
            padding: "8px",
          }}>
            {history.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "20px",
                color: "hsl(220, 15%, 30%)",
                fontSize: "11px",
                fontStyle: "italic",
              }}>
                Jouez des notes pour voir l'historique...
              </div>
            ) : (
              history.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => replayNote(entry.note)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "background 0.1s",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "hsl(222, 20%, 16%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <span style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "11px",
                    color: "hsl(220, 15%, 60%)",
                  }}>
                    {entry.note}
                  </span>
                  {entry.chord && (
                    <span style={{
                      fontSize: "9px",
                      color: "hsl(var(--tl-accent-princ))",
                      fontStyle: "italic",
                    }}>
                      {entry.chord}
                    </span>
                  )}
                  <span style={{
                    fontSize: "9px",
                    color: "hsl(220, 15%, 30%)",
                  }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
