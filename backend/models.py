# backend/schemas.py (ou un nom similaire)

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any # Any est enlevé, on va essayer d'être plus précis
from datetime import datetime, date # Importe date aussi pour les champs de type date
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON as SQLAlchemyJSON
from backend.database import Base

# --- Modèles SQLAlchemy ---
class NonConformite(Base):
    __tablename__ = "nonconformites"
    id = Column(Integer, primary_key=True, index=True)
    statut = Column(String, default="Ouvert")
    date_creation = Column(DateTime, default=datetime.utcnow)
    date_resolution = Column(DateTime, nullable=True)
    d0_initialisation = Column(Text)  # JSON string (tous les champs D0)
    d1_team = Column(Text)
    d2_problem = Column(Text)
    d3_containment = Column(Text)
    d4_rootcause = Column(Text)
    d5_correctiveactions = Column(Text)
    d6_implementvalidate = Column(Text)
    d7_preventrecurrence = Column(Text)
    d8_congratulate = Column(Text)
    membres = relationship("MembreEquipe", back_populates="nonconformite", cascade="all, delete-orphan")

class MembreEquipe(Base):
    __tablename__ = "membres_equipe"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    role = Column(String)
    nonconformite_id = Column(Integer, ForeignKey("nonconformites.id"))
    nonconformite = relationship("NonConformite", back_populates="membres")


# --- Schémas pour MembreEquipe ---
class MembreEquipeBase(BaseModel):
    prenom: str
    nom: str
    fonction: Optional[str] = None

class MembreEquipeCreate(MembreEquipeBase):
    pass # Pas de champs supplémentaires pour la création pour l'instant

class MembreEquipeInDB(MembreEquipeBase):
    id: int
    # nonconformite_id: int # Pas toujours nécessaire de l'exposer au client

    class Config:
        from_attributes = True # Pour Pydantic v2 (remplace orm_mode)

# --- Schémas pour NonConformite ---
# On va créer des sous-modèles Pydantic pour chaque section Dx pour la clarté
# et pour correspondre à la structure de ton Form8DContext et de tes formulaires.

class D0Data(BaseModel):
    referenceNC: Optional[str] = None # Auparavant appelé identification_nc_0d dans Pydantic, correspond à referenceNC dans SQLAlchemy
    dateDetection: Optional[str] = None # Garder en str si c'est ce que le frontend envoie/attend
    dateCreation: Optional[str] = None  # Idem
    produitRef: Optional[str] = None
    LieuDetection: Optional[str] = None
    detectePar: Optional[str] = None
    descriptionInitiale: Optional[str] = None # Auparavant description_probleme_0d, correspond à descriptionInitiale
    Criticite: Optional[str] = None # Si c'est une chaîne, sinon float/int
    FonctionCrea: Optional[str] = None

class D1Data(BaseModel):
    chefEquipe_prenom: Optional[str] = None
    chefEquipe_nom: Optional[str] = None
    chefEquipe_support: Optional[str] = None
    sponsor: Optional[str] = None
    # Les membres seront gérés séparément ou via une liste de MembreEquipeCreate lors de la création/màj
    # Pour la réponse, on aura une List[MembreEquipeInDB]

class D2Data(BaseModel):
    description_qui: Optional[str] = None
    description_quoi: Optional[str] = None
    description_ou: Optional[str] = None
    description_quand: Optional[str] = None # Garder en str pour l'instant
    description_comment: Optional[str] = None
    description_combien: Optional[str] = None
    description_pourquoi: Optional[str] = None

class D3Data(BaseModel):
    actions3D: Optional[str] = None # JSON string contenant une liste d'actions

class D4Data(BaseModel):
    ishikawaData: Optional[str] = None  # JSON string
    fiveWhysData: Optional[str] = None  # JSON string
    causesRacinesIdentifiees: Optional[str] = None # Peut-être une liste de str, donc JSON string
    verificationCauses: Optional[str] = None

class D5Data(BaseModel):
    actionsCorrectives: Optional[str] = None  # JSON string
    rootCausesSelectionnees: Optional[str] = None  # JSON string

class D6Data(BaseModel):
    actionsImplantation: Optional[str] = None  # JSON string
    commentairesImplantation: Optional[str] = None

class D7Data(BaseModel):
    actionsPreventives: Optional[str] = None  # JSON string
    rootCausesPreventSelectionnees: Optional[str] = None  # JSON string

class D8Data(BaseModel):
    resumeResultats: Optional[str] = None
    leconsApprises: Optional[str] = None
    dateCloture: Optional[str] = None # Garder en str pour l'instant
    teamRecognitionMessage: Optional[str] = None

