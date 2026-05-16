# Parsing statique du frontmatter des composants .astro

Les métadonnées CMS d'un Bloc/Layout (label, icône, catégorie, schema Zod des props, hints de format) vivent dans le frontmatter du fichier `.astro` lui-même (inférence depuis `interface Props` + JSDoc descriptions + `export const cmsHints` pour les format hints + détection automatique des `<slot>`). Le CMS extrait ces métadonnées par **parsing statique de l'AST TypeScript** avec `ts-morph`, sans jamais évaluer le code utilisateur.

**Pourquoi.** Le frontmatter Astro est du TS exécutable, pas du YAML — donc il faut soit l'évaluer, soit le parser statiquement. Évaluation dans un sandbox VM : lente, risque sécurité dans Electron (RCE potentiel via un Thème malveillant), gestion complexe des imports. Compilation Astro complète : très lente, exige un projet en état buildable en permanence. Parsing statique avec `ts-morph` : rapide (~ms par fichier), sûr (aucun code utilisateur exécuté), suffisamment expressif (Zod calls + littéraux + types).

**Contrainte imposée au dev de Thème.** `export const cmsHints` doit être un objet littéral avec uniquement des valeurs sérialisables. Pas de variables, pas d'appels dynamiques. Cette contrainte est lisible et alignée avec le pattern Astro Content Collections (`src/content/config.ts` a les mêmes contraintes).

**Fallback.** Si le composant ne déclare pas ses métadonnées, fallback sur l'override dans `astro-cms.config.ts`, puis sur les défauts (label = nom de fichier, schema inféré uniquement depuis `interface Props`).
