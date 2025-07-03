from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json
import asyncio

from backend.database import SessionLocal, engine
from backend import models, schemas, crud
from backend.query import query_documents_with_context
from backend.utils import  build_sources
from backend.retrieval import get_relevant_documents



models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CONFIGURATION CORS ---
origins = [
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- FIN CONFIG CORS ---

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ROUTES NON-CONFORMITES ---
@app.get("/api/nonconformites", response_model=List[schemas.NonConformite])
def list_nonconformites(db: Session = Depends(get_db)):
    return crud.get_ncs(db)

@app.get("/api/nonconformites/{nc_id}", response_model=schemas.NonConformite)
def get_nonconformite(nc_id: int, db: Session = Depends(get_db)):
    nc = crud.get_nc(db, nc_id)
    if not nc:
        raise HTTPException(status_code=404, detail="Non-conformité non trouvée")
    return nc

@app.post("/api/nonconformites", response_model=schemas.NonConformite)
def create_nonconformite(nc: schemas.NonConformiteCreate, db: Session = Depends(get_db)):
    print("[DEBUG] Reçu POST /api/nonconformites avec:", nc)
    print("[DEBUG] Détail du dict envoyé:", nc.dict())
    result = crud.create_nc(db, nc)
    print("[DEBUG] NonConformite créée:", result)
    return result

@app.put("/api/nonconformites/{nc_id}", response_model=schemas.NonConformite)
def update_nonconformite(nc_id: int, nc: schemas.NonConformiteUpdate, db: Session = Depends(get_db)):
    updated = crud.update_nc(db, nc_id, nc)
    if not updated:
        raise HTTPException(status_code=404, detail="Non-conformité non trouvée")
    return updated

@app.delete("/api/nonconformites/{nc_id}")
def delete_nonconformite(nc_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_nc(db, nc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Non-conformité non trouvée")
    return {"ok": True}

# --- ROUTES MEMBRES EQUIPE (optionnel) ---
@app.get("/api/membres", response_model=List[schemas.MembreEquipe])
def list_membres(db: Session = Depends(get_db)):
    return crud.get_membres(db)

@app.post("/api/membres", response_model=schemas.MembreEquipe)
def create_membre(membre: schemas.MembreEquipeCreate, db: Session = Depends(get_db)):
    return crud.create_membre(db, membre)

# --- CHAT ASSISTANT ---
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class QueryContextPayload(BaseModel):
    query: str
    form_data: Dict[str, Any] = Field(default_factory=dict)
    current_section_data: Dict[str, Any] = Field(default_factory=dict)
    current_section_name: Optional[str] = None
    mode: Optional[str] = 'CHAT'  # Ajout du mode
    model_key: Optional[str] = Field(None, description="La clé du modèle d'embedding à utiliser (ex: 'qwen_base', 'mxbai_large').")


@app.post("/query_with_context")
async def process_contextual_query(payload: QueryContextPayload):
    query_text = payload.query
    form_data_8d = payload.form_data
    current_section_data_8d = payload.current_section_data
    current_section_name_8d = payload.current_section_name
    mode = payload.mode or 'CHAT'
    model_key = payload.model_key
    print(f"DEBUG API: Clé de modèle reçue dans le payload = {model_key}")

    if mode == 'REQ':
        
        docs = get_relevant_documents(
            query_text=query_text,
            current_section_data=current_section_data_8d,
            current_section_name=current_section_name_8d,
            form_data=form_data_8d,
            model_key=model_key # <-- Assurez-vous que cet argument est bien passé !
        )
        # Formate les sources comme dans le RAG
        sources = build_sources(docs, mode="REQ")
        print("[DEBUG SOURCES RETRIEVAL] Nombre de sources récupérées:", len(sources))
        
        def simple_stream():
            yield json.dumps({"sources": sources, "done": True}, ensure_ascii=False) + "\n"
        return StreamingResponse(simple_stream(), media_type="application/jsonlines")
    ####CHAT####
    async def stream_response():
        async for chunk in query_documents_with_context(
            query_text=query_text,
            form_data=form_data_8d,
            current_section_data=current_section_data_8d,
            current_section_name=current_section_name_8d,
            stream=True,
            model_key=model_key, # <-- Passer le paramètre

        ):
            if 'sources' in chunk:
                print("[DEBUG SOURCES STREAM] Nombre de sources dans chunk:", len(chunk['sources']))
                for idx, src in enumerate(chunk['sources']):
                    print(f"  Source {idx+1}: NC ID: {src.get('nc_id', 'N/A')} | Fichier: {src.get('source_file', src.get('source', 'N/A'))} | Aperçu: {src.get('preview', src.get('content', 'N/A'))[:60]}")
                    # Log complet des métadonnées du document source si possible
                    if 'retrieved_docs' in chunk and idx < len(chunk['retrieved_docs']):
                        print(f"    [META] Métadonnées complètes: {getattr(chunk['retrieved_docs'][idx], 'metadata', {})}")
            
            yield json.dumps(chunk, ensure_ascii=False) + "\n"
    return StreamingResponse(stream_response(), media_type="application/jsonlines")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)