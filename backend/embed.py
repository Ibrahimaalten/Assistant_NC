import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter # Tu en auras peut-être besoin pour les PDF/TXT
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma # Langchain_community est l'import standard
import pandas as pd
from langchain_core.documents import Document
from pathlib import Path
import shutil # Pour supprimer l'ancien DB_DIR
import re


# Configuration des chemins
DOCUMENTS_DIR = "C:\\Users\\lrodembourg\\Documents\\Test_Langchain\\documents" # Assure-toi que c'est le bon
DB_DIR = "C:/Users/lrodembourg/Documents/Test_Langchain/chroma_db" # Utilise un nom de dossier spécifique pour cette base
ollama_endpoint = "http://localhost:11434"

# --- Fonction d'ingestion CSV CORRIGÉE et AMÉLIORÉE ---
def load_csv_for_rag(file_path):
    try:
        df = pd.read_csv(file_path, sep=';')
    except FileNotFoundError:
        print(f"ERREUR: Fichier CSV non trouvé : {file_path}")
        return []
    except Exception as e:
        print(f"ERREUR lors de la lecture du CSV {file_path}: {e}")
        return []

    docs = []
    content_columns = [
    "Identification NC 0D", "Localisation 0D(Site A, Site B, Site C,Site D)", "Article impacté (pas de marque et/ou modèle) 0D", "Date de Détection 0D(jj/mm/aaaa)", "Créateur NC 0D", "Fonction Créateur 0D", "Description du problème 0D", "Criticité 0D", "name 1D", "team function 1D", "contact  1D(mail,phone num)", "Qui a produit le défaut ? 2D", "Quoi/Quelle pièce est impactée ? 2D", "Où la NC s'est produite ? 2D", "Quand ? 2D(jj/mm/aaaa)", "Comment la NC a été détectée ? 2D", "Combien de pièces impactée ? (0000) 2D", "Pourquoi est ce un problème ? 2D", "Action(s) de sécurisation 3D", "Date de lancement 3D", "Responsable de l'action 3D", "Etat Avancement 3D", "date de clôture 3D", "5Moyen 4D", "5Milieu 4D", "5Méthodes 4D", "5Main d'œuvre 4D", "5Matière 4D", "Pourquoi N°1 4D", "Pourquoi N°2 4D", "Pourquoi N°3 4D", "Pourquoi N°4 4D", "Pourquoi N°5 4D", "Cause Racine 4D", "Action(s) systémique(s) 5D", "Responsable 5D", "Service 5D", "Date de clôture  prévue 5D", "Action(s) systémique(s) 6D", "Date de lancement 6D", "Responsable de l'action 6D", "Etat Avancement 6D", "Date de clôture  6D", "Le nombre de défaut a t""il diminué ? 6D", "Action(s) préventive(s) systémique(s) 7D", "Date de lancement 7D", "Responsable de l'action 7D", "Etat Avancement 7D", "Date de clôture  7D", "Résumé avec saut de ligne 8D", "Résumé 8D", "Date de clôture 8D",
]
    id_nc_column_name = "Identification NC 0D"

    for index, row in df.iterrows():
        page_content_parts = []
        for col_name in content_columns:
            cell_value = str(row.get(col_name, "")).strip()
            if cell_value:
                # Utiliser le nom de colonne comme préfixe pour le contexte
                # Peut-être un peu verbeux, mais donne le contexte du champ
                # Tu peux aussi juste joindre les valeurs si tu préfères un texte plus fluide
                page_content_parts.append(f"{col_name}: {cell_value}") # Ex: "Description du problème 0D: Un autocollant..."

        if not page_content_parts:
            # Fallback (identique à avant)
            first_valid_content = ""
            for col_df in df.columns: # df.columns et non content_columns ici pour le fallback
                val = str(row.get(col_df, "")).strip()
                if val:
                    first_valid_content = val
                    break
            if first_valid_content:
                page_content_text = f"Données de la NC ligne {index+2}: {first_valid_content}"
                print(f"AVERTISSEMENT Ligne {index+2} de {Path(file_path).name}: Aucune colonne de contenu spécifiée n'est remplie. Utilisation de fallback: {first_valid_content[:50]}...")
            else:
                print(f"ERREUR Ligne {index+2} de {Path(file_path).name}: Impossible de construire page_content, toutes les colonnes sont vides.")
                continue
        else:
            page_content_text = ". ".join(page_content_parts) + "."

        metadata = {}
        for col_csv in df.columns: # Toutes les colonnes du CSV deviennent des métadonnées
            metadata[col_csv] = str(row[col_csv]) if pd.notnull(row[col_csv]) else ""
        
        if id_nc_column_name in df.columns:
            metadata["id_non_conformite"] = str(row.get(id_nc_column_name, f"ID_MANQUANT_L{index+2}"))
        else:
            print(f"AVERTISSEMENT: Colonne ID NC '{id_nc_column_name}' non trouvée dans {Path(file_path).name}. Ligne {index+2}")
            metadata["id_non_conformite"] = f"ID_COL_MANQUANTE_L{index+2}"
        
        metadata["nom_fichier_source"] = str(Path(file_path).name)

        doc = Document(page_content=page_content_text, metadata=metadata)
        docs.append(doc)
    return docs


def get_embedding_model(model: str):
        return OllamaEmbeddings(model=model)
