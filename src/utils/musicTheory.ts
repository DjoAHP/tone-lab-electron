// src/utils/musicTheory.ts
// Utilitaires pour la théorie musicale - Détection d'accords et gammes

export type NoteName = string; // ex: "C4", "D#5"

// Mapping note → degré chromatique (0-11)
const NOTE_TO_DEGREE: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

// Mapping inverse
const DEGREE_TO_NOTE: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Extraire la note sans l'octave
export function getNoteName(noteWithOctave: NoteName): string {
  return noteWithOctave.replace(/[0-9]/g, '');
}

// Extraire l'octave
export function getOctave(noteWithOctave: NoteName): number {
  const match = noteWithOctave.match(/(\d+)$/);
  return match ? parseInt(match[1]) : 4;
}

// Obtenir le degré chromatique (0-11)
export function getChromaticDegree(note: NoteName): number {
  return NOTE_TO_DEGREE[getNoteName(note)] ?? 0;
}

// Gammes majeures et mineures (intervalles en demi-tons)
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

export interface Scale {
  name: string;
  label: string;
  root: string;
  notes: string[]; // notes sans octave
}

// Générer une gamme
export function generateScale(root: string, intervals: number[]): string[] {
  const rootDegree = NOTE_TO_DEGREE[root] ?? 0;
  return intervals.map(interval => DEGREE_TO_NOTE[(rootDegree + interval) % 12]);
}

// Gammes prédéfinies (tonalités communes)
export const COMMON_SCALES: Scale[] = [
  { name: 'C-major', label: 'Do Majeur', root: 'C', notes: generateScale('C', MAJOR_INTERVALS) },
  { name: 'G-major', label: 'Sol Majeur', root: 'G', notes: generateScale('G', MAJOR_INTERVALS) },
  { name: 'D-major', label: 'Ré Majeur', root: 'D', notes: generateScale('D', MAJOR_INTERVALS) },
  { name: 'A-major', label: 'La Majeur', root: 'A', notes: generateScale('A', MAJOR_INTERVALS) },
  { name: 'E-major', label: 'Mi Majeur', root: 'E', notes: generateScale('E', MAJOR_INTERVALS) },
  { name: 'F-major', label: 'Fa Majeur', root: 'F', notes: generateScale('F', MAJOR_INTERVALS) },
  { name: 'Bb-major', label: 'Si♭ Majeur', root: 'Bb', notes: generateScale('Bb', MAJOR_INTERVALS) },
  { name: 'A-minor', label: 'La Mineur (relatif)', root: 'A', notes: generateScale('A', MINOR_INTERVALS) },
  { name: 'E-minor', label: 'Mi Mineur', root: 'E', notes: generateScale('E', MINOR_INTERVALS) },
  { name: 'B-minor', label: 'Si Mineur', root: 'B', notes: generateScale('B', MINOR_INTERVALS) },
  { name: 'F#-minor', label: 'Fa# Mineur', root: 'F#', notes: generateScale('F#', MINOR_INTERVALS) },
  { name: 'C#-minor', label: 'Do# Mineur', root: 'C#', notes: generateScale('C#', MINOR_INTERVALS) },
  { name: 'D-minor', label: 'Ré Mineur', root: 'D', notes: generateScale('D', MINOR_INTERVALS) },
  { name: 'G-minor', label: 'Sol Mineur', root: 'G', notes: generateScale('G', MINOR_INTERVALS) },
];

// Vérifier si une note appartient à une gamme
export function isNoteInScale(note: NoteName, scale: Scale): boolean {
  const noteName = getNoteName(note);
  return scale.notes.includes(noteName);
}

// ─── Détection d'accord ────────────────────────────────

interface ChordTemplate {
  name: string;
  label: string;
  intervals: number[]; // demi-tons depuis la racine
}

const CHORD_TEMPLATES: ChordTemplate[] = [
  { name: 'major', label: 'Majeur', intervals: [0, 4, 7] },
  { name: 'minor', label: 'Mineur', intervals: [0, 3, 7] },
  { name: 'diminished', label: 'Diminué', intervals: [0, 3, 6] },
  { name: 'augmented', label: 'Augmenté', intervals: [0, 4, 8] },
  { name: 'major7', label: '7 Majeur', intervals: [0, 4, 7, 11] },
  { name: 'minor7', label: '7 Mineur', intervals: [0, 3, 7, 10] },
  { name: 'dominant7', label: '7 Dominant', intervals: [0, 4, 7, 10] },
  { name: 'major6', label: '6 Majeur', intervals: [0, 4, 7, 9] },
  { name: 'minor6', label: '6 Mineur', intervals: [0, 3, 7, 9] },
  { name: 'sus2', label: 'Sus2', intervals: [0, 2, 7] },
  { name: 'sus4', label: 'Sus4', intervals: [0, 5, 7] },
  { name: 'dim7', label: 'Dim 7', intervals: [0, 3, 6, 9] },
  { name: 'half-dim7', label: 'Demi-dim 7', intervals: [0, 3, 6, 10] },
];

export interface DetectedChord {
  root: string;
  name: string;
  label: string;
  notes: string[]; // notes jouées (sans octave)
}

// Détecter un accord à partir d'un ensemble de notes
export function detectChord(notes: NoteName[]): DetectedChord | null {
  if (notes.length < 2) return null;

  const noteNames = notes.map(n => getNoteName(n));
  const uniqueNotes = [...new Set(noteNames)];

  if (uniqueNotes.length < 2) return null;

  // Essayer chaque note comme racine potentielle
  for (const root of uniqueNotes) {
    const rootDegree = NOTE_TO_DEGREE[root];

    // Calculer les intervalles depuis cette racine
    const intervals = uniqueNotes
      .map(n => (NOTE_TO_DEGREE[n] - rootDegree + 12) % 12)
      .sort((a, b) => a - b);

    // Chercher une correspondance avec les templates
    for (const template of CHORD_TEMPLATES) {
      const templateSorted = [...template.intervals].sort((a, b) => a - b);

      if (intervals.length === templateSorted.length &&
          intervals.every((val, idx) => val === templateSorted[idx])) {
        return {
          root,
          name: template.name,
          label: template.label,
          notes: uniqueNotes,
        };
      }
    }
  }

  // Accord non reconnu - retourner les notes jouées
  return {
    root: uniqueNotes[0],
    name: 'unknown',
    label: 'Custom',
    notes: uniqueNotes,
  };
}

// Formater l'affichage d'un accord
export function formatChord(chord: DetectedChord | null): string {
  if (!chord) return '---';
  return `${chord.root} ${chord.label}`;
}
