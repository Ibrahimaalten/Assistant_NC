from fastapi import FastAPI, Request # Form n'est plus directement utilisé pour le nouvel endpoint
from fastapi.middleware.cors import CORSMiddleware # <<< --- AJOUTÉ ---
import uvicorn
from pydantic import BaseModel, Field # <<< --- AJOUTÉ ---
from typing import Dict, Any, Optional # <<< --- AJOUTÉ ---

# Supposons que votre logique RAG est dans backend/query.py
# Vous devrez modifier cette fonction ou en créer une nouvelle
# from backend.query import query_documents # Ancienne fonction
from backend.query import query_documents_with_context # <<< --- NOUVELLE FONCTION RAG à créer/adapter ---

app = FastAPI()

# --- DÉBUT DE LA CONFIGURATION CORS ---
origins = [
    "http://localhost:5173",  # L'origine de votre frontend Vite/React (vérifiez le port)
    # Ajoutez d'autres origines si nécessaire
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- FIN DE LA CONFIGURATION CORS ---

# --- MODÈLE PYDANTIC pour le Payload du ChatAssistant ---
class QueryContextPayload(BaseModel):
    query: str
    form_data: Dict[str, Any] = Field(default_factory=dict)
    current_section_data: Dict[str, Any] = Field(default_factory=dict)
    current_section_name: Optional[str] = None


# --- NOUVEL ENDPOINT pour le Chat avec Contexte ---
@app.post("/query_with_context") # Correspond à l'appel fetch du ChatAssistant
async def process_contextual_query(payload: QueryContextPayload): # <<<--- Utilise le modèle Pydantic
    query_text = payload.query
    form_data_8d = payload.form_data
    current_section_data_8d = payload.current_section_data
    current_section_name_8d = payload.current_section_name

    # Vous devez maintenant appeler votre fonction RAG qui utilise ce contexte
    # (Cette fonction doit être créée ou adaptée à partir de votre query_documents existant)
    response_text, sources_list, suggested_update = query_documents_with_context(
        query_text=query_text,
        form_data=form_data_8d,
        current_section_data=current_section_data_8d,
        current_section_name=current_section_name_8d
    )

    # Assurez-vous que les sources sont dans un format simple pour JSON
    cleaned_sources = []
    if sources_list:
        for src in sources_list:
            # Adaptez ceci à la structure de vos objets 'source' retournés par la fonction RAG
            if isinstance(src, dict) and 'nc_id' in src: # Exemple
                cleaned_sources.append({"nc_id": src['nc_id']})
            elif isinstance(src, str): # Si c'est juste une chaîne
                 cleaned_sources.append({"source_text": src}) # Exemple
            # ... autres cas

    return {
        "response": response_text,
        "sources": cleaned_sources, # Envoyer les sources nettoyées
        "suggested_field_update": suggested_update # Peut être None
    }


# --- ANCIENNE PARTIE (si vous voulez la garder temporairement ou la supprimer) ---
# Si votre App.jsx gère toute l'interface, vous n'avez plus besoin de servir index.html ici.
# from fastapi.responses import HTMLResponse
# from fastapi.staticfiles import StaticFiles
# from fastapi.templating import Jinja2Templates
# templates = Jinja2Templates(directory="templates")
# app.mount("/static", StaticFiles(directory="static"), name="static")

# @app.get("/", response_class=HTMLResponse)
# async def read_root_old(request: Request):
#  return templates.TemplateResponse("index.html", {"request": request})

# @app.post("/query") # Ancien endpoint
# async def process_query_old(request: Request):
#  form_data = await request.form()
#  query_text = form_data.get("query", "")
#  # response, sources = query_documents(query_text) # Ancienne fonction RAG
#  # return {"response": response, "sources": sources}
#  return {"response": "Cet endpoint est obsolète, utilisez /query_with_context", "sources": []}
# --- FIN DE L'ANCIENNE PARTIE ---


if __name__ == "__main__":
    # Assurez-vous que le nom du module est correct (nom_du_fichier:nom_de_l_instance_fastapi)
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)