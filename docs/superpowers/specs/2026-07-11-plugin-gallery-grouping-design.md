# Design — Regroupement de la galerie de plugins (mode « Tous »)

**Date** : 2026-07-11
**Projet** : ToneLab_LOG (app Electron desktop)
**Fichier concerné** : `src/components/PluginGallery.tsx`
**Auteur** : brainstorming OpenCode

## Contexte

La galerie de plugins (`PluginGallery`) affiche aujourd'hui toutes les cartes
(`PluginCard`) à la suite dans une grille unique, sans distinction de type
d'instrument, quand le filtre est sur **« Tous »**. L'utilisateur veut, en mode
« Tous » uniquement :

1. **Regrouper les plugins par type d'instrument**, séparés visuellement.
2. Afficher **une ligne horizontale + le libellé du type** au-dessus de chaque groupe.
3. **Trier alphabétiquement** : les plugins A→Z dans chaque groupe, et les groupes
   ordonnés alphabétiquement par libellé.
4. Placer les plugins **sans catégorie** (champ `instrument` vide/null) dans un
   groupe **« Sans catégorie »** affiché **en fin de liste**.
5. Le libellé du séparateur est **aligné à gauche**, la ligne s'étend vers la droite.

Le comportement en mode filtre précis (un type sélectionné) **ne change pas** :
grille plate actuelle, sans en-tête de groupe.

## Approche retenue

**Approche A — Regroupement conditionnel au mode « Tous »** (validée par l'utilisateur).

Changement isolé à la vue « Tous ». Aucune refonte de `PluginCard`, aucune
nouvelle persistance, aucun impact sur les filtres précis.

## Structure de données dérivée

Dans `PluginGallery`, on ajoute un calcul mémoïsé (`useMemo` sur `plugins`) :
`groupes`, **utilisé uniquement quand `filtre === "tous"`**.

Forme :

```ts
interface PluginGroupe {
  key: InstrumentType | "__sans__";
  label: string;       // LABELS_INSTRUMENTS[type] ou "Sans catégorie"
  plugins: Plugin[];
}
```

Construction :

1. Grouper `plugins` par `p.instrument`. Clé `null` / `""` / `undefined`
   → groupe `__sans__` (« Sans catégorie »).
2. **Trier les groupes** par ordre alphabétique croissant sur `label`
   (insensible à la casse). Le groupe `__sans__` (« Sans catégorie ») est
   **toujours déplacé en dernière position** après le tri.
3. **Trier les plugins** de chaque groupe par `plugin.nom` A→Z
   (insensible à la casse).
4. `LABELS_INSTRUMENTS` (déjà défini dans le fichier) fournit les libellés ;
   seuls les types réellement présents génèrent un groupe.

En mode filtre précis, on conserve la variable existante `pluginsFiltres`
(grille plate, inchangée).

## Rendu

- **Mode « Tous »** : on itère sur `groupes`. Pour chaque groupe :
  - un **en-tête séparateur** (voir style ci-dessous),
  - puis la grille de cartes (`PluginCard` réutilisé tel quel, avec
    `onSupprimer={() => supprimerPlugin(plugin.id)}`).
- **Mode filtre précis** : grille plate existante (section « ── Grille ── »
  inchangée, mise en variable ou gardée en ligne).
- Loader (`pluginsLoading`) et état vide (« Aucun plugin enregistré ») :
  **inchangés**.

## Style du séparateur (respecte la charte `--tl-*`)

Bloc inline, sur toute la largeur de la zone de défilement :

- **Libellé à gauche** : `text-xs` (≈ `0.75rem`), couleur
  `hsl(220, 30%, 55%)`, léger `font-medium`, `whitespace-nowrap`,
  `pr-3` (espace avant la ligne).
- **Ligne à droite** : `flex-1`, `border-top: 1px solid hsl(220, 15%, 18%)`,
  s'étendant de la fin du libellé jusqu'au bord droit.
- Implémentation : `<div className="flex items-center ...">` contenant
  `<span>{label}</span>` puis `<div style={{ flex: 1, borderTop: ... }} />`.
- Espacement vertical : `my-4` (ou `mt-6 mb-3`) pour séparer des groupes voisins.

Aucune nouvelle variable CSS, aucun composant séparé requis (petit JSX inline
réutilisable si besoin, mais pas de fichier additionnel).

## Hors périmètre (YAGNI)

- Pas de regroupement en mode filtre précis.
- Pas de refonte / nouvelle props de `PluginCard`.
- Pas de nouveau système de persistance ou de settings.
- Pas de modification de `AddPluginModal` ni de la logique Firebase.

## Vérification

- `npm run lint` : aucune erreur.
- `npm run build` (`tsc -b && vite build`) : compile sans erreur de type.
- Contrôle visuel manuel via `npm start` (fenêtre Electron) :
  - Mode « Tous » : groupes présents, séparateur libellé à gauche + ligne à droite,
    ordre alphabétique des groupes et des plugins, « Sans catégorie » en fin.
  - Mode filtre précis : grille plate inchangée.
  - Loader et état vide : identiques.