# Modèle de base pour une NonConformite (champs communs ou minimaux)
class NonConformiteBasePydantic(BaseModel): # Renommé pour éviter conflit avec le modèle SQLAlchemy
    statut: Optional[str] = "Ouvert" # Statut par défaut lors de la création
    # Les champs de D0 sont souvent les premiers à être remplis
    d0_initialisation: Optional[D0Data] = Field(default_factory=D0Data)


# Modèle pour la création d'une NonConformite
class NonConformiteCreatePydantic(NonConformiteBasePydantic):
    # À la création, on s'attend au moins aux données de D0.
    # Les membres de l'équipe D1 peuvent être ajoutés plus tard ou ici.
    d1_membres_a_creer: Optional[List[MembreEquipeCreate]] = []


# Modèle pour la mise à jour (permet des mises à jour partielles)
class NonConformiteUpdatePydantic(BaseModel):
    statut: Optional[str] = None
    d0_initialisation: Optional[D0Data] = None
    d1_team: Optional[D1Data] = None # Pour les champs chefEquipe, sponsor
    d1_membres_a_creer_ou_maj: Optional[List[MembreEquipeCreate]] = None # Pour ajouter/remplacer les membres
    d2_problem: Optional[D2Data] = None
    d3_containment: Optional[D3Data] = None
    d4_rootcause: Optional[D4Data] = None
    d5_correctiveactions: Optional[D5Data] = None
    d6_implementvalidate: Optional[D6Data] = None
    d7_preventrecurrence: Optional[D7Data] = None
    d8_congratulate: Optional[D8Data] = None
    date_resolution: Optional[datetime] = None


# Modèle pour retourner une NonConformite depuis l'API (inclut l'ID et toutes les données)
class NonConformiteInDBPydantic(NonConformiteBasePydantic): # Hérite de NonConformiteBasePydantic
    id: int # L'ID de la base de données SQLAlchemy est un Integer
    
    # Champs de D0 (déjà dans NonConformiteBasePydantic via d0_initialisation)
    # d0_initialisation: D0Data # Hérité et typé

    # Champs de D1
    d1_team: Optional[D1Data] = Field(default_factory=D1Data)
    membres: List[MembreEquipeInDB] = [] # La relation SQLAlchemy devient une liste de modèles Pydantic

    # Champs de D2
    d2_problem: Optional[D2Data] = Field(default_factory=D2Data)
    
    # Champs de D3
    d3_containment: Optional[D3Data] = Field(default_factory=D3Data)
    
    # Champs de D4
    d4_rootcause: Optional[D4Data] = Field(default_factory=D4Data)
    
    # Champs de D5
    d5_correctiveactions: Optional[D5Data] = Field(default_factory=D5Data)
    
    # Champs de D6
    d6_implementvalidate: Optional[D6Data] = Field(default_factory=D6Data)
    
    # Champs de D7
    d7_preventrecurrence: Optional[D7Data] = Field(default_factory=D7Data)
    
    # Champs de D8
    d8_congratulate: Optional[D8Data] = Field(default_factory=D8Data)

    date_creation: datetime
    date_resolution: Optional[datetime] = None

    class Config:
        from_attributes = True # Pour Pydantic v2 (remplace orm_mode pour la conversion SQLAlchemy -> Pydantic)

    # Validateur pour s'assurer que les chaînes JSON sont bien des chaînes (optionnel, mais bonne pratique)
    # Si tu veux que Pydantic valide le contenu JSON, tu devrais typer les champs en Dict ou List
    # et gérer la sérialisation/désérialisation JSON dans des validateurs ou au niveau du service/CRUD.
    # Pour l'instant, on les garde en `str` pour les champs JSON.

    # @field_validator('actions3D', 'ishikawaData', 'fiveWhysData', 'causesRacinesIdentifiees', 
    #                  'verificationCauses', 'actionsCorrectives', 'rootCausesSelectionnees',
    #                  'actionsImplantation', 'actionsPreventives', 'rootCausesPreventSelectionnees', mode='before')
    # @classmethod
    # def ensure_json_string(cls, value):
    #     if value is None:
    #         return None
    #     if not isinstance(value, str):
    #         # Tentative de conversion en chaîne JSON si c'est un dict/list (pourrait arriver de la DB)
    #         try:
    #             return json.dumps(value)
    #         except TypeError:
    #             raise ValueError('Field must be a valid JSON string or serializable to JSON')
    #     # Tu pourrais ajouter une validation pour s'assurer que c'est un JSON valide ici si besoin
    #     return value