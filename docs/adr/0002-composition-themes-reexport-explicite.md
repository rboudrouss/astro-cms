# Composition de Thèmes par réexport explicite

Quand un Thème dépend d'autres Thèmes (notamment des Thèmes "purement techniques" qui exposent uniquement des Blocs réutilisables), il doit **réexporter explicitement** ce qu'il souhaite rendre disponible à l'Utilisateur cible dans le CMS. Sans réexport, un Bloc d'un Thème de dépendance est utilisable en interne par le Thème consommateur (dans ses propres Layouts) mais reste invisible dans le menu d'insertion de Blocs.

**Pourquoi.** L'Utilisateur cible est non-technique ; lui montrer 50 Blocs dont 30 viennent de Thèmes techniques qu'il ne connaît pas serait une catastrophe UX. La curation explicite force le Thème principal à décider ce qu'il expose, créant une frontière propre entre "implémentation interne" et "surface utilisateur". Une ligne de manifest par Bloc à réexporter — pas verbeux.

**Alternatives rejetées.** Fusion à plat automatique (confusion, collisions de noms), fusion avec namespace dans l'UI (expose la composition au non-tech).

**Difficile à inverser.** Changer cette règle plus tard casse tous les manifests de Thème existants.
