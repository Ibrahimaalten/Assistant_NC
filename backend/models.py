from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./nonconformites.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class NonConformite(Base):
    __tablename__ = "nonconformites"
    id = Column(Integer, primary_key=True, index=True)
    # D0
    referenceNC = Column(String, nullable=False)
    dateDetection = Column(String, nullable=False)
    dateCreation = Column(String, nullable=False)
    produitRef = Column(String, nullable=False)
    LieuDetection = Column(String, nullable=False)
    detectePar = Column(String, nullable=True)
    descriptionInitiale = Column(String, nullable=False)
    Criticite = Column(String, nullable=True)
    FonctionCrea = Column(String, nullable=False)
    # D1
    chefEquipe_prenom = Column(String, nullable=True)
    chefEquipe_nom = Column(String, nullable=True)
    chefEquipe_support = Column(String, nullable=True)
    sponsor = Column(String, nullable=True)
    membres = relationship("MembreEquipe", back_populates="nonconformite", cascade="all, delete-orphan")
    # D2
    description_qui = Column(String, nullable=True)
    description_quoi = Column(String, nullable=True)
    description_ou = Column(String, nullable=True)
    description_quand = Column(String, nullable=True)
    description_comment = Column(String, nullable=True)
    description_combien = Column(String, nullable=True)
    description_pourquoi = Column(String, nullable=True)
    # D3
    actions3D = Column(Text, nullable=True)  # JSON string (liste d'actions)
    # D4
    ishikawaData = Column(Text, nullable=True)  # JSON string
    fiveWhysData = Column(Text, nullable=True)  # JSON string
    causesRacinesIdentifiees = Column(Text, nullable=True)
    verificationCauses = Column(Text, nullable=True)
    # D5
    actionsCorrectives = Column(Text, nullable=True)  # JSON string
    rootCausesSelectionnees = Column(Text, nullable=True)  # JSON string
    # D6
    actionsImplantation = Column(Text, nullable=True)  # JSON string
    commentairesImplantation = Column(Text, nullable=True)
    # D7
    actionsPreventives = Column(Text, nullable=True)  # JSON string
    rootCausesPreventSelectionnees = Column(Text, nullable=True)  # JSON string
    # D8
    resumeResultats = Column(Text, nullable=True)
    leconsApprises = Column(Text, nullable=True)
    dateCloture = Column(String, nullable=True)
    teamRecognitionMessage = Column(Text, nullable=True)
    # Général
    statut = Column(String, nullable=False, default="En cours")
    date_resolution = Column(DateTime, nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow)

class MembreEquipe(Base):
    __tablename__ = "membres_equipe"
    id = Column(Integer, primary_key=True, index=True)
    nonconformite_id = Column(Integer, ForeignKey('nonconformites.id'))
    prenom = Column(String, nullable=False)
    nom = Column(String, nullable=False)
    fonction = Column(String, nullable=True)
    nonconformite = relationship("NonConformite", back_populates="membres")

Base.metadata.create_all(bind=engine)
