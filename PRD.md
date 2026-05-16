# astro-cms — PRD

Application Electron qui édite localement des sites Astro en mode WYSIWYG. Chaque modification écrit dans les fichiers du projet ; la publication passe par git.

## Vision

Donner à un membre d'équipe édito **non-technique** (asso étudiante, communicant, secrétaire) l'autonomie pour modifier le contenu d'un site Astro préparé en amont par un développeur — sans avoir à toucher au code, au terminal, ou à git.

Le développeur prépare le projet en assemblant ou créant un **Thème** (Layouts + Blocs + Variables). L'utilisateur édite le contenu dans une UI WYSIWYG fidèle au rendu final, et publie en un clic.

Glossaire du domaine : voir [CONTEXT.md](./CONTEXT.md).

## Pourquoi

Les CMS existants (WordPress, Wix, Decap, Sanity Studio, TinaCMS) ne couvrent pas le sweet-spot ciblé :

- **Astro + WYSIWYG fidèle** : aucun CMS git-based actuel ne propose une édition in-place sur le rendu Astro réel
- **Local-first, full git** : pas de serveur tiers, le contenu vit dans le repo git du projet
- **Non-tech mais Astro-native** : aucune migration de contenu, le CMS lit/écrit directement les `.mdx` et les Content Collections existantes

## Audience

| Rôle | Usage |
|------|-------|
| **Utilisateur cible** (non-technique) | Édite le contenu via WYSIWYG, sauvegarde, publie |
| **Développeur de projet** | Prépare le projet (structure, Thème, déploiement CI) |
| **Développeur de Thème** | Crée et distribue des Thèmes réutilisables (npm packages ou dossiers locaux) |

## Concepts clés

- **Projet astro-cms** — projet Astro qui suit la convention (`astro-cms.config.ts` + structure `src/themes/`, `src/pages/`, `src/content/`)
- **Thème** — paquet portable (npm ou dossier local) regroupant Layouts + Blocs + Variables
- **Layout** — coquille de page Astro
- **Bloc** — composant insérable (feuille ou compositionnel selon présence de `<slot>`)
- **Variable de Thème** — valeur paramétrable (couleurs, polices…) overridable au niveau projet ou page
- **Page** — MDX libre compositionnel dans `src/pages/`
- **Collection / Entrée de Collection** — contenu typé répétitif dans `src/content/`
- **Sauvegarder / Publier** — actions utilisateur mappées sur un workflow git à 3 niveaux

Glossaire complet : [CONTEXT.md](./CONTEXT.md).

## Scope MVP

### Inclus

**Édition**
- Éditeur WYSIWYG avec rendu Astro réel au centre (mode B1 → B2 obligatoire pour MVP, cf. [ADR 0003](./docs/adr/0003-strategie-edition-wysiwyg.md))
- TipTap pour les zones de texte riche, inputs simples au panel droit
- Édition des Pages MDX et des Entrées de Collection (formulaire généré depuis le schema Zod + body MDX si présent)
- Markdown brut éditable même hors Thème ; warning + mode dégradé pour les Layouts custom
- Mode "voir le markdown brut" comme échappatoire (copier-coller, debug)
- Toggle preview mobile / tablette / desktop
- Undo / Redo intra-session
- Recherche dans le contenu
- Helper SEO pour les frontmatters qui exposent `title` / `description` / `og-image`

**Thème**
- Manifest `astro-cms.theme.ts` qui pointe vers les dossiers Layouts/Blocs/Variables
- Découverte automatique des composants
- Inférence du schema des props depuis `interface Props` + JSDoc + `export const cmsHints` (cf. [ADR 0004](./docs/adr/0004-parsing-statique-frontmatter-astro.md))
- Détection automatique Bloc feuille vs compositionnel (présence de `<slot>`)
- Slots nommés supportés dès MVP
- Composition de Thèmes via réexport explicite (cf. [ADR 0002](./docs/adr/0002-composition-themes-reexport-explicite.md))
- Variables de Thème avec override projet (panel CMS) et page (frontmatter)

**Projet**
- Ouvrir un dossier local
- Cloner depuis git (HTTPS)
- Créer un nouveau projet from scratch avec wizard + templates curés
- Liste des projets récents
- Auto `pnpm install` à la première ouverture
- Dev server `astro dev` géré automatiquement par l'app

