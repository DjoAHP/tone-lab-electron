// src/components/Sidebar.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "../context/AppContext";
import type { Stack, SousStack, RechercheInstrument, ToneLabProject, InstrumentType } from "../types";
import ProjetIcon from "../assets/icons/Sidebar/projet.svg?react";
import StackIcon from "../assets/icons/Sidebar/stack.svg?react";
import { HomeButton } from "./HomeButton";

// Import icônes instruments
import PianoIcon from "../assets/icons/Instruments/piano.svg?react";
import TromboneIcon from "../assets/icons/Instruments/trombone.svg?react";
import TrompetteIcon from "../assets/icons/Instruments/trompette.svg?react";
import MicroIcon from "../assets/icons/Instruments/Micro.svg?react";
import RhodesIcon from "../assets/icons/Instruments/Rhodes.svg?react";
import SynthetiseurIcon from "../assets/icons/Instruments/synthetiseur.svg?react";
import DrumIcon from "../assets/icons/Instruments/drum.svg?react";
import TomIcon from "../assets/icons/Instruments/tom.svg?react";

const LARGEUR_MIN = 200;
const LARGEUR_MAX = 520;
const LARGEUR_DEFAUT = 280;

// ── Icône instrument miniature ────────────────────────────────
const INSTRUMENT_ICONS: Partial<
  Record<string, React.FC<React.SVGProps<SVGSVGElement>>>
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

// ── Inline edit ───────────────────────────────────────────────
interface InlineEditProps {
  valeur: string;
  onSauvegarder: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  autoFocusOnMount?: boolean;
}

function InlineEdit({ valeur, onSauvegarder, className, style, autoFocusOnMount }: InlineEditProps) {
  const [editing, setEditing] = useState(autoFocusOnMount ?? false);
  const [draft, setDraft] = useState(valeur);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Sync si valeur externe change
  useEffect(() => {
    if (!editing) setDraft(valeur);
  }, [valeur, editing]);

  function confirmer() {
    const val = draft.trim();
    if (val && val !== valeur) onSauvegarder(val);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirmer}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmer();
          if (e.key === "Escape") { setDraft(valeur); setEditing(false); }
        }}
        onClick={(e) => e.stopPropagation()}
        className={className}
        style={{
          ...style,
          background: "hsl(222, 20%, 20%)",
          border: "1px solid hsl(var(--tl-accent-border))",
          borderRadius: "4px",
          padding: "1px 4px",
          outline: "none",
          width: "100%",
        }}
      />
    );
  }

  return (
    <span className={className} style={style} onDoubleClick={() => setEditing(true)}>
      {valeur}
    </span>
  );
}

// ── Icône crayon ──────────────────────────────────────────────
function CrayonIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1.5l1.5 1.5L3 8.5 1 9l.5-2L7 1.5z" />
    </svg>
  );
}

// ── Icône + petite ────────────────────────────────────────────
function PlusIcon({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" fill="none"
      stroke="currentColor" strokeWidth="1.5">
      <line x1="4" y1="1" x2="4" y2="7" />
      <line x1="1" y1="4" x2="7" y2="4" />
    </svg>
  );
}

