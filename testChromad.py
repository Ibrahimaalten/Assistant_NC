from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma

DB_DIR = "backend\chroma_db"
COLLECTION_NAME = "AssistancNCC" # Assure-toi que c'est bien ce nom
ollama_endpoint = "http://localhost:11434"

try:
    print(f"Tentative de connexion à ChromaDB: dir='{DB_DIR}', collection='{COLLECTION_NAME}'")
    embedding_model = OllamaEmbeddings(base_url=ollama_endpoint, model="snowflake-arctic-embed2")
    vectorstore_check = Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=DB_DIR,
        embedding_function=embedding_model # Doit être le même modèle que pour l'ingestion
    )
    
    count = vectorstore_check._collection.count() # Accès direct à la collection Chroma
    print(f"Nombre de documents dans la collection '{COLLECTION_NAME}': {count}")

    if count > 0:
        print("Quelques exemples de documents (max 5):")
        # Récupérer quelques documents (attention, cela récupère les vecteurs aussi)
        # Pour juste voir les métadonnées et le contenu, c'est un peu plus complexe
        # mais on peut essayer une recherche simple
        results = vectorstore_check.similarity_search("non conformité", k=2) # Utilise un terme générique
        if results:
            for i, doc in enumerate(results):
                print(f"  --- Document {i+1} ---")
                print(f"  Contenu (début): {doc.page_content[:1000]}...")
                print(f"  Métadonnées: {doc.metadata}")
        else:
            print("Aucun document trouvé avec une recherche simple.")
    else:
        print("La collection est vide !")

except Exception as e:
    print(f"Erreur lors de l'inspection de ChromaDB: {e}")
    import traceback
    traceback.print_exc()