# TODO – Assistant 8D

## Refactoring
- [ ] Factoriser les prompts Python (backend/prompts.py) pour éviter la duplication et faciliter la maintenance.
- [ ] Découper les gros composants React (ex : ChatAssistant.jsx) en sous-composants réutilisables.
- [ ] Nettoyer les `console.log` et `print` de debug dans tout le projet.
- [ ] Supprimer ou commenter les `useEffect` inutiles ou sources de bugs (voir D6Form, D6FORM2).
- [ ] Centraliser la gestion des erreurs backend (FastAPI exception handlers).
- [ ] Uniformiser la gestion des imports et conventions de nommage (backend et frontend).

## Tests
- [ ] Ajouter des tests unitaires backend (FastAPI, logique métier, vector search).
- [ ] Ajouter des tests unitaires frontend (React components, context).
- [ ] Mettre en place des tests end-to-end (Cypress ou Playwright pour le frontend).
- [ ] Ajouter des tests d’intégration pour la chaîne RAG (requêtes, embeddings, réponses LLM).

## Documentation
- [ ] Compléter la documentation technique (README, structure, API endpoints, schémas d’architecture).
- [ ] Ajouter des exemples d’utilisation de l’API backend.
- [ ] Documenter les conventions de code et les bonnes pratiques adoptées.
- [ ] Ajouter un guide de contribution (CONTRIBUTING.md).

## Optimisation & Performance
- [ ] Optimiser la recherche vectorielle (pondération des champs, filtrage par étape, multi-étapes).
- [ ] Améliorer la gestion du cache côté backend (embeddings, requêtes fréquentes).
- [ ] Réduire la taille des bundles frontend (analyse Vite, lazy loading).
- [ ] Optimiser le rendu React pour éviter les re-rendus inutiles.

## Sécurité
- [ ] Sécuriser les endpoints backend (validation stricte, gestion des droits, rate limiting).
- [ ] Valider et nettoyer toutes les entrées utilisateur côté frontend et backend.
- [ ] Ajouter une authentification (même simple) pour l’accès à l’API.
- [ ] Protéger les données sensibles (logs, fichiers, .env).

## UI / UX
- [ ] Améliorer l’affichage du chat (bulles, avatars, timestamps, transitions)
- [ ] Afficher les sources sous forme de liens cliquables ou popovers
- [ ] Permettre le rendu markdown/rich text dans les réponses du bot
- [ ] Ajouter des loaders et notifications utilisateur (succès/erreur)
- [ ] Rendre l’interface responsive et accessible (contraste, navigation clavier)
- [ ] Afficher visuellement l’étape courante et la progression 8D

## RAG & Backend
- [ ] Enrichir la recherche vectorielle avec plusieurs étapes précédentes (pas seulement la dernière)
- [ ] Pondérer la similarité selon l’importance des champs (ex : description NC)
- [ ] Filtrer les documents par type d’étape avant la recherche vectorielle
- [ ] Structurer les prompts pour chaque étape et type de question
- [ ] Ajouter des logs structurés et un suivi des erreurs

## Suggestions & Réponses
- [ ] Mettre en forme les suggestions de complétion dans des encadrés avec bouton “Appliquer”
- [ ] Proposer un résumé automatique pour les réponses longues
- [ ] Analyser la réponse du LLM pour détecter et mettre en avant les suggestions de complétion

## Bugs & Correctifs
- [ ] Corriger la gestion des erreurs dans les appels LLM (streaming, suggestions).
- [ ] Corriger les problèmes de synchronisation de contexte dans les formulaires React (useEffect, useState).
- [ ] Vérifier la robustesse des scripts de nettoyage et d’indexation (clean.py, embed.py).
- [ ] Traiter les TODOs restants dans le code (ex : validation dans D6FORM2.jsx).

## Fonctionnalités avancées
- [ ] Historique des conversations et possibilité de recharger une session
- [ ] Export PDF/Word du rapport 8D enrichi
- [ ] Collaboration multi-utilisateurs sur un même 8D
- [ ] Personnalisation du ton ou du niveau de détail des réponses

## Qualité & Suivi
- [ ] Ajouter des logs structurés et un suivi des erreurs (Sentry, Loguru, etc.).
- [ ] Mettre en place un linter et un formatter (Black, isort, ESLint, Prettier).
- [ ] Automatiser les checks CI (lint, tests, build).
- [ ] Mettre à jour et prioriser ce fichier TODO régulièrement.

---

À compléter et prioriser selon l’avancement du projet et les retours utilisateurs.
