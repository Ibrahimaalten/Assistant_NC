from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional
from datetime import datetime

def get_nc(db: Session, nc_id: int):
    return db.query(models.NonConformite).filter(models.NonConformite.id == nc_id).first()

def get_ncs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.NonConformite).offset(skip).limit(limit).all()

def create_nc(db: Session, nc: schemas.NonConformiteCreate):
    db_nc = models.NonConformite(**nc.dict())
    db.add(db_nc)
    db.commit()
    db.refresh(db_nc)
    return db_nc

def update_nc(db: Session, nc_id: int, nc: schemas.NonConformiteUpdate):
    db_nc = db.query(models.NonConformite).filter(models.NonConformite.id == nc_id).first()
    if db_nc:
        for key, value in nc.dict(exclude_unset=True).items():
            setattr(db_nc, key, value)
        db.commit()
        db.refresh(db_nc)
    return db_nc

def delete_nc(db: Session, nc_id: int):
    db_nc = db.query(models.NonConformite).filter(models.NonConformite.id == nc_id).first()
    if db_nc:
        db.delete(db_nc)
        db.commit()
    return db_nc

def get_membres(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.MembreEquipe).offset(skip).limit(limit).all()

def create_membre(db: Session, membre: schemas.MembreEquipeCreate):
    db_membre = models.MembreEquipe(**membre.dict())
    db.add(db_membre)
    db.commit()
    db.refresh(db_membre)
    return db_membre
