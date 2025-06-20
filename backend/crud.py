from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional
from datetime import datetime
import json

def get_nc(db: Session, nc_id: int):
    nc = db.query(models.NonConformite).filter(models.NonConformite.id == nc_id).first()
    if nc:
        for key in [
            'd0_initialisation', 'd1_team', 'd2_problem', 'd3_containment',
            'd4_rootcause', 'd5_correctiveactions', 'd6_implementvalidate',
            'd7_preventrecurrence', 'd8_congratulate']:
            val = getattr(nc, key)
            if isinstance(val, str):
                try:
                    setattr(nc, key, json.loads(val))
                except Exception:
                    setattr(nc, key, None)
    return nc

def get_ncs(db: Session, skip: int = 0, limit: int = 100):
    ncs = db.query(models.NonConformite).offset(skip).limit(limit).all()
    for nc in ncs:
        for key in [
            'd0_initialisation', 'd1_team', 'd2_problem', 'd3_containment',
            'd4_rootcause', 'd5_correctiveactions', 'd6_implementvalidate',
            'd7_preventrecurrence', 'd8_congratulate']:
            val = getattr(nc, key)
            if isinstance(val, str):
                try:
                    setattr(nc, key, json.loads(val))
                except Exception:
                    setattr(nc, key, None)
    return ncs

def create_nc(db: Session, nc: schemas.NonConformiteCreate):
    data = nc.dict()
    # Sérialiser tous les champs D0 à D8 si ce sont des dicts
    for key in [
        'd0_initialisation', 'd1_team', 'd2_problem', 'd3_containment',
        'd4_rootcause', 'd5_correctiveactions', 'd6_implementvalidate',
        'd7_preventrecurrence', 'd8_congratulate']:
        if data.get(key) is not None and not isinstance(data[key], str):
            data[key] = json.dumps(data[key])
    db_nc = models.NonConformite(**data)
    db.add(db_nc)
    db.commit()
    db.refresh(db_nc)
    # Désérialisation pour la réponse
    for key in [
        'd0_initialisation', 'd1_team', 'd2_problem', 'd3_containment',
        'd4_rootcause', 'd5_correctiveactions', 'd6_implementvalidate',
        'd7_preventrecurrence', 'd8_congratulate']:
        val = getattr(db_nc, key)
        if isinstance(val, str):
            try:
                setattr(db_nc, key, json.loads(val))
            except Exception:
                setattr(db_nc, key, None)
    return db_nc

def update_nc(db: Session, nc_id: int, nc: schemas.NonConformiteUpdate):
    db_nc = db.query(models.NonConformite).filter(models.NonConformite.id == nc_id).first()
    if db_nc:
        for key, value in nc.dict(exclude_unset=True).items():
            # Sérialiser les champs D0 à D8 si besoin
            if key in [
                'd0_initialisation', 'd1_team', 'd2_problem', 'd3_containment',
                'd4_rootcause', 'd5_correctiveactions', 'd6_implementvalidate',
                'd7_preventrecurrence', 'd8_congratulate'] and value is not None and not isinstance(value, str):
                value = json.dumps(value)
            setattr(db_nc, key, value)
        db.commit()
        db.refresh(db_nc)
        # Désérialisation pour la réponse
        for key in [
            'd0_initialisation', 'd1_team', 'd2_problem', 'd3_containment',
            'd4_rootcause', 'd5_correctiveactions', 'd6_implementvalidate',
            'd7_preventrecurrence', 'd8_congratulate']:
            val = getattr(db_nc, key)
            if isinstance(val, str):
                try:
                    setattr(db_nc, key, json.loads(val))
                except Exception:
                    setattr(db_nc, key, None)
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
