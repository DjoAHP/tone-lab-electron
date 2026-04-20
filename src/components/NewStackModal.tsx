// src/components/NewStackModal.tsx

import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import type { InstrumentType, Plugin } from "../types";

import PianoIcon from "../assets/icons/Instruments/piano.svg?react";
import TromboneIcon from "../assets/icons/Instruments/trombone.svg?react";
import TrompetteIcon from "../assets/icons/Instruments/trompette.svg?react";
import MicroIcon from "../assets/icons/Instruments/Micro.svg?react";
import RhodesIcon from "../assets/icons/Instruments/Rhodes.svg?react";
import SynthetiseurIcon from "../assets/icons/Instruments/synthetiseur.svg?react";
import DrumIcon from "../assets/icons/Instruments/drum.svg?react";
import TomIcon from "../assets/icons/Instruments/tom.svg?react";

const INSTRUMENTS: {
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

interface NewStackModalProps {
  stackId: string;
  onFermer: () => void;
}

export function NewStackModal({ stackId, onFermer }: NewStackModalProps) {
  const { ajouterSousStack, plugins, pluginsLoading } = useApp();

  const [titre, setTitre] = useState("");
  const [artiste, setArtiste] = useState("");
  const [album, setAlbum] = useState("");
  const [annee, setAnnee] = useState("");
  const [instrument, setInstrument] = useState<InstrumentType | "">("");
  const [pluginSelectionne, setPluginSelectionne] = useState<Plugin | null>(
    null,
  );
  const [reglages, setReglages] = useState("");
  const [notes, setNotes] = useState("");
  const [captureFile, setCaptureFile] = useState<File | null>(null);
  const [capturePreview, setCapturePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erreur, setErreur] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCaptureFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCapturePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAjouter() {
    if (!titre.trim()) {
      setErreur("Le nom de la recherche est requis.");
      return;
    }
    setErreur("");
    setUploading(true);
    try {
      let captureUrl: string | undefined;
      if (captureFile) {
        const { uploadImageCloudinary } = await import("../lib/cloudinary");
        captureUrl = await uploadImageCloudinary(captureFile);
      }
      ajouterSousStack(stackId, {
        titre_morceau: titre.trim(),
        artiste: artiste.trim(),
        album: album.trim(),
        annee: annee.trim(),
        instrument,
        pluginId: pluginSelectionne?.id ?? "",
        plugin: pluginSelectionne?.nom ?? "",
        reglages_plugin: reglages,
        notes,
        captureUrl,
      });
      onFermer();
    } catch (err) {
      setErreur("Erreur lors de l'upload de la capture. Réessaie.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  function handleOverlay(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onFermer();
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
        background: "rgba(10, 12, 20, 0.82)",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleOverlay}
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
            Nouvelle recherche sonore
          </h2>
          <button
            onClick={onFermer}
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ color: "hsl(220, 15%, 45%)" }}
          >
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
                <label style={labelStyle}>Titre *</label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex : Who Knows"
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
                  value={artiste}
                  onChange={(e) => setArtiste(e.target.value)}
                  placeholder="Ex : Jimi Hendrix"
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
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="Ex : Band of Gypsys"
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
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                  placeholder="Ex : 1970"
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
              {INSTRUMENTS.map(({ id, label, Icon }) => {
                const actif = instrument === id;
                return (
                  <button
                    key={id}
                    onClick={() => setInstrument(actif ? "" : id)}
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
            ) : plugins.length === 0 ? (
              <div
                className="text-xs px-3 py-2 rounded-md"
                style={{
                  background: "hsl(222, 18%, 16%)",
                  color: "hsl(220, 15%, 45%)",
                  border: "1px solid hsl(220, 15%, 22%)",
                }}
              >
                Aucun plugin — ajoutez-en depuis Home.
              </div>
            ) : (
              <div
                className="flex flex-wrap gap-2"
                style={{ maxHeight: "100px", overflowY: "auto" }}
              >
                {plugins.map((p) => {
                  const actif = pluginSelectionne?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPluginSelectionne(actif ? null : p)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-xs"
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
            <label style={labelStyle}>Réglages / Notes du plugin</label>
            <textarea
              value={reglages}
              onChange={(e) => setReglages(e.target.value)}
              placeholder="Ex : Attack 0ms, Decay 80%, Chorus ON"
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-md outline-none"
              style={{ ...inputStyle, resize: "vertical" }}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, contexte, idées de reproduction…"
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-md outline-none"
              style={{ ...inputStyle, resize: "vertical" }}
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
            <label style={labelStyle}>Capture d'écran (optionnel)</label>
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
            disabled={uploading || !titre.trim()}
            className="px-5 py-2 rounded-lg text-sm font-medium"
            style={{
              background:
                uploading || !titre.trim()
                  ? "hsl(var(--tl-accent-dim))"
                  : "hsl(var(--tl-accent-button))",
              color:
                uploading || !titre.trim()
                  ? "hsl(220, 15%, 40%)"
                  : "hsl(var(--tl-accent-text))",
              border: "1px solid transparent",
              cursor: uploading || !titre.trim() ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Upload…" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
