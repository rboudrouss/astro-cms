# astro-cms — PRD (format issue)

> Version "issue-ready" du PRD, structurée selon le template `to-prd`. Pour le design doc complet (vision, jalons, risques détaillés), voir [PRD.md](./PRD.md). Pour le glossaire, voir [CONTEXT.md](./CONTEXT.md). Pour les décisions structurantes, voir [docs/adr/](./docs/adr/).

## Problem Statement

Un membre non-technique d'une équipe édito (asso, communicant, secrétaire) qui doit modifier le contenu d'un site Astro est aujourd'hui bloqué :

- Le contenu vit dans des fichiers `.mdx` qui mélangent markdown, imports JSX, frontmatter, et références à des Layouts — illisibles pour un non-tech
- Les CMS git-based existants (Decap, TinaCMS) demandent des conventions de contenu très différentes d'un projet Astro idiomatique, ou ne supportent pas un WYSIWYG fidèle au rendu réel
- Les CMS hébergés (WordPress, Sanity, Contentful) imposent une migration de contenu hors du repo et un serveur tiers
- Le dev doit constamment être sollicité pour des modifs triviales (corriger un mot, changer une image)

L'Utilisateur cible veut éditer son contenu **comme dans WordPress**, mais le dev veut que **le contenu reste dans le repo Astro** (versionné, déployé via CI, sans serveur tiers).

## Solution

Une application Electron locale qui ouvre un projet Astro et offre une interface WYSIWYG fidèle au rendu réel du site. Chaque modification écrit dans les fichiers du projet ; la publication passe par git (push sur la branche de production), déclenchant le CI existant (Vercel, Netlify, GitHub Actions).

L'utilisateur clique sur un paragraphe et l'édite directement dans le rendu, glisse-dépose des Blocs depuis une palette, uploade des images par drag-and-drop, et publie en un clic. Sans terminal, sans git, sans Astro à comprendre.

Le développeur garde la main : il prépare le projet (structure, déploiement) et crée ou choisit un **Thème** (Layouts + Blocs + Variables) qui définit ce que l'utilisateur peut éditer. Un Thème est portable (npm package ou dossier local) et peut composer d'autres Thèmes.

## User Stories

### Utilisateur cible (non-technique)

