# Workflow git "Brouillon + Publier" à 3 niveaux

astro-cms expose une métaphore "Brouillon + Publier" à l'Utilisateur cible non-technique, implémentée sur git à 3 niveaux :

1. **Auto-save silencieux** — à chaque modification (debounced ~500ms) : écriture des fichiers + commit local sur la branche de travail (configurable, défaut `astro-cms-work`). Pas de push. Filet de sécurité contre la perte de travail.
2. **Sauvegarder (action utilisateur)** — push de la branche de travail vers le remote. Synchronisation, pas de publication.
3. **Publier (action utilisateur)** — `git pull --rebase` puis merge branche de travail → branche de production (configurable, défaut `main`), push. Le déploiement effectif (CI) est délégué à GitHub Actions / Vercel / Netlify configurés sur push de la branche de production.

**Pourquoi.** L'Utilisateur cible ne connaît pas git — exposer "commit", "branch", "push" est inutilisable. La métaphore "Brouillon → Sauvegarder → Publier" est universellement comprise (WordPress, Wix, Notion). Mapper ça sur git permet de garder l'avantage du versioning sans en exposer la complexité.

**Conflits.** À la Sauvegarde ou Publication, si `pull --rebase` détecte des conflits, l'app tente une résolution sémantique au niveau Bloc (UI side-by-side). Si la résolution échoue, le travail est stashé sur une branche temporaire (`astro-cms-stash-<timestamp>`) et un dev gère plus tard. **Le travail utilisateur n'est jamais perdu.**

**Alternative rejetée.** Auto-commit granulaire à chaque modification (historique pollué, messages auto-générés peu lisibles).