**Git**
- Workflow Brouillon + Publier (cf. [ADR 0005](./docs/adr/0005-workflow-git-brouillon-publier.md))
- Auto-save silencieux + Sauvegarder + Publier
- Auth GitHub via Device Flow OAuth
- Token stocké dans secure storage natif OS
- Vue diff avant Publier (liste des fichiers modifiés depuis dernière publication)
- Validation pré-publication (liens, images, MDX valide)
- Résolution de conflits au niveau Bloc avec UI side-by-side ; stash sur branche temporaire en dernier recours

**Médias**
- Upload via drag-drop ou picker
- Stockage dans `src/assets/uploads/` par défaut (configurable)
- Bibliothèque réutilisable (scan auto du dossier)
- Optimisation déléguée au build Astro

**App**
- UI bilingue FR + EN avec détection auto depuis l'OS
- Auto-update via `electron-updater` + GitHub Releases
- Distribution `.dmg` / `.exe` / `.AppImage`

### Exclus du MVP — V2

- Compatibilité avec des projets Astro existants non conventionnés (hors structure `src/themes/`)
- GitLab / Bitbucket / git self-hosted
- App Store / Microsoft Store
- Real-time collaboration (CRDT)
- Soft locks de présence (qui édite quoi)
- Stockage médias externe (S3, Cloudinary, Git LFS)
- i18n multi-langue pour les sites édités
- Blocs sauvegardés / snippets réutilisables
- Notifications de CI dans l'app
- Mode dark/light de l'app
- Mini-tutoriel intégré / mode démo
- Settings UI avancés

## Stack technique

| Couche | Choix |
|--------|-------|
| Runtime app | Electron + Node.js bundled |
| Frontend (renderer) | React 19+ + TypeScript |
| Bundling | Vite (electron-vite) |
| Éditeur de texte riche | TipTap (ProseMirror) |
| Drag-and-drop | dnd-kit |
| State global | Zustand |
| UI design system | Shadcn/ui + Tailwind |
| Parsing TS (Astro frontmatter) | ts-morph |
| Frontmatter YAML (MD/MDX) | gray-matter |
| AST MDX | unified + remark + mdast-util-mdx |
| Opérations git | simple-git (sur git système) |
| Secure storage | keytar |
| Auto-update | electron-updater |
| Build/release | electron-builder + GitHub Actions |

Tradeoffs Electron vs Tauri : voir discussion dans `CONTEXT.md`. Electron retenu parce que tout l'écosystème nécessaire (Astro, parsing TS, MDX, git) est Node-natif.

## Workflows utilisateur principaux

### Workflow A — Première ouverture d'un projet existant

1. L'utilisateur lance l'app → écran d'accueil
2. Clique "Cloner depuis git" → saisit URL HTTPS
3. Si repo privé → device flow OAuth GitHub (zéro friction)
4. L'app clone, détecte l'absence de `node_modules` → lance `pnpm install` avec UI de progression
5. Validation post-clone : `astro-cms.config.ts` présent et valide
6. Lancement automatique de `astro dev` en background
7. Affichage de la liste des Pages et Collections
8. L'utilisateur ouvre une page → l'éditeur WYSIWYG charge

### Workflow B — Édition d'une page

1. L'utilisateur ouvre la page d'accueil
2. Iframe centrale affiche le rendu Astro réel
3. Clic sur un paragraphe → substitution par widget TipTap (stylé identique) ; édition inline du texte
4. Clic sur une image → panel droit affiche le picker d'image + alt-text + autres props
5. Drag d'un Bloc depuis la palette → insertion entre deux Blocs existants
6. À chaque modification : auto-save fichier + commit local silencieux sur la branche de travail
7. Aucune action git visible côté utilisateur jusqu'à ce qu'il clique Sauvegarder ou Publier

### Workflow C — Publication

1. L'utilisateur clique Publier
2. App affiche la vue diff : "3 pages modifiées, 1 entrée de collection modifiée"
3. Validation pré-publication (liens, images, MDX valide) : bloque ou warning
4. `git pull --rebase` sur branche de production silencieux
5. Si pas de conflit → merge branche de travail → prod → push
6. Le CI (GitHub Actions / Vercel / Netlify) prend le relais et déploie
7. App affiche "Publication réussie"

### Workflow D — Conflit

