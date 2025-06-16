from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
# Configuration
DB_DIR = "C:/Users/lrodembourg/Documents/Test_Langchain/chroma_db"
ollama_endpoint = "http://localhost:11434"
def get_vectorstore():
    embedding_model = OllamaEmbeddings(base_url=ollama_endpoint, model="snowflake-arctic-embed2")

    vectorstore = Chroma(
        collection_name="AssistancNCC",
    persist_directory=DB_DIR,
    embedding_function=embedding_model
    )
    return vectorstore