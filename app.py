from fastapi import FastAPI, Request, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import json
import asyncio
from backend.models import SessionLocal, NonConformite, MembreEquipe
from backend.query import query_documents_with_context

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

# --- ROUTES NON-CONFORMITES (ex-main.py) ---
@app.get("/api/nonconformites/{nc_id}")
def get_nonconformite(nc_id: int, db: Session = Depends(get_db)):
    nc = db.query(NonConformite).filter(NonConformite.id == nc_id).first()
    if not nc:
        raise HTTPException(status_code=404, detail="Non-conformité non trouvée")
    membres = db.query(MembreEquipe).filter(MembreEquipe.nonconformite_id == nc.id).all()
    nc_dict = nc.__dict__.copy()
    nc_dict['membres'] = [m.__dict__ for m in membres]
    nc_dict.pop('_sa_instance_state', None)
    return nc_dict

@app.post("/api/nonconformites")
def create_nonconformite(item: dict = Body(...), db: Session = Depends(get_db)):
    membres_data = item.pop('membres', [])
    nc = NonConformite(**item)
    db.add(nc)
    db.commit()
    db.refresh(nc)
    for membre in membres_data:
        m = MembreEquipe(
            nonconformite_id=nc.id,
            prenom=membre.get('prenom', ''),
            nom=membre.get('nom', ''),
            fonction=membre.get('fonction', '')
        )
        db.add(m)
    db.commit()
    return get_nonconformite(nc.id, db)

@app.put("/api/nonconformites/{nc_id}")
def update_nonconformite(nc_id: int, item: dict = Body(...), db: Session = Depends(get_db)):
    nc = db.query(NonConformite).filter(NonConformite.id == nc_id).first()
    if not nc:
        raise HTTPException(status_code=404, detail="Non-conformité non trouvée")
    membres_data = item.pop('membres', None)
    for key, value in item.items():
        setattr(nc, key, value)
    db.commit()
    if membres_data is not None:
        db.query(MembreEquipe).filter(MembreEquipe.nonconformite_id == nc.id).delete()
        for membre in membres_data:
            m = MembreEquipe(
                nonconformite_id=nc.id,
                prenom=membre.get('prenom', ''),
                nom=membre.get('nom', ''),
                fonction=membre.get('fonction', '')
            )
            db.add(m)
        db.commit()
    return get_nonconformite(nc.id, db)

@app.get("/api/nonconformites")
def list_nonconformites(db: Session = Depends(get_db)):
    ncs = db.query(NonConformite).all()
    result = []
    for nc in ncs:
        nc_dict = nc.__dict__.copy()
        nc_dict.pop('_sa_instance_state', None)
        membres = db.query(MembreEquipe).filter(MembreEquipe.nonconformite_id == nc.id).all()
        nc_dict['membres'] = [m.__dict__ for m in membres]
        result.append(nc_dict)
    return result

@app.delete("/api/nonconformites/{nc_id}")
def delete_nonconformite(nc_id: int, db: Session = Depends(get_db)):
    nc = db.query(NonConformite).filter(NonConformite.id == nc_id).first()
    if not nc:
        raise HTTPException(status_code=404, detail="Non-conformité non trouvée")
    db.delete(nc)
    db.commit()
    return {"ok": True}

# --- CHAT ASSISTANT ---
class QueryContextPayload(BaseModel):
    query: str
    form_data: Dict[str, Any] = Field(default_factory=dict)
    current_section_data: Dict[str, Any] = Field(default_factory=dict)
    current_section_name: Optional[str] = None

@app.post("/query_with_context")
async def process_contextual_query(payload: QueryContextPayload):
    query_text = payload.query
    form_data_8d = payload.form_data
    current_section_data_8d = payload.current_section_data
    current_section_name_8d = payload.current_section_name
    async def stream_response():
        async for chunk in query_documents_with_context(
            query_text=query_text,
            form_data=form_data_8d,
            current_section_data=current_section_data_8d,
            current_section_name=current_section_name_8d,
            stream=True
        ):
            yield json.dumps(chunk, ensure_ascii=False) + "\n"
    return StreamingResponse(stream_response(), media_type="application/jsonlines")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)