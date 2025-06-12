# Assistant 8D – Application de résolution de problèmes

Ce projet est une application web complète pour accompagner la démarche 8D (résolution de problèmes en 8 étapes) avec un assistant conversationnel intelligent.

## Fonctionnalités principales
- **Frontend React (Vite)** : Interface utilisateur moderne pour saisir et suivre chaque étape du 8D, avec un assistant chat intégré.
- **Backend FastAPI (Python)** : API REST pour le traitement des requêtes, la recherche sémantique et l'interfaçage avec un LLM (Ollama).
- **Recherche vectorielle** : Utilisation de ChromaDB pour retrouver des cas similaires et enrichir les réponses.
- **Assistant contextuel** : Suggestions automatiques, complétion de champs, et réponses personnalisées selon l'étape et le contexte du formulaire.

## Lancement du projet

1. **Backend**
   - Crée un environnement virtuel Python et active-le :
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - Installe les dépendances :
     ```powershell
     pip install -r requirements.txt
     ```
   - Lance le serveur FastAPI :
     ```powershell
     python app.py
     ```

2. **Frontend**
   - Va dans le dossier `frontend` :
     ```powershell
     cd frontend
     npm install
     npm run dev
     ```

3. **Utilisation**
   - Accède à l’interface sur [http://localhost:5173](http://localhost:5173)
   - Le backend écoute sur [http://localhost:8000](http://localhost:8000)

## Structure du projet
- `frontend/` : Application React (Vite)
- `backend/` : Scripts Python pour la logique métier, la recherche vectorielle et les prompts
- `app.py` : Point d’entrée FastAPI
- `chroma_db/` : Base de données vectorielle locale

## Remarques
- Le projet nécessite un serveur Ollama local pour le LLM.
- Les prompts sont adaptés dynamiquement selon l’étape 8D et la requête utilisateur.
- Les suggestions de complétion sont proposées via le chat et peuvent être appliquées en un clic.

---

**Auteur :** lrodembourg
