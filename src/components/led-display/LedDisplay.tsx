import React from "react";
import "./led-display.css";
import LedOverlay from "./assets/led-overlay.svg?react";

interface Props {
  value: number | string;
  digits?: number;
}

export function LedDisplay({ value, digits = 3 }: Props) {
  const str = String(value).padStart(digits, "0");

  return (
    <div className="led">
      {/* valeur active */}
      <div className="led__value">{str}</div>

      {/* overlay SVG inline — currentColor hérite de .led__overlay */}
      <div className="led__overlay">
        <LedOverlay />
      </div>
    </div>
  );
}