1. As an Utilisateur cible, I want to open a local project from a folder picker, so that I can start editing without a terminal
2. As an Utilisateur cible, I want to clone a project from a git HTTPS URL inside the app, so that I don't need to know git commands
3. As an Utilisateur cible, I want to create a new project from a curated template via a wizard, so that I can start a site without a developer
4. As an Utilisateur cible, I want the app to auto-install dependencies (`pnpm install`) the first time I open a project, so that I don't need to know about Node.js
5. As an Utilisateur cible, I want to authenticate to GitHub via a short device code (no token to copy-paste), so that publishing works with zero friction
6. As an Utilisateur cible, I want to see a list of recent projects on the home screen, so that I can resume work quickly
7. As an Utilisateur cible, I want to see the list of Pages and Collections in my project, so that I navigate easily
8. As an Utilisateur cible, I want to see the real Astro rendering of my page while editing, so that I know what the published version will look like
9. As an Utilisateur cible, I want the preview to update automatically as I edit, so that I have immediate feedback
10. As an Utilisateur cible, I want to click on a paragraph or heading and edit the text directly in place, so that editing feels natural
11. As an Utilisateur cible, I want to format text inline (bold, italic, links, lists), so that I can write rich content
12. As an Utilisateur cible, I want to paste text from Word/Google Docs without garbage formatting, so that I can transfer content cleanly
13. As an Utilisateur cible, I want to insert Blocs from a palette via drag-and-drop into the rendering, so that I compose pages visually
14. As an Utilisateur cible, I want to reorder Blocs by drag-and-drop, so that I restructure a page easily
15. As an Utilisateur cible, I want to delete a Bloc with a confirmation, so that I remove unwanted content without accidents
16. As an Utilisateur cible, I want to nest Blocs inside compositional Blocs (those with slots), so that I can build structured content like Sections containing Cards
17. As an Utilisateur cible, I want to edit a Bloc's structured properties (image URL, alignment, button label) via a sidebar form, so that I configure complex blocks without writing code
18. As an Utilisateur cible, I want forms generated from Zod schemas with sensible defaults and validation messages, so that I can't enter invalid data
19. As an Utilisateur cible, I want to upload an image by drag-and-drop on the page or in a Bloc's image property, so that I add visuals fast
20. As an Utilisateur cible, I want to pick an image from a library of already-uploaded images, so that I reuse assets
21. As an Utilisateur cible, I want to toggle the preview between mobile, tablet, and desktop widths, so that I verify responsive rendering
22. As an Utilisateur cible, I want to undo and redo my changes in the current session (Ctrl+Z / Ctrl+Y), so that I recover from mistakes before saving
23. As an Utilisateur cible, I want to search across all Pages and Collection Entries (Ctrl+F), so that I find content without knowing where it lives
24. As an Utilisateur cible, I want a SEO helper for frontmatters that expose `title`/`description`/`og-image`, with length warnings and social card preview, so that I publish good metadata
25. As an Utilisateur cible, I want to create a new Page in `src/pages` by choosing a Layout from the active Theme, so that I extend the site myself
26. As an Utilisateur cible, I want to create a new Entry in a Collection via a form generated from the schema, so that I add structured content
27. As an Utilisateur cible, I want my changes to be saved to disk automatically as I work (debounced), so that I never lose work if I close the app
28. As an Utilisateur cible, I want explicit "Sauvegarder" to push my work to the remote on the working branch, so that collaborators can pull
29. As an Utilisateur cible, I want explicit "Publier" to push to the production branch and trigger deployment, so that the public sees the new version
30. As an Utilisateur cible, I want to see a diff (list of modified files, summary of changes) before clicking Publier, so that I verify scope
31. As an Utilisateur cible, I want validation warnings (broken internal links, missing images, invalid MDX) before publication, so that I don't publish broken pages
32. As an Utilisateur cible, I want a warning at startup if the remote has diverged from my local branch, so that I pull before editing
33. As an Utilisateur cible, I want the app to attempt visual side-by-side conflict resolution at the Bloc level if my push fails due to conflicts, so that I resolve them without a dev
34. As an Utilisateur cible, I want my work stashed on a temporary branch if conflicts can't be resolved automatically, so that my work is never lost and a dev can take over later
35. As an Utilisateur cible, I want to override Theme Variables (colors, fonts) for the entire project via a UI panel, so that I customize the look without code
36. As an Utilisateur cible, I want to override Theme Variables on a single page via that page's frontmatter, so that I have page-specific styling
37. As an Utilisateur cible, I want to view the raw markdown source of a Bloc on demand, so that I can copy-paste large chunks or debug rendering issues
38. As an Utilisateur cible, I want a clear warning when a page uses a Layout outside the active Theme, with a button to "Appliquer un Layout du Thème", so that I can migrate legacy pages
39. As an Utilisateur cible, I want partial editing on legacy pages with custom Layouts (markdown text + Theme Blocs inside remain editable), so that I update content even when the wrapper is dev-managed
40. As an Utilisateur cible, I want the app UI in French or English with auto-detect from the OS, so that I'm comfortable in either language
41. As an Utilisateur cible, I want the app to auto-update itself silently in the background, so that I always have the latest version
42. As an Utilisateur cible, I want to delete a Page or Collection Entry with confirmation, so that I clean up content
43. As an Utilisateur cible, I want to rename a Page (change its slug/URL), so that I restructure the site

### Développeur de projet

