# Regroupement galerie plugins (mode « Tous ») — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En mode filtre « Tous », regrouper les plugins par type d'instrument avec un séparateur (libellé à gauche + ligne à droite), tri alphabétique des groupes et des plugins, et un groupe « Sans catégorie » en fin de liste.

**Architecture:** Modification unique de `src/components/PluginGallery.tsx`. On ajoute une dérivation mémoïsée `groupes` (calculée uniquement en mode « Tous ») et on rend chaque groupe via un petit composant `GrillePlugins` réutilisé (DRY) pour la grille de cartes. Le mode filtre précis reste une grille plate inchangée.

**Tech Stack:** React 19 + TypeScript + Vite (alias `@` → `src`), Tailwind v3 utilitaire, variables CSS `--tl-*` pour la charte. Aucun nouveau composant de fichier hors `PluginGallery.tsx`.

## Global Constraints

- **Pas de framework de test** dans ce dépôt : la vérification se fait via `npm run lint` puis `npm run build` (`tsc -b && vite build`). Toute autre prétendue « commande de test » échouera — ne pas l'inventer.
- **Charte visuelle** : dark only, un seul accent cyan. Utiliser les teintes `hsl(220, 15%, 18%)` pour les lignes et `hsl(220, 30%, 55%)` pour les libellés (cohérent avec la charte existante du composant). Ne pas introduire de rouge/orange/vert.
- **Conventions** : hooks préfixés `useApp*` (existants), gestionnaires `handle*`. Ne pas ajouter Zustand/Redux. Respecter l'état existant (`useApp` via `AppContext`).
- **Version source de vérité** : `package.json` → `2.6.10`.
- **Trigger dev réel** : `npm start` (Electron Forge + HMR). `npm run dev` seul ne lance pas la fenêtre.

---

## File Structure

- **Modify:** `src/components/PluginGallery.tsx`
  - Ajout de l'import `useMemo`.
  - Ajout de l'interface `PluginGroupe` (module-level) + calcul mémoïsé `groupes` dans `PluginGallery`.
  - Extraction du composant module-level `GrillePlugins` (remplace le JSX de grille dupliqué).
  - Remplacement de la branche de rendu « Tous » par l'itération sur `groupes` avec séparateurs.

Aucun autre fichier n'est touché (le spec exclut `AddPluginModal`, la logique Firebase, `PluginCard`).

---

## Task 1: Dérivation `groupes` (données + tri)

**Files:**
- Modify: `src/components/PluginGallery.tsx` (import ligne 3 ; ajout interface + `useMemo` après le bloc `pluginsFiltres`, ~lignes 582-585)

**Interfaces:**
- Consumes: `plugins: Plugin[]` et `filtre: InstrumentType | "tous"` depuis `useApp`/`useState` (déjà présents dans `PluginGallery`), et `LABELS_INSTRUMENTS` (déjà défini lignes 8-21).
- Produces: `groupes: PluginGroupe[]` — tableau trié, utilisé par la Task 2. Type exporté localement :
  ```ts
  interface PluginGroupe {
    key: InstrumentType | "__sans__";
    label: string;
    plugins: Plugin[];
  }
  ```

- [ ] **Step 1: Ajouter `useMemo` à l'import**

Remplacer ligne 3 :
```ts
import React, { useState, useRef } from "react";
```
par :
```ts
import React, { useState, useRef, useMemo } from "react";
```

- [ ] **Step 2: Ajouter l'interface `PluginGroupe` (module-level, avant `PluginGallery`)**

Coller juste au-dessus de `export function PluginGallery()` :
```ts
// ── Groupe de plugins (vue « Tous ») ─────────────────────────
interface PluginGroupe {
  key: InstrumentType | "__sans__";
  label: string;
  plugins: Plugin[];
}
```

- [ ] **Step 3: Ajouter le calcul mémoïsé `groupes`**

Dans `PluginGallery`, après la définition de `pluginsFiltres` (bloc ~lignes 582-585), ajouter :
```ts
const groupes = useMemo<PluginGroupe[]>(() => {
  if (filtre !== "tous") return [];

  const map = new Map<InstrumentType | "__sans__", Plugin[]>();
  for (const p of plugins) {
    const raw = (p.instrument ?? "") as InstrumentType;
    const key: InstrumentType | "__sans__" = raw ? raw : "__sans__";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }

  const list: PluginGroupe[] = [];
  for (const [k, items] of map.entries()) {
    const label = k === "__sans__" ? "Sans catégorie" : (LABELS_INSTRUMENTS[k] ?? k);
    items.sort((a, b) =>
      a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }),
    );
    list.push({ key: k, label, plugins: items });
  }

  // Groupes par ordre alphabétique du libellé
  list.sort((a, b) =>
    a.label.localeCompare(b.label, "fr", { sensitivity: "base" }),
  );

  // « Sans catégorie » toujours en dernière position
  const sansIdx = list.findIndex((g) => g.key === "__sans__");
  if (sansIdx !== -1) {
    const [sans] = list.splice(sansIdx, 1);
    list.push(sans);
  }

  return list;
}, [plugins, filtre]);
```

- [ ] **Step 4: Vérifier la compilation (types)**

Run: `npm run build`
Expected: termine sans erreur TypeScript (`tsc -b` puis `vite build` OK). Corriger tout problème de type avant de continuer.

- [ ] **Step 5: Commit intermédiaire**

```bash
git add src/components/PluginGallery.tsx
git commit -m "♻️ Galerie plugins : ajout dérivation groupes + tri (logique, non rendue) | v2.6.10"
```

---

## Task 2: Rendu des groupes + séparateur (vue « Tous »)

