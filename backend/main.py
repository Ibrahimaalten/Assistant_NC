from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, relationship
from datetime import datetime
from .models import SessionLocal, NonConformite, MembreEquipe
import json

app = FastAPI()

# Autoriser le frontend à accéder à l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/nonconformites/{nc_id}")
def get_nonconformite(nc_id: int, db: Session = Depends(get_db)):
    nc = db.query(NonConformite).filter(NonConformite.id == nc_id).first()
    if not nc:
        raise HTTPException(status_code=404, detail="Non-conformité non trouvée")
    # Inclure les membres d'équipe
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
    # Ajouter les membres d'équipe
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
    # Mettre à jour les membres d'équipe si fournis
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
