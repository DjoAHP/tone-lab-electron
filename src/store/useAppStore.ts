// src/store/useAppStore.ts

import { useState, useCallback, useEffect } from "react";
import type {
  AppState,
  ToneLabProject,
  SoundEntry,
  Plugin,
  InstrumentType,
  Stack,
  SousStack,
  RechercheInstrument,
  SetlistSong,
  DocvFileItem,
  SoundType,
  SubdivisionType,
  BeatConfig,
  MetronomeServiceState,
  ChronoServiceState,
} from "../types";
import {
  fetchPlugins,
  addPlugin as fbAddPlugin,
  deletePlugin as fbDeletePlugin,
  saveProject,
} from "../services/firebaseService";
import { uploadImageCloudinary } from "../lib/cloudinary";
import metronomeService from "../services/metronomeService";
import chronoService from "../services/chronoService";

function genererID(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function maintenant(): string {
  return new Date().toISOString();
}

function creerProjetVide(nom: string): ToneLabProject {
  return {
    id: genererID(),
    version: "1.1.0",
    nom,
    description: "",
    date_creation: maintenant(),
    date_modification: maintenant(),
    stacks: [],
    entries: [],
  };
}

// ── Migration : garantit que chaque SousStack a un tableau `recherches` ──
function migrerSousStack(ss: SousStack): SousStack {
  if (ss.recherches && ss.recherches.length > 0) return ss;
  // Ancien format : entry seule → on crée une RechercheInstrument par défaut
  const rechercheDefaut: RechercheInstrument = {
    id: genererID(),
    label: ss.entry.instrument
      ? labelInstrument(ss.entry.instrument)
      : "Recherche principale",
    entry: ss.entry,
  };
  return { ...ss, recherches: [rechercheDefaut] };
}

function labelInstrument(instr: InstrumentType | ""): string {
  const map: Record<string, string> = {
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
  return map[instr] ?? "Recherche";
}

function migrerProjet(projet: ToneLabProject): ToneLabProject {
  // Migration v0 : entries sans stacks
  if (
    projet.entries &&
    projet.entries.length > 0 &&
    (!projet.stacks || projet.stacks.length === 0)
  ) {
    const stackDefaut: Stack = {
      id: genererID(),
      nom: "Recherches",
      date_creation: projet.date_creation,
      date_modification: projet.date_modification,
      sousStacks: projet.entries.map((entry) => {
        const rechercheDefaut: RechercheInstrument = {
          id: genererID(),
          label: entry.instrument
            ? labelInstrument(entry.instrument)
            : "Recherche principale",
          entry,
        };
        return {
          id: genererID(),
          titre: entry.titre_morceau || "Sans titre",
          entry,
          recherches: [rechercheDefaut],
        };
      }),
    };
    return { ...projet, stacks: [stackDefaut] };
  }

  if (!projet.stacks) return { ...projet, stacks: [] };

  // Migration v1 : stacks sans recherches dans les sous-stacks
  const stacksMigres = projet.stacks.map((s) => ({
    ...s,
    sousStacks: s.sousStacks.map(migrerSousStack),
  }));

  return { ...projet, stacks: stacksMigres };
}

const CLE_SAUVEGARDE = "tonelab_projet_courant";

function chargerDepuisLocalStorage(): ToneLabProject | null {
  try {
    const donnees = localStorage.getItem(CLE_SAUVEGARDE);
    if (donnees) {
      const projet = JSON.parse(donnees) as ToneLabProject;
      return migrerProjet(projet);
    }
  } catch {
    console.warn("Impossible de charger depuis localStorage");
  }
  return null;
}

function sauvegarderDansLocalStorage(projet: ToneLabProject): void {
  try {
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(projet));
  } catch {
    console.warn("Impossible de sauvegarder dans localStorage");
  }
}

// ─────────────────────────────────────────────────────────────────
export function useAppStore() {
  const [state, setState] = useState<AppState>(() => {
    // Charger le projet ou créer un projet par défaut "Nouveau projet"
    let projet = chargerDepuisLocalStorage();
    if (!projet) {
      projet = creerProjetVide("Nouveau projet");
      sauvegarderDansLocalStorage(projet);
    }

    return {
      projet,
      plugins: [],
      pluginsLoading: true,
      entreeSelectionnee: null,
      stackSelectionne: null,
      sousStackSelectionne: null,
      rechercheSelectionnee: null,
      sidebarOuverte: true,
      setlistSidebarOuverte: true,
      setlistSidebarWidth: 220, // largeur sauvegardée en px
      ongletActif: "stack",
      vueActive: "home",
      // Sauvegarde la vue active par onglet pour restaurer lors du switch
      vuesParOnglet: {
        stack: "home",
        metro: "metro",
        diapa: "diapa",
        setlist: "setlist",
        chrono: "chrono",
      } as Record<string, string>,
      modifie: false,
      // DocV
      docvFiles: null,
      docvSelectedFile: null,
      docvSidebarOuverte: false,
      docvSidebarWidth: 300,
      // Métronome (synchronisé avec metronomeService)
      isMetronomePlaying: false,
      metronomeCurrentBeat: -1,
      metronomeCurrentSub: -1,
      metronomeBpm: 120,
      metronomeNumerator: 4,
      metronomeDenominator: 4,
      metronomeSubdivision: 'none' as SubdivisionType,
      metronomeSound: 'click' as SoundType,
      metronomeMasterVolume: 0.8,
      metronomeAccentVolume: 1.0,
      metronomeWeakVolume: 0.65,
      metronomeBeats: Array(4).fill(null).map((_, i) => ({ accent: i === 0 ? 2 : 1 } as BeatConfig)),
      // Chrono (synchronisé avec chronoService)
      isChronoRunning: false,
      chronoElapsedMs: 0,
    };
  });

  useEffect(() => {
    fetchPlugins().then((plugins) => {
      setState((prev) => ({ ...prev, plugins, pluginsLoading: false }));
    });
  }, []);

  // Sync store avec metronomeService
  useEffect(() => {
    const handleMetronomeState = (serviceState: MetronomeServiceState) => {
      setState((prev) => ({
        ...prev,
        isMetronomePlaying: serviceState.isPlaying,
        metronomeCurrentBeat: serviceState.currentBeat,
        metronomeCurrentSub: serviceState.currentSub,
        metronomeBpm: serviceState.bpm,
        metronomeNumerator: serviceState.numerator,
        metronomeDenominator: serviceState.denominator,
        metronomeSubdivision: serviceState.subdivision,
        metronomeSound: serviceState.sound,
        metronomeMasterVolume: serviceState.masterVolume,
        metronomeAccentVolume: serviceState.accentVolume,
        metronomeWeakVolume: serviceState.weakVolume,
        metronomeBeats: serviceState.beats,
      }));
    };

    metronomeService.onStateChange(handleMetronomeState);

    return () => {
      metronomeService.offStateChange(handleMetronomeState);
    };
  }, []);

  // Sync store avec chronoService
  useEffect(() => {
    const handleChronoState = (serviceState: ChronoServiceState) => {
      setState((prev) => ({
        ...prev,
        isChronoRunning: serviceState.isRunning,
        chronoElapsedMs: serviceState.elapsedMs,
      }));
    };

    chronoService.onUpdate(handleChronoState);

    return () => {
      chronoService.offUpdate(handleChronoState);
    };
  }, []);

  const mettreAJourEtat = useCallback((modifications: any) => {
    setState((prev) => {
      const newModifications = { ...modifications };

      // Si on modifie vueActive sans fournir vuesParOnglet, on synchro automatiquement
      if ('vueActive' in modifications && !('vuesParOnglet' in modifications)) {
        newModifications.vuesParOnglet = {
          ...prev.vuesParOnglet,
          [prev.ongletActif]: modifications.vueActive,
        };
      }

      return { ...prev, ...newModifications };
    });
  }, []);

  // ── Toggles DocV Sidebar ───────────────────────────────────────
  const toggleDocvSidebar = useCallback(() => {
    mettreAJourEtat({ docvSidebarOuverte: !state.docvSidebarOuverte });
  }, [state.docvSidebarOuverte, mettreAJourEtat]);

  const setVueActive = useCallback(
    (vue: "home" | "stack" | "metro" | "diapa" | "setlist" | "chrono" | "docv") => mettreAJourEtat({ vueActive: vue }),
    [mettreAJourEtat],
  );

  const setOngletActif = useCallback(
    (onglet: "stack" | "metro" | "diapa" | "setlist" | "chrono" | "docv") => {
      // Sauvegarde la vue active de l'onglet actuel
      const vuesParOnglet = { ...state.vuesParOnglet };
      vuesParOnglet[state.ongletActif] = state.vueActive;

      // Restaure la vue de l'onglet cible
      let nouvelleVue = vuesParOnglet[onglet] || "home";

      // Si pas de projet actif sur l'outil stack, force home
      if (onglet === "stack" && !state.projet) {
        nouvelleVue = "home";
      }

      mettreAJourEtat({
        ongletActif: onglet,
        vueActive: nouvelleVue,
        vuesParOnglet,
      });
    },
    [state.ongletActif, state.vueActive, state.vuesParOnglet, state.projet, mettreAJourEtat],
  );
  // ── Initialiser le projet si nécessaire ──────────────────
  const initialiserProjet = useCallback(() => {
    if (state.projet) return;
    const nouveauProjet: ToneLabProject = {
      id: genererID(),
      version: "1.1.0",
      nom: "Nouveau Projet",
      description: "",
      date_creation: maintenant(),
      date_modification: maintenant(),
      stacks: [],
      entries: [],
    };
    sauvegarderDansLocalStorage(nouveauProjet);
    mettreAJourEtat({ projet: nouveauProjet, modifie: true });
  }, [state.projet, mettreAJourEtat]);

  // ─── Actions Setlist ──────────────────────────────────────
  const setBandName = useCallback(
    (name: string) => {
      if (!state.projet) return;
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        bandName: name,
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const addSetlistSong = useCallback(
    (title: string) => {
      if (!state.projet) return;
      const newSong: SetlistSong = {
        id: genererID(),
        title,
        position: (state.projet.setlistSongs?.length ?? 0) + 1,
      };
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        setlistSongs: [...(state.projet.setlistSongs ?? []), newSong],
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const updateSetlistSong = useCallback(
    (songId: string, updates: Partial<SetlistSong>) => {
      if (!state.projet?.setlistSongs) return;
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        setlistSongs: state.projet.setlistSongs.map((s) =>
          s.id === songId ? { ...s, ...updates } : s
        ),
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const deleteSetlistSong = useCallback(
    (songId: string) => {
      if (!state.projet?.setlistSongs) return;
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        setlistSongs: state.projet.setlistSongs
          .filter((s) => s.id !== songId)
          .map((s, i) => ({ ...s, position: i + 1 })),
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const reorderSetlistSong = useCallback(
    (songId: string, newPosition: number) => {
      if (!state.projet?.setlistSongs) return;
      const songs = [...state.projet.setlistSongs];
      const songIndex = songs.findIndex((s) => s.id === songId);
      if (songIndex === -1) return;

      const [song] = songs.splice(songIndex, 1);
      songs.splice(Math.min(newPosition - 1, songs.length), 0, song);

      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        setlistSongs: songs.map((s, i) => ({ ...s, position: i + 1 })),
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  // ── NOUVEAU : Importer une setlist depuis un fichier .tl ──
  const importerSetlist = useCallback(
    (contenuJSON: string): boolean => {
      try {
        const data = JSON.parse(contenuJSON) as Partial<ToneLabProject>;
        if (!state.projet) return false;

        const projetMisAJour: ToneLabProject = {
          ...state.projet,
          bandName: data.bandName ?? state.projet.bandName,
          setlistSongs: data.setlistSongs ?? state.projet.setlistSongs ?? [],
          date_modification: maintenant(),
        };
        sauvegarderDansLocalStorage(projetMisAJour);
        mettreAJourEtat({ projet: projetMisAJour, modifie: true });
        return true;
      } catch {
        return false;
      }
    },
    [state.projet, mettreAJourEtat],
  );

  // ── Actions DocV ────────────────────────────────────────
  const setDocvFiles = useCallback(
    (files: DocvFileItem[] | null) => {
      mettreAJourEtat({ docvFiles: files, modifie: true });
    },
    [mettreAJourEtat],
  );

  const setDocvSelectedFile = useCallback(
    (fileId: string | null) => {
      mettreAJourEtat({ docvSelectedFile: fileId, modifie: true });
    },
    [mettreAJourEtat],
  );

  const setDocvSidebarWidth = useCallback(
    (width: number) => {
      mettreAJourEtat({ docvSidebarWidth: width, modifie: true });
    },
    [mettreAJourEtat],
  );

  const addDocvFiles = useCallback(
    (files: DocvFileItem[]) => {
      mettreAJourEtat((state: AppState) => ({
        docvFiles: files,
        modifie: true,
      }));
    },
    [mettreAJourEtat],
  );

  const clearDocvFiles = useCallback(() => {
    mettreAJourEtat({ docvFiles: null, docvSelectedFile: null, modifie: true });
  }, [mettreAJourEtat]);

  // ── Projet ───────────────────────────────────────────────────
  const nouveauProjet = useCallback(
    (nom: string) => {
      const projet = creerProjetVide(nom);
      sauvegarderDansLocalStorage(projet);
      saveProject(projet);
      // Si on est sur l'outil stack, affiche directement la vue stack (projet)
      const nouvelleVue = state.ongletActif === "stack" ? "stack" as const : "home" as const;
      mettreAJourEtat({
        projet,
        entreeSelectionnee: null,
        stackSelectionne: null,
        sousStackSelectionne: null,
        rechercheSelectionnee: null,
        modifie: false,
        vueActive: nouvelleVue,
      });
    },
    [mettreAJourEtat],
  );

  const renommerProjet = useCallback(
    (nouveauNom: string) => {
      if (!state.projet) return;
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        nom: nouveauNom,
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const ouvrirProjet = useCallback(
    (contenuJSON: string): boolean => {
      try {
        const projetBrut = JSON.parse(contenuJSON) as ToneLabProject;
        if (!projetBrut.nom || !projetBrut.version)
          throw new Error("Format invalide");
        const projet = migrerProjet(projetBrut);
        sauvegarderDansLocalStorage(projet);
        saveProject(projet);
        // Si on est sur l'outil stack, affiche directement la vue stack (projet)
        const nouvelleVue = state.ongletActif === "stack" ? "stack" as const : "home" as const;
        mettreAJourEtat({
          projet,
          entreeSelectionnee: null,
          stackSelectionne: null,
          sousStackSelectionne: null,
          rechercheSelectionnee: null,
          modifie: false,
          vueActive: nouvelleVue,
        });
        return true;
      } catch {
        return false;
      }
    },
    [mettreAJourEtat],
  );

  const sauvegarderProjet = useCallback(() => {
    if (!state.projet) return;
    const projetMisAJour: ToneLabProject = {
      ...state.projet,
      date_modification: maintenant(),
    };
    const blob = new Blob([JSON.stringify(projetMisAJour, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `${projetMisAJour.nom.replace(/\s+/g, "_")}.tl`;
    lien.click();
    URL.revokeObjectURL(url);
    sauvegarderDansLocalStorage(projetMisAJour);
    saveProject(projetMisAJour);
    mettreAJourEtat({ projet: projetMisAJour, modifie: false });
  }, [state.projet, mettreAJourEtat]);

  const enregistrerProjet = useCallback(() => {
    if (!state.projet) return;
    const projetMisAJour: ToneLabProject = {
      ...state.projet,
      date_modification: maintenant(),
    };
    sauvegarderDansLocalStorage(projetMisAJour);
    saveProject(projetMisAJour);
    mettreAJourEtat({ projet: projetMisAJour, modifie: false });
  }, [state.projet, mettreAJourEtat]);

  // ── Stacks ───────────────────────────────────────────────────
  const ajouterStack = useCallback(
    (nom: string) => {
      if (!state.projet) return;
      const nouveauStack: Stack = {
        id: genererID(),
        nom,
        sousStacks: [],
        date_creation: maintenant(),
        date_modification: maintenant(),
      };
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: [...state.projet.stacks, nouveauStack],
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const renommerStack = useCallback(
    (stackId: string, nouveauNom: string) => {
      if (!state.projet) return;
      const stacksMisAJour = state.projet.stacks.map((s) =>
        s.id === stackId
          ? { ...s, nom: nouveauNom, date_modification: maintenant() }
          : s,
      );
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: stacksMisAJour,
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const supprimerStack = useCallback(
    (stackId: string) => {
      if (!state.projet) return;
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: state.projet.stacks.filter((s) => s.id !== stackId),
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({
        projet: projetMisAJour,
        stackSelectionne:
          state.stackSelectionne === stackId ? null : state.stackSelectionne,
        sousStackSelectionne: null,
        rechercheSelectionnee: null,
        entreeSelectionnee: null,
        modifie: true,
        vueActive:
          state.stackSelectionne === stackId ? "home" : state.vueActive,
      });
    },
    [state.projet, state.stackSelectionne, state.vueActive, mettreAJourEtat],
  );

  // ── Sous-Stacks (titres musicaux) ────────────────────────────
  const ajouterSousStack = useCallback(
    (
      stackId: string,
      data: {
        titre_morceau: string;
        instrument: InstrumentType | "";
        pluginId: string;
        plugin: string;
        reglages_plugin: string;
        notes: string;
        artiste?: string;
        album?: string;
        annee?: string;
        captureUrl?: string;
      },
    ) => {
      if (!state.projet) return;

      const nouvelleEntry: SoundEntry = {
        id: genererID(),
        titre_morceau: data.titre_morceau,
        artiste: data.artiste ?? "",
        album: data.album ?? "",
        annee: data.annee ?? "",
        instrument: data.instrument,
        pluginId: data.pluginId,
        plugin: data.plugin,
        reglages_plugin: data.reglages_plugin,
        captureUrl: data.captureUrl,
        notes: data.notes,
        tags: [],
        date_creation: maintenant(),
        date_modification: maintenant(),
      };

      // La première recherche = instrument choisi (ou "Recherche principale")
      const premiereRecherche: RechercheInstrument = {
        id: genererID(),
        label: data.instrument
          ? labelInstrument(data.instrument)
          : "Recherche principale",
        entry: nouvelleEntry,
      };

      const nouveauSousStack: SousStack = {
        id: genererID(),
        titre: data.titre_morceau,
        entry: nouvelleEntry, // rétrocompat
        recherches: [premiereRecherche],
      };

      const stacksMisAJour = state.projet.stacks.map((s) =>
        s.id === stackId
          ? {
              ...s,
              sousStacks: [...s.sousStacks, nouveauSousStack],
              date_modification: maintenant(),
            }
          : s,
      );

      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: stacksMisAJour,
        date_modification: maintenant(),
      };

      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({
        projet: projetMisAJour,
        entreeSelectionnee: nouvelleEntry.id,
        stackSelectionne: stackId,
        sousStackSelectionne: nouveauSousStack.id,
        rechercheSelectionnee: premiereRecherche.id,
        modifie: true,
        vueActive: "stack",
      });
    },
    [state.projet, mettreAJourEtat],
  );

  // ── NOUVEAU : ajouter une recherche instrument dans un sous-stack existant ──
  const ajouterRechercheInstrument = useCallback(
    (
      stackId: string,
      sousStackId: string,
      data: {
        instrument: InstrumentType | "";
        pluginId: string;
        plugin: string;
        reglages_plugin: string;
        notes: string;
        captureUrl?: string;
        labelCustom?: string; // label personnalisé optionnel
      },
    ) => {
      if (!state.projet) return;

      // Récupère les infos du sous-stack parent pour pré-remplir l'entry
      let parentEntry: SoundEntry | null = null;
      for (const s of state.projet.stacks) {
        const ss = s.sousStacks.find((ss) => ss.id === sousStackId);
        if (ss) {
          parentEntry = ss.entry;
          break;
        }
      }

      const nouvelleEntry: SoundEntry = {
        id: genererID(),
        titre_morceau: parentEntry?.titre_morceau ?? "",
        artiste: parentEntry?.artiste ?? "",
        album: parentEntry?.album ?? "",
        annee: parentEntry?.annee ?? "",
        instrument: data.instrument,
        pluginId: data.pluginId,
        plugin: data.plugin,
        reglages_plugin: data.reglages_plugin,
        captureUrl: data.captureUrl,
        notes: data.notes,
        tags: [],
        date_creation: maintenant(),
        date_modification: maintenant(),
      };

      const nouvelleRecherche: RechercheInstrument = {
        id: genererID(),
        label:
          data.labelCustom ||
          (data.instrument
            ? labelInstrument(data.instrument)
            : "Nouvelle recherche"),
        entry: nouvelleEntry,
      };

      const stacksMisAJour = state.projet.stacks.map((s) =>
        s.id === stackId
          ? {
              ...s,
              sousStacks: s.sousStacks.map((ss) =>
                ss.id === sousStackId
                  ? {
                      ...ss,
                      recherches: [...(ss.recherches ?? []), nouvelleRecherche],
                    }
                  : ss,
              ),
            }
          : s,
      );

      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: stacksMisAJour,
        date_modification: maintenant(),
      };

      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({
        projet: projetMisAJour,
        entreeSelectionnee: nouvelleEntry.id,
        stackSelectionne: stackId,
        sousStackSelectionne: sousStackId,
        rechercheSelectionnee: nouvelleRecherche.id,
        modifie: true,
        vueActive: "stack",
      });
    },
    [state.projet, mettreAJourEtat],
  );

  // ── NOUVEAU : supprimer une recherche instrument ──────────────
  const supprimerRechercheInstrument = useCallback(
    (sousStackId: string, rechercheId: string) => {
      if (!state.projet) return;

      const stacksMisAJour = state.projet.stacks.map((s) => ({
        ...s,
        sousStacks: s.sousStacks.map((ss) =>
          ss.id === sousStackId
            ? {
                ...ss,
                recherches: ss.recherches.filter((r) => r.id !== rechercheId),
              }
            : ss,
        ),
      }));

      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: stacksMisAJour,
        date_modification: maintenant(),
      };

      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({
        projet: projetMisAJour,
        rechercheSelectionnee:
          state.rechercheSelectionnee === rechercheId
            ? null
            : state.rechercheSelectionnee,
        entreeSelectionnee:
          state.rechercheSelectionnee === rechercheId
            ? null
            : state.entreeSelectionnee,
        modifie: true,
        vueActive:
          state.rechercheSelectionnee === rechercheId
            ? "home"
            : state.vueActive,
      });
    },
    [
      state.projet,
      state.rechercheSelectionnee,
      state.entreeSelectionnee,
      state.vueActive,
      mettreAJourEtat,
    ],
  );

  // ── NOUVEAU : renommer le label d'une recherche ───────────────
  const renommerRechercheInstrument = useCallback(
    (sousStackId: string, rechercheId: string, nouveauLabel: string) => {
      if (!state.projet) return;

      const stacksMisAJour = state.projet.stacks.map((s) => ({
        ...s,
        sousStacks: s.sousStacks.map((ss) =>
          ss.id === sousStackId
            ? {
                ...ss,
                recherches: ss.recherches.map((r) =>
                  r.id === rechercheId ? { ...r, label: nouveauLabel } : r,
                ),
              }
            : ss,
        ),
      }));

      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: stacksMisAJour,
        date_modification: maintenant(),
      };

      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const modifierSousStack = useCallback(
    (sousStackId: string, modifications: Partial<SoundEntry>) => {
      if (!state.projet) return;
      const stacksMisAJour = state.projet.stacks.map((s) => ({
        ...s,
        sousStacks: s.sousStacks.map((ss) =>
          ss.id === sousStackId
            ? {
                ...ss,
                titre: modifications.titre_morceau ?? ss.titre,
                entry: {
                  ...ss.entry,
                  ...modifications,
                  date_modification: maintenant(),
                },
              }
            : ss,
        ),
      }));
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: stacksMisAJour,
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const supprimerSousStack = useCallback(
    (sousStackId: string) => {
      if (!state.projet) return;
      const stacksMisAJour = state.projet.stacks.map((s) => ({
        ...s,
        sousStacks: s.sousStacks.filter((ss) => ss.id !== sousStackId),
      }));
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: stacksMisAJour,
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({
        projet: projetMisAJour,
        sousStackSelectionne:
          state.sousStackSelectionne === sousStackId
            ? null
            : state.sousStackSelectionne,
        rechercheSelectionnee:
          state.sousStackSelectionne === sousStackId
            ? null
            : state.rechercheSelectionnee,
        entreeSelectionnee:
          state.sousStackSelectionne === sousStackId
            ? null
            : state.entreeSelectionnee,
        modifie: true,
        vueActive:
          state.sousStackSelectionne === sousStackId ? "home" : state.vueActive,
      });
    },
    [
      state.projet,
      state.sousStackSelectionne,
      state.rechercheSelectionnee,
      state.entreeSelectionnee,
      state.vueActive,
      mettreAJourEtat,
    ],
  );

  const selectionnerSousStack = useCallback(
    (
      sousStackId: string | null,
      stackId: string | null,
      entryId: string | null,
    ) => {
      mettreAJourEtat({
        sousStackSelectionne: sousStackId,
        stackSelectionne: stackId,
        entreeSelectionnee: entryId,
        rechercheSelectionnee: null,
        vueActive: sousStackId ? "stack" : "home",
      });
    },
    [mettreAJourEtat],
  );

  // ── NOUVEAU : sélectionner une recherche instrument ──────────
  const selectionnerRecherche = useCallback(
    (
      rechercheId: string,
      sousStackId: string,
      stackId: string,
      entryId: string,
    ) => {
      mettreAJourEtat({
        rechercheSelectionnee: rechercheId,
        sousStackSelectionne: sousStackId,
        stackSelectionne: stackId,
        entreeSelectionnee: entryId,
        vueActive: "stack",
      });
    },
    [mettreAJourEtat],
  );

  const selectionnerEntree = useCallback(
    (id: string | null) => {
      mettreAJourEtat({
        entreeSelectionnee: id,
        vueActive: (id ? "stack" : "home") as "stack" | "home",
      });
    },
    [mettreAJourEtat],
  );

  const modifierEntree = useCallback(
    (id: string, modifications: Partial<SoundEntry>) => {
      if (!state.projet) return;
      let trouve = false;

      const stacksMisAJour = state.projet.stacks.map((s) => ({
        ...s,
        sousStacks: s.sousStacks.map((ss) => {
          // Vérifie dans les recherches
          const recherchesMisAJour = ss.recherches.map((r) => {
            if (r.entry.id === id) {
              trouve = true;
              return {
                ...r,
                entry: {
                  ...r.entry,
                  ...modifications,
                  date_modification: maintenant(),
                },
              };
            }
            return r;
          });
          // Vérifie aussi l'entry directe (rétrocompat)
          const entryMisAJour =
            ss.entry.id === id
              ? {
                  ...ss.entry,
                  ...modifications,
                  date_modification: maintenant(),
                }
              : ss.entry;
          return {
            ...ss,
            recherches: recherchesMisAJour,
            entry: entryMisAJour,
          };
        }),
      }));

      if (!trouve) return;
      const projetMisAJour: ToneLabProject = {
        ...state.projet,
        stacks: stacksMisAJour,
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({ projet: projetMisAJour, modifie: true });
    },
    [state.projet, mettreAJourEtat],
  );

  const ajouterEntree = useCallback(
    (data: {
      titre_morceau: string;
      instrument: InstrumentType | "";
      pluginId: string;
      plugin: string;
      reglages_plugin: string;
      notes: string;
      captureUrl?: string;
    }) => {
      if (!state.projet) return;
      let stackId: string;
      if (state.projet.stacks.length === 0) {
        const nouveauStack: Stack = {
          id: genererID(),
          nom: "Stack 1",
          sousStacks: [],
          date_creation: maintenant(),
          date_modification: maintenant(),
        };
        setState((prev) => ({
          ...prev,
          projet: { ...prev.projet!, stacks: [nouveauStack] },
        }));
        stackId = nouveauStack.id;
      } else {
        stackId = state.stackSelectionne ?? state.projet.stacks[0].id;
      }
      ajouterSousStack(stackId, data);
    },
    [state.projet, state.stackSelectionne, ajouterSousStack],
  );

  const supprimerEntree = useCallback(
    (id: string) => {
      if (!state.projet) return;
      // Cherche la recherche ayant cet entry.id et la supprime
      for (const s of state.projet.stacks) {
        for (const ss of s.sousStacks) {
          const r = ss.recherches.find((r) => r.entry.id === id);
          if (r) {
            supprimerRechercheInstrument(ss.id, r.id);
            return;
          }
        }
      }
    },
    [state.projet, supprimerRechercheInstrument],
  );

  // ── Plugins ──────────────────────────────────────────────────
  const ajouterPlugin = useCallback(
    async (data: {
      nom: string;
      siteUrl: string;
      instrument?: InstrumentType;
      imageFile?: File;
      imageUrl?: string;
    }): Promise<void> => {
      let imageUrl = data.imageUrl ?? "";
      if (data.imageFile) {
        imageUrl = await uploadImageCloudinary(data.imageFile);
      }
      const plugin = await fbAddPlugin({
        nom: data.nom,
        imageUrl,
        siteUrl: data.siteUrl,
        instrument: data.instrument,
        date_ajout: maintenant(),
      });
      setState((prev) => ({ ...prev, plugins: [plugin, ...prev.plugins] }));
    },
    [],
  );

  const supprimerPlugin = useCallback(async (id: string): Promise<void> => {
    await fbDeletePlugin(id);
    setState((prev) => ({
      ...prev,
      plugins: prev.plugins.filter((p) => p.id !== id),
    }));
  }, []);

  // ── Sidebar ──────────────────────────────────────────────────
  const toggleSidebar = useCallback(() => {
    mettreAJourEtat({ sidebarOuverte: !state.sidebarOuverte });
  }, [state.sidebarOuverte, mettreAJourEtat]);
  // ── Setlist Sidebar ────────────────────────────────
  const toggleSetlistSidebar = useCallback(() => {
    mettreAJourEtat({ setlistSidebarOuverte: !state.setlistSidebarOuverte });
  }, [state.setlistSidebarOuverte, mettreAJourEtat]);
const setSetlistSidebarWidth = useCallback((width: number) => {    mettreAJourEtat({ setlistSidebarWidth: width });  }, [mettreAJourEtat]);


  return {
    // État
    projet: state.projet,
    plugins: state.plugins,
    pluginsLoading: state.pluginsLoading,
    entreeSelectionnee: state.entreeSelectionnee,
    stackSelectionne: state.stackSelectionne,
    sousStackSelectionne: state.sousStackSelectionne,
    rechercheSelectionnee: state.rechercheSelectionnee,
    sidebarOuverte: state.sidebarOuverte,
    setlistSidebarOuverte: state.setlistSidebarOuverte,
    setlistSidebarWidth: state.setlistSidebarWidth,
    ongletActif: state.ongletActif,
    vueActive: state.vueActive,
    modifie: state.modifie,
    // DocV
    docvFiles: state.docvFiles,
    docvSelectedFile: state.docvSelectedFile,
    docvSidebarOuverte: state.docvSidebarOuverte,
    docvSidebarWidth: state.docvSidebarWidth,
    // Métronome (synchronisé avec metronomeService)
    isMetronomePlaying: state.isMetronomePlaying,
    metronomeCurrentBeat: state.metronomeCurrentBeat,
    metronomeCurrentSub: state.metronomeCurrentSub,
    metronomeBpm: state.metronomeBpm,
    metronomeNumerator: state.metronomeNumerator,
    metronomeDenominator: state.metronomeDenominator,
    metronomeSubdivision: state.metronomeSubdivision,
    metronomeSound: state.metronomeSound,
    metronomeMasterVolume: state.metronomeMasterVolume,
    metronomeAccentVolume: state.metronomeAccentVolume,
    metronomeWeakVolume: state.metronomeWeakVolume,
    metronomeBeats: state.metronomeBeats,
    // Chrono (synchronisé avec chronoService)
    isChronoRunning: state.isChronoRunning,
    chronoElapsedMs: state.chronoElapsedMs,
    // Actions projet
    nouveauProjet,
    renommerProjet,
    ouvrirProjet,
    enregistrerProjet,
    sauvegarderProjet,
    initialiserProjet,
    // Actions stacks
    ajouterStack,
    renommerStack,
    supprimerStack,
    // Actions sous-stacks
    ajouterSousStack,
    modifierSousStack,
    supprimerSousStack,
    selectionnerSousStack,
    // Actions recherches instrument (NOUVEAU)
    ajouterRechercheInstrument,
    supprimerRechercheInstrument,
    renommerRechercheInstrument,
    selectionnerRecherche,
    // Actions entries (rétrocompat)
    ajouterEntree,
    modifierEntree,
    setSetlistSidebarWidth,
    supprimerEntree,
    selectionnerEntree,
    // UI
    toggleSidebar,
    toggleSetlistSidebar,
    setVueActive,
    setOngletActif,
    // Setlist
    setBandName,
    addSetlistSong,
    updateSetlistSong,
    deleteSetlistSong,
    reorderSetlistSong,
    importerSetlist,
    // DocV
    toggleDocvSidebar,
    setDocvFiles,
    setDocvSelectedFile,
    setDocvSidebarWidth,
    addDocvFiles,
    clearDocvFiles,
    // Plugins
    ajouterPlugin,
    supprimerPlugin,
  };
}
