// src/components/PluginGallery.tsx

import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import type { InstrumentType, Plugin } from "../types";

// ── Labels des filtres ────────────────────────────────────────
const LABELS_INSTRUMENTS: Record<InstrumentType | "tous", string> = {
  tous: "Tous",
  piano: "Piano",
  trombone: "Trombone",
  trompette: "Trompette",
  micro: "Micro",
  rhodes: "Rhodes",
  synthetiseur: "Synthetiseur",
  drum: "Drum",
  tom: "Tom",
  cordes: "Cordes",
  voix: "Voix",
  autre: "Autre",
};

// ── Composant carte plugin ─────────────────────────────────────
interface PluginCardProps {
  plugin: Plugin;
  onSupprimer: () => void;
}

function PluginCard({ plugin, onSupprimer }: PluginCardProps) {
  const [survol, setSurvol] = useState(false);

  return (
    <div
      className="flex flex-col group"
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
    >
      {/* Vignette carrée */}
      <div
        className="relative rounded-xl overflow-hidden transition-all duration-200"
        style={{
          aspectRatio: "1 / 1",
          background: "hsl(222, 20%, 15%)",
          border: "1px solid hsl(220, 15%, 22%)",
          cursor: "pointer",
          transform: survol ? "translateY(-2px)" : "none",
          boxShadow: survol
            ? "0 8px 24px rgba(0,0,0,0.4)"
            : "0 2px 8px rgba(0,0,0,0.2)",
        }}
        onClick={() => window.open(plugin.siteUrl, "_blank")}
      >
        {plugin.imageUrl ? (
          <img
            src={plugin.imageUrl}
            alt={plugin.nom}
            className="w-full h-full"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-2xl"
            style={{ color: "hsl(220, 15%, 35%)" }}
          >
            🔌
          </div>
        )}

        {/* Overlay au hover */}
        {survol && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(10, 12, 20, 0.55)" }}
          >
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "hsl(var(--tl-accent-button))",
                color: "hsl(var(--tl-accent-text))",
                border: "1px solid hsl(var(--tl-accent-button-border))",
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M1 9L9 1M9 1H4M9 1V6" />
              </svg>
              Ouvrir
            </div>
          </div>
        )}

        {/* Bouton supprimer */}
        {survol && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Supprimer "${plugin.nom}" ?`)) {
                onSupprimer();
              }
            }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
            style={{
              background: "hsl(0, 55%, 38%)",
              color: "white",
              border: "1px solid hsl(0, 55%, 50%)",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Nom */}
      <span
        className="mt-2 text-xs text-center truncate px-1"
        style={{
          color: survol ? "hsl(210, 30%, 88%)" : "hsl(215, 15%, 60%)",
          transition: "color 0.15s",
        }}
      >
        {plugin.nom}
      </span>
    </div>
  );
}

// ── Modale ajout plugin ────────────────────────────────────────
interface AddPluginModalProps {
  onFermer: () => void;
}

function AddPluginModal({ onFermer }: AddPluginModalProps) {
  const { ajouterPlugin } = useApp();

  const [nom, setNom] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [instrument, setInstrument] = useState<InstrumentType | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [modeImage, setModeImage] = useState<"fichier" | "url">("fichier");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erreur, setErreur] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const LABELS_INSTR = Object.entries(LABELS_INSTRUMENTS).filter(
    ([k]) => k !== "tous",
  );

  function handleFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAjouter() {
    if (!nom.trim()) {
      setErreur("Le nom du plugin est requis.");
      return;
    }
    if (!siteUrl.trim()) {
      setErreur("L'URL du site est requise.");
      return;
    }
    if (modeImage === "fichier" && !imageFile) {
      setErreur("Veuillez choisir une image.");
      return;
    }
    if (modeImage === "url" && !imageUrl.trim()) {
      setErreur("Veuillez indiquer une URL d'image.");
      return;
    }
    setErreur("");
    setUploading(true);
    try {
      await ajouterPlugin({
        nom: nom.trim(),
        siteUrl: siteUrl.trim(),
        instrument: instrument || undefined,
        imageFile:
          modeImage === "fichier" ? (imageFile ?? undefined) : undefined,
        imageUrl: modeImage === "url" ? imageUrl.trim() : undefined,
      });
      onFermer();
    } catch (err) {
      setErreur(
        "Erreur lors de l'upload. Vérifie ta configuration Cloudinary.",
      );
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  function handleOverlay(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onFermer();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(10, 12, 20, 0.82)",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleOverlay}
    >
      <div
        className="relative flex flex-col rounded-xl shadow-2xl"
        style={{
          width: "480px",
          maxHeight: "90vh",
          background: "hsl(222, 22%, 12%)",
          border: "1px solid hsl(220, 15%, 22%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(220, 15%, 18%)" }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: "hsl(210, 30%, 90%)" }}
          >
            Ajouter un plugin
          </h2>
          <button
            onClick={onFermer}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ color: "hsl(220, 15%, 45%)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "hsl(220, 15%, 20%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
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
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Nom */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "hsl(var(--tl-accent-text))" }}
            >
              Nom du plugin *
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex : Arturia Wurlitzer V"
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
          </div>

          {/* Site URL */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "hsl(var(--tl-accent-text))" }}
            >
              URL du site *
            </label>
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://www.arturia.com/..."
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
          </div>

          {/* Catégorie instrument */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "hsl(var(--tl-accent-text))" }}
            >
              Catégorie (optionnel)
            </label>
            <div className="flex flex-wrap gap-2">
              {LABELS_INSTR.map(([id, label]) => {
                const actif = instrument === id;
                return (
                  <button
                    key={id}
                    onClick={() =>
                      setInstrument(actif ? "" : (id as InstrumentType))
                    }
                    className="px-3 py-1 rounded-full text-xs transition-all"
                    style={{
                      background: actif
                        ? "hsl(var(--tl-accent-dim))"
                        : "hsl(222, 18%, 18%)",
                      border: actif
                        ? "1px solid hsl(var(--tl-accent-border))"
                        : "1px solid hsl(220, 15%, 24%)",
                      color: actif
                        ? "hsl(var(--tl-accent-text))"
                        : "hsl(215, 15%, 60%)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "hsl(var(--tl-accent-text))" }}
            >
              Image du plugin *
            </label>

            {/* Switch fichier / URL */}
            <div
              className="flex rounded-lg overflow-hidden mb-3"
              style={{
                border: "1px solid hsl(220, 15%, 22%)",
                display: "inline-flex",
              }}
            >
              {(["fichier", "url"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setModeImage(mode)}
                  className="px-4 py-1.5 text-xs transition-colors"
                  style={{
                    background:
                      modeImage === mode
                        ? "hsl(var(--tl-accent-dim))"
                        : "transparent",
                    color:
                      modeImage === mode
                        ? "hsl(var(--tl-accent-text))"
                        : "hsl(220, 15%, 50%)",
                    border: "none",
                  }}
                >
                  {mode === "fichier" ? "Fichier local" : "URL"}
                </button>
              ))}
            </div>

            {modeImage === "fichier" ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFichier}
                  className="hidden"
                />
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="rounded-lg w-full"
                      style={{
                        maxHeight: "120px",
                        objectFit: "cover",
                        border: "1px solid hsl(220, 15%, 24%)",
                      }}
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setPreview(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{
                        background: "hsl(0, 60%, 40%)",
                        color: "white",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    style={{
                      background: "hsl(222, 18%, 16%)",
                      border: "1px dashed hsl(220, 15%, 28%)",
                      color: "hsl(220, 15%, 50%)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "hsl(var(--tl-accent-border))";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "hsl(var(--tl-accent-text))";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "hsl(220, 15%, 28%)";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "hsl(220, 15%, 50%)";
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    >
                      <rect x="1" y="2" width="12" height="10" rx="1.5" />
                      <circle cx="5" cy="6" r="1.2" />
                      <path d="M1 9.5l3-3 2.5 2.5 2-2 3.5 3" />
                    </svg>
                    Choisir une image
                  </button>
                )}
              </>
            ) : (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/plugin-image.png"
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
            )}
          </div>

          {erreur && (
            <p className="text-xs" style={{ color: "hsl(0, 70%, 60%)" }}>
              {erreur}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid hsl(220, 15%, 18%)" }}
        >
          <button
            onClick={onFermer}
            disabled={uploading}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
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
            disabled={uploading || !nom.trim() || !siteUrl.trim()}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background:
                uploading || !nom.trim() || !siteUrl.trim()
                  ? "hsl(var(--tl-accent-dim))"
                  : "hsl(var(--tl-accent-button))",
              color:
                uploading || !nom.trim() || !siteUrl.trim()
                  ? "hsl(220, 15%, 40%)"
                  : "hsl(var(--tl-accent-text))",
              border: "1px solid transparent",
              cursor:
                uploading || !nom.trim() || !siteUrl.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="animate-spin"
                >
                  <circle
                    cx="6"
                    cy="6"
                    r="4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="14 6"
                  />
                </svg>
                Upload…
              </span>
            ) : (
              "Ajouter plugin"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal PluginGallery ─────────────────────────
export function PluginGallery() {
  const { plugins, pluginsLoading, supprimerPlugin } = useApp();
  const [filtre, setFiltre] = useState<InstrumentType | "tous">("tous");
  const [modalOuverte, setModalOuverte] = useState(false);

  // Calcule les catégories présentes dans les plugins
  const categoriesPresentes = Array.from(
    new Set(plugins.map((p) => p.instrument).filter(Boolean)),
  ) as InstrumentType[];

  const pluginsFiltres =
    filtre === "tous"
      ? plugins
      : plugins.filter((p) => p.instrument === filtre);

  return (
    <>
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: "hsl(222, 22%, 9%)" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(220, 15%, 16%)" }}
        >
          <div>
            <h1
              className="text-base font-semibold"
              style={{ color: "hsl(220, 30%, 45%)" }}
            >
              Plugins
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "hsl(220, 15%, 45%)" }}
            >
              {plugins.length} plugin{plugins.length !== 1 ? "s" : ""}{" "}
              enregistré{plugins.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={() => setModalOuverte(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "hsl(var(--tl-accent-button))",
              color: "hsl(var(--tl-accent-text))",
              border: "1px solid hsl(var(--tl-accent-button-border))",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter =
                "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = "none";
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <line x1="6" y1="1" x2="6" y2="11" />
              <line x1="1" y1="6" x2="11" y2="6" />
            </svg>
          </button>
        </div>

        {/* ── Filtres ── */}
        {categoriesPresentes.length > 0 && (
          <div
            className="flex items-center gap-2 px-6 py-3 flex-shrink-0 flex-wrap"
            style={{ borderBottom: "1px solid hsl(220, 15%, 14%)" }}
          >
            {(
              ["tous", ...categoriesPresentes] as (InstrumentType | "tous")[]
            ).map((cat) => {
              const actif = filtre === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFiltre(cat)}
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{
                    background: actif
                      ? "hsl(var(--tl-accent-dim))"
                      : "hsl(222, 18%, 16%)",
                    border: actif
                      ? "1px solid hsl(var(--tl-accent-border))"
                      : "1px solid hsl(220, 15%, 22%)",
                    color: actif
                      ? "hsl(var(--tl-accent-text))"
                      : "hsl(215, 15%, 55%)",
                  }}
                >
                  {LABELS_INSTRUMENTS[cat]}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Grille ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {pluginsLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="animate-spin mr-3"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="7"
                  stroke="hsl(var(--tl-accent-princ))"
                  strokeWidth="2"
                  strokeDasharray="22 10"
                />
              </svg>
              <span className="text-sm" style={{ color: "hsl(220, 15%, 45%)" }}>
                Chargement…
              </span>
            </div>
          ) : pluginsFiltres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ background: "hsl(222, 20%, 16%)" }}
              >
                🔌
              </div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "hsl(215, 15%, 60%)" }}
              >
                {filtre === "tous"
                  ? "Aucun plugin enregistré"
                  : `Aucun plugin dans cette catégorie`}
              </p>
              <p className="text-xs" style={{ color: "hsl(220, 15%, 40%)" }}>
                {filtre === "tous"
                  ? 'Cliquez sur "+ Ajouter plugin" pour commencer'
                  : 'Essayez le filtre "Tous"'}
              </p>
            </div>
          ) : (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              }}
            >
              {pluginsFiltres.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onSupprimer={() => supprimerPlugin(plugin.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modale ajout */}
      {modalOuverte && (
        <AddPluginModal onFermer={() => setModalOuverte(false)} />
      )}
    </>
  );
}
