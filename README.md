# Assistant 8D – Application de résolution de problèmes

Ce projet est une application web complète pour accompagner la démarche 8D (résolution de problèmes en 8 étapes) avec un assistant conversationnel intelligent.

## Fonctionnalités principales
- **Frontend React (Vite)** : Interface utilisateur moderne pour saisir et suivre chaque étape du 8D, avec un assistant chat intégré.
- **Backend FastAPI (Python)** : API REST pour le traitement des requêtes, la recherche sémantique et l'interfaçage avec un LLM (Ollama).
- **Recherche vectorielle** : Utilisation de ChromaDB pour retrouver des cas similaires et enrichir les réponses.
- **Assistant contextuel** : Suggestions automatiques, complétion de champs, et réponses personnalisées selon l'étape et le contexte du formulaire.

## Prérequis
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com/) installé localement (pour le LLM)
- (Optionnel) Docker si tu veux tout containeriser

## Installation et lancement

### 1. Backend (FastAPI)
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend (React/Vite)
```powershell
cd frontend
npm install
npm run dev
```

### 3. LLM local (Ollama)
- Installe Ollama : https://ollama.com/download
  - Tu peux installer Ollama comme application de bureau (Windows/Mac/Linux) : il tournera alors automatiquement en arrière-plan sur ton ordinateur.
  - Ou bien utiliser la version CLI si tu préfères.
- Télécharge le modèle utilisé (exemple) :
  ```powershell
  ollama pull qwen3:14b
  ```
- Lance le serveur Ollama (il doit tourner sur http://localhost:11434) :
  ```powershell
  ollama serve
  ```

### 4. Installation des dépendances

```bash
pip install -r requirements.txt
```

### 5. Téléchargement du modèle d'embedding

Le script `embed.py` téléchargera automatiquement le modèle d'embedding lors de sa première exécution. Assurez-vous d'avoir une connexion internet.

### 6. Génération de la base de données d'embeddings

Exécutez le script suivant pour créer la base de données avec Chroma :

```bash
python embed.py
```

Cela utilisera `langchain-chroma` pour stocker les embeddings générés.

### 7. Lancement du backend
```powershell
python app.py
```

### 8. Utilisation
- Accède à l’interface sur [http://localhost:5173](http://localhost:5173)
- Le backend écoute sur [http://localhost:8000](http://localhost:8000)

## Structure du projet
- `frontend/` : Application React (Vite)
- `backend/` : Scripts Python pour la logique métier, la recherche vectorielle et les prompts
- `app.py` : Point d’entrée FastAPI
- `chroma_db/` : Base de données vectorielle locale
- `documents/NC5_clean.csv` : Données source pour l'indexation

## Remarques
- Le projet nécessite un serveur Ollama local pour le LLM.
- Les prompts sont adaptés dynamiquement selon l’étape 8D et la requête utilisateur.
- Les suggestions de complétion sont proposées via le chat et peuvent être appliquées en un clic.
- Si tu ajoutes de nouveaux documents ou modifies le CSV, relance `python backend/embed.py` pour régénérer les embeddings.

---

**Auteur :** lrodembourg
