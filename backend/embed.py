import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter # Tu en auras peut-être besoin pour les PDF/TXT
from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma # Langchain_community est l'import standard
import pandas as pd
from langchain_core.documents import Document
from pathlib import Path
import shutil # Pour supprimer l'ancien DB_DIR
import json


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

# def csv_to_json(csv_path, json_path):
#     """
#     Convertit un fichier CSV en JSON (liste de dictionnaires).
#     """
#     import pandas as pd
#     df = pd.read_csv(csv_path, sep=';')
#     records = df.to_dict(orient='records')
#     with open(json_path, 'w', encoding='utf-8') as f:
#         json.dump(records, f, ensure_ascii=False, indent=2)
#     print(f"Conversion terminée : {csv_path} -> {json_path}")
#     return json_path

# def load_json_for_rag(json_path):
#     """
#     Charge un fichier JSON (liste de dicts) et retourne une liste de Document.
#     Gère les NaN et valeurs non-string.
#     """
#     import math
#     with open(json_path, 'r', encoding='utf-8') as f:
#         data = json.load(f)
#     docs = []
#     for row in data:
#         page_content = row.get('Description du problème 0D', '')
#         # Gère NaN ou non-string
#         if not isinstance(page_content, str) or (isinstance(page_content, float) and math.isnan(page_content)):
#             page_content = ''
#         if not page_content:
#             # Fallback sur la première colonne non vide
#             for v in row.values():
#                 if isinstance(v, str) and v:
#                     page_content = v
#                     break
#                 elif isinstance(v, float) and not math.isnan(v):
#                     page_content = str(v)
#                     break
#         # Nettoie les métadonnées
#         metadata = {k: (str(v) if (isinstance(v, str) or isinstance(v, int) or isinstance(v, float)) and not (isinstance(v, float) and math.isnan(v)) else '') for k, v in row.items()}
#         docs.append(Document(page_content=page_content, metadata=metadata))
#     return docs

from langchain_ollama import OllamaEmbeddings

def get_embedding_model(model: str):
        return OllamaEmbeddings(model=model)
def get_collection_name_from_model(model):
    # Simplifie et nettoie le nom du modèle pour l'utiliser comme nom de collection
    return model.replace("/", "_").replace(":", "_")
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
    collection_name = get_collection_name_from_model(model)


    print(f"Création de la base vectorielle Chroma dans {DB_DIR} avec la collection {collection_name}...")
    vectorstore = Chroma.from_documents(
        collection_name=collection_name,
        documents=final_documents_to_embed, # Utiliser ces documents
        embedding=embedding_model,
        persist_directory=DB_DIR
    )

    print(f"Base de données vectorielle créée/mise à jour avec {len(final_documents_to_embed)} documents.")
    return vectorstore

if __name__ == "__main__":
    # S'assurer que le répertoire de documents existe
    if not Path(DOCUMENTS_DIR).exists():
        print(f"ERREUR: Le répertoire de documents '{DOCUMENTS_DIR}' n'existe pas.")
    else:
        # vs = process_and_embed_documents(model="dengcao/Qwen3-Embedding-4B:q5_K_M")
        vs = process_and_embed_documents(model="dengcao/Qwen3-Embedding-4B:q5_K_M")

        if vs:
            print("Processus d'embedding terminé avec succès.")
        else:
            print("Échec du processus d'embedding.")