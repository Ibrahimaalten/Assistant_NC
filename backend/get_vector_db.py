from langchain_chroma import Chroma
import chromadb
from .embed import get_embedding_model, get_collection_name_from_model_id
from config import get_model_id, AVAILABLE_EMBEDDING_MODELS
# Configuration
# DB_DIR = "C:/Users/lrodembourg/Documents/Test_Langchain/chroma_db"
ollama_endpoint = "http://localhost:11434"
DB_DIR = "C:/Users/lrodembourg/Documents/Test_Langchain/chroma_db" # Utilise un nom de dossier spécifique pour cette base
# dengcao/Qwen3-Embedding-0.6B:f16

def get_vectorstore(model_key: str | None = None):
    model_id = get_model_id(model_key)
    print(f"[VECTORSTORE] Utilisation du modèle: '{model_key}' (ID: {model_id})")

    # 2. Obtenir le modèle d'embedding
    embedding_model = get_embedding_model(model_id) # Assur
    collection_name = get_collection_name_from_model_id(model_id)

    print(f"DEBUG: get_vectorstore() utilise la collection '{collection_name}'")


    vectorstore = Chroma(
        persist_directory=DB_DIR,
        collection_name=collection_name,
        embedding_function=embedding_model
    )
    print(f"Chargement de la base de données depuis {DB_DIR}. La collection '{collection_name}' contient {vectorstore._collection.count()} documents.")

    return vectorstore