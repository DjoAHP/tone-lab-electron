// src/store/useAppStore.ts

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  AppState,
  ToneLabProject,
  SoundEntry,
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
  const stackDefaut: Stack = {
    id: genererID(),
    nom: "Nouveau Stack",
    sousStacks: [],
    date_creation: maintenant(),
    date_modification: maintenant(),
  };
  return {
    id: genererID(),
    version: "1.1.0",
    nom,
    description: "",
    date_creation: maintenant(),
    date_modification: maintenant(),
    stacks: [stackDefaut],
    entries: [],
  };
}

// â”€â”€ Migration : garantit que chaque SousStack a un tableau `recherches` â”€â”€
function migrerSousStack(ss: SousStack): SousStack {
  const legacy = ss as SousStack & { entry?: SoundEntry };
  if (ss.recherches && ss.recherches.length > 0) {
    if (legacy.entry) {
      const rest = { ...ss };
      delete (rest as { entry?: unknown }).entry;
      return rest;
    }
    return ss;
  }
  if (legacy.entry) {
    const rechercheDefaut: RechercheInstrument = {
      id: genererID(),
      label: legacy.entry.instrument
        ? labelInstrument(legacy.entry.instrument)
        : "Recherche principale",
      entry: legacy.entry,
    };
    return { ...ss, recherches: [rechercheDefaut] };
  }
  return { ...ss, recherches: [] };
}

