import { useState, useRef, useCallback, useEffect } from "react";
import { ChronoLedDisplay } from "./led-display/ChronoLedDisplay";
import type { SVGProps } from "react";

// Overlay personnalisé pour le chronomètre
import LedOverlayChrono from "./led-display/assets/led-overlay-chrono.svg?react";

export function ChronoTool() {
  const [display, setDisplay] = useState({ minutes: 0, seconds: 0 });
  const [running, setRunning] = useState(false);

  // Refs pour le temps en millisecondes
  const startTimeRef = useRef(0);
  const savedMsRef = useRef(0);
  const rafIdRef = useRef(0);

  const updateDisplay = useCallback((totalMs: number) => {
    const totalSec = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    setDisplay({ minutes, seconds });
  }, []);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current + savedMsRef.current;
    updateDisplay(elapsed);
    rafIdRef.current = requestAnimationFrame(tick);
  }, [updateDisplay]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setRunning(true);
    rafIdRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    const now = Date.now();
    savedMsRef.current = now - startTimeRef.current + savedMsRef.current;
    updateDisplay(savedMsRef.current);
    setRunning(false);
  }, [updateDisplay]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    savedMsRef.current = 0;
    startTimeRef.current = 0;
    updateDisplay(0);
    setRunning(false);
  }, [updateDisplay]);

  // Toggle avec barre espace
  const toggle = useCallback(() => {
    if (running) stop();
    else start();
  }, [running, start, stop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const buttonStyle: React.CSSProperties = {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "1px solid",
    color: "hsl(var(--tl-accent-princ))",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Poppins, sans-serif",
    transition: "all 200ms ease-out",
  };

  return (
    <div style={{ padding: "24px", height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* TOUT DANS UN SEUL CADRE */}
        <div style={{
          background: "hsl(222, 20%, 12%)",
          border: "1px solid hsl(220, 15%, 18%)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
        }}>
          {/* Titre */}
          <h2 style={{
            color: "hsl(var(--tl-accent-princ))",
            fontSize: "18px",
            fontWeight: 600,
            marginBottom: "20px",
            fontFamily: "Poppins, sans-serif",
          }}>
            Chronomètre
          </h2>

          {/* Écran LED */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <ChronoLedDisplay
              minutes={display.minutes}
              seconds={display.seconds}
              overlay={LedOverlayChrono}
            />
          </div>

          {/* Indication clavier */}
          <div style={{ textAlign: "center", color: "hsl(220, 15%, 40%)", fontSize: "12px", marginBottom: "16px" }}>
            Barre espace : Démarrer / Arrêter
          </div>

          {/* Boutons de contrôle */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            {!running ? (
              <button onClick={start} style={{ ...buttonStyle, background: "hsl(var(--tl-accent-button))", borderColor: "hsl(var(--tl-accent-button-border))" }}>
                ▶ Start
              </button>
            ) : (
              <button onClick={stop} style={{ ...buttonStyle, background: "hsl(0, 60%, 35%)", borderColor: "hsl(0, 60%, 45%)" }}>
                ⏸ Stop
              </button>
            )}
            <button onClick={reset} style={{ ...buttonStyle, background: "hsl(220, 15%, 20%)", borderColor: "hsl(220, 15%, 30%)" }}>
              ↺ Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
