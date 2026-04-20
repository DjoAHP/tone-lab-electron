// src/components/SoundResearchTool.tsx

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import type { SoundEntry, InstrumentType } from "../types";
import StackIcon from "../assets/icons/Bottombar/stack-tool.svg?react";
import { PluginGallery } from "./PluginGallery";

// Import icônes instruments
import PianoIcon from "../assets/icons/Instruments/piano.svg?react";
import TromboneIcon from "../assets/icons/Instruments/trombone.svg?react";
import TrompetteIcon from "../assets/icons/Instruments/trompette.svg?react";
import MicroIcon from "../assets/icons/Instruments/Micro.svg?react";
import RhodesIcon from "../assets/icons/Instruments/Rhodes.svg?react";
import SynthetiseurIcon from "../assets/icons/Instruments/synthetiseur.svg?react";
import DrumIcon from "../assets/icons/Instruments/drum.svg?react";
import TomIcon from "../assets/icons/Instruments/tom.svg?react";

const INSTRUMENT_ICONS: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  piano: PianoIcon,
  trombone: TromboneIcon,
  trompette: TrompetteIcon,
  micro: MicroIcon,
  rhodes: RhodesIcon,
  synthetiseur: SynthetiseurIcon,
  drum: DrumIcon,
  tom: TomIcon,
};

const INSTRUMENT_LABELS: Record<string, string> = {
  piano: "Piano",
  trombone: "Trombone",
  trompette: "Trompette",
  micro: "Micro",
  rhodes: "Rhodes",
  synthetiseur: "Synthétiseur",
  drum: "Drum",
  tom: "Tom",
  cordes: "Cordes",
  voix: "Voix",
  autre: "Autre",
};

// ── Modal d'édition ───────────────────────────────────────────
import type { Plugin } from "../types";

const INSTRUMENTS_LISTE: {
  id: InstrumentType;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
  { id: "piano", label: "Piano", Icon: PianoIcon },
  { id: "trombone", label: "Trombone", Icon: TromboneIcon },
  { id: "trompette", label: "Trompette", Icon: TrompetteIcon },
  { id: "micro", label: "Micro", Icon: MicroIcon },
  { id: "rhodes", label: "Rhodes", Icon: RhodesIcon },
  { id: "synthetiseur", label: "Synthé", Icon: SynthetiseurIcon },
  { id: "drum", label: "Drum", Icon: DrumIcon },
  { id: "tom", label: "Tom", Icon: TomIcon },
];

interface EditModalProps {
  entry: SoundEntry;
  plugins: Plugin[];
  pluginsLoading: boolean;
  onSauvegarder: (modifications: Partial<SoundEntry>) => void;
  onFermer: () => void;
}