# def get_collection_name_from_model(model):
#     # Simplifie et nettoie le nom du modèle pour l'utiliser comme nom de collection
#     return model.replace("/", "_").replace(":", "_")
def get_collection_name_from_model_id(model_id: str) -> str:
    """Crée un nom de collection valide pour ChromaDB à partir de l'ID du modèle."""
    # Remplace les caractères non autorisés par des underscores
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', model_id)
    # ChromaDB recommande des noms entre 3 et 63 caractères
    return f"coll_{safe_name[:55]}"
def load_documents_main():
    """
    Charge tous les documents (TXT, PDF, et un CSV spécifique) depuis le répertoire DOCUMENTS_DIR.
    Le CSV est traité par une fonction personnalisée pour créer des documents riches.
    """
    all_documents = []

    # --- TXT et PDF (inchangé) ---
    print("Chargement des fichiers TXT...")
    txt_loader = DirectoryLoader(DOCUMENTS_DIR, glob="**/*.txt", loader_cls=TextLoader, show_progress=True, use_multithreading=True)
    txt_loaded_docs = txt_loader.load()
    if txt_loaded_docs: all_documents.extend(txt_loaded_docs)
    print(f"Chargé {len(txt_loaded_docs)} documents TXT.")

    print("Chargement des fichiers PDF...")
    pdf_loader = DirectoryLoader(DOCUMENTS_DIR, glob="**/*.pdf", loader_cls=PyPDFLoader, show_progress=True, use_multithreading=True)
    pdf_loaded_docs = pdf_loader.load()
    if pdf_loaded_docs: all_documents.extend(pdf_loaded_docs)
    print(f"Chargé {len(pdf_loaded_docs)} documents PDF.")

    # --- SECTION CSV ADAPTÉE ---
    # On cible directement le fichier CSV avec votre fonction personnalisée
    clean_csv_path = Path(DOCUMENTS_DIR) / "NC5_clean.csv"
    
    if clean_csv_path.exists():
        print(f"Chargement direct du fichier CSV via la fonction personnalisée : {clean_csv_path.name}")
        
        # Appel direct à votre fonction load_csv_for_rag
        csv_docs = load_csv_for_rag(str(clean_csv_path))
        
        if csv_docs: 
            all_documents.extend(csv_docs)
        
        print(f"Chargé {len(csv_docs)} documents depuis le CSV (traitement personnalisé).")
    else:
        print(f"AVERTISSEMENT: Le fichier CSV spécifique {clean_csv_path} n'a pas été trouvé.")

    print(f"\nTotal de {len(all_documents)} documents sources chargés avant toute décision de splitting.")
    return all_documents


def process_and_embed_documents(model: str):

    loaded_documents = load_documents_main()

    if not loaded_documents:
        print("Aucun document n'a été chargé. Arrêt.")
        return None

    
       # Si tu es sûr de ne vouloir AUCUN splitting pour AUCUN document :
    final_documents_to_embed = loaded_documents
    print(f"Nombre total de documents à embedder (sans splitting appliqué ici) : {len(final_documents_to_embed)}")
    
    
    print("\nExemple de premiers documents à embedder :")
    for i, doc_to_embed in enumerate(final_documents_to_embed[:3]):
        print(f"Document {i+1} (Source: {doc_to_embed.metadata.get('nom_fichier_source', doc_to_embed.metadata.get('source', 'N/A'))}):")
        print(f"  Contenu: {doc_to_embed.page_content[:300]}...")
        # Afficher toutes les métadonnées pour vérifier
        print(f"  Métadonnées complètes: {doc_to_embed.metadata}")
        print("—" * 50)

    if not final_documents_to_embed:
        print("Aucun document à embedder.")
        return None

    print("Initialisation du modèle d'embedding...")

    embedding_model = get_embedding_model(model)
    collection_name = get_collection_name_from_model_id(model)

    print(f"Création de la collection '{collection_name}' dans le répertoire {DB_DIR}...")
    # --- NOUVELLE LOGIQUE D'INDEXATION ROBUSTE ---
    print(f"Connexion au client ChromaDB persistant dans le répertoire : {DB_DIR}")

# # Optionnel mais recommandé : Supprimer l'ancien répertoire pour un nouveau départ
#     if os.path.exists(DB_DIR):
#         print(f"Suppression de l'ancien répertoire de base de données : {DB_DIR}")
#         shutil.rmtree(DB_DIR)

    print(f"Création de la nouvelle collection '{collection_name}'...")
    # On ajoute les documents à CETTE collection spécifique
    vectorstore = Chroma.from_documents(
        documents=final_documents_to_embed,
        embedding=embedding_model,
        collection_name=collection_name,
        persist_directory=DB_DIR  # Très important !
    )
    count = vectorstore._collection.count()

    print(f"Base de données vectorielle créée/mise à jour avec {count} documents.")
    return vectorstore

if __name__ == "__main__":
    # S'assurer que le répertoire de documents existe
    if not Path(DOCUMENTS_DIR).exists():
        print(f"ERREUR: Le répertoire de documents '{DOCUMENTS_DIR}' n'existe pas.")
    else:
        # vs = process_and_embed_documents(model="dengcao/Qwen3-Embedding-4B:q5_K_M")
        vs = process_and_embed_documents(model="snowflake-arctic-embed2:latest")  # Utilise le modèle Snowflake pour l'exemple

        if vs:
            print("Processus d'embedding terminé avec succès.")
        else:
            print("Échec du processus d'embedding.")