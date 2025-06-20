from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class D0Section(BaseModel):
    referenceNC: Optional[str] = None
    dateDetection: Optional[str] = None
    dateCreation: Optional[str] = None
    produitRef: Optional[str] = None
    LieuDetection: Optional[str] = None
    detectePar: Optional[str] = None
    descriptionInitiale: Optional[str] = None
    Criticite: Optional[str] = None
    FonctionCrea: Optional[str] = None

class D1Section(BaseModel):
    chefEquipe: Optional[dict] = None  # {prenom, nom, support}
    membresEquipe: Optional[List[dict]] = None  # [{prenom, nom, fonction}]
    Sponsor: Optional[str] = None

class D2Section(BaseModel):
    descriptionDetaillee: Optional[dict] = None  # {qui, quoi, ou, quand, comment, combien, pourquoi}

class D3Section(BaseModel):
    actions3D: Optional[List[dict]] = None  # [{description, ...}]

class D4Section(BaseModel):
    ishikawaData: Optional[dict] = None
    fiveWhysData: Optional[dict] = None
    causesRacinesIdentifiees: Optional[str] = None
    verificationCauses: Optional[str] = None

class D5Section(BaseModel):
    correctiveActionsData: Optional[dict] = None  # {cause: [actions]}

class D6Section(BaseModel):
    implementedActions: Optional[dict] = None
    validationResults: Optional[str] = None
    surveillancePlan: Optional[str] = None

class D7Section(BaseModel):
    selectedPreventiveCauses: Optional[List[str]] = None
    preventiveActions: Optional[dict] = None
    documentationUpdates: Optional[str] = None
    systemicChanges: Optional[str] = None

class D8Section(BaseModel):
    team_recognition: Optional[str] = None
    resumeResultats: Optional[str] = None
    leconsApprises: Optional[str] = None
    dateCloture: Optional[str] = None
    teamAcknowledged: Optional[List[str]] = None

class NonConformiteBase(BaseModel):
    statut: str = "Ouvert"
    d0_initialisation: Optional[D0Section] = None
    d1_team: Optional[D1Section] = None
    d2_problem: Optional[D2Section] = None
    d3_containment: Optional[D3Section] = None
    d4_rootcause: Optional[D4Section] = None
    d5_correctiveactions: Optional[D5Section] = None
    d6_implementvalidate: Optional[D6Section] = None
    d7_preventrecurrence: Optional[D7Section] = None
    d8_congratulate: Optional[D8Section] = None

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
