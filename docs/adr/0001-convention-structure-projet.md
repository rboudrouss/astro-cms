# Structure de projet imposée

astro-cms exige une convention de projet stricte (`astro-cms.config.ts` à la racine, Thèmes dans `src/themes/<nom>/`, contenu dans `src/pages/` et `src/content/`) au lieu de découvrir une structure arbitraire par heuristiques. La décision est qu'un projet doit s'aligner sur la convention pour être éditable — pas l'inverse.

**Pourquoi.** Faire un WYSIWYG fiable sur du code Astro/MDX arbitraire (parsing AST, inférence de props, gestion d'imports dynamiques, composants custom) est un puits sans fond pour un MVP. La convention rend les promesses tenables : on garantit que ça marche pour les projets qui la respectent. Un projet existant comme `psu_site` doit être refactoré manuellement (les layouts à plat dans `src/layouts/` et les composants markdown dans `src/components/markdown/` deviennent un Thème dans `src/themes/psu/`). Pas de commande CLI de migration prévue — chaque projet est trop différent pour automatiser ça utilement.

**Alternative rejetée.** Auto-découverte sur des projets Astro arbitraires : trop fragile, trop d'edge cases, le coût d'implémentation tue le MVP avant la sortie.