1. Bob clique Sauvegarder ; pendant ce temps Alice a déjà push
2. `git pull --rebase` détecte conflit sur `src/pages/index.mdx`
3. L'app parse l'AST MDX des deux versions, identifie les Blocs modifiés
4. UI side-by-side : "Alice a modifié ce Bloc Section, tu as modifié ce Bloc Section, lequel garder ? Ou fusionner manuellement ?"
5. Si résolution OK → push réussi
6. Si conflit non-résolvable automatiquement (touche du code custom, structure modifiée) → stash sur `astro-cms-stash-2026-05-16-1425` → notif "Un dev doit gérer ce conflit, ton travail est sauvé sur la branche `astro-cms-stash-…`"

## Risques techniques principaux

| Risque | Mitigation |
|--------|------------|
| **Synchro contenteditable ↔ AST MDX (B2)** | Utiliser TipTap (substitution de zone) au lieu de contenteditable maison ; hérite de la robustesse ProseMirror |
| **Parsing fiable des composants `.astro`** | Parsing statique strict, fallback config, contrainte de format imposée aux dev de Thème (objets littéraux) |
| **Performance du dev server à chaud** | `astro dev` est rapide en HMR ; debounce de l'écriture fichier à 500ms minimum |
| **Conflits git complexes** | UI résolution sémantique au niveau Bloc + fallback stash branche temporaire — le travail n'est jamais perdu |
| **Bundle Electron lourd** | Acceptable en 2026 ; `electron-builder` optimise ; pas un critère MVP |
| **Cas Layout custom hors Thème** | Mode dégradé : rendu fidèle, édition partielle des éléments reconnus, warning + bouton "Appliquer un Layout du Thème" |

## Jalons proposés

### Jalon 1 — Foundations (4-6 semaines)
- App Electron + React + écran d'accueil
- Ouverture d'un projet local
- Lecture de la convention de projet + manifest Thème
- Parsing statique frontmatter `.astro` → liste des Blocs/Layouts
- Liste des Pages + ouverture d'une page (vue arbre des Blocs, pas encore d'édition)

### Jalon 2 — Édition B1 (4-6 semaines)
- Dev server `astro dev` géré par l'app
- Iframe rendu avec instrumentation `data-block-id`
- Clic sur Bloc → sélection + panel droit avec formulaire généré depuis schema
- Édition des props via panel → réécriture du fichier MDX → HMR
- Auto-save fichier debounced

### Jalon 3 — Git workflow (3-4 semaines)
- Auto-save + commit local sur branche de travail
- Sauvegarder (push)
- Publier (merge + push)
- Device flow OAuth GitHub
- Vue diff avant Publier

### Jalon 4 — Édition B2 (6-8 semaines)
- Intégration TipTap pour zones de texte riche
- Substitution de la zone au clic
- Sérialisation MDX → réécriture fichier
- Markdown brut éditable hors Blocs

### Jalon 5 — Médias + polish (3-4 semaines)
- Upload images (drag-drop + picker)
- Bibliothèque
- Toggle preview mobile/tablette/desktop
- Validation pré-publication
- Recherche dans le contenu
- Helper SEO

### Jalon 6 — Clone & Création (2-3 semaines)
- Clone depuis git
- Wizard de création de projet
- Templates curés (vitrine, blog)

### Jalon 7 — Résolution de conflits (3-4 semaines)
- UI side-by-side au niveau Bloc
- Stash sur branche temporaire en fallback

### Jalon 8 — Distribution (2-3 semaines)
- electron-builder cross-platform
- electron-updater
- GitHub Releases automation
- Signing macOS + Windows

**Total estimé MVP : ~6-9 mois** en solo full-time (à diviser si plusieurs personnes ; ajuster selon contraintes réelles).

## Questions ouvertes / à creuser plus tard

- Stratégie de tests (unitaires, intégration, E2E avec Playwright sur l'éditeur ?)
- Métriques / télémétrie opt-in pour comprendre l'usage
- Politique de versioning du format `astro-cms.theme.ts` (compatibilité ascendante des Thèmes ?)
- Validation cross-projet : un Thème peut-il être validé sans projet en amont (CI de Thèmes) ?
- Modes "read-only" pour permettre à un dev de browse un projet sans risquer de modifier
- Politique de prise en charge des breaking changes Astro (Astro 6+ ?)
