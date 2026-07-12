// src/components/NewTitreModal.tsx

import React, { useState } from "react";
import { useApp } from "../context/AppContext";

interface NewTitreModalProps {
  stackId: string;
  onFermer: () => void;
}

// Modale "Nouveau SousSousStack" : le SousStack est un conteneur nom-only.
// Les recherches (Nouvelle recherche — instrument) s'ajoutent ensuite via le "+" du titre.
export function NewTitreModal({ stackId, onFermer }: NewTitreModalProps) {
  const { ajouterSousStack } = useApp();
  const [titre, setTitre] = useState("");
  const [erreur, setErreur] = useState("");

  function handleAjouter() {
    if (!titre.trim()) {
      setErreur("Le nom du SousSousStack est requis.");
      return;
    }
    ajouterSousStack(stackId, titre.trim());
    onFermer();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(10, 12, 20, 0.82)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
    >
      <div
        className="flex flex-col rounded-xl shadow-2xl"
        style={{
          width: "360px",
          background: "hsl(222, 22%, 12%)",
          border: "1px solid hsl(220, 15%, 22%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(220, 15%, 18%)" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "hsl(210, 30%, 90%)" }}
          >
            Nouveau SousSousStack
          </h2>
          <button onClick={onFermer} style={{ color: "hsl(220, 15%, 45%)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Corps */}
        <div className="px-5 py-4">
          <label
            className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: "hsl(var(--tl-accent-text))" }}
          >
            Nom du SousSousStack
          </label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && titre.trim()) handleAjouter();
            }}
            placeholder="Ex : Who Knows"
            className="w-full text-sm px-3 py-2 rounded-md outline-none"
            style={{
              background: "hsl(222, 20%, 16%)",
              border: "1px solid hsl(220, 15%, 24%)",
              color: "hsl(210, 30%, 88%)",
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                "hsl(var(--tl-accent-princ))";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                "hsl(220, 15%, 24%)";
            }}
          />
          {erreur && (
            <p className="text-xs mt-2" style={{ color: "hsl(0, 70%, 60%)" }}>
              {erreur}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid hsl(220, 15%, 18%)" }}
        >
          <button
            onClick={onFermer}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: "hsl(222, 18%, 18%)",
              color: "hsl(220, 15%, 60%)",
              border: "1px solid hsl(220, 15%, 24%)",
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleAjouter}
            disabled={!titre.trim()}
            className="px-5 py-2 rounded-lg text-sm font-medium"
            style={{
              background: titre.trim()
                ? "hsl(var(--tl-accent-button))"
                : "hsl(var(--tl-accent-dim))",
              color: titre.trim()
                ? "hsl(var(--tl-accent-text))"
                : "hsl(220, 15%, 40%)",
            }}
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
