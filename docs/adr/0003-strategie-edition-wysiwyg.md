# Stratégie d'édition WYSIWYG : rendu Astro central + TipTap

L'éditeur place le **rendu Astro réel au centre** (`astro dev` géré par l'app, iframe pointant sur `localhost`). L'utilisateur clique sur un élément pour le sélectionner ; le panel droit affiche les propriétés du Bloc correspondant. Le **MVP démarre en mode B1** (in-place feel mais édition du texte via le panel) et **n'est pas considéré terminé tant que le mode B2 n'est pas atteint** (édition du texte directement dans le rendu).

Pour les zones de texte riche en B2, on **substitue** la zone du rendu par un **widget TipTap** stylé identiquement aux styles CSS hérités du composant. À la perte de focus, on sérialise en markdown et on réécrit le fichier source. Pour les inputs simples (URL, alt-text, source d'image), `<input>` classique dans le panel droit. Évolution V2/V3 vers B3 (drag-drop direct dans le canvas) et progressive réduction de la dépendance à TipTap si possible.

**Pourquoi.** B2 est le critère de succès du produit — sans vrai in-place editing du texte, l'illusion WYSIWYG ne tient pas. TipTap (basé sur ProseMirror) gère gratuitement undo/redo, IME, paste depuis Word, sélections complexes, raccourcis — réimplémenter ça est un puits sans fond.

**Alternative rejetée.** Contenteditable maison : on réécrit ce que TipTap a mis des années à stabiliser, MVP tué.

**Implication architecturale.** Mode "édition" du rendu Astro distinct du mode "production" : en mode édition, chaque Bloc est wrappé avec `data-block-id` pour permettre le mapping DOM ↔ source MDX.
