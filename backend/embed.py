import os
from langchain_community.document_loaders import CSVLoader, DirectoryLoader, TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
import pandas as pd
from langchain_core.documents import Document
from pathlib import Path
# Configuration des chemins
DOCUMENTS_DIR = "C:\\Users\\lrodembourg\\Documents\\Test_Langchain\\documents"
DB_DIR = "./chroma_db"
ollama_endpoint = "http://localhost:11434"
def load_csv_with_metadata(file_path):
    df = pd.read_csv(file_path)
    docs = []
    for _, row in df.iterrows():
        # Choisis une colonne comme contenu principal (ex: Description_du_problème)
        content = str(row.get("Description_du_problème", "")) or str(row.iloc[0])  # fallback si vide

        # Toutes les autres colonnes deviennent des métadonnées
        metadata = {
            col: str(row[col]) for col in df.columns
        }
        metadata["source"] = file_path  # Ajout du chemin comme metadata

        doc = Document(page_content=content, metadata=metadata)
        docs.append(doc)
    return docs

def load_csv_as_structured_json(file_path):
    df = pd.read_csv(file_path, sep=';')
    docs = []
    for _, row in df.iterrows():
        # On construit un dict avec toutes les colonnes (étapes, infos, etc.)
        doc_json = {col: (row[col] if pd.notnull(row[col]) else "") for col in df.columns}
        # On choisit un identifiant unique (ex: 'ID', 'Identification_NC', ou index)
        doc_id = str(row.get('ID', row.get('Identification_NC', _)))
        # On stocke tout le 8D comme un seul JSON dans page_content
        doc = Document(
            page_content=str(doc_json),
            metadata={
                "id": doc_id,
                "source": file_path
            }
        )
        docs.append(doc)
    return docs

def load_documents():
    documents = []

    # TXT
    txt_loader = DirectoryLoader(DOCUMENTS_DIR, glob="**/*.txt", loader_cls=TextLoader)
    documents.extend(txt_loader.load())

    # PDF
    pdf_loader = DirectoryLoader(DOCUMENTS_DIR, glob="**/*.pdf", loader_cls=PyPDFLoader)
    documents.extend(pdf_loader.load())

    # Uniquement le CSV propre
    clean_csv = Path(DOCUMENTS_DIR) / "NC5_clean.csv"
    if clean_csv.exists():
        csv_docs = load_csv_as_structured_json(str(clean_csv))
        documents.extend(csv_docs)

    return documents


def process_documents():
    documents = load_documents()

    # Pas de découpage en chunks pour les 8D structurés (un document = un 8D complet)
    print("Exemple de document structuré :")
    for i, doc in enumerate(documents[:3]):
        print(f"Doc {i+1} :")
        print(doc.page_content[:500])
        print("—" * 50)

    # Création des embeddings et stockage
    embedding_model = OllamaEmbeddings(base_url=ollama_endpoint, model="snowflake-arctic-embed2")

    vectorstore = Chroma.from_documents(
        collection_name="AssistancNCC",
        documents=documents,
        embedding=embedding_model,
        persist_directory=DB_DIR
    )

    print(f"Base de données vectorielle créée avec {len(documents)} documents structurés.")
    return vectorstore


if __name__ == "__main__":
    process_documents()