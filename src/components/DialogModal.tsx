// src/components/DialogModal.tsx
// Modale in-app (confirm / prompt) — remplace window.confirm / window.prompt
// qui sont DÉSACTIVÉS en mode sandbox (webPreferences.sandbox: true).

import React, { useState, useEffect } from "react";

interface DialogModalProps {
  open: boolean;
  title: string;
  message?: string;
  inputMode?: boolean;
  inputDefault?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: (value?: string) => void;
  onCancel: () => void;
}

export function DialogModal({
  open,
  title,
  message,
  inputMode,
  inputDefault,
  confirmLabel = "OK",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: DialogModalProps) {
  const [value, setValue] = useState(inputDefault ?? "");

  useEffect(() => {
    if (open) setValue(inputDefault ?? "");
  }, [open, inputDefault]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(10, 12, 20, 0.82)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="flex flex-col rounded-xl shadow-2xl"
        style={{ width: "360px", background: "hsl(222, 22%, 12%)", border: "1px solid hsl(220, 15%, 22%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(220, 15%, 18%)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "hsl(210, 30%, 90%)" }}>
            {title}
          </h2>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          {message && (
            <p className="text-sm" style={{ color: "hsl(215, 15%, 70%)" }}>
              {message}
            </p>
          )}
          {inputMode && (
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onConfirm(value.trim() || undefined);
              }}
              className="text-sm px-3 py-2 rounded-md outline-none"
              style={{
                background: "hsl(222, 20%, 16%)",
                border: "1px solid hsl(220, 15%, 24%)",
                color: "hsl(210, 30%, 88%)",
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "hsl(var(--tl-accent-princ))";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "hsl(220, 15%, 24%)";
              }}
            />
          )}
        </div>

        <div
          className="flex justify-end gap-3 px-5 py-4"
          style={{ borderTop: "1px solid hsl(220, 15%, 18%)" }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "hsl(222, 18%, 18%)", color: "hsl(220, 15%, 60%)", border: "1px solid hsl(220, 15%, 24%)" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm?.(inputMode ? (value.trim() || undefined) : undefined)}
            className="px-5 py-2 rounded-lg text-sm font-medium"
            style={{ background: "hsl(var(--tl-accent-button))", color: "hsl(var(--tl-accent-text))" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
