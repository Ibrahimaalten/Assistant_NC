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
import chromadb


# Configuration des chemins
# DOCUMENTS_DIR = "C:\\Users\\lrodembourg\\Documents\\Test_Langchain\\documents" # Assure-toi que c'est le bon
# DB_DIR = "C:/Users/lrodembourg/Documents/Test_Langchain/chroma_db" # Utilise un nom de dossier spécifique pour cette base
DOCUMENTS_DIR = "C:\\Users\\isene\\MyWorspace\\Assistant_NC\\documents" # Assure-toi que c'est le bon
DB_DIR = "C:/Users/isene/MyWorspace\Assistant_NC/documents/Test_Langchain/chroma_db" # Utilise un nom de dossier spécifique pour cette base
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


def process_and_embed_documents(model: str, force_reingest: bool = False):
    """
    Ingère les documents pour un modèle donné, sauf si la collection existe déjà.
    
    Args:
        model (str): L'ID du modèle d'embedding.
        force_reingest (bool): Si True, supprime l'ancienne collection et ré-ingère tout.
    """
    
    # =========================================================================
    # ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ DÉBUT DES AJOUTS ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    # =========================================================================
    
    # 1. Déterminer le nom de la collection et se connecter au client
    collection_name = get_collection_name_from_model_id(model)
    print(f"--- Vérification pour le modèle '{model}' (collection: '{collection_name}') ---")

    try:
        client = chromadb.PersistentClient(path=DB_DIR)
    except Exception as e:
        print(f"ERREUR: Impossible de se connecter au client ChromaDB à '{DB_DIR}'. Erreur: {e}")
        return None

    # 2. Vérifier si la collection existe déjà
    existing_collections_names = [c.name for c in client.list_collections()]
    
    if collection_name in existing_collections_names:
        if force_reingest:
            print(f"Option 'force_reingest' activée. Suppression de la collection existante '{collection_name}'...")
            client.delete_collection(name=collection_name)
            print("Collection supprimée. L'ingestion va continuer.")
        else:
            collection = client.get_collection(name=collection_name)
            count = collection.count()
            print(f"INFO: La collection '{collection_name}' existe déjà et contient {count} documents.")
            print("Aucune ingestion nécessaire. Pour forcer la ré-ingestion, utilisez l'option --force.")
            return None # On s'arrête ici, car le travail est déjà fait


    loaded_documents = load_documents_main()

    if not loaded_documents:
        print("Aucun document n'a été chargé. Arrêt.")
        return None

    final_documents_to_embed = loaded_documents
    print(f"Nombre total de documents à embedder (sans splitting appliqué ici) : {len(final_documents_to_embed)}")
    
    print("\nExemple de premiers documents à embedder :")
    for i, doc_to_embed in enumerate(final_documents_to_embed[:3]):
        # ... (votre code de log reste inchangé) ...
        print("—" * 50)

    if not final_documents_to_embed:
        print("Aucun document à embedder.")
        return None

    print("Initialisation du modèle d'embedding...")
    embedding_model = get_embedding_model(model)
    # collection_name est déjà défini au début, plus besoin de le redéfinir ici
    
    # Vous pouvez supprimer ces prints car ils sont maintenant gérés au début
    # print(f"Création de la collection '{collection_name}' dans le répertoire {DB_DIR}...")
    # print(f"Connexion au client ChromaDB persistant dans le répertoire : {DB_DIR}")
    # print(f"Création de la nouvelle collection '{collection_name}'...")

    # On ajoute les documents à CETTE collection spécifique
    vectorstore = Chroma.from_documents(
        documents=final_documents_to_embed,
        embedding=embedding_model,
        collection_name=collection_name,
        persist_directory=DB_DIR
    )
    count = vectorstore._collection.count()

    print(f"Base de données vectorielle créée/mise à jour avec {count} documents.")
    return vectorstore


# =========================================================================
# ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ BLOC D'EXÉCUTION À CHANGER ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
# =========================================================================

if __name__ == "__main__":
    # Importation nécessaire pour lire les arguments de la ligne de commande
    import argparse
    from pathlib import Path

    # Création d'un "parser" pour gérer les arguments
    parser = argparse.ArgumentParser(description="Script d'ingestion de documents pour ChromaDB.")
    parser.add_argument("model", type=str, help="L'ID du modèle à utiliser pour l'ingestion (ex: 'snowflake-arctic-embed:latest').")
    parser.add_argument("--force", action="store_true", help="Forcer la ré-ingestion même si la collection existe.")
    
    # Lecture des arguments passés en ligne de commande
    args = parser.parse_args()
    
    # Votre code existant pour vérifier le répertoire des documents
    if not Path(DOCUMENTS_DIR).exists():
        print(f"ERREUR: Le répertoire de documents '{DOCUMENTS_DIR}' n'existe pas.")
    else:
        # On appelle la fonction avec les arguments lus
        vs = process_and_embed_documents(model=args.model, force_reingest=args.force)

        if vs:
            print("Processus d'embedding terminé avec succès.")
        else:
            print("Échec ou annulation du processus d'embedding.")