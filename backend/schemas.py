from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NonConformiteBase(BaseModel):
    referenceNC: str
    dateDetection: Optional[str] = None
    dateCreation: Optional[str] = None
    produitRef: Optional[str] = None
    LieuDetection: Optional[str] = None
    detectePar: Optional[str] = None
    descriptionInitiale: Optional[str] = None
    Criticite: Optional[str] = None
    FonctionCrea: Optional[str] = None
    statut: str
    date_creation: Optional[datetime] = None
    date_resolution: Optional[datetime] = None

class NonConformiteCreate(NonConformiteBase):
    pass

class NonConformiteUpdate(NonConformiteBase):
    pass

class NonConformite(NonConformiteBase):
    id: int

    class Config:
        from_attributes = True

class MembreEquipeBase(BaseModel):
    nom: str
    role: Optional[str] = None

class MembreEquipeCreate(MembreEquipeBase):
    pass

class MembreEquipe(MembreEquipeBase):
    id: int

    class Config:
        from_attributes = True
