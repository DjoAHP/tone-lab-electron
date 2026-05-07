// src/types/index.ts

export type InstrumentType =
  | "piano"
  | "trombone"
  | "trompette"
  | "micro"
  | "rhodes"
  | "synthetiseur"
  | "drum"
  | "tom"
  | "cordes"
  | "voix"
  | "autre";

export interface Plugin {
  id: string;
  nom: string;
  imageUrl: string;
  siteUrl: string;
  instrument?: InstrumentType;
  date_ajout: string;
}

export interface SoundEntry {
  id: string;
  titre_morceau: string;
  artiste: string;
  album: string;
  annee: string;
  instrument: InstrumentType | "";
  pluginId: string;
  plugin: string;
  reglages_plugin: string;
  captureUrl?: string;
  notes: string;
  tags: string[];
  date_creation: string;
  date_modification: string;
}

// ─── NOUVEAU : une recherche pour un instrument précis dans un titre ───
// C'est le niveau le plus profond : Projet > Stack > SousStack > RechercheInstrument
export interface RechercheInstrument {
  id: string;
  // Nom affiché dans la sidebar (ex: "Rhodes", "Guitare clean"…)
  // Par défaut = le label de l'instrument, mais renommable
  label: string;
  entry: SoundEntry;
}

// Sous-stack = un TITRE musical dans un Stack (album)
// Il peut contenir plusieurs recherches, une par instrument
export interface SousStack {
  id: string;
  titre: string; // nom du titre musical
  // Nouveau : tableau de recherches par instrument
  recherches: RechercheInstrument[];
  // entry gardée pour rétrocompatibilité (migration automatique)
  entry: SoundEntry;
}

// ─── NOUVEAU : morceau dans une setlist ────────────────
export interface SetlistSong {
  id: string;
  title: string;
  position: number; // position dans la setlist (1, 2, 3...)
  time?: number; // durée en secondes (optionnel)
  tonality?: string; // tonalité (ex: "C", "D#", "Fm")
}

// Stack = un album / groupe de recherches dans un Projet
export interface Stack {
  id: string;
  nom: string; // ex: "Band of Gypsys"
  sousStacks: SousStack[];
  date_creation: string;
  date_modification: string;
}

export interface ToneLabProject {
  id: string;
  version: string;
  nom: string;
  description: string;
  date_creation: string;
  date_modification: string;
  stacks: Stack[];
  entries: SoundEntry[]; // gardé pour rétrocompatibilité
  bandName?: string;           // Nom du groupe (outil Setlist)
  setlistSongs?: SetlistSong[]; // Morceaux de la setlist
}

export interface AppState {
  projet: ToneLabProject | null;
  plugins: Plugin[];
  pluginsLoading: boolean;
  entreeSelectionnee: string | null; // id de SoundEntry sélectionnée
  stackSelectionne: string | null; // id du Stack
  sousStackSelectionne: string | null; // id du SousStack
  rechercheSelectionnee: string | null; // id de RechercheInstrument (NOUVEAU)
  sidebarOuverte: boolean;
  setlistSidebarOuverte: boolean;
  setlistSidebarWidth: number;
  ongletActif: "stack" | "metro" | "diapa" | "setlist";
  vueActive: "home" | "stack" | "metro" | "diapa" | "setlist";
  // Sauvegarde la vue active par onglet pour restaurer lors du switch
  vuesParOnglet: Record<string, string>;
  modifie: boolean;
}
