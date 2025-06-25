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

@app.post("/query_with_context")
async def process_contextual_query(payload: QueryContextPayload):
    query_text = payload.query
    form_data_8d = payload.form_data
    current_section_data_8d = payload.current_section_data
    current_section_name_8d = payload.current_section_name
    mode = payload.mode or 'CHAT'
    if mode == 'REQ':
        # Appel direct à la logique de retrieval, sans LLM
        from backend.query import get_vectorstore, get_hybrid_retriever
        vectorstore = get_vectorstore()
        all_docs = vectorstore.get(include=['documents'])['documents']
        bm25_docs = []
        from langchain_core.documents import Document
        for doc in all_docs:
            if isinstance(doc, Document):
                bm25_docs.append(doc)
            elif isinstance(doc, dict) and 'page_content' in doc and 'metadata' in doc:
                bm25_docs.append(Document(page_content=doc['page_content'], metadata=doc['metadata']))
            elif isinstance(doc, str):
                bm25_docs.append(Document(page_content=doc, metadata={}))
        hybrid_retriever = get_hybrid_retriever(vectorstore, bm25_docs, emb_weight=0.6, bm25_weight=0.4, k=3)
        # Utilise la même logique d'enrichissement de requête que le RAG
        enriched_query = query_text
        if current_section_data_8d:
            context_fields_text = ' '.join([str(v) for k, v in current_section_data_8d.items() if v and k != 'id'])
            if context_fields_text:
                enriched_query += f" (contexte de {current_section_name_8d}: {context_fields_text})"
        docs = hybrid_retriever(enriched_query)
        # Formate les sources comme dans le RAG
        sources = []
        for doc in docs:
            # Aperçu = Description du problème 0D si dispo, sinon page_content
            description = doc.metadata.get("Description du problème 0D") or doc.page_content[:200] + "..."
            source = {
                "content": description,
                "nc_id": doc.metadata.get("id_non_conformite", doc.metadata.get("Identification NC 0D", "Inconnu")),
                "source": doc.metadata.get("nom_fichier_source", "N/A")
            }
            sources.append(source)
        print("[DEBUG SOURCES RETRIEVAL] Nombre de sources récupérées:", len(sources))
        for idx, src in enumerate(sources):
            print(f"  Source {idx+1}: NC ID: {src['nc_id']} | Fichier: {src['source']} | Aperçu: {src['content'][:60]}")
            # Log complet des métadonnées du document source
            if idx < len(docs):
                print(f"    [META] Métadonnées complètes: {getattr(docs[idx], 'metadata', {})}")
        def simple_stream():
            yield json.dumps({"sources": sources, "done": True}, ensure_ascii=False) + "\n"
        return StreamingResponse(simple_stream(), media_type="application/jsonlines")
    async def stream_response():
        async for chunk in query_documents_with_context(
            query_text=query_text,
            form_data=form_data_8d,
            current_section_data=current_section_data_8d,
            current_section_name=current_section_name_8d,
            stream=True,
            retrieval_mode="vector",
        ):
            if 'sources' in chunk:
                print("[DEBUG SOURCES STREAM] Nombre de sources dans chunk:", len(chunk['sources']))
                for idx, src in enumerate(chunk['sources']):
                    print(f"  Source {idx+1}: NC ID: {src.get('nc_id', 'N/A')} | Fichier: {src.get('source_file', src.get('source', 'N/A'))} | Aperçu: {src.get('preview', src.get('content', 'N/A'))[:60]}")
                    # Log complet des métadonnées du document source si possible
                    if 'retrieved_docs' in chunk and idx < len(chunk['retrieved_docs']):
                        print(f"    [META] Métadonnées complètes: {getattr(chunk['retrieved_docs'][idx], 'metadata', {})}")
            if mode == 'REQ' and chunk.get('done'):
                yield json.dumps({"sources": chunk.get('sources', []), "done": True}, ensure_ascii=False) + "\n"
            elif mode == 'REQ':
                continue  # Ignore les autres chunks
            else:
                yield json.dumps(chunk, ensure_ascii=False) + "\n"
    return StreamingResponse(stream_response(), media_type="application/jsonlines")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)