function EditModal({
  entry,
  plugins,
  pluginsLoading,
  onSauvegarder,
  onFermer,
}: EditModalProps) {
  const [form, setForm] = useState<Partial<SoundEntry>>({ ...entry });
  const [captureFile, setCaptureFile] = useState<File | null>(null);
  const [capturePreview, setCapturePreview] = useState<string | null>(
    entry.captureUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function set(champ: keyof SoundEntry, val: string) {
    setForm((prev) => ({ ...prev, [champ]: val }));
  }

  function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCaptureFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCapturePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSauvegarder() {
    setUploading(true);
    try {
      let captureUrl = form.captureUrl;
      if (captureFile) {
        const { uploadImageCloudinary } = await import("../lib/cloudinary");
        captureUrl = await uploadImageCloudinary(captureFile);
      }
      onSauvegarder({ ...form, captureUrl });
      onFermer();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  const inputStyle = {
    background: "hsl(222, 20%, 16%)",
    border: "1px solid hsl(220, 15%, 24%)",
    color: "hsl(210, 30%, 88%)",
    borderRadius: "0.375rem",
    width: "100%",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
  };
  const labelStyle = {
    display: "block" as const,
    fontSize: "11px",
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "6px",
    color: "hsl(var(--tl-accent-text))",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(10, 12, 20, 0.85)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
    >
      <div
        className="relative flex flex-col rounded-xl shadow-2xl"
        style={{
          width: "580px",
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
            Modifier la recherche
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
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Infos morceau */}
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "hsl(var(--tl-accent-terc))" }}
            >
              Informations du morceau
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label style={labelStyle}>Titre</label>
                <input
                  type="text"
                  value={form.titre_morceau ?? ""}
                  onChange={(e) => set("titre_morceau", e.target.value)}
                  style={inputStyle}
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
              <div>
                <label style={labelStyle}>Artiste</label>
                <input
                  type="text"
                  value={form.artiste ?? ""}
                  onChange={(e) => set("artiste", e.target.value)}
                  style={inputStyle}
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
              <div>
                <label style={labelStyle}>Album</label>
                <input
                  type="text"
                  value={form.album ?? ""}
                  onChange={(e) => set("album", e.target.value)}
                  style={inputStyle}
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
              <div>
                <label style={labelStyle}>Année</label>
                <input
                  type="text"
                  value={form.annee ?? ""}
                  onChange={(e) => set("annee", e.target.value)}
                  style={inputStyle}
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
            </div>
          </div>

          {/* Instrument */}
          <div>
            <label style={labelStyle}>Instrument</label>
            <div className="grid grid-cols-5 gap-2">
              {INSTRUMENTS_LISTE.map(({ id, label, Icon }) => {
                const actif = form.instrument === id;
                return (
                  <button
                    key={id}
                    onClick={() => set("instrument", actif ? "" : id)}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-all"
                    style={{
                      background: actif
                        ? "hsl(var(--tl-accent-dim))"
                        : "hsl(222, 18%, 17%)",
                      border: actif
                        ? "1px solid hsl(var(--tl-accent-border))"
                        : "1px solid transparent",
                    }}
                  >
                    <Icon
                      width="22"
                      height="22"
                      style={{ opacity: actif ? 1 : 0.6 }}
                    />
                    <span
                      className="text-[10px]"
                      style={{
                        color: actif
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(220, 15%, 55%)",
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plugin */}
          <div>
            <label style={labelStyle}>Plugin</label>
            {pluginsLoading ? (
              <p className="text-xs" style={{ color: "hsl(220, 15%, 45%)" }}>
                Chargement…
              </p>
            ) : (
              <div
                className="flex flex-wrap gap-2"
                style={{ maxHeight: "100px", overflowY: "auto" }}
              >
                {plugins.map((p) => {
                  const actif = form.pluginId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        set("pluginId", actif ? "" : p.id);
                        set("plugin", actif ? "" : p.nom);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                      style={{
                        background: actif
                          ? "hsl(var(--tl-accent-dim))"
                          : "hsl(222, 18%, 17%)",
                        border: actif
                          ? "1px solid hsl(var(--tl-accent-border))"
                          : "1px solid hsl(220, 15%, 22%)",
                        color: actif
                          ? "hsl(var(--tl-accent-text))"
                          : "hsl(215, 15%, 70%)",
                      }}
                    >
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt={p.nom}
                          className="rounded"
                          style={{ width: 20, height: 20, objectFit: "cover" }}
                        />
                      )}
                      {p.nom}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Réglages */}
          <div>
            <label style={labelStyle}>Réglages du plugin</label>
            <textarea
              value={form.reglages_plugin ?? ""}
              onChange={(e) => set("reglages_plugin", e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-md outline-none"
              style={{ ...inputStyle, resize: "vertical" as const }}
              onFocus={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor =
                  "hsl(var(--tl-accent-princ))";
              }}
              onBlur={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor =
                  "hsl(220, 15%, 24%)";
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes personnelles</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-md outline-none"
              style={{ ...inputStyle, resize: "vertical" as const }}
              onFocus={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor =
                  "hsl(var(--tl-accent-princ))";
              }}
              onBlur={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor =
                  "hsl(220, 15%, 24%)";
              }}
            />
          </div>

          {/* Capture */}
          <div>
            <label style={labelStyle}>Capture d'écran</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleCapture}
              className="hidden"
            />
            {capturePreview ? (
              <div className="relative">
                <img
                  src={capturePreview}
                  alt="Capture"
                  className="w-full rounded-lg"
                  style={{
                    maxHeight: "140px",
                    objectFit: "cover",
                    border: "1px solid hsl(220, 15%, 24%)",
                  }}
                />
                <button
                  onClick={() => {
                    setCaptureFile(null);
                    setCapturePreview(null);
                    set("captureUrl", "");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: "hsl(0, 60%, 40%)", color: "white" }}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-3 rounded-lg text-sm flex items-center justify-center gap-2"
                style={{
                  background: "hsl(222, 18%, 16%)",
                  border: "1px dashed hsl(220, 15%, 28%)",
                  color: "hsl(220, 15%, 50%)",
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
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags</label>
            <TagsInput
              tags={form.tags ?? []}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
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
            onClick={handleSauvegarder}
            disabled={uploading}
            className="px-5 py-2 rounded-lg text-sm font-medium"
            style={{
              background: "hsl(var(--tl-accent-button))",
              color: "hsl(var(--tl-accent-text))",
            }}
          >
            {uploading ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tags ───────────────────────────────────────────────────────
interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagsInput({ tags, onChange }: TagsInputProps) {
  const [saisie, setSaisie] = useState("");
  function ajouterTag() {
    const tag = saisie.trim().toLowerCase();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setSaisie("");
  }
  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{
                background: "hsl(var(--tl-accent-dim))",
                border: "1px solid hsl(var(--tl-accent-border))",
                color: "hsl(var(--tl-accent-text))",
              }}
            >
              {tag}
              <button
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="ml-0.5 opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              ajouterTag();
            }
          }}
          placeholder="Ajouter un tag (Entrée)"
          className="flex-1 text-sm px-3 py-2 rounded-md outline-none"
          style={{
            background: "hsl(222, 20%, 13%)",
            border: "1px solid hsl(220, 15%, 22%)",
            color: "hsl(210, 30%, 88%)",
          }}
        />
        <button
          onClick={ajouterTag}
          className="px-3 py-2 rounded-md text-sm"
          style={{
            background: "hsl(var(--tl-accent-dim))",
            border: "1px solid hsl(var(--tl-accent-border))",
            color: "hsl(var(--tl-accent-text))",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────
export function SoundResearchTool() {
  const {
    projet,
    entreeSelectionnee,
    rechercheSelectionnee,
    sousStackSelectionne,
    stackSelectionne,
    modifierEntree,
    vueActive,
    plugins,
    pluginsLoading,
  } = useApp();

  const [editModalOuverte, setEditModalOuverte] = useState(false);

  // ── Résolution de l'entrée à afficher ────────────────────────
  // Priorité : rechercheSelectionnee > sousStackSelectionne > entreeSelectionnee
  let entree: SoundEntry | null = null;
  let rechercheLabel: string | null = null;
  let sousStackTitre: string | null = null;
  let stackNom: string | null = null;

  if (projet) {
    for (const s of projet.stacks) {
      for (const ss of s.sousStacks) {
        // 1. Cherche par rechercheSelectionnee
        if (rechercheSelectionnee) {
          const r = ss.recherches?.find((r) => r.id === rechercheSelectionnee);
          if (r) {
            entree = r.entry;
            rechercheLabel = r.label;
            sousStackTitre = ss.titre;
            stackNom = s.nom;
            break;
          }
        }
        // 2. Fallback : cherche par entreeSelectionnee dans les recherches
        if (!entree && entreeSelectionnee) {
          const r = ss.recherches?.find(
            (r) => r.entry.id === entreeSelectionnee,
          );
          if (r) {
            entree = r.entry;
            rechercheLabel = r.label;
            sousStackTitre = ss.titre;
            stackNom = s.nom;
            break;
          }
        }
      }
      if (entree) break;
    }
  }

  function handleSauvegarder(modifications: Partial<SoundEntry>) {
    if (!entree) return;
    modifierEntree(entree.id, modifications);
  }

  // ── Vue Home ──────────────────────────────────────────────────
  if (vueActive === "home") return <PluginGallery />;
  if (vueActive === "metro") return null; // géré par App.tsx

  // ── Pas de projet ──────────────────────────────────────────────
  if (!projet) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "hsl(262, 40%, 20%)" }}
          >
            🎵
          </div>
          <h2 className="text-lg font-semibold text-gray-200 mb-2">
            Bienvenue dans ToneLab
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Créez ou ouvrez un projet via le menu{" "}
            <strong className="text-gray-400">Fichier</strong> pour commencer.
          </p>
        </div>
      </div>
    );
  }

  // ── Pas d'entrée sélectionnée ──────────────────────────────────
  if (!entree) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <StackIcon
            width="48"
            height="48"
            className="mx-auto mb-4"
            style={{
              background: "hsl(222, 20%, 16%)",
              color: "hsl(var(--tl-accent-princ))",
              borderRadius: "1rem",
              padding: "10px",
            }}
          />
          <h2 className="text-base font-medium text-gray-400 mb-2">
            {projet.stacks.length === 0
              ? "Aucun stack pour l'instant"
              : "Sélectionnez une recherche"}
          </h2>
          <p className="text-sm text-gray-600">
            {projet.stacks.length === 0
              ? 'Cliquez sur "+" dans la sidebar pour commencer.'
              : "Choisissez une recherche dans la sidebar."}
          </p>
        </div>
      </div>
    );
  }

  const pluginAssocie = plugins.find((p) => p.id === entree!.pluginId);
  const InstrIcon = entree.instrument
    ? INSTRUMENT_ICONS[entree.instrument]
    : null;

  // ── Affichage ─────────────────────────────────────────────────
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {/* ── En-tête ── */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Fil d'ariane : Stack > Titre > Instrument */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <div
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: "hsl(var(--tl-accent-mid))",
                    color: "hsl(var(--tl-accent-text))",
                  }}
                >
                  Stack Research
                </div>
                {stackNom && (
                  <div
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: "hsl(222, 18%, 18%)",
                      color: "hsl(215, 15%, 65%)",
                      border: "1px solid hsl(220, 15%, 24%)",
                    }}
                  >
                    {stackNom}
                  </div>
                )}
                {/* Badge instrument / label recherche */}
                {rechercheLabel && (
                  <>
                    <span
                      style={{ color: "hsl(220, 15%, 35%)", fontSize: "10px" }}
                    >
                      ›
                    </span>
                    <div
                      className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{
                        background: "hsl(var(--tl-accent-dim))",
                        color: "hsl(var(--tl-accent-text))",
                        border: "1px solid hsl(var(--tl-accent-border))",
                      }}
                    >
                      {InstrIcon && <InstrIcon width="9" height="9" />}
                      {rechercheLabel}
                    </div>
                  </>
                )}
              </div>

              {/* Titre + artiste */}
              <h1 className="text-xl font-bold text-white truncate">
                {sousStackTitre ||
                  entree.titre_morceau ||
                  "Nouvelle recherche sonore"}
              </h1>
              {entree.artiste && (
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "hsl(215, 15%, 60%)" }}
                >
                  {entree.artiste}
                </p>
              )}
              {entree.album && (
                <p
                  className="text-xs mt-0.5 flex items-center gap-1"
                  style={{ color: "hsl(var(--tl-accent-terc))" }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                  >
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <circle cx="5" cy="5" r="1.5" />
                  </svg>
                  {entree.album}
                  {entree.annee ? ` — ${entree.annee}` : ""}
                </p>
              )}
            </div>

            {/* Bouton modifier */}
            <button
              onClick={() => setEditModalOuverte(true)}
              className="flex-shrink-0 ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: "hsl(222, 18%, 18%)",
                color: "hsl(215, 15%, 65%)",
                border: "1px solid hsl(220, 15%, 26%)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "hsl(222, 18%, 22%)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "hsl(var(--tl-accent-text))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "hsl(222, 18%, 18%)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "hsl(215, 15%, 65%)";
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" />
              </svg>
              Modifier
            </button>
          </div>

          {/* ── Instrument + Plugin ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {entree.instrument && InstrIcon && (
              <section>
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2"
                  style={{
                    color: "hsl(var(--tl-accent-text))",
                    borderBottom: "1px solid hsl(220, 15%, 18%)",
                  }}
                >
                  Instrument
                </h2>
                <div
                  className="flex items-center gap-3 px-3 py-3 rounded-xl"
                  style={{
                    background: "hsl(222, 18%, 14%)",
                    border: "1px solid hsl(220, 15%, 22%)",
                  }}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: "hsl(222, 20%, 20%)" }}
                  >
                    <InstrIcon width="24" height="24" />
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "hsl(210, 30%, 88%)" }}
                  >
                    {INSTRUMENT_LABELS[entree.instrument] ?? entree.instrument}
                  </span>
                </div>
              </section>
            )}

            {pluginAssocie && (
              <section>
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2"
                  style={{
                    color: "hsl(var(--tl-accent-text))",
                    borderBottom: "1px solid hsl(220, 15%, 18%)",
                  }}
                >
                  Plugin associé
                </h2>
                <div
                  className="flex items-center gap-3 px-3 py-3 rounded-xl"
                  style={{
                    background: "hsl(222, 18%, 14%)",
                    border: "1px solid hsl(220, 15%, 22%)",
                  }}
                >
                  {pluginAssocie.imageUrl && (
                    <img
                      src={pluginAssocie.imageUrl}
                      alt={pluginAssocie.nom}
                      className="rounded-lg flex-shrink-0"
                      style={{ width: 48, height: 48, objectFit: "cover" }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "hsl(210, 30%, 88%)" }}
                    >
                      {pluginAssocie.nom}
                    </p>
                    {pluginAssocie.siteUrl && (
                      <a
                        href={pluginAssocie.siteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs truncate block mt-0.5 hover:underline"
                        style={{ color: "hsl(var(--tl-accent-terc))" }}
                      >
                        {pluginAssocie.siteUrl}
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Plugin nom seul si pas dans pluginAssocie */}
          {!pluginAssocie && entree.plugin && (
            <section className="mb-5">
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2"
                style={{
                  color: "hsl(var(--tl-accent-text))",
                  borderBottom: "1px solid hsl(220, 15%, 18%)",
                }}
              >
                Plugin
              </h2>
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl"
                style={{
                  background: "hsl(222, 18%, 14%)",
                  border: "1px solid hsl(220, 15%, 22%)",
                }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: "hsl(222, 20%, 20%)" }}
                >
                  🔌
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: "hsl(210, 30%, 88%)" }}
                >
                  {entree.plugin}
                </span>
              </div>
            </section>
          )}

          {/* Réglages */}
          {entree.reglages_plugin && (
            <section className="mb-5">
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2"
                style={{
                  color: "hsl(var(--tl-accent-terc))",
                  borderBottom: "1px solid hsl(220, 15%, 18%)",
                }}
              >
                Réglages du plugin
              </h2>
              <div
                className="px-4 py-3 rounded-xl text-sm whitespace-pre-wrap"
                style={{
                  background: "hsl(222, 18%, 14%)",
                  border: "1px solid hsl(220, 15%, 22%)",
                  color: "hsl(210, 25%, 80%)",
                  lineHeight: "1.6",
                }}
              >
                {entree.reglages_plugin}
              </div>
            </section>
          )}

          {/* Notes */}
          {entree.notes && (
            <section className="mb-5">
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2"
                style={{
                  color: "hsl(150, 60%, 55%)",
                  borderBottom: "1px solid hsl(220, 15%, 18%)",
                }}
              >
                Notes personnelles
              </h2>
              <div
                className="px-4 py-3 rounded-xl text-sm whitespace-pre-wrap"
                style={{
                  background: "hsl(222, 18%, 14%)",
                  border: "1px solid hsl(220, 15%, 22%)",
                  color: "hsl(210, 25%, 80%)",
                  lineHeight: "1.6",
                }}
              >
                {entree.notes}
              </div>
            </section>
          )}

          {/* Capture */}
          {entree.captureUrl && (
            <section className="mb-5">
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2"
                style={{
                  color: "hsl(var(--tl-accent-text))",
                  borderBottom: "1px solid hsl(220, 15%, 18%)",
                }}
              >
                Capture du plugin
              </h2>
              <img
                src={entree.captureUrl}
                alt="Capture plugin"
                className="w-full rounded-xl"
                style={{
                  border: "1px solid hsl(220, 15%, 22%)",
                  maxHeight: "280px",
                  objectFit: "cover",
                }}
              />
            </section>
          )}

          {/* Tags */}
          {entree.tags && entree.tags.length > 0 && (
            <section className="mb-5">
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2"
                style={{
                  color: "hsl(var(--tl-accent-text))",
                  borderBottom: "1px solid hsl(220, 15%, 18%)",
                }}
              >
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {entree.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: "hsl(var(--tl-accent-dim))",
                      border: "1px solid hsl(var(--tl-accent-border))",
                      color: "hsl(var(--tl-accent-text))",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Métadonnées */}
          <div
            className="text-[11px] text-gray-600 pt-4"
            style={{ borderTop: "1px solid hsl(220, 15%, 16%)" }}
          >
            <p>
              Créée le{" "}
              {new Date(entree.date_creation).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              Modifiée le{" "}
              {new Date(entree.date_modification).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {editModalOuverte && entree && (
        <EditModal
          entry={entree}
          plugins={plugins}
          pluginsLoading={pluginsLoading}
          onSauvegarder={handleSauvegarder}
          onFermer={() => setEditModalOuverte(false)}
        />
      )}
    </>
  );
}
