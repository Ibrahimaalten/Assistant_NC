from langchain_chroma import Chroma
import chromadb
from .embed import get_embedding_model, get_collection_name_from_model

# Configuration
# DB_DIR = "C:/Users/lrodembourg/Documents/Test_Langchain/chroma_db"
ollama_endpoint = "http://localhost:11434"
persistent_client = chromadb.PersistentClient()

def get_vectorstore(model_name ="dengcao/Qwen3-Embedding-0.6B:f16"):
    embedding_model = get_embedding_model( model_name)
    collection_name = get_collection_name_from_model(model_name)


    vectorstore = Chroma(
    client=persistent_client,
    collection_name=collection_name,
    # persist_directory=DB_DIR,
    embedding_function=embedding_model
    )
    return vectorstore