// ── Icône × petite ────────────────────────────────────────────
function XIcon({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor">
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Bouton icône discret ──────────────────────────────────────
interface BtnIconProps {
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  accentOnHover?: boolean;
  dangerOnHover?: boolean;
  children: React.ReactNode;
}

function BtnIcon({ onClick, title, accentOnHover, dangerOnHover, children }: BtnIconProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
      style={{ color: "hsl(220, 15%, 40%)" }}
      onMouseEnter={(e) => {
        if (accentOnHover) {
          (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--tl-accent-mid))";
          (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--tl-accent-text))";
        } else if (dangerOnHover) {
          (e.currentTarget as HTMLButtonElement).style.color = "hsl(0, 70%, 60%)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = "hsl(220, 15%, 40%)";
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// NIVEAU 3 : Recherche instrument
// ─────────────────────────────────────────────────────────────
interface RechercheItemProps {
  recherche: RechercheInstrument;
  estSelectionnee: boolean;
  onSelectionner: () => void;
  onSupprimer: () => void;
  onRenommer: (label: string) => void;
}

function RechercheItem({
  recherche,
  estSelectionnee,
  onSelectionner,
  onSupprimer,
  onRenommer,
}: RechercheItemProps) {
  const [survol, setSurvol] = useState(false);
  const InstrIcon = recherche.entry.instrument
    ? INSTRUMENT_ICONS[recherche.entry.instrument]
    : null;

  return (
    <div
      onClick={onSelectionner}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      className="flex items-center justify-between cursor-pointer rounded-md px-2 py-1 transition-all"
      style={{
        background: estSelectionnee ? "hsl(var(--tl-accent-dim))" : survol ? "hsl(222, 18%, 18%)" : "transparent",
        borderLeft: estSelectionnee
          ? "2px solid hsl(var(--tl-accent-terc))"
          : "2px solid transparent",
      }}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {/* Icône instrument ou point */}
        {InstrIcon ? (
          <InstrIcon
            width="10"
            height="10"
            style={{
              flexShrink: 0,
              opacity: estSelectionnee ? 1 : 0.5,
            }}
          />
        ) : (
          <svg width="5" height="5" viewBox="0 0 5 5" fill="currentColor"
            style={{ color: estSelectionnee ? "hsl(var(--tl-accent-terc))" : "hsl(220, 15%, 35%)", flexShrink: 0 }}>
            <circle cx="2.5" cy="2.5" r="2" />
          </svg>
        )}

        <InlineEdit
          valeur={recherche.label}
          onSauvegarder={onRenommer}
          className="text-[11px] truncate flex-1"
          style={{
            color: estSelectionnee ? "hsl(var(--tl-accent-text))" : "hsl(215, 15%, 58%)",
            fontFamily: "Geist Variable, sans-serif",
          }}
        />
      </div>

      {survol && (
        <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
          <BtnIcon
            dangerOnHover
            title="Supprimer cette recherche"
            onClick={() => {
              if (window.confirm(`Supprimer "${recherche.label}" ?`)) onSupprimer();
            }}
          >
            <XIcon />
          </BtnIcon>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NIVEAU 2 : Sous-stack (titre musical)
// ─────────────────────────────────────────────────────────────
interface SousStackItemProps {
  sousStack: SousStack;
  stackId: string;
  estSelectionne: boolean; // au moins une recherche sélectionnée
  onSupprimer: () => void;
  onRenommer: (nom: string) => void;
  onAjouterRecherche: () => void;
}

function SousStackItem({
  sousStack,
  stackId,
  estSelectionne,
  onSupprimer,
  onRenommer,
  onAjouterRecherche,
}: SousStackItemProps) {
  const [ouvert, setOuvert] = useState(estSelectionne);
  const [survol, setSurvol] = useState(false);
  const {
    rechercheSelectionnee,
    selectionnerRecherche,
    supprimerRechercheInstrument,
    renommerRechercheInstrument,
  } = useApp();

  // Ouvre automatiquement si une de ses recherches est sélectionnée
  useEffect(() => {
    if (estSelectionne) setOuvert(true);
  }, [estSelectionne]);

  const aDesRecherches = sousStack.recherches && sousStack.recherches.length > 0;

  return (
    <div className="mb-0.5">
      {/* En-tête sous-stack */}
      <div
        onClick={() => setOuvert(!ouvert)}
        onMouseEnter={() => setSurvol(true)}
        onMouseLeave={() => setSurvol(false)}
        className="flex items-center gap-1.5 cursor-pointer rounded-md px-2 py-1.5 transition-all"
        style={{
          background: estSelectionne
            ? "hsl(222, 18%, 16%)"
            : survol
              ? "hsl(222, 18%, 16%)"
              : "transparent",
          borderLeft: estSelectionne
            ? "2px solid hsl(var(--tl-accent-princ))"
            : "2px solid transparent",
        }}
      >
        {/* Chevron */}
        <svg width="7" height="7" viewBox="0 0 10 10" fill="currentColor"
          className="flex-shrink-0 transition-transform duration-150"
          style={{ color: "hsl(220, 15%, 40%)", transform: ouvert ? "rotate(90deg)" : "rotate(0deg)" }}>
          <path d="M3 2l4 3-4 3V2z" />
        </svg>

        {/* Nom titre */}
        <InlineEdit
          valeur={sousStack.titre}
          onSauvegarder={onRenommer}
          className="text-xs truncate flex-1"
          style={{
            color: estSelectionne ? "hsl(210, 30%, 88%)" : "hsl(215, 15%, 65%)",
            fontFamily: "Geist Variable, sans-serif",
          }}
        />

        {/* Compteur recherches */}
        <span className="text-[10px] flex-shrink-0" style={{ color: "hsl(220, 15%, 38%)" }}>
          {sousStack.recherches?.length ?? 0}
        </span>

        {/* Boutons survol */}
        {survol && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <BtnIcon accentOnHover title="Ajouter un instrument" onClick={() => { onAjouterRecherche(); setOuvert(true); }}>
              <PlusIcon />
            </BtnIcon>
            <BtnIcon dangerOnHover title="Supprimer ce titre"
              onClick={() => { if (window.confirm(`Supprimer "${sousStack.titre}" ?`)) onSupprimer(); }}>
              <XIcon />
            </BtnIcon>
          </div>
        )}
      </div>

      {/* Recherches par instrument */}
      {ouvert && (
        <div style={{ marginLeft: "16px", paddingLeft: "6px", borderLeft: "1px solid hsl(220, 15%, 18%)" }}>
          {!aDesRecherches ? (
            <p className="text-[10px] px-2 py-1" style={{ color: "hsl(220, 15%, 32%)" }}>
              Aucune recherche
            </p>
          ) : (
            sousStack.recherches.map((r) => (
              <RechercheItem
                key={r.id}
                recherche={r}
                estSelectionnee={rechercheSelectionnee === r.id}
                onSelectionner={() =>
                  selectionnerRecherche(r.id, sousStack.id, stackId, r.entry.id)
                }
                onSupprimer={() => supprimerRechercheInstrument(sousStack.id, r.id)}
                onRenommer={(label) => renommerRechercheInstrument(sousStack.id, r.id, label)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NIVEAU 1 : Stack (album)
// ─────────────────────────────────────────────────────────────
interface StackAccordeonProps {
  stack: Stack;
  onOuvrirModalSousStack: (stackId: string) => void;
  onOuvrirModalRecherche: (stackId: string, sousStackId: string) => void;
}

function StackAccordeon({ stack, onOuvrirModalSousStack, onOuvrirModalRecherche }: StackAccordeonProps) {
  const [ouvert, setOuvert] = useState(true);
  const [survol, setSurvol] = useState(false);
  const {
    sousStackSelectionne,
    rechercheSelectionnee,
    supprimerSousStack,
    renommerStack,
    supprimerStack,
    modifierSousStack,
    projet,
  } = useApp();

  // Vérifie si ce stack a une recherche sélectionnée
  const stackEstActif = stack.sousStacks.some(
    (ss) =>
      ss.id === sousStackSelectionne ||
      ss.recherches?.some((r) => r.id === rechercheSelectionnee)
  );

  return (
    <div className="mb-0.5">
      {/* En-tête Stack */}
      <div
        onClick={() => setOuvert(!ouvert)}
        onMouseEnter={() => setSurvol(true)}
        onMouseLeave={() => setSurvol(false)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all select-none"
        style={{ background: survol ? "hsl(222, 18%, 17%)" : "transparent" }}
      >
        <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"
          className="flex-shrink-0 transition-transform duration-150"
          style={{ color: "hsl(220, 15%, 45%)", transform: ouvert ? "rotate(90deg)" : "rotate(0deg)" }}>
          <path d="M3 2l4 3-4 3V2z" />
        </svg>

        <StackIcon width="12" height="12" style={{ color: "hsl(var(--tl-accent-terc))", flexShrink: 0 }} />

        <InlineEdit
          valeur={stack.nom}
          onSauvegarder={(nom) => renommerStack(stack.id, nom)}
          className="text-xs font-semibold truncate flex-1"
          style={{ color: "hsl(210, 20%, 75%)", fontFamily: "Geist Variable, sans-serif" }}
        />

        <span className="text-[10px] flex-shrink-0" style={{ color: "hsl(220, 15%, 40%)" }}>
          {stack.sousStacks.length}
        </span>

        {survol && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <BtnIcon accentOnHover title="Nouveau titre" onClick={() => { onOuvrirModalSousStack(stack.id); setOuvert(true); }}>
              <PlusIcon />
            </BtnIcon>
            <BtnIcon dangerOnHover title="Supprimer le stack"
              onClick={() => { if (window.confirm(`Supprimer le stack "${stack.nom}" ?`)) supprimerStack(stack.id); }}>
              <XIcon />
            </BtnIcon>
          </div>
        )}
      </div>

      {/* Sous-stacks */}
      {ouvert && (
        <div style={{ marginLeft: "20px", paddingLeft: "8px", borderLeft: "1px solid hsl(220, 15%, 20%)" }}>
          {stack.sousStacks.length === 0 ? (
            <p className="text-[10px] px-2 py-1.5" style={{ color: "hsl(220, 15%, 35%)" }}>
              Aucun titre
            </p>
          ) : (
            stack.sousStacks.map((ss) => {
              const estSelectionne =
                ss.id === sousStackSelectionne ||
                ss.recherches?.some((r) => r.id === rechercheSelectionnee);
              return (
                <SousStackItem
                  key={ss.id}
                  sousStack={ss}
                  stackId={stack.id}
                  estSelectionne={!!estSelectionne}
                  onSupprimer={() => supprimerSousStack(ss.id)}
                  onRenommer={(nom) => modifierSousStack(ss.id, { titre_morceau: nom })}
                  onAjouterRecherche={() => onOuvrirModalRecherche(stack.id, ss.id)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NIVEAU 0 : Projet
// ─────────────────────────────────────────────────────────────
interface ProjetAccordeonProps {
  projet: ToneLabProject;
  onOuvrirModalStack: () => void;
  onOuvrirModalSousStack: (stackId: string) => void;
  onOuvrirModalRecherche: (stackId: string, sousStackId: string) => void;
}

function ProjetAccordeon({
  projet,
  onOuvrirModalStack,
  onOuvrirModalSousStack,
  onOuvrirModalRecherche,
}: ProjetAccordeonProps) {
  const [ouvert, setOuvert] = useState(true);
  const [survol, setSurvol] = useState(false);
  // État local pour l'édition inline du nom de projet
  const [editingNom, setEditingNom] = useState(false);
  const { renommerProjet } = useApp();

  const totalRecherches = projet.stacks.reduce(
    (acc, s) =>
      acc + s.sousStacks.reduce((a, ss) => a + (ss.recherches?.length ?? 0), 0),
    0,
  );

  return (
    <div className="mb-1">
      {/* En-tête Projet */}
      <div
        onMouseEnter={() => setSurvol(true)}
        onMouseLeave={() => setSurvol(false)}
        className="flex items-center gap-1.5 px-2 py-2 mx-1 rounded-md transition-all select-none"
        style={{ background: survol ? "hsl(222, 18%, 17%)" : "transparent" }}
      >
        {/* Chevron (clic = toggle) */}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
          className="flex-shrink-0 transition-transform duration-150 cursor-pointer"
          style={{ color: "hsl(220, 15%, 45%)", transform: ouvert ? "rotate(90deg)" : "rotate(0deg)" }}
          onClick={() => setOuvert(!ouvert)}>
          <path d="M3 2l4 3-4 3V2z" />
        </svg>

        <ProjetIcon width="14" height="14"
          className="cursor-pointer"
          style={{ color: "hsl(var(--tl-accent-princ))", flexShrink: 0 }}
          onClick={() => setOuvert(!ouvert)} />

        {/* Nom projet — éditable inline */}
        {editingNom ? (
          <input
            autoFocus
            defaultValue={projet.nom}
            className="text-sm font-bold truncate flex-1 outline-none"
            style={{
              background: "hsl(222, 20%, 20%)",
              border: "1px solid hsl(var(--tl-accent-border))",
              borderRadius: "4px",
              padding: "1px 6px",
              color: "hsl(210, 30%, 88%)",
              fontFamily: "Geist Variable, sans-serif",
            }}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val && val !== projet.nom) renommerProjet(val);
              setEditingNom(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingNom(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-sm font-bold truncate flex-1 cursor-pointer"
            style={{ color: "hsl(210, 30%, 88%)", fontFamily: "Geist Variable, sans-serif" }}
            onClick={() => setOuvert(!ouvert)}
            onDoubleClick={() => setEditingNom(true)}
          >
            {projet.nom}
          </span>
        )}

        <span className="text-[10px] flex-shrink-0" style={{ color: "hsl(220, 15%, 40%)" }}>
          {totalRecherches}
        </span>

        {/* Boutons survol : crayon + nouveau stack */}
        {survol && !editingNom && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {/* ── BOUTON CRAYON : renommer le projet ── */}
            <button
              onClick={() => setEditingNom(true)}
              title="Renommer le projet"
              className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
              style={{ color: "hsl(220, 15%, 40%)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--tl-accent-text))";
                (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--tl-accent-mid))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "hsl(220, 15%, 40%)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <CrayonIcon size={9} />
            </button>

            {/* ── BOUTON + : nouveau stack ── */}
            <button
              onClick={onOuvrirModalStack}
              title="Nouveau stack"
              className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
              style={{ color: "hsl(220, 15%, 40%)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--tl-accent-mid))";
                (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--tl-accent-text))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "hsl(220, 15%, 40%)";
              }}
            >
              <PlusIcon size={8} />
            </button>
          </div>
        )}
      </div>

      {/* Stacks */}
      {ouvert && (
        <div style={{ marginLeft: "16px", paddingLeft: "8px", borderLeft: "1px solid hsl(220, 15%, 18%)" }}>
          {projet.stacks.length === 0 ? (
            <p className="text-[11px] px-2 py-2" style={{ color: "hsl(220, 15%, 38%)" }}>
              Aucun stack — cliquez sur "+"
            </p>
          ) : (
            projet.stacks.map((stack) => (
              <StackAccordeon
                key={stack.id}
                stack={stack}
                onOuvrirModalSousStack={onOuvrirModalSousStack}
                onOuvrirModalRecherche={onOuvrirModalRecherche}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal : Nouveau Stack (album)
// ─────────────────────────────────────────────────────────────
function NouveauStackModal({ onFermer, onCreer }: { onFermer: () => void; onCreer: (nom: string) => void }) {
  const [nom, setNom] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10, 12, 20, 0.82)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onFermer(); }}>
      <div className="flex flex-col rounded-xl shadow-2xl"
        style={{ width: "360px", background: "hsl(222, 22%, 12%)", border: "1px solid hsl(220, 15%, 22%)" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(220, 15%, 18%)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "hsl(210, 30%, 90%)" }}>Nouveau Stack</h2>
          <button onClick={onFermer} style={{ color: "hsl(220, 15%, 45%)" }}>
            <XIcon size={12} />
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: "hsl(var(--tl-accent-text))" }}>
            Nom du Stack (ex : album, projet musical…)
          </label>
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && nom.trim()) { onCreer(nom.trim()); onFermer(); } }}
            placeholder="Ex : Band of Gypsys"
            className="w-full text-sm px-3 py-2 rounded-md outline-none"
            style={{ background: "hsl(222, 20%, 16%)", border: "1px solid hsl(220, 15%, 24%)", color: "hsl(210, 30%, 88%)" }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "hsl(var(--tl-accent-princ))"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "hsl(220, 15%, 24%)"; }}
          />
        </div>
        <div className="flex justify-end gap-3 px-5 py-4" style={{ borderTop: "1px solid hsl(220, 15%, 18%)" }}>
          <button onClick={onFermer} className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "hsl(222, 18%, 18%)", color: "hsl(220, 15%, 60%)", border: "1px solid hsl(220, 15%, 24%)" }}>
            Annuler
          </button>
          <button onClick={() => { if (nom.trim()) { onCreer(nom.trim()); onFermer(); } }}
            disabled={!nom.trim()} className="px-5 py-2 rounded-lg text-sm font-medium"
            style={{
              background: nom.trim() ? "hsl(var(--tl-accent-button))" : "hsl(var(--tl-accent-dim))",
              color: nom.trim() ? "hsl(var(--tl-accent-text))" : "hsl(220, 15%, 40%)",
            }}>
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal : Nouvelle recherche instrument (dans un sous-stack)
// ─────────────────────────────────────────────────────────────
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

interface ModalRechercheProps {
  stackId: string;
  sousStackId: string;
  onFermer: () => void;
}

function ModalNouvelleRecherche({ stackId, sousStackId, onFermer }: ModalRechercheProps) {
  const { ajouterRechercheInstrument, plugins, pluginsLoading } = useApp();
  const [instrument, setInstrument] = useState<InstrumentType | "">("");
  const [pluginId, setPluginId] = useState("");
  const [pluginNom, setPluginNom] = useState("");
  const [reglages, setReglages] = useState("");
  const [notes, setNotes] = useState("");
  const [labelCustom, setLabelCustom] = useState("");
  const [erreur, setErreur] = useState("");

  async function handleAjouter() {
    if (!instrument && !labelCustom.trim()) {
      setErreur("Choisissez un instrument ou donnez un nom à la recherche.");
      return;
    }
    setErreur("");
    ajouterRechercheInstrument(stackId, sousStackId, {
      instrument,
      pluginId,
      plugin: pluginNom,
      reglages_plugin: reglages,
      notes,
      labelCustom: labelCustom.trim() || undefined,
    });
    onFermer();
  }

  const inputStyle = {
    background: "hsl(222, 20%, 16%)",
    border: "1px solid hsl(220, 15%, 24%)",
    color: "hsl(210, 30%, 88%)",
    borderRadius: "0.375rem",
    width: "100%",
    padding: "0.4rem 0.65rem",
    fontSize: "0.8125rem",
    outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10, 12, 20, 0.82)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onFermer(); }}>
      <div className="relative flex flex-col rounded-xl shadow-2xl"
        style={{ width: "480px", maxHeight: "85vh", background: "hsl(222, 22%, 12%)", border: "1px solid hsl(220, 15%, 22%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(220, 15%, 18%)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "hsl(210, 30%, 90%)" }}>
            Nouvelle recherche — instrument
          </h2>
          <button onClick={onFermer} style={{ color: "hsl(220, 15%, 45%)" }}><XIcon size={12} /></button>
        </div>

        {/* Corps */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">

          {/* Label custom */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "hsl(var(--tl-accent-text))" }}>
              Nom de la recherche (optionnel)
            </label>
            <input type="text" value={labelCustom} onChange={(e) => setLabelCustom(e.target.value)}
              placeholder="Ex : Guitare clean, Basse fretless…"
              style={inputStyle}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "hsl(var(--tl-accent-princ))"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "hsl(220, 15%, 24%)"; }}
            />
            <p className="text-[10px] mt-1" style={{ color: "hsl(220, 15%, 38%)" }}>
              Si vide, le nom de l'instrument sera utilisé
            </p>
          </div>

          {/* Instrument */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "hsl(var(--tl-accent-text))" }}>
              Instrument
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {INSTRUMENTS_LISTE.map(({ id, label, Icon }) => {
                const actif = instrument === id;
                return (
                  <button key={id} onClick={() => setInstrument(actif ? "" : id)}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg transition-all"
                    style={{
                      background: actif ? "hsl(var(--tl-accent-dim))" : "hsl(222, 18%, 17%)",
                      border: actif ? "1px solid hsl(var(--tl-accent-border))" : "1px solid transparent",
                    }}>
                    <Icon width="18" height="18" style={{ opacity: actif ? 1 : 0.55 }} />
                    <span className="text-[9px]"
                      style={{ color: actif ? "hsl(var(--tl-accent-text))" : "hsl(220, 15%, 50%)" }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plugin */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "hsl(var(--tl-accent-text))" }}>
              Plugin
            </label>
            {pluginsLoading ? (
              <p className="text-xs" style={{ color: "hsl(220, 15%, 45%)" }}>Chargement…</p>
            ) : plugins.length === 0 ? (
              <p className="text-xs" style={{ color: "hsl(220, 15%, 40%)" }}>Aucun plugin — ajoutez-en depuis Home.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5" style={{ maxHeight: "80px", overflowY: "auto" }}>
                {plugins.map((p) => {
                  const actif = pluginId === p.id;
                  return (
                    <button key={p.id}
                      onClick={() => { setPluginId(actif ? "" : p.id); setPluginNom(actif ? "" : p.nom); }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all"
                      style={{
                        background: actif ? "hsl(var(--tl-accent-dim))" : "hsl(222, 18%, 17%)",
                        border: actif ? "1px solid hsl(var(--tl-accent-border))" : "1px solid hsl(220, 15%, 22%)",
                        color: actif ? "hsl(var(--tl-accent-text))" : "hsl(215, 15%, 65%)",
                      }}>
                      {p.imageUrl && <img src={p.imageUrl} alt={p.nom} className="rounded" style={{ width: 16, height: 16, objectFit: "cover" }} />}
                      {p.nom}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Réglages */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "hsl(var(--tl-accent-text))" }}>
              Réglages
            </label>
            <textarea value={reglages} onChange={(e) => setReglages(e.target.value)}
              placeholder="Ex : Attack 0ms, Decay 80%…" rows={2}
              className="w-full text-sm px-3 py-2 rounded-md outline-none"
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "hsl(var(--tl-accent-princ))"; }}
              onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "hsl(220, 15%, 24%)"; }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "hsl(var(--tl-accent-text))" }}>
              Notes
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, idées…" rows={2}
              className="w-full text-sm px-3 py-2 rounded-md outline-none"
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "hsl(var(--tl-accent-princ))"; }}
              onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "hsl(220, 15%, 24%)"; }}
            />
          </div>

          {erreur && <p className="text-xs" style={{ color: "hsl(0, 70%, 60%)" }}>{erreur}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid hsl(220, 15%, 18%)" }}>
          <button onClick={onFermer} className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "hsl(222, 18%, 18%)", color: "hsl(220, 15%, 60%)", border: "1px solid hsl(220, 15%, 24%)" }}>
            Annuler
          </button>
          <button onClick={handleAjouter} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "hsl(var(--tl-accent-button))", color: "hsl(var(--tl-accent-text))" }}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar principale
// ─────────────────────────────────────────────────────────────
interface SidebarProps {
  onOuvrirModalStack: () => void;
}

export function Sidebar({ onOuvrirModalStack }: SidebarProps) {
  const { projet, sidebarOuverte, ajouterStack } = useApp();
  const [modalNouveauStack, setModalNouveauStack] = useState(false);
  // Pour la modal nouvelle recherche instrument
  const [modalRecherche, setModalRecherche] = useState<{
    stackId: string;
    sousStackId: string;
  } | null>(null);

  const [largeur, setLargeur] = useState(LARGEUR_DEFAUT);
  const enTrainDeRedimensionner = useRef(false);
  const largeurDepart = useRef(0);
  const xDepart = useRef(0);

  const demarrerRedimensionnement = useCallback(
    (e: React.MouseEvent) => {
      enTrainDeRedimensionner.current = true;
      xDepart.current = e.clientX;
      largeurDepart.current = largeur;
      e.preventDefault();
    },
    [largeur],
  );

  useEffect(() => {
    function surMouvement(e: MouseEvent) {
      if (!enTrainDeRedimensionner.current) return;
      const delta = e.clientX - xDepart.current;
      setLargeur(Math.min(Math.max(largeurDepart.current + delta, LARGEUR_MIN), LARGEUR_MAX));
    }
    function surRelachement() { enTrainDeRedimensionner.current = false; }
    document.addEventListener("mousemove", surMouvement);
    document.addEventListener("mouseup", surRelachement);
    return () => {
      document.removeEventListener("mousemove", surMouvement);
      document.removeEventListener("mouseup", surRelachement);
    };
  }, []);

  if (!sidebarOuverte) return null;

  return (
    <>
      <div
        className="flex flex-col h-full flex-shrink-0 relative"
        style={{ width: `${largeur}px`, background: "hsl(222, 20%, 11%)", borderRight: "1px solid hsl(220, 15%, 18%)" }}
      >
        {/* En-tête */}
        <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid hsl(220, 15%, 16%)" }}>
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(220, 15%, 45%)" }}>
            Projets
          </span>
        </div>

        {/* Bouton Home */}
        <div className="px-2 pt-2 pb-1 flex-shrink-0">
          <HomeButton />
        </div>

        {/* Séparateur */}
        <div className="mx-3 flex-shrink-0" style={{ height: "1px", background: "hsl(220, 15%, 18%)", marginBottom: "6px" }} />

        {/* Liste */}
        <div className="flex-1 overflow-y-auto py-1">
          {!projet ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs" style={{ color: "hsl(220, 15%, 35%)" }}>
                Aucun projet ouvert.<br />Utilisez Fichier → Nouveau projet
              </p>
            </div>
          ) : (
            <ProjetAccordeon
              projet={projet}
              onOuvrirModalStack={() => setModalNouveauStack(true)}
              onOuvrirModalSousStack={(stackId) => {
                // Délègue au parent (App.tsx) pour ouvrir la modal NewStackModal
                onOuvrirModalStack();
                // Stocke le stackId ciblé via l'App
              }}
              onOuvrirModalRecherche={(stackId, sousStackId) => {
                setModalRecherche({ stackId, sousStackId });
              }}
            />
          )}
        </div>

        {/* Poignée redimensionnement */}
        <div
          onMouseDown={demarrerRedimensionnement}
          className="absolute top-0 right-0 h-full transition-colors"
          style={{ width: "4px", cursor: "col-resize", background: "transparent", zIndex: 10 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--tl-accent-princ) / 0.3)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
        />
      </div>

      {/* Modal nouveau Stack */}
      {modalNouveauStack && (
        <NouveauStackModal
          onFermer={() => setModalNouveauStack(false)}
          onCreer={(nom) => ajouterStack(nom)}
        />
      )}

      {/* Modal nouvelle recherche instrument */}
      {modalRecherche && (
        <ModalNouvelleRecherche
          stackId={modalRecherche.stackId}
          sousStackId={modalRecherche.sousStackId}
          onFermer={() => setModalRecherche(null)}
        />
      )}
    </>
  );
}
