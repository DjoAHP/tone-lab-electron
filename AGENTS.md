# AGENTS.md

Guide compact pour travailler dans ce dépôt. Pour le détail complet, voir `CLAUDE.md` (en français).

## Ce qu'est ce dépôt
ToneLab — une application de bureau Electron pour musiciens (React 19 + TypeScript + Vite + Electron Forge). Une seule application, un seul package, pas de monorepo ici.

## Pièges sur les sources de vérité (vérifier avant de croire la prose)
- **`package.json` est la source de vérité pour la version** (actuellement 2.6.10). `CLAUDE.md` indique 2.6.5 — c'est périmé.
- **`README.md` est périmé et partiellement faux.** Il prétend une gestion d'état Zustand + Radix/shadcn. La vraie couche d'état est un **hook personnalisé `useAppStore`** (`src/store/useAppStore.ts`), exposé via React Context (`src/context/AppContext.tsx`). Il **n'y a aucune dépendance zustand** dans `package.json`. Ignorez les affirmations du README sur l'état.
- `CLAUDE.md` est le fichier d'instructions faisant autorité ; lui faire confiance plutôt qu'au `README.md`.

## Commandes
- `npm start` → `electron-forge start`. **C'est la vraie commande de dev** (lance la fenêtre Electron avec HMR). Le renderer est servi via un **proxy HTTPS local `https://tonelab.local`** (Vite proxifié) pour donner une origine https réelle → l'API YouTube du DocV fonctionne en dev. Le HMR est préservé via le proxy WebSocket.
- `npm run dev` → `vite` seul (uniquement le renderer, sans fenêtre Electron). Servi en **HTTPS sur localhost** (origine https → l'API YouTube du DocV fonctionne aussi hors Electron ; accepte le certificat auto-signé dans le navigateur).
- `npm run build` → `tsc -b && vite build`. L'ordre compte : vérification des types puis bundling.
- `npm run lint` → `eslint --ext .ts,.tsx .`
- `npm run make` → construit l'installeur dans `out/make/` (Squirrel .exe sous Windows, ZIP/darwin, deb/rpm).
- **Aucun framework de test ni script de test n'existe.** Ne cherchez pas de tests ; la boucle de vérification est `lint` → `build`.

## Environnement
- `.env` est requis pour les fonctionnalités plugins/Cloudinary (copier depuis `.env.example`). Toutes les variables doivent être préfixées par `VITE_` pour atteindre le renderer. `.env` est dans le `.gitignore`.
- Firebase est utilisé **uniquement** pour le CRUD de la galerie de plugins. Les projets utilisateur vivent dans le **localStorage**, pas dans le cloud.
- L'application démarre sans `.env`, mais les fonctionnalités plugins/images échoueront.
- **Logs SSL `net_error -202` en dev/prod** : Chromium (Electron) affiche `handshake failed … net_error -202` (`ERR_CERT_AUTHORITY_INVALID`) pour `https://tonelab.local`. C'est **attendu et bénin** : le renderer est servi via un serveur HTTPS local avec un certificat **auto-signé** (origine HTTPS requise par l'API YouTube du DocV). Le handler `certificate-error` de `main.ts` accepte explicitement `tonelab.local` → la connexion aboutit. Aucune action requise ; ne pas chercher de panne côté réseau/Firebase/Cloudinary.

## Notes d'architecture (non évidentes)
- Points d'entrée : `src/main.ts` (processus principal), `src/preload.ts`, `src/renderer.tsx`, `src/App.tsx` (routage par onglets via l'état `ongletActif`).
- État : hook `useAppStore` personnalisé, persisté dans le localStorage. Au chargement, il exécute les migrations `migrerProjet()` / `migrerSousStack()` pour la rétro-compat — appelez-les au chargement des projets. Utilisez `genererID()` (pas du random) et `maintenant()` pour les timestamps.
- Alias Vite `@` → `src/`. SVGR est activé, donc importez les SVG comme composants React avec `import X from './x.svg?react'`.
- `tsconfig.json` : `rootDir` est `./src` et `vite.*.config.ts` est exclu (les inclure a déjà provoqué un écran blanc au démarrage). `baseUrl: "."` est conservé volontairement pour Vite malgré l'avertissement de dépréciation TypeScript — laissez-le.

## Conventions
- Les hooks sont préfixés `useApp*` ; les gestionnaires d'événements sont préfixés `handle*`.
- Les couleurs du design system sont des variables CSS (`--tl-*` dans `src/index.css`) ; gardez la nouvelle UI sur cette palette.
- N'ajoutez pas Zustand/Redux ; conservez le pattern de store personnalisé.