**Files:**
- Modify: `src/components/PluginGallery.tsx` (extraction `GrillePlugins` module-level ; branche de rendu « ── Grille ── », ~lignes 678-740)

**Interfaces:**
- Consumes: `groupes: PluginGroupe[]` (Task 1), `pluginsFiltres: Plugin[]`, `supprimerPlugin` depuis `useApp`, `PluginCard` existant.
- Produces: rendu visuel final. Réutilise `GrillePlugins` pour éviter la duplication de la grille.

- [ ] **Step 1: Extraire le composant `GrillePlugins` (module-level, avant `PluginGallery`)**

```tsx
// ── Grille de cartes plugins (réutilisée) ───────────────────
function GrillePlugins({ plugins }: { plugins: Plugin[] }) {
  const { supprimerPlugin } = useApp();
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}
    >
      {plugins.map((plugin) => (
        <PluginCard
          key={plugin.id}
          plugin={plugin}
          onSupprimer={() => supprimerPlugin(plugin.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Remplacer la branche de rendu de la grille**

Dans le JSX de `PluginGallery`, repérer le bloc :
```tsx
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
```
et remplacer par :
```tsx
) : filtre === "tous" ? (
  <div className="flex flex-col">
    {groupes.map((g) => (
      <div key={g.key}>
        {/* Séparateur : libellé à gauche + ligne à droite */}
        <div className="flex items-center my-4">
          <span
            className="text-xs font-medium whitespace-nowrap pr-3"
            style={{ color: "hsl(220, 30%, 55%)" }}
          >
            {g.label}
          </span>
          <div className="flex-1" style={{ borderTop: "1px solid hsl(220, 15%, 18%)" }} />
        </div>
        {g.plugins.length === 0 ? (
          <p className="text-xs mb-2" style={{ color: "hsl(220, 15%, 40%)" }}>
            Aucun plugin
          </p>
        ) : (
          <GrillePlugins plugins={g.plugins} />
        )}
      </div>
    ))}
  </div>
) : (
  <GrillePlugins plugins={pluginsFiltres} />
)}
```

Note : la branche `pluginsFiltres.length === 0` (état vide « Aucun plugin enregistré ») reste **en amont et inchangée** — elle couvre déjà le cas où `plugins` est vide en mode « Tous ».

- [ ] **Step 3: Vérifier le lint**

Run: `npm run lint`
Expected: aucune erreur ESLint sur `PluginGallery.tsx`.

- [ ] **Step 4: Vérifier le build**

Run: `npm run build`
Expected: compile sans erreur.

- [ ] **Step 5: Commit**

```bash
git add src/components/PluginGallery.tsx
git commit -m "✨ Galerie plugins : regroupement par type + séparateur (vue Tous) | v2.6.10"
```

---

## Task 3: Vérification manuelle & finalisation

**Files:**
- Aucun (validation uniquement)

**Interfaces:**
- Consumes: build de `Task 2`, application lancée via `npm start`.

- [ ] **Step 1: Lancer l'app en dev réel**

Run: `npm start`
Expected: la fenêtre Electron s'ouvre, onglet/section « Plugins » accessible (menu « Stack — Galerie plugins » depuis `MenuBar.tsx:351`).

- [ ] **Step 2: Vérifier le mode « Tous »**

Dans la galerie, filtre sur « Tous » :
- Les plugins apparaissent regroupés par type, chaque groupe précédé d'un séparateur **libellé à gauche + ligne horizontale à droite**.
- L'ordre des groupes est alphabétique par libellé (ex : Cordes, Drum, Micro, Piano, Rhodes, Synthetiseur, Tom, Trombone, Trompette, Voix, puis **Sans catégorie** en dernier).
- Dans chaque groupe, les plugins sont triés A→Z par nom.
- Les plugins sans `instrument` sont dans « Sans catégorie ».

- [ ] **Step 3: Vérifier le mode filtre précis**

Sélectionner un type précis (ex : « Piano ») : la grille reste **plate** (une seule grille, pas de séparateur). Comportement identique à avant.

- [ ] **Step 4: Vérifier loader et état vide**

- Avec `pluginsLoading` actif : spinner « Chargement… » présent (inchangé).
- Sans aucun plugin : message « Aucun plugin enregistré » (inchangé).

- [ ] **Step 5: Commit final de suivi (si correctifs nécessaires)**

```bash
git add src/components/PluginGallery.tsx
git commit -m "🐛 Galerie plugins : ajustements post-vérification visuelle | v2.6.10"
```
(Skip si aucune correction — ne pas créer de commit vide.)

- [ ] **Step 6: Push**

```bash
git push origin master
```

---

## Self-Review (effectué par l'auteur du plan)

1. **Spec coverage** : regroupement par type ✅ (Task 2), séparateur libellé gauche + ligne droite ✅ (Task 2 Step 2), tri plugins + groupes alpha ✅ (Task 1 Step 3), « Sans catégorie » en fin ✅ (Task 1 Step 3), mode filtre précis inchangé ✅ (Task 2 Step 2 branche `else`), loader/état vide inchangés ✅ (Task 3 Step 4). Aucun écart.
2. **Placeholder scan** : aucun « TBD » / « similar to Task N ». Tout le code est fourni (interface, `useMemo`, composant, JSX de remplacement, commandes exactes).
3. **Type consistency** : `PluginGroupe` (Task 1) réutilisé dans `groupes` et dans le rendu (Task 2). `GrillePlugins` prend `Plugin[]` cohérent avec `g.plugins` et `pluginsFiltres`. `InstrumentType | "__sans__"` constant partout. Aucune divergence de nom.
4. **Adaptation tests** : projet sans framework de test → portes `lint` + `build` + vérif manuelle `npm start` (Task 3), conformément aux Global Constraints.
