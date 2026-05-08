import React from "react";
import "./led-display.css";
import LedOverlay from "./assets/led-overlay.svg?react";
import type { SVGProps } from "react";

interface Props {
  minutes: number; // 0-99
  seconds: number; // 0-59
  overlay?: React.ComponentType<SVGProps<SVGSVGElement>>;
  className?: string; // Pour personnaliser la classe CSS
}

export function ChronoLedDisplay({ minutes, seconds, overlay: Overlay = LedOverlay, className = "led" }: Props) {
  const minStr = minutes.toString().padStart(2, "0");
  const secStr = seconds.toString().padStart(2, "0");

  return (
    <div className={className}>
      {/* Valeur chronographe : MM:SS */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "DigitalLed, monospace",
          fontWeight: 700,
          fontSize: "80px",
          letterSpacing: "4px",
          color: "hsl(var(--tl-accent-text))",
          textShadow: `
            0 0 6px hsl(var(--tl-accent-text)),
            0 0 14px hsl(var(--tl-accent-text) / 0.6),
            0 0 28px hsl(var(--tl-accent-h) 80% 50% / 0.5)
          `,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>{minStr}</span>
        <span style={{ fontSize: "80px", margin: "0 2px" }}>:</span>
        <span>{secStr}</span>
      </div>

      {/* Overlay SVG circulaire */}
      <div className="led__overlay">
        <Overlay />
      </div>
    </div>
  );
}