function labelInstrument(instr: InstrumentType | ""): string {
  const map: Record<string, string> = {
    piano: "Piano",
    trombone: "Trombone",
    trompette: "Trompette",
    micro: "Micro",
    rhodes: "Rhodes",
    synthetiseur: "SynthÃ©tiseur",
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

  // Garantir au moins un Stack (artiste) par défaut
  if (stacksMigres.length === 0) {
    return {
      ...projet,
      stacks: [
        {
          id: genererID(),
          nom: "Nouveau Stack",
          sousStacks: [],
          date_creation: projet.date_creation,
          date_modification: projet.date_modification,
        },
      ],
    };
  }

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function useAppStore() {
  const [state, setState] = useState<AppState>(() => {
    // Charger le projet ou crÃ©er un projet par dÃ©faut "Nouveau projet"
    let projet = chargerDepuisLocalStorage();
    if (!projet) {
      projet = creerProjetVide("ToneLab");
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
      setlistSidebarWidth: 220, // largeur sauvegardÃ©e en px
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
      demandeEditionNomProjet: false,
      // DocV
      docvFiles: null,
      docvSelectedFile: null,
      docvSidebarOuverte: false,
      docvSidebarWidth: 300,
      // MÃ©tronome (synchronisÃ© avec metronomeService)
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
      // Chrono (synchronisÃ© avec chronoService)
      isChronoRunning: false,
      chronoElapsedMs: 0,

      // DocV Audio Player
      docvAudioUrl: null,
      docvAudioPlaying: false,
      docvAudioCurrentTime: 0,
      docvAudioDuration: 0,
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
      setState((prev) => {
        // Ignore les notifications ne changeant aucun champ visible (évite les re-renders inutiles)
        if (
          prev.isMetronomePlaying === serviceState.isPlaying &&
          prev.metronomeCurrentBeat === serviceState.currentBeat &&
          prev.metronomeCurrentSub === serviceState.currentSub &&
          prev.metronomeBpm === serviceState.bpm &&
          prev.metronomeNumerator === serviceState.numerator &&
          prev.metronomeDenominator === serviceState.denominator &&
          prev.metronomeSubdivision === serviceState.subdivision &&
          prev.metronomeSound === serviceState.sound &&
          prev.metronomeMasterVolume === serviceState.masterVolume &&
          prev.metronomeAccentVolume === serviceState.accentVolume &&
          prev.metronomeWeakVolume === serviceState.weakVolume &&
          prev.metronomeBeats === serviceState.beats
        ) {
          return prev;
        }
        return {
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
        };
      });
    };

    metronomeService.onStateChange(handleMetronomeState);

    return () => {
      metronomeService.offStateChange(handleMetronomeState);
    };
  }, []);

  // Sync store avec chronoService
  // Throttle : le chrono notifie ~60 fps, on ne pousse dans le store qu'~5x/s
  // (l'affichage visuel est géré localement par ChronoTool via son propre listener)
  const chronoThrottleRef = useRef(0);
  useEffect(() => {
    const handleChronoState = (serviceState: ChronoServiceState) => {
      const now = Date.now();
      // mise à jour immédiate sur play/pause, sinon au plus ~5x/s
      if (serviceState.isRunning && now - chronoThrottleRef.current < 200) return;
      chronoThrottleRef.current = now;
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
      const mods = typeof modifications === "function" ? modifications(prev) : modifications;
      const newModifications = { ...mods };

      // Si on modifie vueActive sans fournir vuesParOnglet, on synchro automatiquement
      if ('vueActive' in mods && !('vuesParOnglet' in mods)) {
        newModifications.vuesParOnglet = {
          ...prev.vuesParOnglet,
          [prev.ongletActif]: mods.vueActive,
        };
      }

      return { ...prev, ...newModifications };
    });
  }, []);

  // â”€â”€ Toggles DocV Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  // â”€â”€ Initialiser le projet si nÃ©cessaire â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Actions Setlist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ NOUVEAU : Importer une setlist depuis un fichier .tl â”€â”€
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

  // â”€â”€ Actions DocV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      mettreAJourEtat(() => ({
        docvFiles: files,
        modifie: true,
      }));
    },
    [mettreAJourEtat],
  );

  const clearDocvFiles = useCallback(() => {
    mettreAJourEtat({ docvFiles: null, docvSelectedFile: null, modifie: true });
  }, [mettreAJourEtat]);

  // â”€â”€ Projet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // Déclenche l'édition inline du nom de projet dans la Sidebar (depuis le menu)
  const setDemandeEditionNomProjet = useCallback(
    (v: boolean) => mettreAJourEtat({ demandeEditionNomProjet: v }),
    [mettreAJourEtat],
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

  const sauvegarderProjet = useCallback(async () => {
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
    saveProject(projetMisAJour); // synchro cloud best-effort (ne bloque pas le témoin)
    mettreAJourEtat({ projet: projetMisAJour, modifie: false });
  }, [state.projet, mettreAJourEtat]);

  const enregistrerProjet = useCallback(async () => {
    if (!state.projet) return;
    const projetMisAJour: ToneLabProject = {
      ...state.projet,
      date_modification: maintenant(),
    };
    sauvegarderDansLocalStorage(projetMisAJour);
    saveProject(projetMisAJour); // synchro cloud best-effort
    mettreAJourEtat({ projet: projetMisAJour, modifie: false });
  }, [state.projet, mettreAJourEtat]);

  // â”€â”€ Stacks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Sous-Stacks (titres musicaux) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ── Sous-Stacks (titres musicaux) : conteneur nom-only ──
    // ── Sous-Stacks (titres musicaux) : conteneur nom-only ──
  const ajouterSousStack = useCallback(
    (stackId: string, titre: string) => {
      if (!state.projet) return;

      const nouveauSousStack: SousStack = {
        id: genererID(),
        titre: titre.trim() || "Sans titre",
        recherches: [],
      };

      const stacksMisAJour = state.projet.stacks.map((s: Stack) =>
        s.id === stackId
          ? { ...s, sousStacks: [...s.sousStacks, nouveauSousStack], date_modification: maintenant() }
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
        entreeSelectionnee: null,
        stackSelectionne: stackId,
        sousStackSelectionne: nouveauSousStack.id,
        rechercheSelectionnee: null,
        modifie: true,
        vueActive: "stack",
      });
    },
    [state.projet, mettreAJourEtat],
  );

  // â”€â”€ NOUVEAU : ajouter une recherche instrument dans un sous-stack existant â”€â”€
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
        labelCustom?: string; // label personnalisÃ© optionnel
      },
    ) => {
      if (!state.projet) return;

      // RÃ©cupÃ¨re les infos du sous-stack parent pour prÃ©-remplir l'entry
      let parentEntry: SoundEntry | null = null;
      let titreParent = "";
      for (const s of state.projet.stacks) {
        const ss = s.sousStacks.find((ss) => ss.id === sousStackId);
        if (ss) {
          parentEntry = ss.recherches?.[0]?.entry ?? null;
          titreParent = ss.titre;
          break;
        }
      }

      const nouvelleEntry: SoundEntry = {
        id: genererID(),
        titre_morceau: parentEntry?.titre_morceau ?? titreParent,
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

  // â”€â”€ NOUVEAU : supprimer une recherche instrument â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ NOUVEAU : renommer le label d'une recherche â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    (sousStackId: string, modifications: { titre_morceau?: string }) => {
      if (!state.projet) return;
      const stacksMisAJour = state.projet.stacks.map((s) => ({
        ...s,
        sousStacks: s.sousStacks.map((ss) =>
          ss.id === sousStackId
            ? {
                ...ss,
                titre: modifications.titre_morceau ?? ss.titre,
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

  // â”€â”€ NOUVEAU : sÃ©lectionner une recherche instrument â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          // VÃ©rifie dans les recherches
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
          // VÃ©rifie aussi l'entry directe (rÃ©trocompat)
          return {
            ...ss,
            recherches: recherchesMisAJour,
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
      let projetDeBase = state.projet;
      let stackId: string;
      if (projetDeBase.stacks.length === 0) {
        const nouveauStack: Stack = {
          id: genererID(),
          nom: "Stack 1",
          sousStacks: [],
          date_creation: maintenant(),
          date_modification: maintenant(),
        };
        projetDeBase = { ...projetDeBase, stacks: [nouveauStack] };
        stackId = nouveauStack.id;
      } else {
        stackId = state.stackSelectionne ?? projetDeBase.stacks[0].id;
      }

      // Cree un titre (nom) + une premiere recherche instrument
      const nouvelleEntry: SoundEntry = {
        id: genererID(),
        titre_morceau: data.titre_morceau,
        artiste: "",
        album: "",
        annee: "",
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
        label: data.instrument ? labelInstrument(data.instrument) : "Nouvelle recherche",
        entry: nouvelleEntry,
      };
      const nouveauSousStack: SousStack = {
        id: genererID(),
        titre: data.titre_morceau,
        recherches: [nouvelleRecherche],
      };

      const projetMisAJour: ToneLabProject = {
        ...projetDeBase,
        stacks: projetDeBase.stacks.map((s) =>
          s.id === stackId
            ? { ...s, sousStacks: [...s.sousStacks, nouveauSousStack], date_modification: maintenant() }
            : s,
        ),
        date_modification: maintenant(),
      };
      sauvegarderDansLocalStorage(projetMisAJour);
      saveProject(projetMisAJour);
      mettreAJourEtat({
        projet: projetMisAJour,
        entreeSelectionnee: nouvelleEntry.id,
        stackSelectionne: stackId,
        sousStackSelectionne: nouveauSousStack.id,
        rechercheSelectionnee: nouvelleRecherche.id,
        modifie: true,
        vueActive: "stack",
      });
    },
    [state.projet, state.stackSelectionne, mettreAJourEtat],
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

  // â”€â”€ Plugins â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleSidebar = useCallback(() => {
    mettreAJourEtat({ sidebarOuverte: !state.sidebarOuverte });
  }, [state.sidebarOuverte, mettreAJourEtat]);
  // â”€â”€ Setlist Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleSetlistSidebar = useCallback(() => {
    mettreAJourEtat({ setlistSidebarOuverte: !state.setlistSidebarOuverte });
  }, [state.setlistSidebarOuverte, mettreAJourEtat]);
  // ---- DocV Audio Player ----
  const [youtubePlayerRef, setYoutubePlayerRef] = useState<any>(null);

  const setDocvAudioUrl = useCallback(
    (url: string | null) => {
      mettreAJourEtat({ docvAudioUrl: url, modifie: true });
    },
    [mettreAJourEtat],
  );

  const setDocvAudioPlaying = useCallback(
    (playing: boolean) => {
      mettreAJourEtat({ docvAudioPlaying: playing });
    },
    [mettreAJourEtat],
  );

  const setDocvAudioTime = useCallback(
    (time: number, duration?: number) => {
      const updates: any = { docvAudioCurrentTime: time };
      if (duration !== undefined) updates.docvAudioDuration = duration;
      mettreAJourEtat(updates);
    },
    [mettreAJourEtat],
  );

  const registerYouTubePlayer = useCallback((player: any) => {
    setYoutubePlayerRef(player);
  }, []);

  const seekYouTubeAudio = useCallback((delta: number) => {
    if (!youtubePlayerRef) return;
    const currentTime = youtubePlayerRef.getCurrentTime();
    const duration = youtubePlayerRef.getDuration();
    const newTime = Math.max(0, Math.min(duration, currentTime + delta));
    youtubePlayerRef.seekTo(newTime, true);
  }, [youtubePlayerRef]);

  const playPauseYouTubeAudio = useCallback(() => {
    if (!youtubePlayerRef) return;
    const state = youtubePlayerRef.getPlayerState();
    if (state === 1) {
      youtubePlayerRef.pauseVideo();
    } else {
      youtubePlayerRef.playVideo();
    }
  }, [youtubePlayerRef]);
const setSetlistSidebarWidth = useCallback((width: number) => {    mettreAJourEtat({ setlistSidebarWidth: width });  }, [mettreAJourEtat]);


  return {
    // Ã‰tat
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
    demandeEditionNomProjet: state.demandeEditionNomProjet,
    // DocV
    docvFiles: state.docvFiles,
    docvSelectedFile: state.docvSelectedFile,
    docvSidebarOuverte: state.docvSidebarOuverte,
    docvSidebarWidth: state.docvSidebarWidth,
    // MÃ©tronome (synchronisÃ© avec metronomeService)
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
    // Chrono (synchronisÃ© avec chronoService)
    isChronoRunning: state.isChronoRunning,
    chronoElapsedMs: state.chronoElapsedMs,
    // Actions projet
    nouveauProjet,
    renommerProjet,
    setDemandeEditionNomProjet,
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
    // Actions entries (rÃ©trocompat)
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
    // DocV Audio Player
    docvAudioUrl: state.docvAudioUrl,
    docvAudioPlaying: state.docvAudioPlaying,
    docvAudioCurrentTime: state.docvAudioCurrentTime,
    docvAudioDuration: state.docvAudioDuration,
    setDocvAudioUrl,
    setDocvAudioPlaying,
    setDocvAudioTime,
    registerYouTubePlayer,
    seekYouTubeAudio,
    playPauseYouTubeAudio,  };
}


