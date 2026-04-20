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

// Stack = un album / groupe de recherches dans un Projet
export interface Stack {
  id: string;
  nom: string; // ex: "Band of Gypsys"
  sousStacks: SousStack[];
  date_creation: string;
  date_modification: string;
}

export interface ToneLabProject {
  version: string;
  nom: string;
  description: string;
  date_creation: string;
  date_modification: string;
  stacks: Stack[];
  entries: SoundEntry[]; // gardé pour rétrocompatibilité
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
  ongletActif: "stack" | "metro";
  vueActive: "home" | "stack" | "metro";
  modifie: boolean;
}
