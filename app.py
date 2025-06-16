from fastapi import FastAPI, Request # Form n'est plus directement utilisé pour le nouvel endpoint
from fastapi.middleware.cors import CORSMiddleware # <<< --- AJOUTÉ ---
from fastapi.responses import StreamingResponse
import uvicorn
from pydantic import BaseModel, Field # <<< --- AJOUTÉ ---
from typing import Dict, Any, Optional # <<< --- AJOUTÉ ---
import json
import asyncio

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

    # --- Nouvelle logique streaming ---
    async def stream_response():
        # Appel à la fonction RAG qui doit être adaptée pour yield (voir backend/query.py)
        async for chunk in query_documents_with_context(
            query_text=query_text,
            form_data=form_data_8d,
            current_section_data=current_section_data_8d,
            current_section_name=current_section_name_8d,
            stream=True  # Ajout d'un paramètre stream (à gérer dans query.py)
        ):
            # On envoie chaque chunk sous forme de JSONL (une ligne JSON par chunk)
            yield json.dumps(chunk, ensure_ascii=False) + "\n"

    return StreamingResponse(stream_response(), media_type="application/jsonlines")


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)