44. As a Dev de projet, I want to declare the active Theme, variable overrides, and Block overrides in a single `astro-cms.config.ts`, so that the CMS configuration is centralized
45. As a Dev de projet, I want to configure folder paths (`pagesDir`, `contentDir`, `assetsDir`), so that I can adapt to a non-default structure
46. As a Dev de projet, I want to configure the working branch, production branch, and remote, so that I align with my existing git workflow
47. As a Dev de projet, I want my project's custom Layouts and components (outside the Theme) to be tolerated by the CMS in a graceful read-only mode, so that I can mix CMS-managed and dev-managed pages
48. As a Dev de projet, I want clear validation errors when my project structure or config is invalid, so that I know exactly what to fix
49. As a Dev de projet, I want to refactor an existing Astro project (like psu_site) into the astro-cms convention manually, with documented migration steps, so that I can adopt the CMS without starting over

### Développeur de Thème

50. As a Dev de Thème, I want to declare my Theme via a single `astro-cms.theme.ts` manifest that points to folders (`layouts/`, `blocks/`), so that the structure is convention-driven
51. As a Dev de Thème, I want Bloc/Layout metadata (label, schema, slots) inferred automatically from the component (`interface Props`, JSDoc, `export const cmsHints`, `<slot>` scan), so that I don't duplicate information
52. As a Dev de Thème, I want named slots supported automatically when present, so that I can build compositional Blocs with multiple zones
53. As a Dev de Thème, I want to override inferred metadata per-Bloc in `astro-cms.config.ts` for escape hatches, so that I have flexibility for special cases
54. As a Dev de Thème, I want to declare Theme Variables with type (color, string, number, select) and default value, so that they can be overridden by users
55. As a Dev de Thème, I want to depend on other Themes (npm packages or local folders) and use their Blocs/Variables freely in my own Layouts, so that I can build on technical Themes
56. As a Dev de Thème, I want to selectively re-export Blocs from dependency Themes to the user's CMS palette, so that I curate what the Utilisateur cible sees
57. As a Dev de Thème, I want to distribute my Theme as an npm package OR keep it as a local folder in `src/themes/`, so that I choose the right level of portability
58. As a Dev de Thème, I want clear errors during Theme parsing (missing manifest, bad `cmsHints` shape, unsupported Zod call), so that I diagnose issues during development
59. As a Dev de Thème, I want the CMS to support both `.astro` and `.tsx`/`.jsx` Blocs (via Astro's React/Vue integration), so that I'm not limited to one component model

## Implementation Decisions

### Modules de l'application (organisés en modules profonds, testables en isolation)

| # | Module | Type | Responsabilité |
|---|--------|------|----------------|
| 1 | **Theme Manifest Parser** | Pur | Parser le manifest `astro-cms.theme.ts`, scanner les dossiers `layouts/` et `blocks/`, extraire les métadonnées de chaque composant via parsing AST TypeScript du frontmatter (`ts-morph`), produire un `ThemeManifest` structuré (Blocs + Layouts + Variables + slots + schemas Zod) |
| 2 | **MDX AST Parser/Writer** | Pur | Convertir un fichier `.mdx` en `ContentAST` (frontmatter YAML + arbre de Blocs sérialisable) et inversement. Le round-trip doit être idempotent : `write(parse(file)) === file` (modulo formatting) |
| 3 | **Block Tree Editor State** | Pur | State machine de la page en édition : Blocs, props, sélection courante, stack d'undo/redo. Transitions explicites (insertBlock, deleteBlock, reorderBlock, updateProp, undo, redo) |
| 4 | **Git Workflow State Machine** | Pur | State machine (action utilisateur, état git) → (état suivant, effets git). Couvre auto-save / Sauvegarder / Publier et les transitions de conflit |
| 5 | **Conflict Resolver** | Pur | À partir de deux `ContentAST` (local + remote) sur un même fichier, produire un `MergePlan` (Blocs à garder / fusionner / écraser) ou signaler `Unresolvable` |
| 6 | **Astro Dev Server Manager** | Side-effect | Spawn `astro dev` en process enfant, observe stdout/stderr, expose URL + état (running/starting/error/stopped) à l'UI |
| 7 | **GitHub Device Flow Auth** | Side-effect (HTTP) | Implémente le device flow OAuth GitHub : poll de l'API, retourne un access token. Stockage du token délégué à `keytar` |
| 8 | **Theme Hot Reloader** | Composite | Compose le Theme Manifest Parser avec un watcher `chokidar` : reconstruit le manifest à la volée quand le dev modifie un Bloc/Layout |
| 9 | **Astro Edit-Mode Integration** | Plugin Astro | Intégration Astro qui, en mode édition, injecte un wrapper `data-block-id` autour de chaque Bloc rendu (et `data-content-source` sur le markdown brut), pour permettre le mapping DOM → AST source |
| 10 | **Project Validator** | Pur | Valide qu'un dossier est un projet astro-cms conforme (`astro-cms.config.ts` présent, structure valide, Thème actif résolvable, etc.) et produit un `ValidationReport` lisible |

### Architecture générale

**Processus** :
- **Main process Electron** : Theme Manifest Parser, MDX AST Parser/Writer, Git Workflow, Conflict Resolver, Astro Dev Server Manager, GitHub Auth, Project Validator, Theme Hot Reloader. Tout ce qui touche au filesystem, à git, et à l'AST.
- **Renderer process (React)** : Block Tree Editor State, UI (Shadcn/ui + Tailwind), TipTap pour les zones de texte riche, dnd-kit pour le drag-drop, iframe vers `localhost:4321` (le dev server géré par le main).
- **IPC** : main expose des handlers typés (via `electron-typed-ipc` ou similaire). Renderer envoie des `actions` (e.g. `editor.insertBlock`), main les exécute, renvoie le nouvel état.
- **Astro Edit-Mode Integration** : un plugin Astro installé côté projet utilisateur, activé en dev. C'est lui qui instrumente le rendu pour permettre la sélection.

**Format du contrat de Thème** :
- Manifest centralisé `astro-cms.theme.ts` qui pointe vers les dossiers `layouts/`, `blocks/`, et déclare les Variables + les ré-exports de Thèmes de dépendance
- Métadonnées par composant : héritage de `interface Props` (TypeScript), enrichies par JSDoc descriptions et `export const cmsHints` (objet littéral statique, parsable sans évaluation)
- Détection automatique des slots par scan du markup du `.astro`
- Override possible per-Bloc dans `astro-cms.config.ts` côté projet
- Voir [ADR 0002](./docs/adr/0002-composition-themes-reexport-explicite.md), [ADR 0004](./docs/adr/0004-parsing-statique-frontmatter-astro.md)

**Workflow git "Brouillon + Publier"** sur 3 niveaux (auto-save / Sauvegarder / Publier), avec résolution de conflits sémantique + stash en fallback. Voir [ADR 0005](./docs/adr/0005-workflow-git-brouillon-publier.md).

**Stratégie d'édition** : rendu Astro réel au centre via iframe, instrumenté en mode édition. Mode B1 (édition au panel) → mode B2 (édition inline via substitution TipTap) obligatoire pour MVP. Voir [ADR 0003](./docs/adr/0003-strategie-edition-wysiwyg.md).

**Convention de projet imposée** (`astro-cms.config.ts` + `src/themes/`), pas de support des projets Astro arbitraires en MVP. Voir [ADR 0001](./docs/adr/0001-convention-structure-projet.md).

### Stack technique

- **Electron** (main + renderer)
- **React 19+ + TypeScript** (renderer)
- **Vite / electron-vite** (bundling)
- **TipTap** (ProseMirror, édition rich text)
- **dnd-kit** (drag-drop)
- **Zustand** (state global renderer)
- **Shadcn/ui + Tailwind** (UI design system)
- **ts-morph** (parsing AST des `.astro`)
- **gray-matter** (frontmatter YAML)
- **unified + remark + mdast-util-mdx** (AST MDX)
- **simple-git** (opérations git via le binaire système)
- **keytar** (secure storage)
- **electron-updater + electron-builder** (distribution & auto-update)
- **chokidar** (filesystem watching)

### Données et formats

**`astro-cms.config.ts`** (à la racine du projet) :
```ts
import { defineProject } from "@astro-cms/runtime";
import myTheme from "./src/themes/my-theme/astro-cms.theme";

export default defineProject({
  theme: myTheme,
  variableOverrides: { mainColor: "#e865ad" },
  pagesDir: "src/pages",
  contentDir: "src/content",
  assetsDir: "src/assets",
  git: {
    workingBranch: "astro-cms-work",
    productionBranch: "main",
    remote: "origin",
  },
  blockOverrides: {
    // ImageText: { label: "Image + Texte", schema: ... }
  },
});
```

**`astro-cms.theme.ts`** (manifest de Thème) :
```ts
import { defineTheme } from "@astro-cms/theme";

export default defineTheme({
  name: "my-theme",
  layoutsDir: "./layouts",
  blocksDir: "./blocks",
  variables: {
    mainColor: { type: "color", default: "#000" },
    secondaryColor: { type: "color", default: "#fff" },
  },
  reexport: [
    // "theme-ui-base/Button",
    // "theme-ui-base/Card",
  ],
});
```

**`cmsHints`** (dans le frontmatter d'un `.astro`, optionnel) :
```astro
---
interface Props {
  /** Image principale */
  image: string;
  /** Texte affiché à côté de l'image */
  text: string;
  /** Texte à droite au lieu de gauche */
  reversed?: boolean;
}

export const cmsHints = {
  image: { format: "image" },
  text: { format: "richtext" },
};

const { image, text, reversed = false } = Astro.props;
---
```

## Testing Decisions

### Principe directeur

Tester le comportement externe des modules, pas leur implémentation interne. Pour les modules purs, les tests fournissent des fixtures d'entrée et vérifient les sorties. Pour les modules side-effect, on isole avec des mocks de surface (filesystem, HTTP, subprocess).

**Pas de tests E2E sur l'UI en MVP** (trop lents, trop fragiles à l'évolution rapide du produit). L'UI est validée manuellement et via tests d'intégration des modules sous-jacents.

### Modules couverts par tests automatisés (priorité MVP)

| Module | Type de tests | Stratégie |
|--------|--------------|-----------|
| **Theme Manifest Parser** | Snapshot + unit | Fixtures `.astro` représentatives (Bloc feuille, compositionnel, slot nommé, sans `cmsHints`, override par config, edge cases : `Props` mal défini, défauts complexes). Vérifie la sortie `ThemeManifest` |
| **MDX AST Parser/Writer** | Round-trip | `write(parse(file)) === file` pour des fichiers `.mdx` couvrant : frontmatter YAML simple/complexe, body avec markdown pur, body avec Blocs Astro, slots nommés, composants imbriqués. **Critique** : un bug ici corrompt les fichiers utilisateur |
| **Block Tree Editor State** | State machine | Pour chaque transition (insert/delete/reorder/updateProp/undo/redo) : état d'entrée + action → état attendu. Tests de l'invariant undo : `redo(undo(s)) === s` |
| **Git Workflow State Machine** | State machine | Mock du module git (simple-git stub). Tests des chaînes : auto-save → Sauvegarder OK, auto-save → Sauvegarder avec conflit → résolution OK / stash, divergence au démarrage → warning. Validation que l'état git ne devient jamais incohérent |
| **Conflict Resolver** | Synthétique | Conflits fabriqués manuellement (deux ASTs avec divergences) : Bloc identique modifié différemment → unresolvable, Blocs distincts modifiés → merge auto, structure modifiée (Bloc inséré entre deux versions) → unresolvable. Vérifie qu'un faux merge n'est jamais produit |
| **Project Validator** | Fixture | Projets fixtures (valide, config manquant, structure non conforme, Thème introuvable, ts invalide) → `ValidationReport` attendu |

### Modules side-effect : tests d'intégration ciblés (V2)

Non prioritaires en MVP mais à prévoir :

- **Astro Dev Server Manager** : tests d'intégration avec un projet fixture, vérifie spawn/restart/error handling
- **GitHub Device Flow Auth** : tests avec mock HTTP (nock ou MSW), vérifie le polling et le retry
- **Theme Hot Reloader** : test d'intégration avec un dossier temporaire, modification d'un fichier → manifest mis à jour

### Prior art

Aucune (projet nouveau). Pour le format des tests :
- **Snapshot tests** : Vitest `expect(x).toMatchSnapshot()` avec stockage en fichiers séparés (`__snapshots__/`)
- **Round-trip tests** : Vitest, fixtures `.mdx` dans `tests/fixtures/`, comparaison textuelle stricte
- **State machine tests** : tables d'inputs/outputs en data-driven (`test.each`)
- **Mocks de git** : `simple-git` interface, mock minimal exposant les seules méthodes utilisées

## Out of Scope

Tout ce qui suit est explicitement hors MVP, à reconsidérer en V2 ou plus tard :

- **Compatibilité avec des projets Astro non conventionnés** (qui ne suivent pas `src/themes/`, qui n'ont pas `astro-cms.config.ts`)
- **CLI de migration automatique** pour des projets existants (chaque projet est trop différent — migration manuelle documentée)
- **Providers git autres que GitHub** (GitLab, Bitbucket, git self-hosted)
- **Distribution sur App Store / Microsoft Store** (coûts, restrictions)
- **Real-time collaboration** style Google Docs (CRDT, Yjs, Automerge)
- **Presence indicators / soft locks** (qui édite quelle page en temps réel)
- **Stockage médias externe** (S3, Cloudinary, Git LFS)
- **i18n multi-langue pour les sites édités** (édition simultanée FR/EN d'une page) — pas la i18n de l'UI de l'app, qui elle est en MVP
- **Snippets / Blocs sauvegardés réutilisables** (instances configurées de Blocs)
- **Notifications de CI dans l'app** (état du dernier build GitHub Actions)
- **Mode dark/light de l'app**
- **Tutoriel intégré / mode démo**
- **Mode "lecture seule" / preview-only pour les devs**
- **Tests E2E sur l'UI** (validation manuelle en MVP)
- **Édition d'autres types de contenu Astro** (`.json`, `.yaml`, fichiers `.ts` de config) — uniquement `.md` et `.mdx` en MVP

## Further Notes

- **Design doc complet** : [PRD.md](./PRD.md) — contient la vision, l'audience détaillée, les workflows utilisateur narratifs, les risques techniques avec mitigation, les 8 jalons proposés (~6-9 mois solo), les questions ouvertes
- **Glossaire** : [CONTEXT.md](./CONTEXT.md) — vocabulaire du domaine (Layout, Bloc, Thème, Variable, Page, Collection, Sauvegarder/Publier, branches de travail/production, principe d'édition)
- **ADRs** : [docs/adr/](./docs/adr/) — 5 décisions structurantes
  - [0001 — Convention de structure de projet imposée](./docs/adr/0001-convention-structure-projet.md)
  - [0002 — Composition de Thèmes par réexport explicite](./docs/adr/0002-composition-themes-reexport-explicite.md)
  - [0003 — Stratégie d'édition WYSIWYG (TipTap + mode édition)](./docs/adr/0003-strategie-edition-wysiwyg.md)
  - [0004 — Parsing statique du frontmatter `.astro`](./docs/adr/0004-parsing-statique-frontmatter-astro.md)
  - [0005 — Workflow git "Brouillon + Publier" à 3 niveaux](./docs/adr/0005-workflow-git-brouillon-publier.md)
- **Spike technique recommandé en premier** : valider que TipTap peut substituer une zone du rendu Astro et resynthétiser du MDX propre (round-trip fidèle). 2-3 jours, dérisque le risque #1 du PRD. Cette validation conditionne tout le reste de l'éditeur.
- **Nom du package npm à vérifier** : `astro-cms` est probablement déjà pris. Alternatives : `@astro-cms/*` (scope), `astro-studio`, `quill-astro`, à arbitrer.
- **Pas publié sur un issue tracker** : le projet n'a pas d'intégration issue tracker configurée (`/setup-matt-pocock-skills` non lancé). Ce PRD est sauvegardé localement ; à publier manuellement quand un tracker sera en place. Label cible : `ready-for-agent`.
