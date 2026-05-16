# Context

Glossaire du domaine pour `astro-cms` — une application Electron qui édite localement des sites Astro en mode WYSIWYG.

## Termes

### Layout

La coquille structurelle d'une page Astro — un fichier `.astro` situé conventionnellement dans `src/layouts/` qui définit l'enveloppe globale (header, footer, navigation, mise en page). Référencé dans le frontmatter d'une page MDX/MD via la clé `layout:`. Une page possède exactement un Layout, choisi à la création et modifiable.

Exemple dans `psu_site` : `src/layouts/parent/PsuP.astro`, `Parent.astro`.

### Bloc

Un composant Astro/React réutilisable, insérable dans le corps d'une page MDX comme un élément empilable. L'utilisateur compose une page en empilant et configurant des Blocs. Distinct d'un Layout : un Bloc s'insère dans le contenu, plusieurs Blocs cohabitent dans une page, alors qu'un Layout enveloppe la page entière.

Deux variantes structurelles :

- **Bloc feuille** — pas de `<slot>` dans son markup. L'utilisateur édite uniquement ses props (ex: `ImageText`, `YtEmbed`).
- **Bloc compositionnel** — contient un ou plusieurs `<slot>`. L'utilisateur édite ses props **et** peut empiler d'autres Blocs à l'intérieur de chaque slot (ex: `Section`, `SectionB`).

La variante d'un Bloc est détectée automatiquement par astro-cms via scan du markup du composant.

Exemples dans `psu_site` : `Section` (compositionnel), `ColorLigne` (feuille), `ImageText` (feuille), `YtEmbed` (feuille).

### Utilisateur cible

Membre non-technique d'une équipe édito (asso, communicant, secrétaire) qui modifie du contenu sur un projet Astro préparé en amont par un dev. Un mode "afficher le markdown brut" reste disponible comme échappatoire pour copier-coller ou debug visuel, mais n'est pas le mode par défaut.

### Thème

Un paquet portable qui regroupe un ensemble cohérent de Layouts, de Blocs, et de Variables, et qui respecte la convention de structure exigée par astro-cms. Un Thème peut être distribué :

- comme un **package npm** (`@astro-cms/theme-blog`), ou
- comme un **dossier local** dans le projet (ex: `themes/mon-theme/`) qui respecte la même convention.

La portabilité ne dépend pas du mode de distribution — un dossier local respectant la convention reste extractible vers un package npm ultérieurement.

Un projet a idéalement **un seul Thème actif** au niveau du contenu visible par l'Utilisateur cible (pour éviter qu'il ne sache pas d'où vient un Bloc). En pratique, ce Thème actif peut **composer d'autres Thèmes** comme dépendances — notamment des Thèmes "purement techniques" qui exposent uniquement des Blocs réutilisables (cf. concept de bibliothèque de composants).

**Règle de composition** : un Thème dépendant peut *utiliser* librement les Blocs et Variables de ses dépendances dans ses propres Layouts, mais doit **réexporter explicitement** ce qu'il souhaite rendre disponible à l'Utilisateur cible dans le CMS. Sans réexport, un Bloc d'un Thème de dépendance reste invisible dans le menu d'insertion de Blocs.

### Page

Un fichier MDX situé dans `src/pages/` qui constitue une page unique compositionnelle (accueil, à-propos, mentions légales, page de présentation d'un club). Le frontmatter porte la référence au Layout et les métadonnées (titre, description). Le corps est une composition de Blocs empilés que l'Utilisateur cible édite via l'éditeur WYSIWYG.

Distinct d'une Entrée de Collection : une Page est routée par sa position dans `src/pages/`, et son contenu est entièrement libre (composition de Blocs au choix). Idéale pour le contenu non-répétitif.

### Collection

Un ensemble d'Entrées typées par un schema Zod, situé dans `src/content/<nom>/`. Utilise le mécanisme Content Collections d'Astro. Le schema définit les champs structurés (titre, date, auteur, image, …) ; un champ `body` MDX optionnel permet d'inclure une composition de Blocs.

L'Utilisateur cible voit une Collection comme une liste éditable (les Entrées existantes) avec un bouton "Nouveau". L'édition d'une Entrée combine un formulaire (pour les champs typés) et un éditeur de Blocs (pour le champ body).

Exemples typiques : articles de blog, événements, membres d'équipe, jeux organisés (cf. `psu_site/src/pages/luxludi/jeux-org/` qui émule actuellement une Collection avec des pages MDX).

### Entrée de Collection

Un fichier individuel (`.md`, `.mdx`, `.json`, `.yaml`) à l'intérieur d'une Collection. Représente une instance unique du type défini par le schema de la Collection.

### Projet astro-cms

Un projet Astro qui suit la convention de structure exigée par astro-cms :

- `astro-cms.config.ts` à la racine — déclare le Thème actif, les overrides de Variables et de Blocs, et les chemins des dossiers (par défaut : `pagesDir: src/pages`, `contentDir: src/content`, `assetsDir: src/assets`).
- Thèmes locaux dans `src/themes/<nom>/` avec un fichier manifeste `astro-cms.theme.ts`. Les Thèmes installés via npm sont importés depuis `node_modules`.
- Pages MDX éditables dans `src/pages/`, Collections dans `src/content/` (conventions Astro standard).

### Sauvegarder

Action utilisateur qui pousse la branche de travail (cf. Branche de travail) vers le remote. Synchronise l'état d'avancement avec le repo distant et les éventuels collaborateurs. Ne rend rien public — le contenu n'est pas encore mis en production.

### Publier

Action utilisateur qui merge la branche de travail dans la branche de production (cf. Branche de production), push, et déclenche optionnellement le build/déploiement. C'est ce qui rend les modifications visibles sur le site public.

### Branche de travail

Branche git (configurable dans `astro-cms.config.ts`, défaut `astro-cms-work`) sur laquelle l'app commit en continu lors de l'édition (auto-save silencieux après chaque modification, debounced ~500ms). Pas pushée sauf via l'action Sauvegarder.

### Branche de production

Branche git (configurable, défaut `main`) qui représente l'état publié du site. Mise à jour uniquement via l'action Publier.

### Principe d'édition

Le CMS édite tout ce qu'il sait éditer, et marque le reste en read-only :

- **Markdown brut** (paragraphes, headings, listes, emphasis, liens, images) → toujours éditable, indépendamment du Layout, via éditeur de rich text (TipTap).
- **Blocs du Thème actif** → toujours éditables (props via panel, contenu inline si compositionnel), peu importe le contexte (Page avec Layout du Thème, Page avec Layout custom, ou Entrée de Collection).
- **Composants JSX inconnus** (hors Thème actif) → read-only, signalés visuellement.
- **Layout custom hors Thème** → rendu fidèle dans la preview, non éditable, mais le contenu MDX éditable normalement à l'intérieur. Un warning indique à l'Utilisateur cible que la page utilise un Layout hors Thème et propose "Appliquer un Layout du Thème" pour basculer en mode WYSIWYG complet.

### Variable de Thème

Une valeur paramétrable exposée par un Thème (typiquement : couleur primaire, couleur secondaire, polices, espacements de base). Trois niveaux d'override, du plus général au plus spécifique :

1. **Valeur par défaut** — déclarée par le Thème lui-même
2. **Override projet** — appliquée à tout le projet, éditable depuis le CMS
3. **Override page** — appliquée à une page unique, déclarée dans le frontmatter de la page

Une override de niveau plus spécifique remplace la valeur du niveau plus général.
